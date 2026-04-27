'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useCallback } from 'react';
import { ShareButton } from '../../components/ShareButton';
import { PlayButton } from '../../components/PlayButton';
import { LikeButton } from '../../components/LikeButton';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { TrackComments } from '../../components/TrackComments';
import { TipJar } from '../../components/TipJar';
import { VerifiedBadge } from '../../components/VerifiedBadge';

export default function TrackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: track, isLoading, error } = trpc.tracks.getById.useQuery({ id });
  const { data: relatedTracks } = trpc.tracks.list.useQuery(
    { limit: 4 },
    { enabled: !!track }
  );
  // Purchase status — hasPurchased returns the purchase row if user owns it, else null
  const { data: ownership } = trpc.trackPurchases.hasPurchased.useQuery({ trackId: id });
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = useCallback(() => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }, []);

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
                className="text-gray-400 hover:text-brand-400 transition text-sm mb-2 inline-flex items-center gap-1"
              >
                by {track.artistName}
                {track.artistVerifiedAt && <VerifiedBadge size="sm" />}
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
                  creator: track.artistName ?? undefined,
                  genre: track.genre ?? undefined,
                  duration: track.duration ?? undefined,
                  audioUrl: (track as { audioUrl?: string | null }).audioUrl ?? null,
                  coverUrl: (track as { coverUrl?: string | null }).coverUrl ?? null,
                }}
                size="lg"
              />
              <LikeButton initialCount={Math.floor((track.playCount ?? 0) * 0.12)} />
              <ShareButton title={`${track.title} on OPYNX`} text={`Listen to ${track.title} by ${track.artistName ?? 'Unknown'} on OPYNX`} />
              {/* Buy button (only for paid tracks not yet owned) */}
              {track.price && track.price > 0 && !ownership && (
                <Link
                  href={`/track/${id}/buy`}
                  className="rounded-full bg-green-600 hover:bg-green-500 px-5 py-2 text-sm font-semibold text-white transition"
                >
                  Buy — ${(track.price / 100).toFixed(2)}
                </Link>
              )}
              {/* Owned badge */}
              {ownership && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-600/20 border border-green-600/40 px-4 py-2 text-sm font-semibold text-green-400">
                  ✓ Owned
                </span>
              )}
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

        {/* Prominent Play Count */}
        <div className="rounded-2xl bg-gradient-to-r from-brand-600/10 to-brand-800/10 border border-brand-800/20 p-6 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-brand-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-black text-white">{formatPlays(track.playCount ?? 0)}</p>
              <p className="text-sm text-gray-400">total plays</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Updated live as listeners stream</p>
          </div>
        </div>

        {/* Share Section */}
        <div className="rounded-2xl bg-[#15151f] p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Share This Track</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 bg-brand-950/50 rounded-xl px-4 py-3 border border-brand-800/20">
              <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-sm text-gray-400 truncate flex-1">
                {typeof window !== 'undefined' ? window.location.href : `opynx.com/track/${id}`}
              </span>
            </div>
            <button
              onClick={handleCopyLink}
              className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-500 shrink-0"
            >
              {linkCopied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          <div className="flex gap-3 mt-4">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Listen to ${track.title} by ${track.artistName ?? 'Unknown'} on OPYNX`)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-brand-950/50 border border-brand-800/20 px-4 py-2 text-sm text-gray-400 hover:text-white transition"
            >
              Share on X
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-brand-950/50 border border-brand-800/20 px-4 py-2 text-sm text-gray-400 hover:text-white transition"
            >
              Share on Facebook
            </a>
          </div>
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
