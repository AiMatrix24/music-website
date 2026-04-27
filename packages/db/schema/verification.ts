import { pgTable, uuid, text, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const verificationStatusEnum = pgEnum('verification_status', [
  'pending',
  'approved',
  'rejected',
]);

/**
 * verification_applications — one row per applicant. Status starts
 * 'pending', admin flips to 'approved' or 'rejected'. On approve we set
 * users.verifiedAt to NOW(); on reject we just record the reason.
 *
 * Identity tier (B) requirements (enforced client-side at submit + admin-
 * verified before approval):
 *   - legal name + country
 *   - government ID image
 *   - portfolio link
 *   - has uploaded ≥1 track OR hosted ≥1 event OR ≥100 cumulative plays
 *
 * ID image storage: kept in UploadThing while the application is pending
 * or for 30 days after the decision (whichever is later). The daily
 * reap-pending cron deletes idImageKey from the row + UploadThing once
 * `decidedAt < NOW() - 30 days`. We keep the decision row forever for
 * audit purposes — just not the photo.
 */
export const verificationApplications = pgTable(
  'verification_applications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    status: verificationStatusEnum('status').default('pending').notNull(),
    legalName: text('legal_name').notNull(),
    stageName: text('stage_name'),
    country: text('country').notNull(), // ISO 3166-1 alpha-2
    portfolioUrl: text('portfolio_url').notNull(),
    pitch: text('pitch').notNull(), // why they should be verified
    // UploadThing key for the gov-ID photo. Nulled out after 30-day cleanup.
    idImageKey: text('id_image_key'),
    // Admin notes shown to the applicant (rejection reason or approval note).
    decisionReason: text('decision_reason'),
    decidedBy: uuid('decided_by').references(() => users.id),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    submittedAt: timestamp('submitted_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('verif_user_idx').on(t.userId),
    index('verif_status_idx').on(t.status),
  ]
);

export const verificationApplicationsRelations = relations(
  verificationApplications,
  ({ one }) => ({
    user: one(users, {
      fields: [verificationApplications.userId],
      references: [users.id],
      relationName: 'applicant',
    }),
    decider: one(users, {
      fields: [verificationApplications.decidedBy],
      references: [users.id],
      relationName: 'decider',
    }),
  })
);
