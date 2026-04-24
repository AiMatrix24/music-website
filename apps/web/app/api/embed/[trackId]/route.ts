import { NextRequest, NextResponse } from 'next/server';
import { db } from '@opynx/db';
import { tracks, users } from '@opynx/db';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const { trackId } = await params;

  const rows = await db
    .select({
      id: tracks.id,
      title: tracks.title,
      artistName: users.name,
      coverUrl: tracks.coverUrl,
    })
    .from(tracks)
    .leftJoin(users, eq(tracks.userId, users.id))
    .where(eq(tracks.id, trackId))
    .limit(1);

  const track = rows[0];

  if (!track) {
    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://opynx.com';

  return NextResponse.json({
    version: '1.0',
    type: 'rich',
    title: track.title,
    author_name: track.artistName ?? 'Unknown Artist',
    provider_name: 'OPYNX',
    provider_url: appUrl,
    width: 400,
    height: 160,
    html: `<iframe src="${appUrl}/embed/player/${trackId}" width="400" height="160" frameborder="0" allow="autoplay; encrypted-media" style="border-radius: 12px;"></iframe>`,
    thumbnail_url: track.coverUrl ?? `${appUrl}/logo.png`,
  });
}
