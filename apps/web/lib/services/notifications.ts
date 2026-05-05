/**
 * Notification helper. Inserts a row into the `notifications` table for
 * in-app bell delivery AND fires Web Push notifications to the user's
 * subscribed devices. Webhooks call notify() fire-and-forget alongside
 * email sends — the in-app row, email, and push are three independent
 * delivery channels.
 *
 * Errors are logged but never thrown; notification persistence must never
 * fail a webhook (the user already paid).
 */
import { db, notifications, pushSubscriptions, users } from '@opynx/db';
import { eq } from 'drizzle-orm';
import webpush from 'web-push';

type NotificationType =
  | 'ticket_sale'
  | 'track_sale'
  | 'subscription'
  | 'tip_received'
  | 'marketplace_sale'
  | 'follow'
  | 'comment'
  | 'mention'
  | 'payout_processed'
  | 'payout_rejected'
  | 'milestone'
  | 'verification_status'
  | 'system';

interface NotifyArgs {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

// Lazy VAPID setup. Done once on first push send instead of at module-load
// so a missing env var doesn't crash unrelated code at import time.
let vapidConfigured = false;
function configureVapid(): boolean {
  if (vapidConfigured) return true;
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) {
    console.warn('[notify] VAPID keys missing — Web Push disabled');
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

/**
 * Send a Web Push notification to every device the user has subscribed.
 * Loops through all subscriptions for the user, swallows any that 404 or
 * 410 (expired/unsubscribed) and deletes those rows so we stop trying
 * to send to them next time.
 */
async function sendPush(args: NotifyArgs): Promise<void> {
  if (!configureVapid()) return;

  let subs;
  try {
    subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, args.userId));
  } catch (err) {
    console.error('[notify] Failed to look up push subscriptions:', err);
    return;
  }
  if (subs.length === 0) return;

  const payload = JSON.stringify({
    title: args.title,
    body: args.body,
    link: args.link ?? '/notifications',
    type: args.type,
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        // 404 / 410 = subscription gone (revoked, expired, browser cleared).
        // Drop the row so we don't keep trying.
        if (status === 404 || status === 410) {
          try {
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.endpoint, sub.endpoint));
            console.log('[notify] Removed dead push subscription:', sub.endpoint.slice(0, 60));
          } catch {}
        } else {
          console.error('[notify] Push send failed:', status, (err as Error)?.message);
        }
      }
    })
  );
}

/**
 * Map notification types → user preference column. Types not in the map
 * (system, verification_status) bypass prefs and always notify — those
 * are security/compliance, not noise.
 */
function prefColumnForType(type: NotificationType): keyof typeof users.$inferSelect | null {
  switch (type) {
    case 'follow': return 'notifFollows';
    case 'ticket_sale': return 'notifTicketSales';
    case 'track_sale': return 'notifTrackSales';
    case 'tip_received': return 'notifTips';
    case 'comment':
    case 'mention': return 'notifComments';
    case 'milestone': return 'notifMilestones';
    case 'payout_processed':
    case 'payout_rejected': return 'notifPayouts';
    case 'subscription':
    case 'marketplace_sale': return 'notifTrackSales'; // grouped with track_sales
    default: return null; // system, verification_status — always notify
  }
}

async function userOptedIn(userId: string, type: NotificationType): Promise<boolean> {
  const col = prefColumnForType(type);
  if (!col) return true; // mandatory types
  try {
    const u = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { [col]: true } as never,
    });
    if (!u) return true; // user gone — don't block
    return Boolean((u as Record<string, unknown>)[col]);
  } catch (err) {
    console.error('[notify] pref lookup failed, defaulting to send:', err);
    return true;
  }
}

export async function notify(args: NotifyArgs): Promise<void> {
  // Check user's per-type pref first. Skip both channels (bell + push) if opted out.
  const optedIn = await userOptedIn(args.userId, args.type);
  if (!optedIn) return;

  // 1) In-app bell row — always attempted first
  try {
    await db.insert(notifications).values({
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      link: args.link ?? null,
      metadata: args.metadata ?? null,
    });
  } catch (err) {
    console.error('[notify] Failed to insert notification:', err);
  }

  // 2) Web Push to subscribed devices — fire-and-forget, doesn't block.
  //    Caller already gets the in-app row even if push delivery hiccups.
  sendPush(args).catch((err) => {
    console.error('[notify] sendPush threw:', err);
  });
}

/** Format cents as a USD string for notification bodies. */
export function fmtCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
