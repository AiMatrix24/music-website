'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { trpc } from '@/lib/trpc/client';

export default function PodcastDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: show, isLoading, isError, error } = trpc.podcasts.getBySlug.useQuery(
    { slug },
    { enabled: !!slug, retry: false }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading podcast…</div>
      </div>
    );
  }

  const sanitizedDescription = useMemo(() => {
    if (!show?.description) return '';
    return DOMPurify.sanitize(show.description, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote', 'a', 'code', 'pre'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    });
  }, [show?.description]);

  if (isError || !show) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-5xl mb-2">🎙️</p>
        <h1 className="text-2xl font-bold">Podcast not found</h1>
        <p className="text-gray-400 text-sm">{error?.message ?? 'This show doesn\'t exist or hasn\'t been published yet.'}</p>
        <Link href="/explore" className="rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-500 transition">
          Browse Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/explore" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">← Back</Link>

        {/* Podcast header */}
        <div className="flex flex-col sm:flex-row gap-6 items-start mb-10">
          {show.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={show.coverUrl} alt="" className="w-40 h-40 rounded-2xl object-cover shrink-0 shadow-2xl" />
          ) : (
            <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center text-5xl shrink-0 shadow-2xl">
              🎙️
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm text-brand-400 font-semibold uppercase tracking-wider mb-1">Podcast</p>
            <h1 className="text-4xl font-black mb-2">{show.title}</h1>
            {show.author && <p className="text-gray-400 mb-3">Hosted by {show.author}</p>}
            {sanitizedDescription && (
              <div
                className="prose prose-sm prose-invert max-w-none mb-4 prose-a:text-brand-400 prose-strong:text-white prose-headings:text-white"
                dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
              />
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span>{show.episodes.length} episode{show.episodes.length === 1 ? '' : 's'}</span>
              {show.category && <><span>·</span><span>{show.category}</span></>}
              {show.explicit && <><span>·</span><span className="text-red-400">Explicit</span></>}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Link
                href={`/api/podcast/${show.slug}/feed.xml`}
                target="_blank"
                className="rounded-full bg-brand-950 border border-brand-800/30 px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:border-brand-600/50 transition"
              >
                📡 RSS Feed
              </Link>
              {show.websiteUrl && (
                <a
                  href={show.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-brand-950 border border-brand-800/30 px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:border-brand-600/50 transition"
                >
                  🌐 Website
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Episodes */}
        {show.episodes.length === 0 ? (
          <div className="rounded-2xl bg-[#15151f] p-8 text-center text-gray-400">
            No episodes published yet.
          </div>
        ) : (
          <div className="rounded-2xl bg-[#15151f] overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-800/20">
              <h2 className="text-lg font-bold">Episodes</h2>
            </div>
            <div className="divide-y divide-brand-800/10">
              {show.episodes.map((ep) => (
                <Link
                  key={ep.id}
                  href={`/podcast/${show.slug}/${ep.slug}`}
                  className="px-6 py-5 block hover:bg-brand-950/40 transition"
                >
                  <div className="flex items-start gap-4">
                    {ep.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ep.coverUrl} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white shrink-0 mt-1">
                        <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {ep.seasonNumber && ep.episodeNumber && (
                          <span className="text-xs text-gray-500">S{ep.seasonNumber} E{ep.episodeNumber}</span>
                        )}
                        {ep.episodeType !== 'full' && (
                          <span className="text-xs uppercase tracking-wider text-brand-400">{ep.episodeType}</span>
                        )}
                        {ep.publishedAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(ep.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold mb-1">{ep.title}</h3>
                      {ep.description && (
                        <p className="text-sm text-gray-400 line-clamp-2">{stripHtml(ep.description)}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {ep.duration && <span>{formatDuration(ep.duration)}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
