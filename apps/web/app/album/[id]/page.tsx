'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

export default function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data: album, isLoading, error } = trpc.albums.getById.useQuery({ id });
  const { data: albumTracks } = trpc.albums.getTracks.useQuery(
    { albumId: id },
    { enabled: !!album }
  );
  const { data: owned } = trpc.albums.hasPurchased.useQuery(
    { albumId: id },
    { enabled: !!album && !!session?.user?.id }
  );

  const isOwner = !!album && (album as { userId?: string }).userId === session?.user?.id;
  const [showPicker, setShowPicker] = useState(false);

  // Only fetched when owner opens the picker — avoids leaking other users'
  // tracks to non-owners and avoids a wasted query for visitors.
  const { data: myTracks } = trpc.tracks.list.useQuery(
    { limit: 100, userId: session?.user?.id ?? '' },
    { enabled: showPicker && !!session?.user?.id }
  );

  const addTrack = trpc.albums.addTrack.useMutation({
    onSuccess: () => {
      utils.albums.getTracks.invalidate({ albumId: id });
    },
    onError: (err) => toast(err.message || 'Add failed', 'error'),
  });

  const removeTrack = trpc.albums.removeTrack.useMutation({
    onSuccess: () => {
      utils.albums.getTracks.invalidate({ albumId: id });
    },
    onError: (err) => toast(err.message || 'Remove failed', 'error'),
  });

  const trackIdsInAlbum = new Set(albumTracks?.map((at) => at.track.id) ?? []);
  const addableTracks = myTracks?.filter((t) => !trackIdsInAlbum.has(t.id)) ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading album...</div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Album not found</p>
        <Link href="/explore" className="text-brand-400 hover:text-brand-300 transition">
          ← Back to Explore
        </Link>
      </div>
    );
  }

  const totalDuration = albumTracks?.reduce(
    (sum, at) => sum + (at.track.duration ?? 0),
    0
  ) ?? 0;

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/explore"
          className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block"
        >
          ← Back to Explore
        </Link>

        {/* Album header */}
        <div className="flex flex-col sm:flex-row gap-6 items-start mb-10">
          <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center text-5xl shrink-0 shadow-2xl shadow-brand-900/30">
            💿
          </div>
          <div className="flex-1">
            <p className="text-sm text-brand-400 font-semibold uppercase tracking-wider mb-1">
              Album
            </p>
            <h1 className="text-4xl font-black mb-3">{album.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{albumTracks?.length ?? 0} tracks</span>
              <span>·</span>
              <span>{formatTotalDuration(totalDuration)}</span>
              {album.price !== null && album.price > 0 && (
                <>
                  <span>·</span>
                  <span className="text-brand-400 font-semibold">
                    ${(album.price / 100).toFixed(2)}
                  </span>
                </>
              )}
            </div>
            {/* Buy button — visible to non-owners when album has a price */}
            {album.price !== null && album.price > 0 && !isOwner && (
              <div className="mt-4">
                {owned ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-green-600/20 px-4 py-2 text-sm font-semibold text-green-400">
                    ✓ Owned
                  </span>
                ) : (
                  <Link
                    href={`/album/${id}/buy`}
                    className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition"
                  >
                    Buy Album — ${(album.price / 100).toFixed(2)}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tracklist */}
        {(albumTracks && albumTracks.length > 0) || isOwner ? (
          <div className="rounded-2xl bg-[#15151f] overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-800/20 flex items-center justify-between">
              <h2 className="text-lg font-bold">Tracklist</h2>
              {isOwner && (
                <button
                  onClick={() => setShowPicker((v) => !v)}
                  className="text-sm bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-full transition font-semibold"
                >
                  {showPicker ? 'Done' : '+ Add Track'}
                </button>
              )}
            </div>

            {/* Owner: track picker. Shows the user's own tracks not already in the album. */}
            {isOwner && showPicker && (
              <div className="border-b border-brand-800/20 bg-brand-950/30 px-6 py-4">
                {addableTracks.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {addableTracks.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => addTrack.mutate({ albumId: id, trackId: t.id })}
                        disabled={addTrack.isPending}
                        className="w-full flex items-center gap-3 rounded-lg bg-[#15151f] hover:bg-[#1a1a2e] p-3 text-left transition disabled:opacity-50"
                      >
                        {(t as { coverUrl?: string | null }).coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={(t as { coverUrl?: string | null }).coverUrl ?? ''}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-sm font-bold shrink-0">
                            {t.genre?.charAt(0) ?? '♪'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate text-sm">{t.title}</p>
                          <p className="text-xs text-gray-500">{t.genre ?? 'No genre'}</p>
                        </div>
                        <span className="text-xs text-red-400 font-semibold shrink-0">+ Add</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {myTracks === undefined
                      ? 'Loading your tracks…'
                      : 'All your tracks are already in this album. Upload more from /dashboard.'}
                  </p>
                )}
              </div>
            )}

            <div className="divide-y divide-brand-800/10">
              {albumTracks?.map((at) => (
                <div
                  key={at.track.id}
                  className="flex items-center gap-4 px-6 py-4 transition hover:bg-brand-950/50"
                >
                  <Link
                    href={`/track/${at.track.id}`}
                    className="flex items-center gap-4 flex-1 min-w-0"
                  >
                    <span className="text-gray-500 text-sm w-8 text-right font-mono shrink-0">
                      {at.position + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{at.track.title}</p>
                      <p className="text-sm text-gray-400">{at.track.genre}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm text-gray-400">
                        {formatDuration(at.track.duration)}
                      </p>
                    </div>
                  </Link>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remove "${at.track.title}" from this album?`)) {
                          removeTrack.mutate({ albumId: id, trackId: at.track.id });
                        }
                      }}
                      disabled={removeTrack.isPending}
                      className="shrink-0 text-xs text-gray-500 hover:text-red-400 px-2 py-1 transition disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {albumTracks?.length === 0 && !showPicker && isOwner && (
                <div className="px-6 py-8 text-center text-sm text-gray-500">
                  No tracks yet. Click <span className="font-semibold text-red-400">+ Add Track</span> above.
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Album info */}
        <div className="mt-6 rounded-2xl bg-[#15151f] p-6">
          <h2 className="text-lg font-bold mb-4">Details</h2>
          <div className="space-y-3 text-sm">
            <DetailRow label="Slug" value={album.slug} />
            <DetailRow label="Visibility" value={album.visibility} />
            <DetailRow
              label="Price"
              value={album.price ? `$${(album.price / 100).toFixed(2)}` : 'Free'}
            />
            <DetailRow
              label="Released"
              value={
                album.releaseDate
                  ? new Date(album.releaseDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Unreleased'
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTotalDuration(seconds: number): string {
  if (!seconds) return '0 min';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs} hr ${remMins} min`;
}
