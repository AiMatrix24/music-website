import { pgTable, uuid, real, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { tracks } from './tracks';

/**
 * track_similarities — precomputed item-based similarity scores.
 *
 * One row per ordered pair (a, b). For lookup convenience we store both
 * (a, b) and (b, a) so a single-direction WHERE track_a_id = ? returns
 * the full neighborhood. Storage doubles vs. canonical-pair storage but
 * makes queries trivially fast.
 *
 * Score is Jaccard similarity over user interactions:
 *   J(a, b) = |users who interacted with both a and b|
 *           / |users who interacted with a or b|
 *   "interacted" = liked the track OR has a track_plays row for it
 *
 * Recomputed daily by /api/cron/recompute-similarities. The cron writes
 * the top-N (currently 20) most-similar partners per track in a single
 * transaction to keep reads consistent.
 *
 * Cold-start: tracks with no interactions get no rows here. Callers
 * fall back to genre-match or trending. New users get recommendations
 * via tracks.recommendedForMe which aggregates similars of the user's
 * own listening + likes — falls back to trending if the user has zero
 * history.
 */
export const trackSimilarities = pgTable(
  'track_similarities',
  {
    trackAId: uuid('track_a_id')
      .references(() => tracks.id, { onDelete: 'cascade' })
      .notNull(),
    trackBId: uuid('track_b_id')
      .references(() => tracks.id, { onDelete: 'cascade' })
      .notNull(),
    score: real('score').notNull(),
    computedAt: timestamp('computed_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.trackAId, t.trackBId] }),
    index('track_similarities_a_score_idx').on(t.trackAId, t.score),
  ]
);
