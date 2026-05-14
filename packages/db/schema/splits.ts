import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { tracks } from './tracks';

/**
 * Track royalty splits. Two split types are kept independent because the
 * music industry pays them as separate income streams:
 *   - master: sound recording revenue (DSP master royalties, on-platform
 *     tips/purchases/subscriptions). Paid by DSPs via aggregators.
 *   - publishing: composition revenue (MLC mechanicals, PRO performance).
 *     Paid to publishers/songwriters via collective management orgs.
 *
 * Default behavior when no rows exist for a (track, split_type) pair:
 * the track owner is treated as 100%. Rows only get materialized once
 * the owner invites a first collaborator — at which point the owner's
 * implicit row also gets inserted so the math is auditable.
 *
 * Owner percent is AUTO-COMPUTED on every invite/revoke (Lee's call
 * "Y" — fewer friction points than forcing explicit-edit). System
 * maintains the owner row to always make the (track, split_type) sum
 * equal exactly 10000 basis points (100.00%) across status='accepted'
 * rows + the owner.
 */

export const splitTypeEnum = pgEnum('split_type', ['master', 'publishing']);

export const splitRoleEnum = pgEnum('split_role', [
  'owner',
  'co_writer',
  'producer',
  'featured_artist',
  'mixer',
  'publisher',
  'other',
]);

export const splitStatusEnum = pgEnum('split_status', [
  'pending',    // owner invited collab, awaiting their accept/reject
  'accepted',   // counts toward 100% sum + payouts
  'rejected',   // collab declined (terminal)
  'revoked',    // owner removed the collab (terminal)
]);

export const splitActionEnum = pgEnum('split_action', [
  'created',
  'percent_changed',
  'role_changed',
  'accepted',
  'rejected',
  'revoked',
]);

/**
 * Split payout lifecycle (Commit B — money routing):
 *   credited   — recipient's share is theirs immediately (owner residual,
 *                or an already-accepted collaborator at payment time)
 *   escrowed   — collaborator was still pending at payment time; held
 *                until they accept/reject
 *   released   — collaborator accepted post-payment; escrow → spendable
 *   returned   — collaborator rejected (or owner revoked while pending);
 *                a sibling 'credited' row is generated for the owner
 *   clawed_back — the source payment was refunded; row no longer counts
 *                toward earnings
 *
 * Spendable earnings = status IN ('credited', 'released').
 */
export const splitPayoutStatusEnum = pgEnum('split_payout_status', [
  'credited',
  'escrowed',
  'released',
  'returned',
  'clawed_back',
]);

export const trackSplits = pgTable(
  'track_splits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    trackId: uuid('track_id')
      .references(() => tracks.id, { onDelete: 'cascade' })
      .notNull(),
    collaboratorUserId: uuid('collaborator_user_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    splitType: splitTypeEnum('split_type').notNull(),
    role: splitRoleEnum('role').notNull(),
    // Basis points — 5000 = 50.00%, 10000 = 100.00%. Integer math avoids
    // float drift when validating the 10000-sum invariant.
    percentBp: integer('percent_bp').notNull(),
    status: splitStatusEnum('status').default('pending').notNull(),
    createdBy: uuid('created_by')
      .references(() => users.id, { onDelete: 'set null' }),
    rejectionReason: text('rejection_reason'),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    rejectedAt: timestamp('rejected_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    // One row per (track, split_type, collaborator). Re-inviting the same
    // person on the same track+type updates their existing row (or fails
    // if they already accepted — caller decides).
    uniqueIndex('track_splits_unique_idx').on(
      t.trackId,
      t.splitType,
      t.collaboratorUserId
    ),
    // Payout-time lookup: "give me all accepted splits for this track+type"
    index('track_splits_payout_idx').on(t.trackId, t.splitType, t.status),
    // Collaborator dashboard: "all my splits, grouped by status"
    index('track_splits_collab_idx').on(t.collaboratorUserId, t.status),
  ]
);

/**
 * Immutable audit log. Every state transition on a track_splits row
 * (create, percent change, role change, accept, reject, revoke) writes
 * a new row here. Never DELETE.
 *
 * Snapshot fields are jsonb so the audit survives even if track_splits
 * gets deleted (ON DELETE SET NULL on the FK keeps the history but
 * unlinks). prior_data is null on 'created' rows.
 */
export const trackSplitHistory = pgTable(
  'track_split_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    trackSplitId: uuid('track_split_id').references(() => trackSplits.id, {
      onDelete: 'set null',
    }),
    // Denormalized for fast reporting queries without join
    trackId: uuid('track_id').notNull(),
    collaboratorUserId: uuid('collaborator_user_id').notNull(),
    splitType: splitTypeEnum('split_type').notNull(),
    action: splitActionEnum('action').notNull(),
    priorData: jsonb('prior_data'),
    newData: jsonb('new_data').notNull(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('track_split_history_track_idx').on(t.trackId, t.createdAt),
    index('track_split_history_collab_idx').on(t.collaboratorUserId, t.createdAt),
    index('track_split_history_actor_idx').on(t.actorId, t.createdAt),
  ]
);

