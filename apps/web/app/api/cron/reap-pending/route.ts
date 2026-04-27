import { NextResponse } from 'next/server';
import { eq, and, sql, lt, isNotNull } from 'drizzle-orm';
import { db } from '@opynx/db';
import {
  subscriptions,
  tickets,
  trackPurchases,
  tips,
  orders,
  orderItems,
  verificationApplications,
} from '@opynx/db/schema';

/**
 * Stale-pending reaper — runs on a schedule (vercel.json crons) to clean up
 * abandoned checkouts across all 5 revenue paths.
 *
 * Why this exists: when a user clicks "Buy" we create a `pending` row +
 * NOWPayments charge. NOWPayments sends webhook events on success/failure/
 * expiry, but if the user closes the browser tab BEFORE NOWPayments emits
 * any final state, the pending row sits forever and (for tickets/orders)
 * blocks inventory.
 *
 * What it reaps (anything older than 30 minutes still in pending state):
 *   - subscriptions where status='inactive' → 'cancelled' (no inventory to release)
 *   - tickets where status='pending' → 'cancelled' + release ticket_type stock
 *   - trackPurchases where status='pending' → 'cancelled' (no inventory)
 *   - tips where status='pending' → 'cancelled' (no inventory)
 *   - orders where status='pending' → 'refunded' + release listing stock per item
 *
 * Auth: Vercel cron sends Authorization: Bearer ${CRON_SECRET} when CRON_SECRET
 * is set as an env var. This handler rejects requests without it.
 */

const REAP_AGE_MINUTES = 30;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  // Auth check — Vercel cron uses a bearer token header
  const auth = request.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const cutoff = new Date(Date.now() - REAP_AGE_MINUTES * 60 * 1000);
  // Verification ID photo retention — 30 days post-decision (privacy minimum)
  const idPhotoCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const summary = {
    subscriptionsCancelled: 0,
    ticketsCancelled: 0,
    ticketStockReleased: 0,
    trackPurchasesCancelled: 0,
    tipsCancelled: 0,
    ordersCancelled: 0,
    orderStockReleased: 0,
    verificationIdPhotosScrubbed: 0,
  };

  // ── Subscriptions: pending = status 'inactive' ──
  const subResult = await db
    .update(subscriptions)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(and(eq(subscriptions.status, 'inactive'), lt(subscriptions.createdAt, cutoff)))
    .returning({ id: subscriptions.id });
  summary.subscriptionsCancelled = subResult.length;

  // ── Tickets: pending → cancelled + release stock per ticket ──
  const stalePendingTickets = await db
    .select({ id: tickets.id, ticketTypeId: tickets.ticketTypeId })
    .from(tickets)
    .where(and(eq(tickets.status, 'pending'), lt(tickets.createdAt, cutoff)));
  for (const t of stalePendingTickets) {
    await db.update(tickets).set({ status: 'cancelled' }).where(eq(tickets.id, t.id));
    await db.execute(
      sql`UPDATE ticket_types SET sold = GREATEST(sold - 1, 0) WHERE id = ${t.ticketTypeId}`
    );
    summary.ticketsCancelled++;
    summary.ticketStockReleased++;
  }

  // ── Track purchases: pending → cancelled ──
  const tpResult = await db
    .update(trackPurchases)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(and(eq(trackPurchases.status, 'pending'), lt(trackPurchases.createdAt, cutoff)))
    .returning({ id: trackPurchases.id });
  summary.trackPurchasesCancelled = tpResult.length;

  // ── Tips: pending → cancelled ──
  const tipResult = await db
    .update(tips)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(and(eq(tips.status, 'pending'), lt(tips.createdAt, cutoff)))
    .returning({ id: tips.id });
  summary.tipsCancelled = tipResult.length;

  // ── Marketplace orders: pending → refunded + release listing stock ──
  const stalePendingOrders = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.status, 'pending'), lt(orders.createdAt, cutoff)));
  for (const o of stalePendingOrders) {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
    for (const item of items) {
      await db.execute(
        sql`UPDATE listings SET stock = stock + ${item.quantity} WHERE id = ${item.listingId}`
      );
      summary.orderStockReleased += item.quantity;
    }
    await db
      .update(orders)
      .set({ status: 'refunded', updatedAt: new Date() })
      .where(eq(orders.id, o.id));
    summary.ordersCancelled++;
  }

  // ── Verification ID photos: scrub idImageKey 30+ days after decision ──
  // Keep the application row (audit trail), drop the photo URL (privacy).
  // Note: this NULLs the column but doesn't delete the file from UploadThing —
  // when UploadThing's bulk-delete API is wired up, replace this with a
  // server-side delete + then NULL.
  const photoScrubResult = await db
    .update(verificationApplications)
    .set({ idImageKey: null })
    .where(
      and(
        isNotNull(verificationApplications.decidedAt),
        lt(verificationApplications.decidedAt, idPhotoCutoff),
        isNotNull(verificationApplications.idImageKey)
      )
    )
    .returning({ id: verificationApplications.id });
  summary.verificationIdPhotosScrubbed = photoScrubResult.length;

  console.log(
    `[Cron reap-pending] cutoff=${cutoff.toISOString()} ` +
      `subs=${summary.subscriptionsCancelled} ` +
      `tickets=${summary.ticketsCancelled} (stock+${summary.ticketStockReleased}) ` +
      `trackBuys=${summary.trackPurchasesCancelled} ` +
      `tips=${summary.tipsCancelled} ` +
      `orders=${summary.ordersCancelled} (stock+${summary.orderStockReleased}) ` +
      `idPhotos=${summary.verificationIdPhotosScrubbed}`
  );

  return NextResponse.json({
    ok: true,
    cutoff: cutoff.toISOString(),
    summary,
  });
}
