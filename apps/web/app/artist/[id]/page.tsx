'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ArtistProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: artist, isLoading, error } = trpc.users.getById.useQuery({ id });
  const { data: tracks } = trpc.tracks.list.useQuery(
    { userId: id, limit: 20 },
    { enabled: !!artist }
  );
  const { data: events } = trpc.events.list.useQuery(
    { limit: 10 },
    { enabled: !!artist }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading artist...</div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Artist not found</p>
        <Link href="/explore" className="text-brand-400 hover:text-brand-300 transition">
          ← Back to Explore
        </Link>
      </div>
    );
  }

  // Filter events hosted by this artist
  const artistEvents = events?.filter((e) => e.hostId === id) ?? [];
  const totalPlays = tracks?.reduce((sum, t) => sum + (t.playCount ?? 0), 0) ?? 0;

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/explore"
          className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block"
        >
          ← Back to Explore
        </Link>

        {/* Artist header */}
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-10">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-4xl font-black shrink-0">
            {artist.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="text-center sm:text-left">
            <span className="inline-block bg-brand-600/20 text-brand-400 text-xs px-3 py-1 rounded-full mb-2 font-semibold uppercase">
              {artist.role}
            </span>
            <h1 className="text-4xl font-black mb-2">{artist.name}</h1>
            <p className="text-gray-400">
              Joined {new Date(artist.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <StatCard label="Tracks" value={String(tracks?.length ?? 0)} />
          <StatCard label="Total Plays" value={formatPlays(totalPlays)} />
          <StatCard label="Events" value={String(artistEvents.length)} />
        </div>

        {/* Tracks */}
        {tracks && tracks.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Tracks</h2>
            <div className="space-y-3">
              {tracks.map((track, i) => (
                <Link
                  key={track.id}
                  href={`/track/${track.id}`}
                  className="flex items-center gap-4 rounded-xl bg-[#15151f] p-4 transition hover:bg-[#1a1a2e]"
                >
                  <span className="text-gray-500 text-sm w-8 text-right">{i + 1}</span>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-sm font-bold">
                    {track.genre?.charAt(0) ?? '♪'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{track.title}</p>
                    <p className="text-sm text-gray-400">{track.genre}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-gray-400">{formatDuration(track.duration)}</p>
                    <p className="text-xs text-gray-500">{formatPlays(track.playCount ?? 0)} plays</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Events */}
        {artistEvents.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {artistEvents.map((event) => {
                const date = new Date(event.startDate);
                return (
                  <Link
                    key={event.id}
                    href={`/event/${event.id}`}
                    className="rounded-2xl bg-[#15151f] overflow-hidden transition hover:bg-[#1a1a2e] block"
                  >
                    <div className="h-24 bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-black">{date.getDate()}</p>
                        <p className="text-xs font-semibold uppercase text-brand-300">
                          {date.toLocaleDateString('en-US', { month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold">{event.title}</h3>
                      <p className="text-sm text-gray-400">
                        {event.capacity?.toLocaleString()} cap
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#15151f] p-4 text-center">
      <p className="text-2xl font-bold text-brand-400">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatPlays(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}
