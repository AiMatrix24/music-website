import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db, subscriptions, subEvents } from '@opynx/db';
import { eq } from 'drizzle-orm';
import { processCommissionWaterfall } from '@/lib/services/commissions';
import { captureError, startTransaction } from '@/lib/services/monitoring';

/**
 * NOWPayments IPN (Instant Payment Notification) Webhook Handler
 *
 * Receives payment status updates from NOWPayments and processes them:
 * - Verifies HMAC-SHA512 signature using NOWPAYMENTS_IPN_SECRET
 * - Routes by orderId prefix: sub_, ticket_, merch_
 * - On 'finished': activates subscriptions, triggers commission waterfall
 *
 * IPN docs: https://documenter.getpostman.com/view/7907941/2s93JusNJt
 */

// ─── Types ───

type PaymentStatus =
  | 'waiting'
  | 'confirming'
  | 'confirmed'
  | 'sending'
  | 'partially_paid'
  | 'finished'
  | 'failed'
  | 'refunded'
  | 'expired';

interface NowPaymentsIPNPayload {
  payment_id: number;
  payment_status: PaymentStatus;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id?: string;
  outcome_amount?: number;
  outcome_currency?: string;
  [key: string]: unknown;
}

// ─── Signature Verification ───

/**
 * Verify the IPN signature using HMAC-SHA512.
 * NOWPayments signs the sorted JSON body with the IPN secret.
 */
function verifyIPNSignature(
  body: Record<string, unknown>,
  signature: string
): boolean {
  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!ipnSecret) {
    console.error('[NOWPayments Webhook] NOWPAYMENTS_IPN_SECRET not configured');
    return false;
  }

  // Remove the signature field before hashing, sort keys alphabetically
  const { 'np_sig': _sig, ...bodyWithoutSig } = body;
  const sortedBody = sortObjectKeys(bodyWithoutSig);
  const bodyString = JSON.stringify(sortedBody);

  const hmac = crypto
    .createHmac('sha512', ipnSecret)
    .update(bodyString)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hmac, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

/**
 * Recursively sort object keys alphabetically for deterministic hashing.
 */
function sortObjectKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    const value = obj[key];
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sorted[key] = sortObjectKeys(value as Record<string, unknown>);
    } else {
      sorted[key] = value;
    }
  }

  return sorted;
}

// ─── Order Handlers ───

async function handleSubscriptionPayment(
  orderId: string,
  payload: NowPaymentsIPNPayload
): Promise<void> {
  // orderId format: sub_{subscriptionId}_{tier}
  // e.g. sub_abc123_premium or sub_abc123_bundle
  const parts = orderId.split('_');
  const subscriptionId = parts[1];
  const tierRaw = parts[2] ?? 'premium';

  console.log(
    `[NOWPayments Webhook] Processing subscription payment: ${orderId} tier=${tierRaw}`
  );

  // Map tier names to commission engine tiers
  const tier = tierRaw === 'bundle' ? 'superfan_bundle' : 'standard';

  // Parse metadata from order_description if available
  // Format: creatorId:{id},facilitatorId:{id},outlierId:{id},geoVerified:{bool},facilitatorTier:{tier}
  const metadata = parseOrderMetadata(payload.order_description);

  // Process commission waterfall
  if (tier === 'standard' && metadata.creatorId) {
    await processCommissionWaterfall({
      subscriptionId,
      tier: 'standard',
      creatorId: metadata.creatorId,
      facilitatorId: metadata.facilitatorId,
      outlierId: metadata.outlierId,
      geoVerified: metadata.geoVerified ?? false,
      facilitatorTier: (metadata.facilitatorTier as 'silver' | 'gold' | 'platinum') ?? 'silver',
    });
  } else if (tier === 'superfan_bundle' && metadata.creatorIds) {
    await processCommissionWaterfall({
      subscriptionId,
      tier: 'superfan_bundle',
      creatorIds: metadata.creatorIds,
      geoVerified: metadata.geoVerified ?? false,
      facilitatorTier: (metadata.facilitatorTier as 'silver' | 'gold' | 'platinum') ?? 'silver',
      facilitatorId: metadata.facilitatorId,
    });
  }

  // Activate or renew subscription in DB
  const existingSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.id, subscriptionId),
  });

  if (existingSub) {
    // Renewal
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await db
      .update(subscriptions)
      .set({
        status: 'active',
        periodStart: now,
        periodEnd,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, subscriptionId));

    await db.insert(subEvents).values({
      subscriptionId: existingSub.id,
      event: 'renewed',
      metadata: JSON.stringify({
        source: 'nowpayments',
        paymentId: payload.payment_id,
        actuallyPaid: payload.actually_paid,
        payCurrency: payload.pay_currency,
      }),
    });

    console.log(`[NOWPayments Webhook] Subscription renewed: ${subscriptionId}`);
  } else {
    // New subscription — the subscription row should already exist from checkout flow
    // but if not, log a warning
    console.warn(
      `[NOWPayments Webhook] Subscription ${subscriptionId} not found in DB. ` +
        `Payment confirmed but subscription may need manual activation.`
    );
  }
}

async function handleTicketPurchase(
  orderId: string,
  payload: NowPaymentsIPNPayload
): Promise<void> {
  // orderId format: ticket_{ticketId}
  const ticketId = orderId.replace('ticket_', '');

  console.log(
    `[NOWPayments Webhook] Ticket purchase confirmed: ${ticketId} ` +
      `paid=${payload.actually_paid} ${payload.pay_currency}`
  );

  // TODO: Update ticket status in DB, send confirmation email
  // This will be implemented when the ticket purchase flow is connected
}

