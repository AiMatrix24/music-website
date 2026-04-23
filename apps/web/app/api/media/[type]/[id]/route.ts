import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@opynx/db';
import { tracks, podcastEpisodes } from '@opynx/db/schema';

// Force Node runtime so we get full streaming support (Edge has stricter limits
// on response bodies and timing). Audio files can be tens of MB.
export const runtime = 'nodejs';
// Don't cache the proxy response itself — UploadThing's CDN already caches
// upstream, and our proxy must always honor the client's Range header fresh.
export const dynamic = 'force-dynamic';

type MediaType = 'track' | 'episode';

async function resolveAudioUrl(type: MediaType, id: string): Promise<string | null> {
  if (type === 'track') {
    const [row] = await db
      .select({
        audioUrl320: tracks.audioUrl320,
        audioUrl128: tracks.audioUrl128,
      })
      .from(tracks)
      .where(eq(tracks.id, id))
      .limit(1);
    return row?.audioUrl320 ?? row?.audioUrl128 ?? null;
  }
  if (type === 'episode') {
    const [row] = await db
      .select({ audioUrl: podcastEpisodes.audioUrl })
      .from(podcastEpisodes)
      .where(eq(podcastEpisodes.id, id))
      .limit(1);
    return row?.audioUrl ?? null;
  }
  return null;
}

async function handleRequest(
  request: Request,
  params: Promise<{ type: string; id: string }>,
  isHead: boolean
): Promise<Response> {
  const { type, id } = await params;
  if (type !== 'track' && type !== 'episode') {
    return new NextResponse('Bad media type', { status: 400 });
  }
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return new NextResponse('Bad id', { status: 400 });
  }

  const audioUrl = await resolveAudioUrl(type as MediaType, id);
  if (!audioUrl) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Forward Range header (iOS Safari uses this aggressively for media)
  const upstreamHeaders: HeadersInit = {};
  const range = request.headers.get('range');
  if (range) upstreamHeaders['Range'] = range;
  const ifNoneMatch = request.headers.get('if-none-match');
  if (ifNoneMatch) upstreamHeaders['If-None-Match'] = ifNoneMatch;
  const ifRange = request.headers.get('if-range');
  if (ifRange) upstreamHeaders['If-Range'] = ifRange;

  const upstream = await fetch(audioUrl, {
    method: isHead ? 'HEAD' : 'GET',
    headers: upstreamHeaders,
    // Don't pass cookies/credentials to the CDN
    credentials: 'omit',
  });

  // Pass through status (200 / 206 Partial Content / 304 / etc.)
  const status = upstream.status;

  // Build response headers — keep what iOS needs for media seeking, drop the rest
  const headers = new Headers();
  const passthrough = [
    'content-type',
    'content-length',
    'content-range',
    'accept-ranges',
    'last-modified',
    'etag',
  ];
  for (const h of passthrough) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  // Force the Content-Type to a known-good MP3 type if the CDN didn't include
  // one (UploadThing always does, but be defensive).
  if (!headers.has('content-type')) headers.set('content-type', 'audio/mpeg');
  headers.set('content-disposition', 'inline');
  headers.set('access-control-allow-origin', '*');
  headers.set('access-control-allow-methods', 'GET,HEAD,OPTIONS');
  // CRITICAL: do NOT let Vercel's edge cache this response. The cache key
  // doesn't vary on Range, so caching turns 206 Partial Content into 200
  // Full, breaking HTML5 audio seeking and — on iOS — playback entirely.
  // The browser still caches per-resource as normal; this only tells the
  // CDN layer to stay out of the way.
  headers.set('cache-control', 'no-store, private');
  headers.set('cdn-cache-control', 'no-store');
  headers.set('vercel-cdn-cache-control', 'no-store');

  // For HEAD or non-200/206, return without a body
  if (isHead || (status !== 200 && status !== 206)) {
    return new NextResponse(null, { status, headers });
  }

  // Stream the body straight through — no buffering, no transformation
  return new NextResponse(upstream.body, { status, headers });
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ type: string; id: string }> }
): Promise<Response> {
  return handleRequest(request, ctx.params, false);
}

export async function HEAD(
  request: Request,
  ctx: { params: Promise<{ type: string; id: string }> }
): Promise<Response> {
  return handleRequest(request, ctx.params, true);
}

export async function OPTIONS(): Promise<Response> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
      'Access-Control-Allow-Headers': 'Range,If-Range,If-None-Match',
      'Access-Control-Max-Age': '86400',
    },
  });
}
