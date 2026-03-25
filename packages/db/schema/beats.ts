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
import { visibilityEnum } from './tracks';

export const beatProjectStatusEnum = pgEnum('beat_project_status', [
  'draft',
  'rendering',
  'rendered',
  'published',
]);

/**
 * Beat maker projects — full DAW state stored as JSON.
 */
export const beatProjects = pgTable(
  'beat_projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    bpm: integer('bpm').notNull().default(120),
    timeSignature: text('time_signature').notNull().default('4/4'),
    swingAmount: integer('swing_amount').notNull().default(0),
    duration: integer('duration'), // seconds
    coverUrl: text('cover_url'),
    projectData: jsonb('project_data'), // full Tone.js state
    renderedAudioKey: text('rendered_audio_key'), // S3 key
    status: beatProjectStatusEnum('status').notNull().default('draft'),
    visibility: visibilityEnum('visibility').notNull().default('private'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('beat_projects_user_id_idx').on(table.userId),
    statusIdx: index('beat_projects_status_idx').on(table.status),
  })
);

export const beatProjectsRelations = relations(beatProjects, ({ one }) => ({
  user: one(users, {
    fields: [beatProjects.userId],
    references: [users.id],
  }),
}));

/**
 * User-uploaded audio samples for beat projects.
 */
export const beatProjectSamples = pgTable(
  'beat_project_samples',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => beatProjects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    fileKey: text('file_key').notNull(),
    duration: integer('duration'), // milliseconds
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdIdx: index('beat_samples_project_id_idx').on(table.projectId),
  })
);
