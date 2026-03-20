import { NextRequest, NextResponse } from 'next/server';
import { db, subscriptions, attributions, commissions, subEvents } from '@opynx/db';
import { eq, and } from 'drizzle-orm';
import { redis } from '@/lib/redis';
import { calculateWaterfall, type AttributionData } from '@/lib/waterfall';
import crypto from 'crypto';

/**
 * Samiteon Fiat Webhook Handler
 *
 * CRITICAL INVARIANT: This handler MUST produce identical commission records
 * to the Helio webhook handler. Payment method (crypto vs fiat) MUST NEVER
 * affect stakeholder payouts. Both handlers use the same calculateWaterfall()
 * function to guarantee this.
 */

// ─── Samiteon Event Types ───
type SamiteonEventType =
  | 'subscription.created'
  | 'subscription.renewed'
  | 'subscription.payment_pending'
  | 'subscription.cancelled';

interface SamiteonWebhookPayload {
  event: SamiteonEventType;
  id: string; // Samiteon transaction/event ID
  subscriptionId: string;
  customer: {
    userId: string;
    email?: string;
  };
  attribution: {
    creatorId: string;
    facilitatorId?: string;
    outlierId?: string;
    geoVerified?: boolean;
    totpVerified?: boolean;
    facilitatorTier?: 'silver' | 'gold' | 'platinum';
    outlierRate?: number;
  };
  plan: {
    tier: 'premium' | 'bundle' | 'studio';
    periodStart?: string;
    periodEnd?: string;
  };
  metadata?: Record<string, unknown>;
}

// ─── Idempotency TTL: 48 hours in seconds ───
const IDEMPOTENCY_TTL = 48 * 60 * 60;

/**
 * Verify Samiteon webhook signature using HMAC-SHA256.
 */
