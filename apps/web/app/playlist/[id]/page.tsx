'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { usePlayer } from '@/app/components/MusicPlayer';

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: playlist, isLoading, error } = trpc.playlists.getById.useQuery({ id });
  const { data: playlistTracks } = trpc.playlists.getTracks.useQuery(
    { playlistId: id },
    { enabled: !!playlist }
  );
  const { play } = usePlayer();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading playlist...</div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Playlist not found</p>
        <Link href="/explore" className="text-brand-400 hover:text-brand-300 transition">
          ← Back to Explore
        </Link>
      </div>
    );
  }

  const totalDuration = playlistTracks?.reduce(
    (sum, pt) => sum + (pt.track.duration ?? 0),
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

        {/* Playlist header */}
        <div className="flex flex-col sm:flex-row gap-6 items-start mb-10">
          <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-800 flex items-center justify-center text-5xl shrink-0 shadow-2xl shadow-brand-900/30">
            🎧
          </div>
          <div className="flex-1">
            <p className="text-sm text-brand-400 font-semibold uppercase tracking-wider mb-1">
              Playlist
            </p>
            <h1 className="text-4xl font-black mb-3">{playlist.title}</h1>
            {playlist.description && (
              <p className="text-gray-400 mb-3">{playlist.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{playlistTracks?.length ?? 0} tracks</span>
              <span>·</span>
              <span>{formatTotalDuration(totalDuration)}</span>
              <span>·</span>
              <span className="capitalize">{playlist.visibility}</span>
            </div>
          </div>
        </div>

        {/* Tracklist */}
        {playlistTracks && playlistTracks.length > 0 ? (
          <div className="rounded-2xl bg-[#15151f] overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-800/20 flex items-center justify-between">
              <h2 className="text-lg font-bold">Tracks</h2>
              <button
                onClick={() => {
                  if (playlistTracks[0]) {
                    play({
                      id: playlistTracks[0].track.id,
                      title: playlistTracks[0].track.title,
                      creator: 'Unknown',
                      genre: playlistTracks[0].track.genre ?? '',
                      duration: playlistTracks[0].track.duration ?? 0,
                    });
                  }
                }}
                className="text-sm bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-full transition font-semibold"
              >
                Play All
              </button>
            </div>
            <div className="divide-y divide-brand-800/10">
              {playlistTracks.map((pt) => (
                <div
                  key={pt.track.id}
                  className="flex items-center gap-4 px-6 py-4 transition hover:bg-brand-950/50 cursor-pointer"
                  onClick={() =>
                    play({
                      id: pt.track.id,
                      title: pt.track.title,
                      creator: 'Unknown',
                      genre: pt.track.genre ?? '',
                      duration: pt.track.duration ?? 0,
                    })
                  }
                >
                  <span className="text-gray-500 text-sm w-8 text-right font-mono">
                    {pt.position}
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-sm">
                    {pt.track.genre?.charAt(0) ?? '♪'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{pt.track.title}</p>
                    <p className="text-sm text-gray-400">{pt.track.genre}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      {formatDuration(pt.track.duration)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#15151f] p-12 text-center">
            <p className="text-gray-500 text-lg mb-2">This playlist is empty</p>
            <p className="text-gray-600 text-sm">Add tracks from the Explore page.</p>
          </div>
        )}
      </div>
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
