import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  jsonb,
  index,
  real,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const eventStatusEnum = pgEnum('event_status', [
  'draft',
  'published',
  'active',
  'completed',
  'cancelled',
]);

export const paymentRailEnum = pgEnum('payment_rail', [
  'helio',
  'samiteon',
  'transbank',
  'pix',
]);

export const seriesTypeEnum = pgEnum('series_type', [
  'tour',
  'festival',
  'multi_city',
  'residency',
]);

// Parent container for tours, festivals, multi-city activations
export const eventSeries = pgTable(
  'event_series',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    creatorId: uuid('creator_id')
      .references(() => users.id)
      .notNull(),
    title: text('title').notNull(),
    description: jsonb('description'), // Rich text (Tiptap)
    seriesType: seriesTypeEnum('series_type').notNull(),
    coverUrl: text('cover_url'),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    countryScope: text('country_scope').array(), // ['US', 'BR', 'CL', 'GB']
    status: text('status').default('draft').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('series_creator_idx').on(t.creatorId),
  ]
);

export const venues = pgTable('venues', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
  lat: real('lat'),
  lng: real('lng'),
  capacity: integer('capacity'),
  geofenceRadius: integer('geofence_radius').default(50), // meters, small venue default
  geofenceZones: jsonb('geofence_zones'), // GeoJSON FeatureCollection for large venues
  gpsAccuracyThreshold: integer('gps_accuracy_threshold').default(100), // meters
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const events = pgTable(
  'events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    hostId: uuid('host_id')
      .references(() => users.id)
      .notNull(),
    title: text('title').notNull(),
    // Sanitized HTML from the rich text editor (same model as podcasts).
    // Was jsonb (Tiptap JSON); text is simpler and matches the rest of the
    // creator-facing content.
    description: text('description'),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    venueId: uuid('venue_id').references(() => venues.id),
    // Free-text venue fields captured at event creation. When a proper venues
    // system exists (Wave 3), these can be auto-populated from venueId.
    venueName: text('venue_name'),
    venueCity: text('venue_city'),
    venueAddress: text('venue_address'),
    // Geofencing (Option A — GPS directly on event row, no venues table needed
    // for MVP). When geofenceEnforced=true, ticket check-in requires the
    // scanner's GPS coordinates within geofenceRadiusMeters of (lat, lng) AND
    // the event's time window (start − 2h through end + 1h).
    venueLat: real('venue_lat'), // -90 to 90, null if not captured
    venueLng: real('venue_lng'), // -180 to 180, null if not captured
    geofenceRadiusMeters: integer('geofence_radius_meters').default(100),
    geofenceEnforced: boolean('geofence_enforced').default(false).notNull(),
    seriesId: uuid('series_id').references(() => eventSeries.id),
    seriesOrder: integer('series_order'),
    countryCode: text('country_code'), // ISO 3166-1 alpha-2
    timezone: text('timezone'), // IANA timezone
    currency: text('currency').default('USD'), // ISO 4217
    paymentRail: paymentRailEnum('payment_rail').default('helio'),
    status: eventStatusEnum('status').default('draft').notNull(),
    capacity: integer('capacity'),
    streamProvider: text('stream_provider'), // twitch, zoom, whereby, mux, streamyard
    streamUrl: text('stream_url'),
    coverUrl: text('cover_url'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('events_host_idx').on(t.hostId),
    index('events_series_idx').on(t.seriesId),
    index('events_status_idx').on(t.status),
    index('events_date_idx').on(t.startDate),
  ]
);

export const eventFacilitators = pgTable(
  'event_facilitators',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .references(() => events.id, { onDelete: 'cascade' })
      .notNull(),
    facilitatorId: uuid('facilitator_id')
      .references(() => users.id)
      .notNull(),
    assignedZone: text('assigned_zone'),
    totpSecret: text('totp_secret'), // Per-facilitator per-event TOTP
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('ef_event_idx').on(t.eventId),
    index('ef_facilitator_idx').on(t.facilitatorId),
  ]
);

export const ticketTierEnum = pgEnum('ticket_tier', [
  'free',
  'early_bird',
  'general',
  'vip',
]);

export const ticketTypes = pgTable('ticket_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  tier: ticketTierEnum('tier').default('general').notNull(),
  price: integer('price').default(0).notNull(), // INTEGER CENTS
  quantity: integer('quantity'),
  sold: integer('sold').default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const tickets = pgTable(
  'tickets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ticketTypeId: uuid('ticket_type_id')
      .references(() => ticketTypes.id)
      .notNull(),
    attendeeId: uuid('attendee_id')
      .references(() => users.id)
      .notNull(),
    eventId: uuid('event_id')
      .references(() => events.id)
      .notNull(),
    qrToken: text('qr_token').notNull().unique(), // Signed JWT
    checkedIn: timestamp('checked_in', { withTimezone: true }),
    status: text('status').default('valid').notNull(), // valid | used | cancelled | refunded
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('tickets_attendee_idx').on(t.attendeeId),
    index('tickets_event_idx').on(t.eventId),
  ]
);

// ─── Waitlist ───
export const waitlist = pgTable(
  'waitlist',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .references(() => events.id)
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    ticketTypeId: uuid('ticket_type_id')
      .references(() => ticketTypes.id),
    position: integer('position').notNull(),
    status: text('status').default('waiting').notNull(), // waiting | offered | accepted | expired
    notifiedAt: timestamp('notified_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('waitlist_event_idx').on(t.eventId),
    index('waitlist_user_idx').on(t.userId),
  ]
);

// ─── Promo Codes ───
export const promoCodes = pgTable(
  'promo_codes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .references(() => events.id)
      .notNull(),
    code: text('code').notNull(),
    discountType: text('discount_type').default('percentage').notNull(), // percentage | fixed
    discountValue: integer('discount_value').notNull(), // percentage (0-100) or fixed amount in cents
    maxUses: integer('max_uses'),
    usedCount: integer('used_count').default(0).notNull(),
    validFrom: timestamp('valid_from', { withTimezone: true }),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    subscriberOnly: boolean('subscriber_only').default(false).notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('promo_event_idx').on(t.eventId),
  ]
);

// ─── Ticket Transfers ───
export const ticketTransfers = pgTable(
  'ticket_transfers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ticketId: uuid('ticket_id')
      .references(() => tickets.id)
      .notNull(),
    fromUserId: uuid('from_user_id')
      .references(() => users.id)
      .notNull(),
    toEmail: text('to_email').notNull(),
    toUserId: uuid('to_user_id')
      .references(() => users.id),
    status: text('status').default('pending').notNull(), // pending | accepted | rejected | expired
    reason: text('reason'), // why they're transferring
    approvedByHost: boolean('approved_by_host').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (t) => [
    index('transfer_ticket_idx').on(t.ticketId),
  ]
);

export const eventsRelations = relations(events, ({ one, many }) => ({
  host: one(users, { fields: [events.hostId], references: [users.id] }),
  venue: one(venues, { fields: [events.venueId], references: [venues.id] }),
  series: one(eventSeries, {
    fields: [events.seriesId],
    references: [eventSeries.id],
  }),
  facilitators: many(eventFacilitators),
  ticketTypes: many(ticketTypes),
}));
