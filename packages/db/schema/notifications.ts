import { pgTable, uuid, text, timestamp, pgEnum, index, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

/**
 * Notification types. Add new ones here as new notification sources wire in.
 * Kept as a pgEnum for indexability + type safety.
 */
export const notificationTypeEnum = pgEnum('notification_type', [
  // Revenue events
  'ticket_sale',       // event host: someone bought a ticket to your event
  'track_sale',        // creator: someone bought your track
  'subscription',      // creator: fan subscribed, commission earned
  'tip_received',      // creator: fan sent a tip
  'marketplace_sale',  // seller: listing sold
  // Social
  'follow',            // someone started following you
  'comment',           // someone commented on your track/episode/event
  'mention',           // reserved — someone @mentioned you
  // Creator lifecycle
  'payout_processed',  // payout request was paid out (admin marked paid)
  'payout_rejected',   // payout request was rejected
  'milestone',         // plays/followers hit a round number
  'verification_status', // verified application approved/rejected
  // Platform
  'system',            // announcements, policy, etc.
]);

/**
 * Notifications — in-app bell + full list. Rows are created by webhooks
 * (revenue events), background jobs (milestones), and the platform itself
 * (system announcements). Emails fire in parallel; notifications are the
 * in-app record that also gets a badge count on the bell.
 *
 * Read state: `readAt` timestamp. NULL = unread. Marking read is idempotent.
 * We don't delete read notifications — creators want to revisit "Tip
 * received from @fan" or "Ticket sold" history.
 */
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    type: notificationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    // Optional click-through URL (internal path, e.g. '/dashboard/earnings')
    link: text('link'),
    // Free-form metadata (amount cents, related entity ids, etc.). Kept as
    // jsonb so consumers can extract what they need without schema churn.
    metadata: jsonb('metadata'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('notif_user_idx').on(t.userId),
    index('notif_user_read_idx').on(t.userId, t.readAt),
    index('notif_user_created_idx').on(t.userId, t.createdAt),
  ]
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

/**
 * push_subscriptions — Web Push subscriptions per device. One user can
 * have many rows (phone + tablet + laptop, each gets its own subscription
 * with a different endpoint URL).
 *
 * Endpoints are unique by browser + device. We dedupe on insert by
 * (endpoint) so a user re-subscribing on the same device replaces the
 * old keys instead of creating duplicate rows.
 *
 * Subscriptions can expire silently (browser clears storage, user
 * revokes permission, push service rotates keys). The send helper
 * deletes rows on 410 Gone responses so we don't keep mailing dead
 * endpoints.
 */
export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    // Push service URL — uniquely identifies the (device, browser, install)
    endpoint: text('endpoint').notNull().unique(),
    // ECDH P-256 public key from the browser, base64url-encoded
    p256dh: text('p256dh').notNull(),
    // 16-byte auth secret from the browser, base64url-encoded
    auth: text('auth').notNull(),
    // For debugging — which device subscribed (e.g., "iPhone Safari")
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('psub_user_idx').on(t.userId),
  ]
);
