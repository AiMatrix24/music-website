import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { attributions } from './attributions';
import { users } from './users';

export const commissionTierEnum = pgEnum('commission_tier', [
  'creator',
  'facilitator',
  'outlier',
]);

export const commissionStatusEnum = pgEnum('commission_status', [
  'pending',
  'approved',
  'processing',
  'paid',
  'held',
  'clawed_back',
]);

// ⚠ CRITICAL: All amounts stored as INTEGER CENTS. $1.00 = 100.
// Floating-point arithmetic on currency is FORBIDDEN.
export const commissions = pgTable(
  'commissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    attributionId: uuid('attribution_id')
      .references(() => attributions.id)
      .notNull(),
    recipientId: uuid('recipient_id')
      .references(() => users.id)
      .notNull(),
    tier: commissionTierEnum('tier').notNull(),
    amount: integer('amount').notNull(), // INTEGER CENTS — $1.00 = 100
    status: commissionStatusEnum('status').default('pending').notNull(),
    payoutBatchId: uuid('payout_batch_id').references(
      () => payoutBatches.id
    ),
    txHash: text('tx_hash'), // Polygon transaction hash
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    attrIdx: index('comm_attr_idx').on(t.attributionId),
    recipientIdx: index('comm_recipient_idx').on(t.recipientId),
    statusIdx: index('comm_status_idx').on(t.status),
    tierIdx: index('comm_tier_idx').on(t.tier),
    batchIdx: index('comm_batch_idx').on(t.payoutBatchId),
  })
);

export const payoutBatches = pgTable(
  'payout_batches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    month: text('month').notNull(), // '2026-03'
    status: text('status').default('pending').notNull(), // pending | processing | completed | failed
    totalAmount: integer('total_amount').default(0).notNull(), // INTEGER CENTS
    recipientCount: integer('recipient_count').default(0),
    txHash: text('tx_hash'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    executedAt: timestamp('executed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    monthIdx: index('payout_month_idx').on(t.month),
    statusIdx: index('payout_status_idx').on(t.status),
  })
);

export const commissionsRelations = relations(commissions, ({ one }) => ({
  attribution: one(attributions, {
    fields: [commissions.attributionId],
    references: [attributions.id],
  }),
  recipient: one(users, {
    fields: [commissions.recipientId],
    references: [users.id],
  }),
  payoutBatch: one(payoutBatches, {
    fields: [commissions.payoutBatchId],
    references: [payoutBatches.id],
  }),
}));
