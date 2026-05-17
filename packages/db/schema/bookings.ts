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

/**
 * Contract lifecycle. A contract row is auto-created when an application
 * is accepted (the venue owner clicks Accept). Both parties review + amend
 * + sign; when both signatures land, status flips to 'signed'. After the
 * event the contract is marked 'completed' (this is the trigger event for
 * future concession settlements + ticket-revenue splits).
 */
export const bookingContractStatusEnum = pgEnum('booking_contract_status', [
  'draft',      // auto-created, awaiting both signatures
  'signed',     // both parties signed; event is on the books
  'completed', // event happened + settlements done
  'cancelled', // either party cancelled before the event
]);

export const bookingPaymentTermsEnum = pgEnum('booking_payment_terms', [
  'upfront',         // creator paid before the event
  'at_event',        // paid at the venue on event night
  'after_event',     // paid N days after event (default 7)
  'door_split_only', // no flat fee, revenue from door split only
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

/**
 * Booking contract — the agreement object that sits on top of an accepted
 * application. Holds the negotiated terms (creator fee, ticket revenue
 * split, concession revenue split, riders, payment timing) and both
 * parties' signatures. This is the structured contract that concession
 * settlements + ticket-revenue splits will key off in subsequent phases.
 *
 * Money terms are TRUST-BASED v1 — nothing held in escrow yet. The
 * contract is the authoritative record of what was agreed.
 *
 * Auto-creation: when bookings.accept fires, the procedure inserts a
 * contract row with defaults derived from the slot (event_start/end from
 * slot times, creator_fee_cents from slot.compensation_cents,
 * payment_terms='at_event'). Either party can amend while status='draft';
 * amendments reset both signatures. Both must re-sign to flip to 'signed'.
 */
export const bookingContracts = pgTable(
  'booking_contracts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // One contract per accepted application. Unique enforces 1:1.
    applicationId: uuid('application_id')
      .references(() => bookingApplications.id, { onDelete: 'cascade' })
      .notNull(),
    // Denormalized for fast lookups by party + venue.
    slotId: uuid('slot_id')
      .references(() => venueSlots.id, { onDelete: 'cascade' })
      .notNull(),
    venueId: uuid('venue_id')
      .references(() => venues.id, { onDelete: 'cascade' })
      .notNull(),
    venueOwnerUserId: uuid('venue_owner_user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    creatorUserId: uuid('creator_user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    eventStart: timestamp('event_start', { withTimezone: true }).notNull(),
    eventEnd: timestamp('event_end', { withTimezone: true }).notNull(),
    // Creator's guaranteed flat fee, if any. Nullable for door-split-only deals.
    creatorFeeCents: integer('creator_fee_cents'),
    // Basis points to creator on ticket revenue (0-10000; venue keeps the
    // remainder). Null = no ticket sharing in this deal.
    ticketSplitBp: integer('ticket_split_bp'),
    // Basis points to creator on concession (F&B) revenue. Null = no concession
    // sharing — venue keeps 100%.
    concessionSplitBp: integer('concession_split_bp'),
    paymentTerms: bookingPaymentTermsEnum('payment_terms').default('at_event').notNull(),
    setLengthMinutes: integer('set_length_minutes'),
    soundcheckAt: timestamp('soundcheck_at', { withTimezone: true }),
    riderText: text('rider_text'),
    cancellationPolicy: text('cancellation_policy'),
    venueSignedAt: timestamp('venue_signed_at', { withTimezone: true }),
    creatorSignedAt: timestamp('creator_signed_at', { withTimezone: true }),
    status: bookingContractStatusEnum('status').default('draft').notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancellationReason: text('cancellation_reason'),
    cancelledBy: uuid('cancelled_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('contracts_app_unique_idx').on(t.applicationId),
    index('contracts_venue_idx').on(t.venueOwnerUserId, t.status),
    index('contracts_creator_idx').on(t.creatorUserId, t.status),
    index('contracts_status_event_idx').on(t.status, t.eventStart),
  ]
);

export const bookingContractsRelations = relations(bookingContracts, ({ one }) => ({
  application: one(bookingApplications, {
    fields: [bookingContracts.applicationId],
    references: [bookingApplications.id],
  }),
  slot: one(venueSlots, {
    fields: [bookingContracts.slotId],
    references: [venueSlots.id],
  }),
  venue: one(venues, {
    fields: [bookingContracts.venueId],
    references: [venues.id],
  }),
  venueOwner: one(users, {
    fields: [bookingContracts.venueOwnerUserId],
    references: [users.id],
    relationName: 'contractVenueOwner',
  }),
  creator: one(users, {
    fields: [bookingContracts.creatorUserId],
    references: [users.id],
    relationName: 'contractCreator',
  }),
}));

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