function verifySignature(request: NextRequest, rawBody: string): boolean {
  const signature = request.headers.get('x-samiteon-signature');
  if (!signature) return false;

  const secret = process.env.SAMITEON_WEBHOOK_SECRET;
  if (!secret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Check idempotency via Redis. Returns true if this event was already processed.
 */
async function checkIdempotency(eventId: string): Promise<boolean> {
  const key = `samiteon:webhook:${eventId}`;
  const existing = await redis.get(key);

  if (existing) return true;

  const result = await redis.set(key, 'processed', 'EX', IDEMPOTENCY_TTL, 'NX');
  return result === null;
}

/**
 * Shared commission creation logic. Uses the SAME calculateWaterfall() function
 * as the Helio handler to guarantee payment-method-agnostic payouts.
 */
async function createCommissionsFromAttribution(
  attributionId: string,
  attrData: AttributionData
): Promise<void> {
  // CRITICAL: Same waterfall function — payment method NEVER affects payouts
  const splits = calculateWaterfall(attrData);

  for (const split of splits) {
    await db.insert(commissions).values({
      attributionId,
      recipientId: split.recipientId,
      tier: split.tier,
      amount: split.amount,
      status: 'pending',
    });
  }
}

// ─── Event Handlers ───

async function handleSubscriptionCreated(payload: SamiteonWebhookPayload): Promise<void> {
  const { attribution: attr, customer, plan } = payload;

  // STEP 1: Record attribution FIRST
  const attributionData: AttributionData = {
    creatorId: attr.creatorId,
    facilitatorId: attr.facilitatorId ?? null,
    outlierId: attr.outlierId ?? null,
    geoVerified: attr.geoVerified ?? false,
    totpVerified: attr.totpVerified ?? false,
    facilitatorTier: attr.facilitatorTier,
    outlierRate: attr.outlierRate,
  };

  const [attribution] = await db
    .insert(attributions)
    .values({
      subscriberId: customer.userId,
      creatorId: attr.creatorId,
      facilitatorId: attr.facilitatorId ?? null,
      outlierId: attr.outlierId ?? null,
      geoVerified: attributionData.geoVerified,
      totpVerified: attributionData.totpVerified,
    })
    .returning();

  // STEP 2: Calculate waterfall — identical to Helio path
  await createCommissionsFromAttribution(attribution.id, attributionData);

  // STEP 3: Activate subscription
  const [subscription] = await db
    .insert(subscriptions)
    .values({
      userId: customer.userId,
      tier: plan.tier,
      status: 'active',
      samiteonSubId: payload.subscriptionId,
      periodStart: plan.periodStart ? new Date(plan.periodStart) : new Date(),
      periodEnd: plan.periodEnd ? new Date(plan.periodEnd) : undefined,
    })
    .returning();

  // Link attribution to subscription
  await db
    .update(attributions)
    .set({ subscriptionId: subscription.id })
    .where(eq(attributions.id, attribution.id));

  await db.insert(subEvents).values({
    subscriptionId: subscription.id,
    event: 'created',
    metadata: JSON.stringify({
      source: 'samiteon',
      transactionId: payload.id,
    }),
  });
}

async function handleSubscriptionRenewed(payload: SamiteonWebhookPayload): Promise<void> {
  const existingSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.samiteonSubId, payload.subscriptionId),
  });

  if (!existingSub) {
    throw new Error(`Samiteon subscription not found: ${payload.subscriptionId}`);
  }

  const existingAttribution = await db.query.attributions.findFirst({
    where: and(
      eq(attributions.subscriberId, payload.customer.userId),
      eq(attributions.creatorId, payload.attribution.creatorId)
    ),
  });

  if (existingAttribution) {
    const attributionData: AttributionData = {
      creatorId: payload.attribution.creatorId,
      facilitatorId: existingAttribution.facilitatorId,
      outlierId: existingAttribution.outlierId,
      geoVerified: existingAttribution.geoVerified,
      totpVerified: existingAttribution.totpVerified,
      facilitatorTier: payload.attribution.facilitatorTier,
      outlierRate: payload.attribution.outlierRate,
    };

    // Same waterfall — fiat or crypto, payouts are identical
    await createCommissionsFromAttribution(existingAttribution.id, attributionData);
  }

  await db
    .update(subscriptions)
    .set({
      status: 'active',
      periodStart: payload.plan.periodStart
        ? new Date(payload.plan.periodStart)
        : new Date(),
      periodEnd: payload.plan.periodEnd
        ? new Date(payload.plan.periodEnd)
        : undefined,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, existingSub.id));

  await db.insert(subEvents).values({
    subscriptionId: existingSub.id,
    event: 'renewed',
    metadata: JSON.stringify({
      source: 'samiteon',
      transactionId: payload.id,
    }),
  });
}

async function handlePaymentPending(payload: SamiteonWebhookPayload): Promise<void> {
  const existingSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.samiteonSubId, payload.subscriptionId),
  });

  if (!existingSub) {
    throw new Error(`Samiteon subscription not found: ${payload.subscriptionId}`);
  }

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
    event: 'cancelled',
    metadata: JSON.stringify({
      source: 'samiteon',
      reason: 'payment_pending',
      transactionId: payload.id,
    }),
  });
}

async function handleSubscriptionCancelled(payload: SamiteonWebhookPayload): Promise<void> {
  const existingSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.samiteonSubId, payload.subscriptionId),
  });

  if (!existingSub) {
    throw new Error(`Samiteon subscription not found: ${payload.subscriptionId}`);
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
      source: 'samiteon',
      transactionId: payload.id,
    }),
  });
}

// ─── Route Handler ───

export async function POST(request: NextRequest) {
  // Step 1: Read raw body for signature verification
  const rawBody = await request.text();

  // Step 2: Verify HMAC signature
  if (!verifySignature(request, rawBody)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: SamiteonWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Step 3: Idempotency check
  const alreadyProcessed = await checkIdempotency(payload.id);
  if (alreadyProcessed) {
    return NextResponse.json({ status: 'already_processed' }, { status: 200 });
  }

  // Step 4: Route to handler — maps Samiteon events to the same subscription lifecycle
  try {
    switch (payload.event) {
      case 'subscription.created':
        await handleSubscriptionCreated(payload);
        break;
      case 'subscription.renewed':
        await handleSubscriptionRenewed(payload);
        break;
      case 'subscription.payment_pending':
        await handlePaymentPending(payload);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown event type: ${(payload as { event: string }).event}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('[Samiteon Webhook] Error processing event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
