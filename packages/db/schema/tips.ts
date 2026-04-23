import { pgTable, uuid, text, integer, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { tracks } from './tracks';

export const tipStatusEnum = pgEnum('tip_status', [
  'pending',
  'completed',
  'cancelled',
  'refunded',
]);

/**
 * Tips — one-time creator support payments from a fan to a creator.
 *
 * Flow: row inserted with status='pending' when NOWPayments charge is created.
 * Webhook flips 'pending' → 'completed' on payment.finished, or → 'cancelled'
 * on failed/expired. The tipperUserId may be different from the recipientUserId;
 * tipping yourself is rejected at the API layer.
 *
 * trackId is optional context — the track the user was viewing when they
 * opened the tip jar. Lets creators see "this tip came from someone listening
 * to X."
 */
export const tips = pgTable(
  'tips',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tipperUserId: uuid('tipper_user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    recipientUserId: uuid('recipient_user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    trackId: uuid('track_id').references(() => tracks.id, { onDelete: 'set null' }),
    amount: integer('amount').notNull(), // INTEGER CENTS
    message: text('message'), // Optional note (max 500 chars at API layer)
    status: tipStatusEnum('status').default('pending').notNull(),
    paymentId: text('payment_id'), // NOWPayments payment_id for reconciliation
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('tips_tipper_idx').on(t.tipperUserId),
    index('tips_recipient_idx').on(t.recipientUserId),
    index('tips_status_idx').on(t.status),
    index('tips_recipient_status_idx').on(t.recipientUserId, t.status),
  ]
);

export const tipsRelations = relations(tips, ({ one }) => ({
  tipper: one(users, {
    fields: [tips.tipperUserId],
    references: [users.id],
    relationName: 'tipsSent',
  }),
  recipient: one(users, {
    fields: [tips.recipientUserId],
    references: [users.id],
    relationName: 'tipsReceived',
  }),
  track: one(tracks, {
    fields: [tips.trackId],
    references: [tracks.id],
  }),
}));
