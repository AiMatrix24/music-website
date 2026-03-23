'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: album, isLoading, error } = trpc.albums.getById.useQuery({ id });
  const { data: albumTracks } = trpc.albums.getTracks.useQuery(
    { albumId: id },
    { enabled: !!album }
  );

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
          </div>
        </div>

        {/* Tracklist */}
        {albumTracks && albumTracks.length > 0 && (
          <div className="rounded-2xl bg-[#15151f] overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-800/20">
              <h2 className="text-lg font-bold">Tracklist</h2>
            </div>
            <div className="divide-y divide-brand-800/10">
              {albumTracks.map((at) => (
                <Link
                  key={at.track.id}
                  href={`/track/${at.track.id}`}
                  className="flex items-center gap-4 px-6 py-4 transition hover:bg-brand-950/50"
                >
                  <span className="text-gray-500 text-sm w-8 text-right font-mono">
                    {at.position}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{at.track.title}</p>
                    <p className="text-sm text-gray-400">{at.track.genre}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      {formatDuration(at.track.duration)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

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
