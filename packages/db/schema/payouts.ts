import { pgTable, uuid, integer, text, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const payoutRequestStatusEnum = pgEnum('payout_request_status', [
  'pending', // Created by creator, awaiting admin processing
  'processing', // Admin has picked it up
  'paid', // On-chain transfer confirmed (txHash recorded)
  'rejected', // Admin rejected (e.g. insufficient balance, fraud check failed)
  'cancelled', // Creator cancelled before processing
]);

/**
 * payout_requests — manual payout queue for the visibility-only payout flow
 * (Option C from the audit). When a creator clicks "Request Payout":
 *
 *  1. Snapshot the amount they're requesting + the wallet address at request time
 *  2. Insert a row with status='pending'
 *  3. Admin reviews via DB query (or future admin dashboard) and sends USDC
 *     manually from the OPYNX wallet using MetaMask
 *  4. Admin records the on-chain txHash and flips status='paid'
 *
 * "How much can I request?" = lifetime earnings (from earningsRouter.summary)
 *   minus the sum of all already-paid + processing payout requests for this user.
 *
 * Wallet address is snapshotted so a creator changing their wallet after
 * requesting doesn't accidentally redirect a pending payout.
 */
export const payoutRequests = pgTable(
  'payout_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    amountCents: integer('amount_cents').notNull(), // Snapshot at request time
    walletAddress: text('wallet_address').notNull(), // Snapshot at request time
    status: payoutRequestStatusEnum('status').default('pending').notNull(),
    txHash: text('tx_hash'), // Polygon transaction hash, set when status='paid'
    notes: text('notes'), // Admin notes (rejection reason, payment notes)
    requestedAt: timestamp('requested_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('payout_req_user_idx').on(t.userId),
    index('payout_req_status_idx').on(t.status),
    index('payout_req_user_status_idx').on(t.userId, t.status),
  ]
);

export const payoutRequestsRelations = relations(payoutRequests, ({ one }) => ({
  user: one(users, {
    fields: [payoutRequests.userId],
    references: [users.id],
  }),
}));
