import { pgTable, uuid, text, timestamp, boolean, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { tracks } from './tracks';

export const takedownStatusEnum = pgEnum('takedown_status', [
  'pending',          // submitted, awaiting admin review
  'approved',         // admin agreed, content taken down + strike issued
  'rejected',         // admin disagreed (notice was abusive / facially invalid)
  'withdrawn',        // claimant withdrew before decision
]);

/**
 * takedown_notices — DMCA §512(c)(3) takedown requests filed by rights
 * holders against allegedly infringing tracks on the platform.
 *
 * Public can submit (no auth required — rights holders aren't necessarily
 * OPYNX users). Rate-limited at the procedure level.
 *
 * Approval action: track.visibility = 'private'. Content stays in the DB
 * (audit trail), no longer reachable via public surfaces. Reversible if
 * a counter-notice is filed and the takedown is withdrawn. Counter-notice
 * UI is deferred to v1.1 — for now, alleged infringers contact support.
 *
 * On approve: target user's dmcaStrikes counter increments by 1. The
 * suspension threshold (3 strikes → user.role='suspended') is enforced
 * in the dmca.adminDecide procedure. Suspended users have their access
 * blocked at the protectedProcedure middleware layer.
 */
export const takedownNotices = pgTable(
  'takedown_notices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // Target — what's allegedly infringing. We currently only support
    // takedowns against tracks; other content types (articles, podcasts,
    // etc.) can be added later.
    trackId: uuid('track_id')
      .references(() => tracks.id, { onDelete: 'set null' }),
    // Snapshot of the URL the claimant submitted, in case the trackId resolves
    // (we accept either an explicit trackId on the form OR a URL we parse).
    targetUrl: text('target_url').notNull(),
    // Claimant identification (DMCA §512(c)(3)(A) requires actual contact info)
    claimantName: text('claimant_name').notNull(),
    claimantEmail: text('claimant_email').notNull(),
    claimantOrganization: text('claimant_organization'),
    claimantAddress: text('claimant_address').notNull(),
    claimantPhone: text('claimant_phone'),
    // What's being claimed
    infringedWorkTitle: text('infringed_work_title').notNull(),
    infringedWorkOwner: text('infringed_work_owner').notNull(),
    description: text('description').notNull(), // free-form explanation
    // Statutory sworn statements (§512(c)(3)(A)(v) and (vi))
    goodFaithStatement: boolean('good_faith_statement').default(false).notNull(),
    accuracyStatement: boolean('accuracy_statement').default(false).notNull(),
    signature: text('signature').notNull(), // electronic signature (typed name)
    status: takedownStatusEnum('status').default('pending').notNull(),
    // Admin decision metadata
    adminNotes: text('admin_notes'),
    decidedBy: uuid('decided_by').references(() => users.id),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    // Audit
    submittedAt: timestamp('submitted_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    submittedFromIp: text('submitted_from_ip'),
  },
  (t) => [
    index('takedown_track_idx').on(t.trackId),
    index('takedown_status_idx').on(t.status),
    index('takedown_submitted_idx').on(t.submittedAt),
  ]
);

export const takedownNoticesRelations = relations(takedownNotices, ({ one }) => ({
  track: one(tracks, {
    fields: [takedownNotices.trackId],
    references: [tracks.id],
  }),
  decider: one(users, {
    fields: [takedownNotices.decidedBy],
    references: [users.id],
  }),
}));
