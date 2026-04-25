/**
 * Notification helper. Insert a row into the `notifications` table for
 * in-app bell delivery. Webhooks call this fire-and-forget alongside email
 * sends — the in-app row + email are independent delivery channels.
 *
 * Errors are logged but never thrown; notification persistence must never
 * fail a webhook (the user already paid).
 */
import { db, notifications } from '@opynx/db';

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

export async function notify(args: NotifyArgs): Promise<void> {
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
}

/** Format cents as a USD string for notification bodies. */
export function fmtCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
