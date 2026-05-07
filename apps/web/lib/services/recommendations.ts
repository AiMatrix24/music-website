/**
 * Item-based collaborative filtering for OPYNX track recommendations.
 *
 * Approach: Jaccard similarity over user interactions.
 *   For each pair (a, b) of published tracks, score =
 *     |users who interacted with both a and b|
 *     ÷ |users who interacted with a or b|
 *   "interacted" = a row in `likes` OR a row in `track_plays`.
 *
 * Compute is O(N²) over published-track count, but each pair-check is
 * just a set intersection in JS over a precomputed userId-set per track.
 * At MVP scale (dozens to a few thousand tracks), this is cheap; rerun
 * nightly via /api/cron/recompute-similarities.
 *
 * Per-track output is the top TOP_N most-similar OTHER tracks. Stored
 * symmetrically (a→b AND b→a) so reads can do `WHERE track_a_id = ?`.
 *
 * If/when the catalog grows past ~10K tracks this becomes too slow for
 * a serverless cron — at that point, switch to a DB-side query that
 * materializes the user-set-per-track in a CTE and computes Jaccard in
 * SQL. Out of scope for v1.
 */
import { db, tracks, likes, trackPlays, trackSimilarities } from '@opynx/db';
import { eq, and, isNotNull } from 'drizzle-orm';

/** How many similar tracks to keep per source track. */
const TOP_N = 20;

/** Minimum users-in-common before we consider a pair "similar enough" to record. */
const MIN_COOCCUR = 2;

interface ComputeResult {
  trackCount: number;
  pairsWritten: number;
  durationMs: number;
}

export async function computeAllSimilarities(): Promise<ComputeResult> {
  const start = Date.now();

  // Step 1: pull every published track
  const allTracks = await db
    .select({ id: tracks.id })
    .from(tracks)
    .where(eq(tracks.status, 'published'));

  if (allTracks.length === 0) {
    return { trackCount: 0, pairsWritten: 0, durationMs: Date.now() - start };
  }

  // Step 2: build trackId → Set<userId> from likes + plays
  const userSets = new Map<string, Set<string>>();
  for (const t of allTracks) userSets.set(t.id, new Set());

  // Likes — userId might be present even when trackId is null (album likes etc),
  // so filter to track-likes only
  const likeRows = await db
    .select({ userId: likes.userId, trackId: likes.trackId })
    .from(likes)
    .where(isNotNull(likes.trackId));
  for (const r of likeRows) {
    if (r.trackId && userSets.has(r.trackId)) {
      userSets.get(r.trackId)!.add(r.userId);
    }
  }

  const playRows = await db
    .select({ userId: trackPlays.userId, trackId: trackPlays.trackId })
    .from(trackPlays);
  for (const r of playRows) {
    if (userSets.has(r.trackId)) {
      userSets.get(r.trackId)!.add(r.userId);
    }
  }

  // Step 3: pairwise Jaccard. Track without any interactions is skipped — we
  // can't compute similarity for an isolated track and the table has nothing
  // to add for it.
  const ids = allTracks.map((t) => t.id).filter((id) => userSets.get(id)!.size > 0);

  type Pair = { a: string; b: string; score: number };
  const perTrackTop = new Map<string, Pair[]>();
  for (const id of ids) perTrackTop.set(id, []);

  for (let i = 0; i < ids.length; i++) {
    const aId = ids[i];
    const aSet = userSets.get(aId)!;
    for (let j = i + 1; j < ids.length; j++) {
      const bId = ids[j];
      const bSet = userSets.get(bId)!;

      // Intersection — iterate the smaller set for efficiency.
      const [small, big] = aSet.size <= bSet.size ? [aSet, bSet] : [bSet, aSet];
      let intersection = 0;
      for (const u of small) if (big.has(u)) intersection++;
      if (intersection < MIN_COOCCUR) continue;

      const union = aSet.size + bSet.size - intersection;
      const score = intersection / union;

      // Store symmetrically — push to BOTH a's and b's top-N lists
      pushTop(perTrackTop.get(aId)!, { a: aId, b: bId, score });
      pushTop(perTrackTop.get(bId)!, { a: bId, b: aId, score });
    }
  }

  // Step 4: flatten + replace whole table.
  // Single transaction: TRUNCATE-like (delete all + insert all) so callers
  // never see a half-recomputed state.
  const allPairs: Pair[] = [];
  for (const list of perTrackTop.values()) allPairs.push(...list);

  if (allPairs.length === 0) {
    return { trackCount: ids.length, pairsWritten: 0, durationMs: Date.now() - start };
  }

  await db.transaction(async (tx) => {
    // sql`` template for "DELETE FROM track_similarities" — Drizzle doesn't
    // expose a no-WHERE delete shortcut.
    await tx.delete(trackSimilarities);
    // Chunked insert — Postgres caps parameters per statement (~32k); 1000-row
    // batches keep us comfortably under that limit.
    const CHUNK = 1000;
    for (let i = 0; i < allPairs.length; i += CHUNK) {
      const slice = allPairs.slice(i, i + CHUNK);
      await tx.insert(trackSimilarities).values(
        slice.map((p) => ({
          trackAId: p.a,
          trackBId: p.b,
          score: p.score,
        }))
      );
    }
  });

  return {
    trackCount: ids.length,
    pairsWritten: allPairs.length,
    durationMs: Date.now() - start,
  };
}

function pushTop(list: { a: string; b: string; score: number }[], item: { a: string; b: string; score: number }) {
  // Maintain top-N descending by score
  if (list.length < TOP_N) {
    list.push(item);
    list.sort((x, y) => y.score - x.score);
    return;
  }
  if (item.score <= list[list.length - 1].score) return;
  list[list.length - 1] = item;
  list.sort((x, y) => y.score - x.score);
}
