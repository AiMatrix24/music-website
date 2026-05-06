import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
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
  // 'suspended' = DMCA repeat-infringer (3 strikes) or admin sanction.
  // protectedProcedure middleware blocks all writes for suspended users.
  // Reversible — admin can flip them back to a normal role.
  'suspended',
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').unique(),
    name: text('name'),
    avatar: text('avatar'),
    // Profile cover banner (the wide image above the avatar on /settings and
    // /artist/[id]). UploadThing imageUpload — 8MB max, recommended 1500×500.
    bannerUrl: text('banner_url'),
    role: userRoleEnum('role').default('free').notNull(),
    bio: text('bio'),
    walletAddress: text('wallet_address'),
    samiteonAccountId: text('samiteon_account_id'),
    socialInstagram: text('social_instagram'),
    socialTwitter: text('social_twitter'),
    socialTiktok: text('social_tiktok'),
    socialYoutube: text('social_youtube'),
    socialSpotify: text('social_spotify'),
    socialSoundcloud: text('social_soundcloud'),
    socialWebsite: text('social_website'),
    locale: text('locale').default('en-US').notNull(),
    // Set when an admin approves the user's verification application.
    // Drives the blue ✓ badge on /artist, /track, /event detail pages.
    // Null = not verified.
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    // Stamped when the user finishes (or explicitly skips) the /onboarding
    // flow. Null = banner shows on the dashboard prompting them to set up.
    onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),
    // Per-type notification opt-out switches. Default all true (notify by
    // default). Checked inside notify() before sending in-app bell + push.
    // 'system' and 'verification_status' types ignore these and always
    // notify — they're security/compliance, not noise.
    notifFollows: boolean('notif_follows').default(true).notNull(),
    notifTicketSales: boolean('notif_ticket_sales').default(true).notNull(),
    notifTrackSales: boolean('notif_track_sales').default(true).notNull(),
    notifTips: boolean('notif_tips').default(true).notNull(),
    notifComments: boolean('notif_comments').default(true).notNull(),
    notifMilestones: boolean('notif_milestones').default(true).notNull(),
    notifPayouts: boolean('notif_payouts').default(true).notNull(),
    // Email digest opt-in. Off by default — opt-in not opt-out.
    digestWeekly: boolean('digest_weekly').default(false).notNull(),
    // Last time we sent this user a digest. Null = never sent (so first
    // digest fires on the next cron tick after they opt in).
    lastDigestSentAt: timestamp('last_digest_sent_at', { withTimezone: true }),
    // DMCA repeat-infringer counter. Incremented in dmca.adminDecide on
    // each approved takedown. At 3 strikes, the same procedure flips
    // role='suspended'. Visible to admins only.
    dmcaStrikes: integer('dmca_strikes').default(0).notNull(),
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
