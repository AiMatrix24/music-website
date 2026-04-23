'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useRef } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useSafeHtml } from '@/app/components/podcast/useSafeHtml';

export default function EpisodeDetailPage() {
  const { slug, episodeSlug } = useParams<{ slug: string; episodeSlug: string }>();
  const { data, isLoading, isError, error } = trpc.podcastEpisodes.getBySlug.useQuery(
    { podcastSlug: slug, episodeSlug },
    { enabled: !!slug && !!episodeSlug, retry: false }
  );

  const recordDownload = trpc.podcastEpisodes.recordDownload.useMutation();
  const downloadFiredRef = useRef(false);
  // Hooks must run unconditionally — sanitize before any early returns
  const sanitizedDescription = useSafeHtml(data?.description);

  // Fire a single download/play event when audio first plays
  const handlePlay = () => {
    if (downloadFiredRef.current || !data) return;
    downloadFiredRef.current = true;
    recordDownload.mutate({ id: data.id });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading episode…</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-5xl mb-2">🎙️</p>
        <h1 className="text-2xl font-bold">Episode not found</h1>
        <p className="text-gray-400 text-sm">{error?.message ?? 'This episode doesn\'t exist.'}</p>
        <Link href={`/podcast/${slug}`} className="rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-500 transition">
          Back to Show
        </Link>
      </div>
    );
  }

  const ep = data;
  const show = data.podcast;
  const coverImage = ep.coverUrl ?? show.coverUrl;

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href={`/podcast/${show.slug}`} className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          ← {show.title}
        </Link>

        {/* Episode artwork (per-episode cover overrides show cover) */}
        {coverImage && (
          <div className="mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt=""
              className="w-full max-w-md aspect-square rounded-2xl object-cover shadow-2xl"
            />
          </div>
        )}

        {/* Episode header */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {ep.seasonNumber && ep.episodeNumber && (
            <span className="text-xs text-gray-500">SEASON {ep.seasonNumber} · EPISODE {ep.episodeNumber}</span>
          )}
          {ep.episodeType !== 'full' && (
            <span className="text-xs uppercase tracking-wider text-brand-400 font-semibold">{ep.episodeType}</span>
          )}
          {ep.explicit && (
            <span className="text-xs bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full font-semibold">EXPLICIT</span>
          )}
        </div>
        <h1 className="text-4xl font-black mb-3">{ep.title}</h1>
        <div className="flex items-center gap-3 text-sm text-gray-400 mb-6">
          {ep.publishedAt && (
            <span>{new Date(ep.publishedAt).toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
          )}
          {ep.duration && <><span>·</span><span>{formatDuration(ep.duration)}</span></>}
          {typeof ep.downloadCount === 'number' && (
            <><span>·</span><span>{ep.downloadCount.toLocaleString()} plays</span></>
          )}
        </div>

        {/* Audio player */}
        {ep.audioUrl ? (
          <div className="rounded-2xl bg-[#15151f] p-6 mb-8">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio
              controls
              preload="metadata"
              playsInline
              crossOrigin="anonymous"
              src={ep.audioUrl}
              onPlay={handlePlay}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-3">
              Listen here, or subscribe via{' '}
              <Link href={`/api/podcast/${show.slug}/feed.xml`} target="_blank" className="text-brand-400 hover:text-brand-300">
                RSS
              </Link>
              {' '}in your podcast app.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#15151f] p-6 mb-8 text-center text-gray-500">
            Audio not available.
          </div>
        )}

        {/* Show notes (sanitized HTML from rich text editor) */}
        {sanitizedDescription && (
          <div className="rounded-2xl bg-[#15151f] p-6">
            <h2 className="font-bold mb-3">Show Notes</h2>
            <div
              className="prose prose-sm prose-invert max-w-none prose-a:text-brand-400 prose-strong:text-white prose-headings:text-white"
              dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
