import { NextRequest, NextResponse } from 'next/server';
import { db } from '@opynx/db';
import { tracks } from '@opynx/db/schema';
import { eq, sql } from 'drizzle-orm';

// Increment play count after 30s of listening
// Debounced on client side — one call per track per session
export async function POST(request: NextRequest) {
  try {
    const { trackId } = await request.json();
    if (!trackId) return NextResponse.json({ error: 'trackId required' }, { status: 400 });

    await db
      .update(tracks)
      .set({ playCount: sql`${tracks.playCount} + 1` })
      .where(eq(tracks.id, trackId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PlayCount] Error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
