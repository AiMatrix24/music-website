'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/app/components/Toast';
import { PodcastShowForm } from './PodcastShowForm';
import { EpisodeForm } from './EpisodeForm';

export function PodcastsTab() {
  const { toast } = useToast();
  const myShows = trpc.podcasts.getMine.useQuery();
  const [creatingShow, setCreatingShow] = useState(false);
  const [activeShowId, setActiveShowId] = useState<string | null>(null);

  const deleteEpisode = trpc.podcastEpisodes.delete.useMutation({
    onSuccess: () => {
      toast('Episode deleted');
      myShows.refetch();
    },
    onError: (err) => toast(err.message || 'Delete failed', 'error'),
  });

  if (myShows.isLoading) {
    return <div className="text-gray-400">Loading podcasts…</div>;
  }

  const shows = myShows.data ?? [];
  const activeShow = shows.find((s) => s.id === activeShowId);

  return (
    <div className="space-y-6">
      {/* Header + new show button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">My Podcasts</h2>
          <p className="text-sm text-gray-400">
            Each show gets a public page and an RSS feed for Apple/Spotify/Pocket Casts.
          </p>
        </div>
        {!creatingShow && shows.length > 0 && (
          <button
            onClick={() => setCreatingShow(true)}
            className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500 transition"
          >
            + New Show
          </button>
        )}
      </div>

      {/* Empty state OR new show form */}
      {(creatingShow || shows.length === 0) && (
        <PodcastShowForm
          onCreated={() => {
            setCreatingShow(false);
            myShows.refetch();
          }}
        />
      )}

      {/* Episode form (modal-ish, shown when activeShow set) */}
      {activeShow && (
        <EpisodeForm
          podcastId={activeShow.id}
          podcastTitle={activeShow.title}
          onCreated={() => {
            setActiveShowId(null);
            myShows.refetch();
          }}
          onCancel={() => setActiveShowId(null)}
        />
      )}

      {/* Show list */}
      {shows.length > 0 && !activeShow && (
        <div className="space-y-3">
          {shows.map((show) => (
            <div key={show.id} className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5">
              <div className="flex items-start gap-4">
                {show.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={show.coverUrl} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center text-3xl shrink-0">
                    🎙️
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold truncate">{show.title}</h3>
                    {show.explicit && (
                      <span className="text-xs bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full">E</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {show.episodeCount} episode{show.episodeCount === 1 ? '' : 's'} · {show.category ?? 'Uncategorized'}
                  </p>
                  {show.description && (
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">{show.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveShowId(show.id)}
                      className="rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-500 transition"
                    >
                      + Add Episode
                    </button>
                    <Link
                      href={`/podcast/${show.slug}`}
                      target="_blank"
                      className="rounded-full bg-brand-950 border border-brand-800/30 px-4 py-1.5 text-xs font-semibold text-gray-300 hover:text-white transition"
                    >
                      View Public Page
                    </Link>
                    <Link
                      href={`/api/podcast/${show.slug}/feed.xml`}
                      target="_blank"
                      className="rounded-full bg-brand-950 border border-brand-800/30 px-4 py-1.5 text-xs font-semibold text-gray-300 hover:text-white transition"
                    >
                      RSS Feed
                    </Link>
                  </div>
                </div>
              </div>

              {/* Episode list */}
              {show.episodes.length > 0 && (
                <div className="mt-4 pt-4 border-t border-brand-800/20 space-y-2">
                  {show.episodes.slice(0, 5).map((ep) => (
                    <div key={ep.id} className="flex items-center justify-between gap-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ep.title}</p>
                        <p className="text-xs text-gray-500">
                          {ep.duration ? formatDuration(ep.duration) : '—'} ·{' '}
                          {ep.downloadCount ?? 0} downloads ·{' '}
                          {ep.publishedAt ? new Date(ep.publishedAt).toLocaleDateString() : 'draft'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${ep.title}"?`)) {
                            deleteEpisode.mutate({ id: ep.id });
                          }
                        }}
                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                  {show.episodes.length > 5 && (
                    <p className="text-xs text-gray-500">+{show.episodes.length - 5} more</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}
