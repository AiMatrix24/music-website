import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@opynx/auth';
import { db } from '@opynx/db';
import { tracks, trackPlays } from '@opynx/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Play logging endpoint, fired by MusicPlayer after 30s of continuous play.
 * The player includes a session-level dedupe (countedTracksRef) so we get
 * at most one call per (session, track) pair, but multiple sessions still
 * log multiple rows.
 *
 * Two side effects (best-effort):
 *  1. Bump tracks.play_count atomically (fires for everyone — anon listens
 *     count toward the public play counter)
 *  2. Insert a track_plays row (only when authenticated) so the user's
 *     /library "History" tab can surface real recent listens
 *
 * Always returns 200 — never 500 — so the player's `.catch(() => {})`
 * stays silent on transient DB errors.
 */
export async function POST(request: NextRequest) {
  let trackId: string | undefined;
  try {
    const body = await request.json();
    trackId = body?.trackId;
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (!trackId || !/^[0-9a-f-]{36}$/i.test(trackId)) {
    return NextResponse.json({ error: 'trackId required' }, { status: 400 });
  }

  try {
    // Aggregate play counter — anon + authed.
    await db
      .update(tracks)
      .set({ playCount: sql`${tracks.playCount} + 1` })
      .where(eq(tracks.id, trackId));

    // Personalized history — authed only.
    const session = await auth();
    const userId = session?.user?.id;
    if (userId) {
      await db.insert(trackPlays).values({ userId, trackId });
    }
  } catch (error) {
    console.error('[/api/tracks/play] error:', error);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
