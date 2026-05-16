/**
 * Venues-side marketplace: venue owners post available time slots, creators
 * apply, owners accept/decline. Pay terms are TRUST-BASED v1 (off-platform) —
 * the agreed compensation is recorded on the application for the record but
 * OPYNX does not hold or move money for these bookings. Escrow + on-platform
 * payment can layer on later (similar pattern to track-split escrow).
 */
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { venues } from './events';

export const slotTypeEnum = pgEnum('slot_type', [
  'open_mic',     // free / open invitation
  'paid',         // venue pays the creator a flat fee
  'door_split',   // creator gets a % of ticket revenue
  'showcase',     // unpaid but curated (e.g. industry showcase)
]);

export const slotStatusEnum = pgEnum('slot_status', [
  'open',         // accepting applications
  'filled',       // an application was accepted; further apps blocked
  'cancelled',    // owner cancelled before filling
]);

export const bookingApplicationStatusEnum = pgEnum('booking_application_status', [
  'pending',      // awaiting venue owner's decision
  'accepted',     // owner accepted; slot is filled
  'declined',     // owner declined this specific app
  'withdrawn',    // creator pulled their own app before a decision
]);

export const venueSlots = pgTable(
  'venue_slots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    venueId: uuid('venue_id')
      .references(() => venues.id, { onDelete: 'cascade' })
      .notNull(),
    // Denormalized — same as venues.ownerUserId at slot-creation time. Lets
    // listing queries filter by owner without a join.
    ownerUserId: uuid('owner_user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    title: text('title').notNull(),
    description: text('description'),
    slotType: slotTypeEnum('slot_type').notNull(),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    // Trust-based fee — what the venue says they'll pay. Cents. Nullable for
    // open_mic / showcase types.
    compensationCents: integer('compensation_cents'),
    // Basis points to creator on door-split slots (5000 = 50%). Nullable
    // unless slot_type='door_split'.
    doorSplitBp: integer('door_split_bp'),
    genres: jsonb('genres'), // string[] preferred genres
    capacityHint: integer('capacity_hint'), // optional override of venue capacity
    status: slotStatusEnum('status').default('open').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('venue_slots_venue_idx').on(t.venueId),
    index('venue_slots_owner_idx').on(t.ownerUserId),
    index('venue_slots_status_idx').on(t.status, t.startTime),
  ]
);

export const bookingApplications = pgTable(
  'booking_applications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slotId: uuid('slot_id')
      .references(() => venueSlots.id, { onDelete: 'cascade' })
      .notNull(),
    creatorUserId: uuid('creator_user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    message: text('message'),
    // Optional counter-offer from the creator (e.g. "I'd do this for $250").
    // Trust-based v1: this is just on the record; no money moves.
    proposedFeeCents: integer('proposed_fee_cents'),
    status: bookingApplicationStatusEnum('status').default('pending').notNull(),
    decisionMessage: text('decision_message'), // venue's note on accept/decline
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    decidedBy: uuid('decided_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    // One application per (slot, creator). Re-applies update the existing row.
    uniqueIndex('booking_apps_unique_idx').on(t.slotId, t.creatorUserId),
    index('booking_apps_creator_idx').on(t.creatorUserId, t.status),
    index('booking_apps_slot_status_idx').on(t.slotId, t.status),
  ]
);

export const venueSlotsRelations = relations(venueSlots, ({ one, many }) => ({
  venue: one(venues, {
    fields: [venueSlots.venueId],
    references: [venues.id],
  }),
  owner: one(users, {
    fields: [venueSlots.ownerUserId],
    references: [users.id],
  }),
  applications: many(bookingApplications),
}));

export const bookingApplicationsRelations = relations(bookingApplications, ({ one }) => ({
  slot: one(venueSlots, {
    fields: [bookingApplications.slotId],
    references: [venueSlots.id],
  }),
  creator: one(users, {
    fields: [bookingApplications.creatorUserId],
    references: [users.id],
  }),
}));
