import { db } from '@opynx/db';
import { tracks, users } from '@opynx/db';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { EmbedPlayerClient } from './EmbedPlayerClient';

export default async function EmbedPlayerPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = await params;

  const rows = await db
    .select({
      id: tracks.id,
      title: tracks.title,
      slug: tracks.slug,
      duration: tracks.duration,
      audioUrl128: tracks.audioUrl128,
      audioUrl320: tracks.audioUrl320,
      coverUrl: tracks.coverUrl,
      artistName: users.name,
      artistId: tracks.userId,
    })
    .from(tracks)
    .leftJoin(users, eq(tracks.userId, users.id))
    .where(eq(tracks.id, trackId))
    .limit(1);

  const track = rows[0];
  if (!track) return notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://opynx.com';

  return (
    <>
      {/* Hide the global layout chrome when rendered as embed */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            nav, footer, .skip-nav, [data-back-to-top], [data-music-player-bar],
            [data-cookie-consent], [data-keyboard-shortcuts], [data-top-loading-bar] {
              display: none !important;
            }
            main#main-content {
              padding-top: 0 !important;
              min-height: auto !important;
            }
            body {
              min-height: auto !important;
              overflow: hidden !important;
              background: #0a0a14 !important;
            }
          `,
        }}
      />
      <EmbedPlayerClient
        track={{
          id: track.id,
          title: track.title,
          artistName: track.artistName ?? 'Unknown Artist',
          artistId: track.artistId,
          duration: track.duration ?? 0,
          audioUrl: track.audioUrl320 ?? track.audioUrl128 ?? null,
          coverUrl: track.coverUrl ?? null,
        }}
        appUrl={appUrl}
      />
    </>
  );
}
