import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const broadcastTypeEnum = pgEnum('broadcast_type', [
  'text',
  'voice_memo',
  'announcement',
  'exclusive',
]);

/**
 * Artist-to-fan broadcasts / messages.
 * Artists can send messages to all their subscribers (superfans).
 */
export const broadcasts = pgTable('broadcasts', {
  id: uuid('id').primaryKey().defaultRandom(),
  artistId: uuid('artist_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: broadcastTypeEnum('type').notNull().default('text'),
  title: text('title').notNull(),
  body: text('body').notNull(),
  mediaUrl: text('media_url'),
  subscribersOnly: boolean('subscribers_only').notNull().default(true),
  publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const broadcastsRelations = relations(broadcasts, ({ one }) => ({
  artist: one(users, {
    fields: [broadcasts.artistId],
    references: [users.id],
  }),
}));
