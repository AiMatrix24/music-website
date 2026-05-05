'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { FollowButton } from '../../components/FollowButton';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { AddToPlaylistModal } from '../../components/AddToPlaylistModal';

export default function ArtistProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [addToPlaylistFor, setAddToPlaylistFor] = useState<{ id: string; title: string } | null>(null);
  const { data: artist, isLoading, error } = trpc.users.getById.useQuery({ id });
  const { data: tracks } = trpc.tracks.list.useQuery(
    { userId: id, limit: 20 },
    { enabled: !!artist }
  );
  const { data: events } = trpc.events.list.useQuery(
    { limit: 10 },
    { enabled: !!artist }
  );
  const { data: followerCount } = trpc.users.getFollowerCount.useQuery(
    { userId: id },
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
          {artist.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artist.avatar}
              alt=""
              className="w-28 h-28 rounded-full object-cover ring-2 ring-brand-800/40 shrink-0"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-4xl font-black shrink-0">
              {artist.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
          )}
          <div className="text-center sm:text-left">
            <span className="inline-block bg-brand-600/20 text-brand-400 text-xs px-3 py-1 rounded-full mb-2 font-semibold uppercase">
              {artist.role}
            </span>
            <h1 className="text-4xl font-black mb-2 flex items-center gap-2 flex-wrap">
              {artist.name}
              {artist.verifiedAt && <VerifiedBadge size="lg" />}
            </h1>
            <p className="text-gray-400 mb-3">
              Joined {new Date(artist.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
              {followerCount !== undefined && (
                <span className="ml-3">· {followerCount} follower{followerCount !== 1 ? 's' : ''}</span>
              )}
            </p>
            <FollowButton artistId={id} artistName={artist.name ?? undefined} />

            {/* Social Links */}
            <SocialLinks artist={artist} />
          </div>
        </div>

        {/* Bio */}
        {(artist as any).bio && (
          <div className="rounded-xl bg-[#15151f] p-5 mb-6">
            <p className="text-gray-300 text-sm leading-relaxed">{(artist as any).bio}</p>
          </div>
        )}

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
                <div
                  key={track.id}
                  className="flex items-center gap-4 rounded-xl bg-[#15151f] p-4 transition hover:bg-[#1a1a2e]"
                >
                  <Link href={`/track/${track.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="text-gray-500 text-sm w-8 text-right shrink-0">{i + 1}</span>
                    {(track as { coverUrl?: string | null }).coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={(track as { coverUrl?: string | null }).coverUrl ?? ''}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-sm font-bold shrink-0">
                        {track.genre?.charAt(0) ?? '♪'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{track.title}</p>
                      <p className="text-sm text-gray-400">{track.genre}</p>
                    </div>
                    <div className="text-right hidden sm:block shrink-0">
                      <p className="text-sm text-gray-400">{formatDuration(track.duration)}</p>
                      <p className="text-xs text-gray-500">{formatPlays(track.playCount ?? 0)} plays</p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setAddToPlaylistFor({ id: track.id, title: track.title })}
                    aria-label="Add to playlist"
                    title="Add to playlist"
                    className="shrink-0 rounded-lg bg-brand-950 hover:bg-brand-900 border border-brand-800/40 px-2.5 py-1.5 text-xs font-bold text-gray-400 hover:text-white transition"
                  >
                    +
                  </button>
                </div>
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

      {addToPlaylistFor && (
        <AddToPlaylistModal
          trackId={addToPlaylistFor.id}
          trackTitle={addToPlaylistFor.title}
          isOpen={true}
          onClose={() => setAddToPlaylistFor(null)}
        />
      )}
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

function SocialLinks({ artist }: { artist: any }) {
  const socials = [
    { key: 'socialInstagram', icon: '📸', label: 'Instagram', prefix: 'https://instagram.com/' },
    { key: 'socialTwitter', icon: '𝕏', label: 'Twitter', prefix: 'https://x.com/' },
    { key: 'socialTiktok', icon: '🎵', label: 'TikTok', prefix: 'https://tiktok.com/@' },
    { key: 'socialYoutube', icon: '▶️', label: 'YouTube', prefix: '' },
    { key: 'socialSpotify', icon: '🎧', label: 'Spotify', prefix: '' },
    { key: 'socialSoundcloud', icon: '☁️', label: 'SoundCloud', prefix: '' },
    { key: 'socialWebsite', icon: '🌐', label: 'Website', prefix: '' },
  ];

  const activeSocials = socials.filter((s) => artist[s.key]);

  if (activeSocials.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {activeSocials.map((s) => {
        const value = artist[s.key] as string;
        const href = value.startsWith('http') ? value : s.prefix + value.replace('@', '');
        return (
          <a
            key={s.key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#15151f] hover:bg-[#1a1a2e] border border-brand-800/20 px-3 py-1.5 rounded-full text-sm transition hover:border-red-600/30"
            title={s.label}
          >
            <span>{s.icon}</span>
            <span className="text-gray-400 text-xs">{s.label}</span>
          </a>
        );
      })}
    </div>
  );
}
