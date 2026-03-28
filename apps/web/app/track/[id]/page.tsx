'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ShareButton } from '../../components/ShareButton';
import { PlayButton } from '../../components/PlayButton';
import { LikeButton } from '../../components/LikeButton';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { TrackComments } from '../../components/TrackComments';
import { TipJar } from '../../components/TipJar';

export default function TrackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: track, isLoading, error } = trpc.tracks.getById.useQuery({ id });
  const { data: relatedTracks } = trpc.tracks.list.useQuery(
    { limit: 4 },
    { enabled: !!track }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading track...</div>
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Track not found</p>
        <Link href="/explore" className="text-brand-400 hover:text-brand-300 transition">
          ← Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Breadcrumbs items={[
          { label: 'Explore', href: '/explore' },
          { label: track.title },
        ]} />

        {/* Track header */}
        <div className="flex flex-col sm:flex-row gap-6 items-start mb-10">
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-5xl font-bold shrink-0">
            {track.genre?.charAt(0) ?? '♪'}
          </div>
          <div className="flex-1">
            <p className="text-sm text-brand-400 font-semibold uppercase tracking-wider mb-1">
              Track
            </p>
            <h1 className="text-4xl font-black mb-2">{track.title}</h1>
            {track.artistName && (
              <Link
                href={`/artist/${track.userId}`}
                className="text-gray-400 hover:text-brand-400 transition text-sm mb-2 inline-block"
              >
                by {track.artistName}
              </Link>
            )}
            {track.genre && (
              <span className="inline-block bg-brand-600/20 text-brand-400 text-sm px-3 py-1 rounded-full mb-4 ml-2">
                {track.genre}
              </span>
            )}
            <div className="flex items-center gap-3 mt-4">
              <PlayButton
                track={{
                  id: track.id,
                  title: track.title,
                  artist: track.artistName ?? undefined,
                  genre: track.genre ?? undefined,
                  duration: track.duration ?? undefined,
                }}
                size="lg"
              />
              <LikeButton initialCount={Math.floor((track.playCount ?? 0) * 0.12)} />
              <ShareButton title={`${track.title} on OPYNX`} text={`Listen to ${track.title} by ${track.artistName ?? 'Unknown'} on OPYNX`} />
              <TipJar artistName={track.artistName ?? 'Unknown'} artistId={track.userId} />
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <StatCard label="Plays" value={formatPlays(track.playCount ?? 0)} />
          <StatCard label="Duration" value={formatDuration(track.duration)} />
          <StatCard label="BPM" value={track.bpm ? String(track.bpm) : '—'} />
          <StatCard
            label="Status"
            value={track.status.charAt(0).toUpperCase() + track.status.slice(1)}
          />
        </div>

        {/* Details */}
        <div className="rounded-2xl bg-[#15151f] p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Details</h2>
          <div className="space-y-3 text-sm">
            <DetailRow label="Slug" value={track.slug} />
            <DetailRow label="Visibility" value={track.visibility} />
            <DetailRow
              label="Price"
              value={track.price ? `$${(track.price / 100).toFixed(2)}` : 'Free'}
            />
            <DetailRow
              label="Created"
              value={new Date(track.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            />
          </div>
        </div>

        {/* Comments */}
        <div className="mb-6">
          <TrackComments trackId={track.id} />
        </div>

        {/* Related Tracks */}
        {relatedTracks && relatedTracks.filter((t) => t.id !== track.id).length > 0 && (
          <div className="rounded-2xl bg-[#15151f] p-6">
            <h2 className="text-lg font-bold mb-4">More Tracks</h2>
            <div className="space-y-3">
              {relatedTracks
                .filter((t) => t.id !== track.id)
                .slice(0, 3)
                .map((t) => (
                  <Link
                    key={t.id}
                    href={`/track/${t.id}`}
                    className="flex items-center gap-4 p-3 rounded-xl transition hover:bg-brand-950/50"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-sm font-bold shrink-0">
                      {t.genre?.charAt(0) ?? '♪'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-sm">{t.title}</p>
                      <p className="text-xs text-gray-400">{t.artistName ?? 'Unknown'} · {t.genre}</p>
                    </div>
                    <span className="text-xs text-gray-500">{formatPlays(t.playCount ?? 0)} plays</span>
                  </Link>
                ))}
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

function formatPlays(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}
