import { NextRequest, NextResponse } from 'next/server';
import { db, subscriptions, attributions, commissions, subEvents } from '@opynx/db';
import { eq, and } from 'drizzle-orm';
import { redis } from '@/lib/redis';
import { calculateWaterfall, type AttributionData } from '@/lib/waterfall';

// ─── Helio Webhook Event Types ───
type HelioEventType =
  | 'SUBSCRIPTION_STARTED'
  | 'SUBSCRIPTION_RENEWED'
  | 'SUBSCRIPTION_PENDING_PAYMENT'
  | 'SUBSCRIPTION_ENDED';

interface HelioWebhookPayload {
  event: HelioEventType;
  transactionId: string;
  subscriptionId: string;
  userId: string;
  creatorId: string;
  facilitatorId?: string;
  outlierId?: string;
  geoVerified?: boolean;
  totpVerified?: boolean;
  facilitatorTier?: 'silver' | 'gold' | 'platinum';
  outlierRate?: number;
  tier?: 'premium' | 'bundle' | 'studio';
  periodStart?: string;
  periodEnd?: string;
  metadata?: Record<string, unknown>;
}

// ─── Idempotency TTL: 48 hours in seconds ───
const IDEMPOTENCY_TTL = 48 * 60 * 60;

/**
 * Verify the Bearer token from Helio's webhook request.
 * Returns true if the token matches the configured secret.
 */
function verifyBearerToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.slice(7);
  return token === process.env.HELIO_WEBHOOK_SECRET;
}

/**
 * Check idempotency via Redis. Returns true if this event was already processed.
 * Sets the key with 48h TTL if not yet seen.
 */
async function checkIdempotency(transactionId: string): Promise<boolean> {
  const key = `helio:webhook:${transactionId}`;
  const existing = await redis.get(key);

  if (existing) return true;

  // SET NX ensures only the first processor wins
  const result = await redis.set(key, 'processed', 'EX', IDEMPOTENCY_TTL, 'NX');
  return result === null; // null means key already existed (race condition)
}

// ─── Event Handlers ───

async function handleSubscriptionStarted(payload: HelioWebhookPayload): Promise<void> {
  // STEP 1: Record attribution FIRST — this is the source of truth for commissions
  const attributionData: AttributionData = {
    creatorId: payload.creatorId,
    facilitatorId: payload.facilitatorId ?? null,
    outlierId: payload.outlierId ?? null,
    geoVerified: payload.geoVerified ?? false,
    totpVerified: payload.totpVerified ?? false,
    facilitatorTier: payload.facilitatorTier,
    outlierRate: payload.outlierRate,
  };

  const [attribution] = await db
    .insert(attributions)
    .values({
      subscriberId: payload.userId,
      creatorId: payload.creatorId,
      facilitatorId: payload.facilitatorId ?? null,
      outlierId: payload.outlierId ?? null,
      geoVerified: attributionData.geoVerified,
      totpVerified: attributionData.totpVerified,
    })
    .returning();

  // STEP 2: Calculate waterfall — payment method NEVER affects stakeholder payouts
  const splits = calculateWaterfall(attributionData);

  // STEP 3: Insert commission records
  for (const split of splits) {
    await db.insert(commissions).values({
      attributionId: attribution.id,
      recipientId: split.recipientId,
      tier: split.tier,
      amount: split.amount,
      status: 'pending',
    });
  }

  // STEP 4: Activate subscription
  const [subscription] = await db
    .insert(subscriptions)
    .values({
      userId: payload.userId,
      tier: payload.tier ?? 'premium',
      status: 'active',
      helioSubId: payload.subscriptionId,
      periodStart: payload.periodStart ? new Date(payload.periodStart) : new Date(),
      periodEnd: payload.periodEnd ? new Date(payload.periodEnd) : undefined,
    })
    .returning();

  // Link attribution to subscription
  await db
    .update(attributions)
    .set({ subscriptionId: subscription.id })
    .where(eq(attributions.id, attribution.id));

  // Record subscription event
  await db.insert(subEvents).values({
    subscriptionId: subscription.id,
    event: 'created',
    metadata: JSON.stringify({
      source: 'helio',
      transactionId: payload.transactionId,
    }),
  });
}

