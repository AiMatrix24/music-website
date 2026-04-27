import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  index,
  jsonb,
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
    // Attribution: where this subscription came from. Captured at signup,
    // never modified after. Schema (all keys optional):
    //   { source: 'qr' | 'subscribe-page' | 'artist-page',
    //     creatorId: string,           // primary creator (single tier)
    //     creatorIds: string[],        // bundle picks
    //     eventId: string,             // if scanned at a specific event
    //     scanLat: number, scanLng: number,  // best-effort GPS at signup
    //     scannedAt: ISO string }
    // Used for: commission attribution (creatorId/creatorIds drives the
    // webhook's commission waterfall) + signup analytics ("where do our
    // subs come from").
    attribution: jsonb('attribution'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('subs_user_idx').on(t.userId),
    index('subs_status_idx').on(t.status),
    index('subs_helio_idx').on(t.helioSubId),
    index('subs_samiteon_idx').on(t.samiteonSubId),
    // Partial index for payout queries
    index('subs_active_idx')
      .on(t.userId, t.status),
  ]
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
  (t) => [
    index('sub_events_sub_idx').on(t.subscriptionId),
  ]
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