async function handleMarketplaceOrder(
  orderId: string,
  payload: NowPaymentsIPNPayload
): Promise<void> {
  // orderId format: merch_{orderId}
  const merchOrderId = orderId.replace('merch_', '');

  console.log(
    `[NOWPayments Webhook] Marketplace order confirmed: ${merchOrderId} ` +
      `paid=${payload.actually_paid} ${payload.pay_currency}`
  );

  // TODO: Update order status in DB, trigger fulfillment
  // This will be implemented when the marketplace checkout flow is connected
}

// ─── Metadata Parser ───

interface OrderMetadata {
  creatorId?: string;
  creatorIds?: string[];
  facilitatorId?: string;
  outlierId?: string;
  geoVerified?: boolean;
  facilitatorTier?: string;
}

function parseOrderMetadata(description: string): OrderMetadata {
  const metadata: OrderMetadata = {};

  if (!description) return metadata;

  try {
    // Try JSON first
    const parsed = JSON.parse(description);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as OrderMetadata;
    }
  } catch {
    // Fall back to key:value format
  }

  // Parse key:value pairs separated by commas
  const pairs = description.split(',');
  for (const pair of pairs) {
    const [key, value] = pair.split(':').map((s) => s.trim());
    if (!key || !value) continue;

    switch (key) {
      case 'creatorId':
        metadata.creatorId = value;
        break;
      case 'creatorIds':
        metadata.creatorIds = value.split(';').filter(Boolean);
        break;
      case 'facilitatorId':
        metadata.facilitatorId = value;
        break;
      case 'outlierId':
        metadata.outlierId = value;
        break;
      case 'geoVerified':
        metadata.geoVerified = value === 'true';
        break;
      case 'facilitatorTier':
        metadata.facilitatorTier = value;
        break;
    }
  }

  return metadata;
}

// ─── Idempotency ───
// TODO: Replace with Redis SET + 48h TTL for distributed idempotency
const processedPaymentIds = new Set<number>();

// ─── Route Handler ───

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  let payload: NowPaymentsIPNPayload;
  try {
    payload = JSON.parse(rawBody) as NowPaymentsIPNPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Idempotency check: skip duplicate payment_id processing
  if (processedPaymentIds.has(payload.payment_id)) {
    console.log(
      `[NOWPayments Webhook] Duplicate payment_id=${payload.payment_id}, skipping`
    );
    return NextResponse.json({ status: 'already_processed' }, { status: 200 });
  }

  // Log every webhook event
  console.log(
    `[NOWPayments Webhook] Received: status=${payload.payment_status} ` +
      `orderId=${payload.order_id} paymentId=${payload.payment_id} ` +
      `paid=${payload.actually_paid} ${payload.pay_currency}`
  );

  // Verify HMAC-SHA512 signature
  const signature =
    request.headers.get('x-nowpayments-sig') ?? '';

  if (!signature) {
    console.error('[NOWPayments Webhook] Missing signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  const bodyObj = JSON.parse(rawBody) as Record<string, unknown>;
  if (!verifyIPNSignature(bodyObj, signature)) {
    console.error('[NOWPayments Webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Route by payment status
  const txn = startTransaction('nowpayments-webhook', 'webhook.process');
  try {
    switch (payload.payment_status) {
      case 'waiting':
        console.log(
          `[NOWPayments Webhook] Payment waiting: ${payload.order_id}`
        );
        break;

      case 'confirming':
      case 'confirmed':
      case 'sending':
        console.log(
          `[NOWPayments Webhook] Payment in progress (${payload.payment_status}): ${payload.order_id}`
        );
        break;

      case 'partially_paid':
        console.warn(
          `[NOWPayments Webhook] Partial payment: ${payload.order_id} ` +
            `expected=${payload.pay_amount} actual=${payload.actually_paid}`
        );
        break;

      case 'finished': {
        // Payment complete — route by order type
        const orderId = payload.order_id;

        if (orderId.startsWith('sub_')) {
          await handleSubscriptionPayment(orderId, payload);
        } else if (orderId.startsWith('ticket_')) {
          await handleTicketPurchase(orderId, payload);
        } else if (orderId.startsWith('merch_')) {
          await handleMarketplaceOrder(orderId, payload);
        } else {
          console.warn(
            `[NOWPayments Webhook] Unknown order type: ${orderId}`
          );
        }
        break;
      }

      case 'failed':
        console.error(
          `[NOWPayments Webhook] Payment failed: ${payload.order_id}`
        );
        break;

      case 'refunded':
        console.warn(
          `[NOWPayments Webhook] Payment refunded: ${payload.order_id}`
        );
        // TODO: Handle refund — cancel subscription, reverse commission
        break;

      case 'expired':
        console.warn(
          `[NOWPayments Webhook] Payment expired: ${payload.order_id}`
        );
        break;

      default:
        console.warn(
          `[NOWPayments Webhook] Unknown status: ${payload.payment_status}`
        );
    }

    // Mark as processed after successful handling
    processedPaymentIds.add(payload.payment_id);
    txn.finish();

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    txn.finish();
    captureError(error, {
      action: 'nowpayments-webhook',
      metadata: {
        paymentId: payload.payment_id,
        orderId: payload.order_id,
        paymentStatus: payload.payment_status,
        payCurrency: payload.pay_currency,
        actuallyPaid: payload.actually_paid,
      },
    });
    console.error('[NOWPayments Webhook] Error processing event:', error);
    // Return 200 anyway to prevent NOWPayments from retrying
    // (we log the error and can investigate manually)
    return NextResponse.json(
      { status: 'ok', error: 'Processing error logged' },
      { status: 200 }
    );
  }
}
