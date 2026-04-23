import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db, subscriptions, subEvents } from '@opynx/db';
import { tickets, ticketTypes, trackPurchases, tips, orders, orderItems, listings, commissions } from '@opynx/db/schema';
import { eq, sql } from 'drizzle-orm';
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
  payload: NowPaymentsIPNPayload,
  status: PaymentStatus
): Promise<void> {
  // orderId format: sub_{subscriptionId}_{tier}
  // The subscription row was created by /api/subscribe with status='inactive'
  // (our pending state — the DB enum lacks an explicit 'pending' value).
  const parts = orderId.split('_');
  const subscriptionId = parts[1];
  const tierRaw = parts[2] ?? 'premium';

  if (!subscriptionId || !/^[0-9a-f-]{36}$/i.test(subscriptionId)) {
    console.error(`[NOWPayments Webhook] Malformed subscription order_id: ${orderId}`);
    return;
  }

  // Look up the subscription (must already exist; created at checkout)
  const existingSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.id, subscriptionId),
  });

  if (!existingSub) {
    console.warn(
      `[NOWPayments Webhook] Subscription ${subscriptionId} not found in DB; ` +
        `cannot process status=${status}`
    );
    return;
  }

  // ── Handle terminal failure states first ──
  if (status === 'failed' || status === 'expired') {
    // Only mark cancelled if still pending — don't override active subs
    if (existingSub.status === 'inactive') {
      await db
        .update(subscriptions)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(subscriptions.id, subscriptionId));
      await db.insert(subEvents).values({
        subscriptionId,
        event: 'cancelled',
        metadata: JSON.stringify({ source: 'nowpayments', reason: status, paymentId: payload.payment_id }),
      });
      console.log(
        `[NOWPayments Webhook] Pending subscription ${subscriptionId} cancelled (status=${status})`
      );
    }
    return;
  }

  if (status === 'refunded') {
    await db
      .update(subscriptions)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(subscriptions.id, subscriptionId));
    await db.insert(subEvents).values({
      subscriptionId,
      event: 'refunded',
      metadata: JSON.stringify({ source: 'nowpayments', paymentId: payload.payment_id }),
    });
    console.log(`[NOWPayments Webhook] Subscription ${subscriptionId} refunded`);
    // TODO: reverse commission waterfall on refund
    return;
  }

  // ── status === 'finished': activate or renew ──
  const wasPending = existingSub.status === 'inactive';

  // Run the commission waterfall (only if metadata is present — embedded in
  // order_description at checkout time as colon-comma key:value pairs)
  const metadata = parseOrderMetadata(payload.order_description);
  const commissionTier = tierRaw === 'bundle' ? 'superfan_bundle' : 'standard';
  let waterfallResult: Awaited<ReturnType<typeof processCommissionWaterfall>> | null = null;
  if (commissionTier === 'standard' && metadata.creatorId) {
    waterfallResult = await processCommissionWaterfall({
      subscriptionId,
      tier: 'standard',
      creatorId: metadata.creatorId,
      facilitatorId: metadata.facilitatorId,
      outlierId: metadata.outlierId,
      geoVerified: metadata.geoVerified ?? false,
      facilitatorTier:
        (metadata.facilitatorTier as 'silver' | 'gold' | 'platinum') ?? 'silver',
    });
  } else if (commissionTier === 'superfan_bundle' && metadata.creatorIds) {
    waterfallResult = await processCommissionWaterfall({
      subscriptionId,
      tier: 'superfan_bundle',
      creatorIds: metadata.creatorIds,
      geoVerified: metadata.geoVerified ?? false,
      facilitatorTier:
        (metadata.facilitatorTier as 'silver' | 'gold' | 'platinum') ?? 'silver',
      facilitatorId: metadata.facilitatorId,
    });
  }

  // Persist commission rows so they show up on creator earnings dashboards
  // and can be aggregated into payout batches. Only persist non-platform
  // splits — platform revenue is implicit (not paid out to anyone).
  if (waterfallResult) {
    const persistRows = waterfallResult.splits
      .filter((s) => s.role !== 'platform' && s.recipientId !== 'platform' && s.amount > 0)
      .map((s) => ({
        recipientId: s.recipientId,
        tier: s.role as 'creator' | 'facilitator' | 'outlier',
        amount: s.amount,
        status: 'approved' as const, // Skip 'pending' — payment already confirmed by NOWPayments
        sourceType: 'subscription',
        sourceId: subscriptionId,
      }));
    if (persistRows.length > 0) {
      await db.insert(commissions).values(persistRows);
      console.log(
        `[NOWPayments Webhook] Persisted ${persistRows.length} commission rows for subscription ${subscriptionId}`
      );
    }
  }

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
    subscriptionId,
    event: wasPending ? 'created' : 'renewed',
    metadata: JSON.stringify({
      source: 'nowpayments',
      paymentId: payload.payment_id,
      actuallyPaid: payload.actually_paid,
      payCurrency: payload.pay_currency,
    }),
  });

  console.log(
    `[NOWPayments Webhook] Subscription ${subscriptionId} ${wasPending ? 'activated' : 'renewed'} (tier=${tierRaw})`
  );
}

