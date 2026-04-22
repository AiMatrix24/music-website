'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/app/components/Toast';
import { PodcastShowForm, type ExistingShow } from './PodcastShowForm';
import { EpisodeForm, type ExistingEpisode } from './EpisodeForm';

type Mode =
  | { kind: 'list' }
  | { kind: 'create-show' }
  | { kind: 'edit-show'; show: ExistingShow }
  | { kind: 'add-episode'; podcastId: string; podcastTitle: string }
  | { kind: 'edit-episode'; podcastId: string; podcastTitle: string; episode: ExistingEpisode };

export function PodcastsTab() {
  const { toast } = useToast();
  const myShows = trpc.podcasts.getMine.useQuery();
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<Mode>({ kind: 'list' });

  const deleteEpisode = trpc.podcastEpisodes.delete.useMutation({
    onSuccess: () => {
      toast('Episode deleted', 'success');
      utils.podcasts.getMine.invalidate();
    },
    onError: (err) => toast(err.message || 'Delete failed', 'error'),
  });

  const deleteShow = trpc.podcasts.delete.useMutation({
    onSuccess: () => {
      toast('Show deleted', 'success');
      utils.podcasts.getMine.invalidate();
    },
    onError: (err) => toast(err.message || 'Delete failed', 'error'),
  });

  if (myShows.isLoading) {
    return <div className="text-gray-400">Loading podcasts…</div>;
  }

  const shows = myShows.data ?? [];

  // ── Edit/create overlay states ──
  if (mode.kind === 'create-show') {
    return (
      <div className="space-y-4">
        <button onClick={() => setMode({ kind: 'list' })} className="text-sm text-gray-400 hover:text-white">
          ← Back to podcasts
        </button>
        <PodcastShowForm onCreated={() => setMode({ kind: 'list' })} onCancel={() => setMode({ kind: 'list' })} />
      </div>
    );
  }

  if (mode.kind === 'edit-show') {
    return (
      <div className="space-y-4">
        <button onClick={() => setMode({ kind: 'list' })} className="text-sm text-gray-400 hover:text-white">
          ← Back to podcasts
        </button>
        <PodcastShowForm
          existing={mode.show}
          onCreated={() => setMode({ kind: 'list' })}
          onCancel={() => setMode({ kind: 'list' })}
        />
      </div>
    );
  }

  if (mode.kind === 'add-episode') {
    return (
      <div className="space-y-4">
        <button onClick={() => setMode({ kind: 'list' })} className="text-sm text-gray-400 hover:text-white">
          ← Back to podcasts
        </button>
        <EpisodeForm
          podcastId={mode.podcastId}
          podcastTitle={mode.podcastTitle}
          onSaved={() => setMode({ kind: 'list' })}
          onCancel={() => setMode({ kind: 'list' })}
        />
      </div>
    );
  }

  if (mode.kind === 'edit-episode') {
    return (
      <div className="space-y-4">
        <button onClick={() => setMode({ kind: 'list' })} className="text-sm text-gray-400 hover:text-white">
          ← Back to podcasts
        </button>
        <EpisodeForm
          podcastId={mode.podcastId}
          podcastTitle={mode.podcastTitle}
          existing={mode.episode}
          onSaved={() => setMode({ kind: 'list' })}
          onCancel={() => setMode({ kind: 'list' })}
        />
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">My Podcasts</h2>
          <p className="text-sm text-gray-400">
            Each show gets a public page and an RSS feed for Apple/Spotify/Pocket Casts.
          </p>
        </div>
        {shows.length > 0 && (
          <button
            onClick={() => setMode({ kind: 'create-show' })}
            className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500 transition"
          >
            + New Show
          </button>
        )}
      </div>

      {shows.length === 0 ? (
        <PodcastShowForm onCreated={() => myShows.refetch()} />
      ) : (
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
                      onClick={() => setMode({ kind: 'add-episode', podcastId: show.id, podcastTitle: show.title })}
                      className="rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-500 transition"
                    >
                      + Add Episode
                    </button>
                    <button
                      onClick={() =>
                        setMode({
                          kind: 'edit-show',
                          show: {
                            id: show.id,
                            title: show.title,
                            description: show.description,
                            category: show.category,
                            language: show.language,
                            author: show.author,
                            ownerEmail: show.ownerEmail,
                            explicit: show.explicit,
                            coverUrl: show.coverUrl,
                          },
                        })
                      }
                      className="rounded-full bg-brand-950 border border-brand-800/30 px-4 py-1.5 text-xs font-semibold text-gray-300 hover:text-white transition"
                    >
                      Edit
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
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Delete "${show.title}" and all ${show.episodeCount} episode${show.episodeCount === 1 ? '' : 's'}? This cannot be undone.`
                          )
                        ) {
                          deleteShow.mutate({ id: show.id });
                        }
                      }}
                      className="rounded-full bg-red-950/40 border border-red-800/30 px-4 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-900/40 hover:text-red-300 transition"
                    >
                      Delete Show
                    </button>
                  </div>
                </div>
              </div>

              {show.episodes.length > 0 && (
                <div className="mt-4 pt-4 border-t border-brand-800/20 space-y-1">
                  {show.episodes.slice(0, 8).map((ep) => (
                    <div key={ep.id} className="flex items-center justify-between gap-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ep.title}</p>
                        <p className="text-xs text-gray-500">
                          {ep.duration ? formatDuration(ep.duration) : '—'} ·{' '}
                          {ep.downloadCount ?? 0} downloads ·{' '}
                          {ep.publishedAt ? new Date(ep.publishedAt).toLocaleDateString() : 'draft'}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() =>
                            setMode({
                              kind: 'edit-episode',
                              podcastId: show.id,
                              podcastTitle: show.title,
                              episode: {
                                id: ep.id,
                                podcastId: ep.podcastId,
                                title: ep.title,
                                description: ep.description,
                                coverUrl: ep.coverUrl,
                                audioUrl: ep.audioUrl,
                                duration: ep.duration,
                                episodeNumber: ep.episodeNumber,
                                seasonNumber: ep.seasonNumber,
                                explicit: ep.explicit,
                                episodeType: ep.episodeType,
                              },
                            })
                          }
                          className="text-xs text-gray-400 hover:text-white px-2 py-1"
                        >
                          Edit
                        </button>
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
                    </div>
                  ))}
                  {show.episodes.length > 8 && (
                    <p className="text-xs text-gray-500">+{show.episodes.length - 8} more</p>
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
