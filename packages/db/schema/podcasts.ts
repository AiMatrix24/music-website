import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  jsonb,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const podcastStatusEnum = pgEnum('podcast_status', [
  'draft',
  'published',
  'archived',
]);

export const episodeStatusEnum = pgEnum('episode_status', [
  'recording',
  'uploading',
  'processing',
  'draft',
  'scheduled',
  'published',
]);

/**
 * Podcast shows — a series container for episodes.
 */
export const podcasts = pgTable(
  'podcasts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    coverUrl: text('cover_url'),
    language: text('language').notNull().default('en'),
    category: text('category'), // Apple Podcasts category
    subcategory: text('subcategory'),
    author: text('author'),
    ownerEmail: text('owner_email'),
    explicit: boolean('explicit').notNull().default(false),
    websiteUrl: text('website_url'),
    status: podcastStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('podcasts_user_id_idx').on(table.userId),
    slugIdx: index('podcasts_slug_idx').on(table.slug),
  })
);

export const podcastsRelations = relations(podcasts, ({ one, many }) => ({
  user: one(users, {
    fields: [podcasts.userId],
    references: [users.id],
  }),
  episodes: many(podcastEpisodes),
}));

/**
 * Podcast episodes within a show.
 */
export const podcastEpisodes = pgTable(
  'podcast_episodes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    podcastId: uuid('podcast_id')
      .notNull()
      .references(() => podcasts.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    description: text('description'), // show notes (HTML/markdown)
    coverUrl: text('cover_url'), // per-episode artwork (overrides show cover)
    episodeNumber: integer('episode_number'),
    seasonNumber: integer('season_number'),
    audioUrl: text('audio_url'), // processed MP3
    originalFileKey: text('original_file_key'), // S3 key
    duration: integer('duration'), // seconds
    fileSize: integer('file_size'), // bytes (for RSS enclosure)
    peaksJson: jsonb('peaks_json'), // waveform data
    chaptersJson: jsonb('chapters_json'), // [{startTime, title, url?, imageUrl?}]
    transcription: text('transcription'),
    status: episodeStatusEnum('status').notNull().default('draft'),
    publishAt: timestamp('publish_at', { withTimezone: true }), // scheduled
    publishedAt: timestamp('published_at', { withTimezone: true }),
    explicit: boolean('explicit').notNull().default(false),
    episodeType: text('episode_type').notNull().default('full'), // full, trailer, bonus
    downloadCount: integer('download_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    podcastIdIdx: index('episodes_podcast_id_idx').on(table.podcastId),
    statusIdx: index('episodes_status_idx').on(table.status),
    publishAtIdx: index('episodes_publish_at_idx').on(table.publishAt),
  })
);

export const podcastEpisodesRelations = relations(podcastEpisodes, ({ one }) => ({
  podcast: one(podcasts, {
    fields: [podcastEpisodes.podcastId],
    references: [podcasts.id],
  }),
}));