async function handleTicketPurchase(
  orderId: string,
  payload: NowPaymentsIPNPayload,
  status: PaymentStatus
): Promise<void> {
  // orderId format: ticket_{ticketId} — the ticketId is a UUID for a ticket
  // row with status='pending' created at checkout.
  const ticketId = orderId.replace('ticket_', '');
  if (!/^[0-9a-f-]{36}$/i.test(ticketId)) {
    console.error(`[NOWPayments Webhook] Malformed ticket order_id: ${orderId}`);
    return;
  }

  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, ticketId),
  });
  if (!ticket) {
    console.warn(`[NOWPayments Webhook] Ticket ${ticketId} not found`);
    return;
  }

  if (status === 'finished') {
    // Payment complete — activate the ticket
    if (ticket.status === 'valid') {
      console.log(`[NOWPayments Webhook] Ticket ${ticketId} already valid (idempotent)`);
      return;
    }
    await db.update(tickets).set({ status: 'valid' }).where(eq(tickets.id, ticketId));
    console.log(
      `[NOWPayments Webhook] Ticket ${ticketId} activated, paid=${payload.actually_paid} ${payload.pay_currency}`
    );
    // TODO: send confirmation email with QR code
  } else if (status === 'failed' || status === 'expired' || status === 'refunded') {
    // Release inventory + cancel the pending ticket (only if still pending)
    if (ticket.status === 'pending') {
      await db.update(tickets).set({ status: 'cancelled' }).where(eq(tickets.id, ticketId));
      await db.execute(
        sql`UPDATE ticket_types SET sold = GREATEST(sold - 1, 0) WHERE id = ${ticket.ticketTypeId}`
      );
      console.log(
        `[NOWPayments Webhook] Ticket ${ticketId} cancelled, inventory released (status=${status})`
      );
    } else if (status === 'refunded') {
      // Already-activated ticket refunded: mark refunded + release inventory
      await db.update(tickets).set({ status: 'refunded' }).where(eq(tickets.id, ticketId));
      await db.execute(
        sql`UPDATE ticket_types SET sold = GREATEST(sold - 1, 0) WHERE id = ${ticket.ticketTypeId}`
      );
      console.log(`[NOWPayments Webhook] Ticket ${ticketId} refunded, inventory released`);
    }
  }
}

async function handleTrackPurchase(
  orderId: string,
  payload: NowPaymentsIPNPayload,
  status: PaymentStatus
): Promise<void> {
  // orderId format: trackbuy_{purchaseId}
  const purchaseId = orderId.replace('trackbuy_', '');
  if (!/^[0-9a-f-]{36}$/i.test(purchaseId)) {
    console.error(`[NOWPayments Webhook] Malformed track purchase order_id: ${orderId}`);
    return;
  }

  const purchase = await db.query.trackPurchases.findFirst({
    where: eq(trackPurchases.id, purchaseId),
  });
  if (!purchase) {
    console.warn(`[NOWPayments Webhook] Track purchase ${purchaseId} not found`);
    return;
  }

  if (status === 'finished') {
    if (purchase.status === 'completed') {
      console.log(`[NOWPayments Webhook] Track purchase ${purchaseId} already completed (idempotent)`);
      return;
    }
    await db
      .update(trackPurchases)
      .set({ status: 'completed', updatedAt: new Date() })
      .where(eq(trackPurchases.id, purchaseId));
    console.log(
      `[NOWPayments Webhook] Track purchase ${purchaseId} completed (trackId=${purchase.trackId})`
    );
    // TODO: notify creator of sale, apply commission waterfall for per-track sales
  } else if (status === 'failed' || status === 'expired') {
    if (purchase.status === 'pending') {
      await db
        .update(trackPurchases)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(trackPurchases.id, purchaseId));
      console.log(
        `[NOWPayments Webhook] Track purchase ${purchaseId} cancelled (status=${status})`
      );
    }
  } else if (status === 'refunded') {
    await db
      .update(trackPurchases)
      .set({ status: 'refunded', updatedAt: new Date() })
      .where(eq(trackPurchases.id, purchaseId));
    console.log(`[NOWPayments Webhook] Track purchase ${purchaseId} refunded`);
  }
}

