import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const visibilityEnum = pgEnum('visibility', [
  'public',
  'private',
  'unlisted',
  'subscribers_only',
]);

export const trackStatusEnum = pgEnum('track_status', [
  'uploading',
  'processing',
  'processing_failed',
  'published',
  'draft',
]);

export const tracks = pgTable(
  'tracks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    genre: text('genre'),
    bpm: integer('bpm'),
    duration: integer('duration'), // seconds
    peaksJson: jsonb('peaks_json'), // 1000-point waveform array
    audioUrl128: text('audio_url_128'), // MP3 128kbps
    audioUrl320: text('audio_url_320'), // MP3 320kbps
    audioUrlFlac: text('audio_url_flac'), // Lossless
    coverUrl: text('cover_url'),
    originalFileKey: text('original_file_key'), // S3 key for raw upload
    license: text('license'),
    visibility: visibilityEnum('visibility').default('public').notNull(),
    status: trackStatusEnum('status').default('uploading').notNull(),
    price: integer('price'), // INTEGER CENTS, null = free
    playCount: integer('play_count').default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('tracks_user_idx').on(t.userId),
    index('tracks_slug_idx').on(t.slug),
    index('tracks_status_idx').on(t.status),
    index('tracks_created_idx').on(t.createdAt),
  ]
);

export const trackPurchaseStatusEnum = pgEnum('track_purchase_status', [
  'pending',
  'completed',
  'cancelled',
  'refunded',
]);

/**
 * Track purchases — records a user's one-time purchase of a track.
 *
 * Flow: row inserted with status='pending' when NOWPayments charge is
 * created. Webhook flips 'pending' → 'completed' on payment.finished,
 * or → 'cancelled' on failed/expired. A 'completed' row means the user
 * owns the track (shown as "Owned" on the track detail page).
 */
export const trackPurchases = pgTable(
  'track_purchases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    trackId: uuid('track_id')
      .references(() => tracks.id, { onDelete: 'cascade' })
      .notNull(),
    pricePaid: integer('price_paid').notNull(), // INTEGER CENTS at purchase time
    status: trackPurchaseStatusEnum('status').default('pending').notNull(),
    paymentId: text('payment_id'), // NOWPayments payment_id for audit/reconciliation
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('track_purchases_user_idx').on(t.userId),
    index('track_purchases_track_idx').on(t.trackId),
    index('track_purchases_status_idx').on(t.status),
    index('track_purchases_user_track_idx').on(t.userId, t.trackId),
  ]
);

export const albums = pgTable(
  'albums',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    coverUrl: text('cover_url'),
    releaseDate: timestamp('release_date', { withTimezone: true }),
    price: integer('price'), // INTEGER CENTS
    visibility: visibilityEnum('visibility').default('public').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('albums_user_idx').on(t.userId),
  ]
);

export const albumTracks = pgTable(
  'album_tracks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    albumId: uuid('album_id')
      .references(() => albums.id, { onDelete: 'cascade' })
      .notNull(),
    trackId: uuid('track_id')
      .references(() => tracks.id, { onDelete: 'cascade' })
      .notNull(),
    position: integer('position').notNull(),
  },
  (t) => [
    index('album_tracks_album_idx').on(t.albumId),
  ]
);

export const playlists = pgTable('playlists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  description: text('description'),
  coverUrl: text('cover_url'),
  visibility: visibilityEnum('visibility').default('public').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const playlistTracks = pgTable(
  'playlist_tracks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    playlistId: uuid('playlist_id')
      .references(() => playlists.id, { onDelete: 'cascade' })
      .notNull(),
    trackId: uuid('track_id')
      .references(() => tracks.id, { onDelete: 'cascade' })
      .notNull(),
    position: integer('position').notNull(),
  },
  (t) => [
    index('playlist_tracks_playlist_idx').on(t.playlistId),
  ]
);

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    trackId: uuid('track_id')
      .references(() => tracks.id, { onDelete: 'cascade' })
      .notNull(),
    body: text('body').notNull(),
    timestampMs: integer('timestamp_ms'), // Timed comment position
    parentId: uuid('parent_id'), // Thread reply
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('comments_track_idx').on(t.trackId),
    index('comments_parent_idx').on(t.parentId),
  ]
);

export const likes = pgTable(
  'likes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    trackId: uuid('track_id').references(() => tracks.id, {
      onDelete: 'cascade',
    }),
    albumId: uuid('album_id').references(() => albums.id, {
      onDelete: 'cascade',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('likes_user_idx').on(t.userId),
  ]
);

export const reposts = pgTable(
  'reposts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    trackId: uuid('track_id').references(() => tracks.id, {
      onDelete: 'cascade',
    }),
    albumId: uuid('album_id').references(() => albums.id, {
      onDelete: 'cascade',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('reposts_user_idx').on(t.userId),
  ]
);

export const tracksRelations = relations(tracks, ({ one, many }) => ({
  user: one(users, { fields: [tracks.userId], references: [users.id] }),
  comments: many(comments),
}));
