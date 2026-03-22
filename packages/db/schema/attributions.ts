import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { subscriptions } from './subscriptions';

export const scanLogs = pgTable(
  'scan_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    qrCodeId: text('qr_code_id'),
    userId: uuid('user_id').references(() => users.id),
    eventId: uuid('event_id'),
    facilitatorId: uuid('facilitator_id').references(() => users.id),
    scanType: text('scan_type').default('ACQUISITION_SCAN'), // ACQUISITION_SCAN | RETENTION_SCAN
    geoMatch: boolean('geo_match').default(false),
    geoConfidence: text('geo_confidence'), // EXACT | BUFFER
    totpFallback: boolean('totp_fallback').default(false),
    latitude: text('latitude'), // Stored only for verification, discarded after check per GDPR
    longitude: text('longitude'),
    accuracy: text('accuracy'),
    deviceFingerprint: text('device_fingerprint'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('scan_logs_user_idx').on(t.userId),
    index('scan_logs_event_idx').on(t.eventId),
    index('scan_logs_created_idx').on(t.createdAt),
  ]
);

export const attributions = pgTable(
  'attributions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    subscriberId: uuid('subscriber_id')
      .references(() => users.id)
      .notNull(),
    creatorId: uuid('creator_id')
      .references(() => users.id)
      .notNull(),
    facilitatorId: uuid('facilitator_id').references(() => users.id),
    outlierId: uuid('outlier_id').references(() => users.id),
    scanLogId: uuid('scan_log_id').references(() => scanLogs.id),
    subscriptionId: uuid('subscription_id').references(
      () => subscriptions.id
    ),
    eventId: uuid('event_id'),
    geoVerified: boolean('geo_verified').default(false).notNull(),
    geoConfidence: text('geo_confidence'), // EXACT | BUFFER
    totpVerified: boolean('totp_verified').default(false).notNull(),
    firstScanLocked: boolean('first_scan_locked').default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('attr_subscriber_idx').on(t.subscriberId),
    index('attr_creator_idx').on(t.creatorId),
    index('attr_facilitator_idx').on(t.facilitatorId),
    index('attr_outlier_idx').on(t.outlierId),
    index('attr_event_idx').on(t.eventId),
  ]
);

export const attributionsRelations = relations(attributions, ({ one }) => ({
  subscriber: one(users, {
    fields: [attributions.subscriberId],
    references: [users.id],
    relationName: 'subscriber',
  }),
  creator: one(users, {
    fields: [attributions.creatorId],
    references: [users.id],
    relationName: 'creator',
  }),
  subscription: one(subscriptions, {
    fields: [attributions.subscriptionId],
    references: [subscriptions.id],
  }),
  scanLog: one(scanLogs, {
    fields: [attributions.scanLogId],
    references: [scanLogs.id],
  }),
}));
