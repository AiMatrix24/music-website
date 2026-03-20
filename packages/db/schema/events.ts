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
  (t) => ({
    creatorIdx: index('series_creator_idx').on(t.creatorId),
  })
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
    description: jsonb('description'), // Tiptap JSON
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    venueId: uuid('venue_id').references(() => venues.id),
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
  (t) => ({
    hostIdx: index('events_host_idx').on(t.hostId),
    seriesIdx: index('events_series_idx').on(t.seriesId),
    statusIdx: index('events_status_idx').on(t.status),
    dateIdx: index('events_date_idx').on(t.startDate),
  })
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
  (t) => ({
    eventIdx: index('ef_event_idx').on(t.eventId),
    facilitatorIdx: index('ef_facilitator_idx').on(t.facilitatorId),
  })
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
  (t) => ({
    attendeeIdx: index('tickets_attendee_idx').on(t.attendeeId),
    eventIdx: index('tickets_event_idx').on(t.eventId),
  })
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