async function handleSubscriptionRenewed(payload: HelioWebhookPayload): Promise<void> {
  // Find existing subscription
  const existingSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.helioSubId, payload.subscriptionId),
  });

  if (!existingSub) {
    throw new Error(`Subscription not found: ${payload.subscriptionId}`);
  }

  // Look up existing attribution for this subscriber+creator pair
  const existingAttribution = await db.query.attributions.findFirst({
    where: and(
      eq(attributions.subscriberId, payload.userId),
      eq(attributions.creatorId, payload.creatorId)
    ),
  });

  if (existingAttribution) {
    // Recalculate waterfall on renewal — same function, same results
    const attributionData: AttributionData = {
      creatorId: payload.creatorId,
      facilitatorId: existingAttribution.facilitatorId,
      outlierId: existingAttribution.outlierId,
      geoVerified: existingAttribution.geoVerified,
      totpVerified: existingAttribution.totpVerified,
      facilitatorTier: payload.facilitatorTier,
      outlierRate: payload.outlierRate,
    };

    const splits = calculateWaterfall(attributionData);

    for (const split of splits) {
      await db.insert(commissions).values({
        attributionId: existingAttribution.id,
        recipientId: split.recipientId,
        tier: split.tier,
        amount: split.amount,
        status: 'pending',
      });
    }
  }

  // Update subscription period
  await db
    .update(subscriptions)
    .set({
      status: 'active',
      periodStart: payload.periodStart ? new Date(payload.periodStart) : new Date(),
      periodEnd: payload.periodEnd ? new Date(payload.periodEnd) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, existingSub.id));

  await db.insert(subEvents).values({
    subscriptionId: existingSub.id,
    event: 'renewed',
    metadata: JSON.stringify({
      source: 'helio',
      transactionId: payload.transactionId,
    }),
  });
}

async function handleSubscriptionPendingPayment(payload: HelioWebhookPayload): Promise<void> {
  const existingSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.helioSubId, payload.subscriptionId),
  });

  if (!existingSub) {
    throw new Error(`Subscription not found: ${payload.subscriptionId}`);
  }

  // Set to past_due — the grace period logic allows continued access
  await db
    .update(subscriptions)
    .set({
      status: 'past_due',
      gracePeriodEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7-day grace
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, existingSub.id));

  await db.insert(subEvents).values({
    subscriptionId: existingSub.id,
    event: 'cancelled', // maps to payment failure event
    metadata: JSON.stringify({
      source: 'helio',
      reason: 'pending_payment',
      transactionId: payload.transactionId,
    }),
  });
}

async function handleSubscriptionEnded(payload: HelioWebhookPayload): Promise<void> {
  const existingSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.helioSubId, payload.subscriptionId),
  });

  if (!existingSub) {
    throw new Error(`Subscription not found: ${payload.subscriptionId}`);
  }

  await db
    .update(subscriptions)
    .set({
      status: 'cancelled',
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, existingSub.id));

  await db.insert(subEvents).values({
    subscriptionId: existingSub.id,
    event: 'cancelled',
    metadata: JSON.stringify({
      source: 'helio',
      transactionId: payload.transactionId,
    }),
  });
}

// ─── Route Handler ───

export async function POST(request: NextRequest) {
  // Step 1: Verify Bearer token
  if (!verifyBearerToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: HelioWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Step 2: Idempotency check
  const alreadyProcessed = await checkIdempotency(payload.transactionId);
  if (alreadyProcessed) {
    return NextResponse.json({ status: 'already_processed' }, { status: 200 });
  }

  // Step 3: Route event to handler
  try {
    switch (payload.event) {
      case 'SUBSCRIPTION_STARTED':
        await handleSubscriptionStarted(payload);
        break;
      case 'SUBSCRIPTION_RENEWED':
        await handleSubscriptionRenewed(payload);
        break;
      case 'SUBSCRIPTION_PENDING_PAYMENT':
        await handleSubscriptionPendingPayment(payload);
        break;
      case 'SUBSCRIPTION_ENDED':
        await handleSubscriptionEnded(payload);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown event type: ${(payload as { event: string }).event}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('[Helio Webhook] Error processing event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
