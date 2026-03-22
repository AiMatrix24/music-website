import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'admin',
  'creator',
  'facilitator',
  'outlier',
  'editor',
  'subscriber',
  'free',
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').unique(),
    name: text('name'),
    avatar: text('avatar'),
    role: userRoleEnum('role').default('free').notNull(),
    walletAddress: text('wallet_address'),
    samiteonAccountId: text('samiteon_account_id'),
    locale: text('locale').default('en-US').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex('users_email_idx').on(t.email),
    index('users_wallet_idx').on(t.walletAddress),
    index('users_role_idx').on(t.role),
  ]
);

export const oauthConnections = pgTable(
  'oauth_connections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    provider: text('provider').notNull(), // discord, twitter, twitch
    providerAccountId: text('provider_account_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex('oauth_provider_account_idx').on(
      t.provider,
      t.providerAccountId
    ),
    index('oauth_user_idx').on(t.userId),
  ]
);

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const follows = pgTable(
  'follows',
  {
    followerId: uuid('follower_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    followeeId: uuid('followee_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('follows_follower_idx').on(t.followerId),
    index('follows_followee_idx').on(t.followeeId),
  ]
);

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  }
);

export const taggables = pgTable(
  'taggables',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tagId: uuid('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
    taggableId: uuid('taggable_id').notNull(),
    taggableType: text('taggable_type').notNull(), // track, album, event, article, listing
  },
  (t) => [
    index('taggables_tag_idx').on(t.tagId),
    index('taggables_target_idx').on(t.taggableId, t.taggableType),
  ]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  oauthConnections: many(oauthConnections),
  sessions: many(sessions),
}));

export const oauthConnectionsRelations = relations(
  oauthConnections,
  ({ one }) => ({
    user: one(users, {
      fields: [oauthConnections.userId],
      references: [users.id],
    }),
  })
);
