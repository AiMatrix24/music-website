import { NextResponse } from 'next/server';
import { computeAllSimilarities } from '@/lib/services/recommendations';

/**
 * Daily recompute of track-similarity scores. Runs at 04:00 UTC, after
 * reap-pending (03:00) and before digest (14:00). Cheap at MVP scale —
 * full-recompute over the catalog using JS-side set-intersection. See
 * apps/web/lib/services/recommendations.ts for the algorithm + scaling
 * note (switch to a SQL-side computation past ~10K tracks).
 *
 * Auth: same Bearer-CRON_SECRET pattern as reap-pending + digest.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Track-similarity recompute can take a while as the catalog grows.
// Allow up to 5 minutes; cron handlers in Vercel can run up to 300s on Hobby.
export const maxDuration = 300;

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const result = await computeAllSimilarities();
    console.log(
      `[Cron similarities] tracks=${result.trackCount} pairs=${result.pairsWritten} ms=${result.durationMs}`
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[Cron similarities] failed:', err);
    return NextResponse.json(
      { ok: false, error: (err as Error).message ?? 'unknown' },
      { status: 500 }
    );
  }
}