/**
 * Per-recipient credit ledger for track-driven money events. Written on the
 * 'finished' branch of the NOWPayments webhook for sources where a track is
 * the revenue object: trackPurchases (always) and tips with a track_id.
 *
 * One source payment fans out to N payout rows, one per accepted-split
 * collaborator + the owner residual. Pending-split collaborators get
 * 'escrowed' rows that wait for splits.accept (→ released) or splits.reject
 * / splits.revoke (→ returned + a sibling 'credited' row for the owner).
 *
 * Earnings = SUM(amount_cents) WHERE recipient_user_id = X
 *            AND status IN ('credited', 'released').
 *
 * Refunds set status='clawed_back' across all rows for the source.
 *
 * percent_bp is snapshotted at payment time so the row stays auditable even
 * if track_splits gets edited later. amount_cents is computed using
 * largest-remainder rounding so the per-row sum matches the source pool
 * exactly (no orphan cents).
 */
export const trackSplitPayouts = pgTable(
  'track_split_payouts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // 'track_purchase' | 'tip' (extend as new sources go through splits)
    sourceType: text('source_type').notNull(),
    sourceId: uuid('source_id').notNull(),
    trackId: uuid('track_id')
      .references(() => tracks.id, { onDelete: 'cascade' })
      .notNull(),
    recipientUserId: uuid('recipient_user_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    // Null when the row represents the owner residual on a track with no
    // splits (or the regenerated owner-credit after a return).
    trackSplitId: uuid('track_split_id').references(() => trackSplits.id, {
      onDelete: 'set null',
    }),
    // Lineage: a 'returned' escrow row points its sibling 'credited' row
    // (owner refund) back here so the audit chain is walkable.
    parentPayoutId: uuid('parent_payout_id'),
    splitType: splitTypeEnum('split_type').default('master').notNull(),
    percentBp: integer('percent_bp').notNull(),
    amountCents: integer('amount_cents').notNull(),
    status: splitPayoutStatusEnum('status').default('credited').notNull(),
    releasedAt: timestamp('released_at', { withTimezone: true }),
    returnedAt: timestamp('returned_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('split_payouts_recipient_status_idx').on(t.recipientUserId, t.status),
    index('split_payouts_source_idx').on(t.sourceType, t.sourceId),
    index('split_payouts_track_split_status_idx').on(t.trackSplitId, t.status),
    index('split_payouts_track_idx').on(t.trackId),
  ]
);

export const trackSplitsRelations = relations(trackSplits, ({ one }) => ({
  track: one(tracks, {
    fields: [trackSplits.trackId],
    references: [tracks.id],
  }),
  collaborator: one(users, {
    fields: [trackSplits.collaboratorUserId],
    references: [users.id],
    relationName: 'splitCollaborator',
  }),
  creator: one(users, {
    fields: [trackSplits.createdBy],
    references: [users.id],
    relationName: 'splitCreator',
  }),
}));

export const trackSplitHistoryRelations = relations(trackSplitHistory, ({ one }) => ({
  trackSplit: one(trackSplits, {
    fields: [trackSplitHistory.trackSplitId],
    references: [trackSplits.id],
  }),
  actor: one(users, {
    fields: [trackSplitHistory.actorId],
    references: [users.id],
  }),
}));

export const trackSplitPayoutsRelations = relations(trackSplitPayouts, ({ one }) => ({
  track: one(tracks, {
    fields: [trackSplitPayouts.trackId],
    references: [tracks.id],
  }),
  recipient: one(users, {
    fields: [trackSplitPayouts.recipientUserId],
    references: [users.id],
  }),
  trackSplit: one(trackSplits, {
    fields: [trackSplitPayouts.trackSplitId],
    references: [trackSplits.id],
  }),
}));
