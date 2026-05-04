import { pgTable, uuid, text, timestamp, boolean, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const distributionSubjectEnum = pgEnum('distribution_subject', [
  'track',
  'album',
]);

export const distributionStatusEnum = pgEnum('distribution_status', [
  'pending',         // creator submitted, admin hasn't picked it up
  'in_review',       // admin opened it, gathering metadata / fixing issues
  'submitted',       // admin forwarded to an aggregator
  'live',            // confirmed live on target platforms
  'rejected',        // admin or aggregator rejected
  'cancelled',       // creator pulled the request
]);

/**
 * distribution_submissions — one row per request a creator makes to push a
 * track or album to external streaming services. The platform (us) does NOT
 * directly integrate with an aggregator yet; an admin reads new rows from
 * this table, manually forwards to whatever aggregator we use, and updates
 * status as it progresses.
 *
 * subjectType + subjectId is polymorphic (no FK) — points at either tracks
 * or albums depending on subjectType. We rely on the creating tRPC procedure
 * to validate the FK at submission time.
 *
 * targetTiers is text[] using generic descriptors per the project's
 * "no branded platform names" rule (e.g. 'major-streaming',
 * 'video-audio-hybrid', 'social-platforms'). Admin maps these to the
 * actual aggregator's distribution selections.
 */
export const distributionSubmissions = pgTable(
  'distribution_submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    subjectType: distributionSubjectEnum('subject_type').notNull(),
    subjectId: uuid('subject_id').notNull(),
    status: distributionStatusEnum('status').default('pending').notNull(),
    targetTiers: text('target_tiers').array().notNull().default([]),
    releaseDate: timestamp('release_date', { withTimezone: true }),
    copyrightCertified: boolean('copyright_certified').default(false).notNull(),
    splitsConfirmed: boolean('splits_confirmed').default(false).notNull(),
    creatorNotes: text('creator_notes'),
    adminNotes: text('admin_notes'),
    aggregatorName: text('aggregator_name'), // free text — which aggregator admin used
    aggregatorRefId: text('aggregator_ref_id'), // aggregator's reference id for tracking
    decidedBy: uuid('decided_by').references(() => users.id),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    submittedAt: timestamp('submitted_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('dist_user_idx').on(t.userId),
    index('dist_status_idx').on(t.status),
  ]
);

export const distributionSubmissionsRelations = relations(
  distributionSubmissions,
  ({ one }) => ({
    user: one(users, {
      fields: [distributionSubmissions.userId],
      references: [users.id],
      relationName: 'distSubmitter',
    }),
    decider: one(users, {
      fields: [distributionSubmissions.decidedBy],
      references: [users.id],
      relationName: 'distDecider',
    }),
  })
);
