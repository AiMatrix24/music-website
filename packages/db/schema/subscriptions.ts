import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const subTierEnum = pgEnum('sub_tier', [
  'free',
  'premium',
  'bundle',
  'studio',
]);

export const subStatusEnum = pgEnum('sub_status', [
  'active',
  'past_due',
  'inactive',
  'cancelled',
]);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    tier: subTierEnum('tier').default('free').notNull(),
    status: subStatusEnum('status').default('inactive').notNull(),
    billingCycle: text('billing_cycle').default('monthly'),
    helioSubId: text('helio_sub_id'),
    samiteonSubId: text('samiteon_sub_id'),
    periodStart: timestamp('period_start', { withTimezone: true }),
    periodEnd: timestamp('period_end', { withTimezone: true }),
    gracePeriodEndsAt: timestamp('grace_period_ends_at', {
      withTimezone: true,
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userIdx: index('subs_user_idx').on(t.userId),
    statusIdx: index('subs_status_idx').on(t.status),
    helioIdx: index('subs_helio_idx').on(t.helioSubId),
    samiteonIdx: index('subs_samiteon_idx').on(t.samiteonSubId),
    // Partial index for payout queries
    activeIdx: index('subs_active_idx')
      .on(t.userId, t.status),
  })
);

export const subEventEnum = pgEnum('sub_event_type', [
  'created',
  'renewed',
  'cancelled',
  'refunded',
  'upgraded',
  'downgraded',
]);

export const subEvents = pgTable(
  'sub_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    subscriptionId: uuid('subscription_id')
      .references(() => subscriptions.id)
      .notNull(),
    event: subEventEnum('event').notNull(),
    metadata: text('metadata'), // JSON string
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    subIdx: index('sub_events_sub_idx').on(t.subscriptionId),
  })
);

export const subscriptionsRelations = relations(
  subscriptions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [subscriptions.userId],
      references: [users.id],
    }),
    events: many(subEvents),
  })
);