async function handleTipPayment(
  orderId: string,
  payload: NowPaymentsIPNPayload,
  status: PaymentStatus
): Promise<void> {
  // orderId format: tip_{tipId}
  const tipId = orderId.replace('tip_', '');
  if (!/^[0-9a-f-]{36}$/i.test(tipId)) {
    console.error(`[NOWPayments Webhook] Malformed tip order_id: ${orderId}`);
    return;
  }

  const tip = await db.query.tips.findFirst({ where: eq(tips.id, tipId) });
  if (!tip) {
    console.warn(`[NOWPayments Webhook] Tip ${tipId} not found`);
    return;
  }

  if (status === 'finished') {
    if (tip.status === 'completed') {
      console.log(`[NOWPayments Webhook] Tip ${tipId} already completed (idempotent)`);
      return;
    }
    await db
      .update(tips)
      .set({ status: 'completed', updatedAt: new Date() })
      .where(eq(tips.id, tipId));
    console.log(
      `[NOWPayments Webhook] Tip ${tipId} completed: ${tip.amount} cents to ${tip.recipientUserId}`
    );
    // TODO: notify creator of tip received
  } else if (status === 'failed' || status === 'expired') {
    if (tip.status === 'pending') {
      await db
        .update(tips)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(tips.id, tipId));
      console.log(`[NOWPayments Webhook] Tip ${tipId} cancelled (status=${status})`);
    }
  } else if (status === 'refunded') {
    await db
      .update(tips)
      .set({ status: 'refunded', updatedAt: new Date() })
      .where(eq(tips.id, tipId));
    console.log(`[NOWPayments Webhook] Tip ${tipId} refunded`);
  }
}

async function handleMarketplaceOrder(
  orderId: string,
  payload: NowPaymentsIPNPayload,
  status: PaymentStatus
): Promise<void> {
  // orderId format: merch_{orderId}
  const merchOrderId = orderId.replace('merch_', '');
  if (!/^[0-9a-f-]{36}$/i.test(merchOrderId)) {
    console.error(`[NOWPayments Webhook] Malformed marketplace order_id: ${orderId}`);
    return;
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, merchOrderId),
  });
  if (!order) {
    console.warn(`[NOWPayments Webhook] Marketplace order ${merchOrderId} not found`);
    return;
  }

  if (status === 'finished') {
    if (order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') {
      console.log(`[NOWPayments Webhook] Marketplace order ${merchOrderId} already paid (idempotent)`);
      return;
    }
    await db
      .update(orders)
      .set({ status: 'paid', updatedAt: new Date() })
      .where(eq(orders.id, merchOrderId));
    console.log(
      `[NOWPayments Webhook] Marketplace order ${merchOrderId} paid: $${(order.totalAmount / 100).toFixed(2)} to seller ${order.sellerId}`
    );
    // TODO: notify seller of sale, send buyer confirmation email
  } else if (status === 'failed' || status === 'expired') {
    if (order.status === 'pending') {
      // Release stock: look up order items and add back
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, merchOrderId));
      for (const item of items) {
        await db.execute(
          sql`UPDATE listings SET stock = stock + ${item.quantity} WHERE id = ${item.listingId}`
        );
      }
      await db
        .update(orders)
        .set({ status: 'refunded', updatedAt: new Date() })
        .where(eq(orders.id, merchOrderId));
      console.log(
        `[NOWPayments Webhook] Marketplace order ${merchOrderId} cancelled (status=${status}), stock released`
      );
    }
  } else if (status === 'refunded') {
    await db
      .update(orders)
      .set({ status: 'refunded', updatedAt: new Date() })
      .where(eq(orders.id, merchOrderId));
    console.log(`[NOWPayments Webhook] Marketplace order ${merchOrderId} refunded`);
  }
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
          await handleSubscriptionPayment(orderId, payload, 'finished');
        } else if (orderId.startsWith('ticket_')) {
          await handleTicketPurchase(orderId, payload, 'finished');
        } else if (orderId.startsWith('trackbuy_')) {
          await handleTrackPurchase(orderId, payload, 'finished');
        } else if (orderId.startsWith('tip_')) {
          await handleTipPayment(orderId, payload, 'finished');
        } else if (orderId.startsWith('merch_')) {
          await handleMarketplaceOrder(orderId, payload, 'finished');
        } else {
          console.warn(
            `[NOWPayments Webhook] Unknown order type: ${orderId}`
          );
        }
        break;
      }

      case 'failed':
      case 'expired':
      case 'refunded': {
        console.warn(
          `[NOWPayments Webhook] Payment ${payload.payment_status}: ${payload.order_id}`
        );
        if (payload.order_id.startsWith('sub_')) {
          await handleSubscriptionPayment(
            payload.order_id,
            payload,
            payload.payment_status
          );
        } else if (payload.order_id.startsWith('ticket_')) {
          await handleTicketPurchase(payload.order_id, payload, payload.payment_status);
        } else if (payload.order_id.startsWith('trackbuy_')) {
          await handleTrackPurchase(payload.order_id, payload, payload.payment_status);
        } else if (payload.order_id.startsWith('tip_')) {
          await handleTipPayment(payload.order_id, payload, payload.payment_status);
        } else if (payload.order_id.startsWith('merch_')) {
          await handleMarketplaceOrder(payload.order_id, payload, payload.payment_status);
        }
        break;
      }

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
