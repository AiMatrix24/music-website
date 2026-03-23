'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const { data: artists } = trpc.users.searchUsers.useQuery(
    { query, limit: 6 },
    { enabled: query.length > 0 }
  );

  // We'll search tracks by fetching all and filtering client-side
  // (Meilisearch integration would be better for production)
  const { data: allTracks } = trpc.tracks.list.useQuery(
    { limit: 100 },
    { enabled: query.length > 0 }
  );

  const { data: allEvents } = trpc.events.list.useQuery(
    { limit: 50 },
    { enabled: query.length > 0 }
  );

  const { data: allListings } = trpc.marketplace.listItems.useQuery(
    { limit: 50 },
    { enabled: query.length > 0 }
  );

  const lowerQuery = query.toLowerCase();

  const matchedTracks = allTracks?.filter(
    (t) =>
      t.title.toLowerCase().includes(lowerQuery) ||
      t.genre?.toLowerCase().includes(lowerQuery) ||
      t.artistName?.toLowerCase().includes(lowerQuery)
  ) ?? [];

  const matchedEvents = allEvents?.filter(
    (e) =>
      e.title.toLowerCase().includes(lowerQuery) ||
      e.hostName?.toLowerCase().includes(lowerQuery)
  ) ?? [];

  const matchedListings = allListings?.filter(
    (l) =>
      l.title.toLowerCase().includes(lowerQuery) ||
      l.description?.toLowerCase().includes(lowerQuery) ||
      l.sellerName?.toLowerCase().includes(lowerQuery)
  ) ?? [];

  const totalResults = (artists?.length ?? 0) + matchedTracks.length + matchedEvents.length + matchedListings.length;

  if (!query) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-lg">Enter a search term to find tracks, artists, events, and more.</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-gray-400 mb-8">
        {totalResults} result{totalResults !== 1 ? 's' : ''} for &quot;{query}&quot;
      </p>

      {/* Artists */}
      {artists && artists.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Artists</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artist/${artist.id}`}
                className="flex items-center gap-4 rounded-xl bg-[#15151f] p-4 transition hover:bg-[#1a1a2e]"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-lg font-bold shrink-0">
                  {artist.name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="font-semibold">{artist.name}</p>
                  <p className="text-xs text-gray-400">{artist.role}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Tracks */}
      {matchedTracks.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Tracks</h2>
          <div className="space-y-3">
            {matchedTracks.map((track) => (
              <Link
                key={track.id}
                href={`/track/${track.id}`}
                className="flex items-center gap-4 rounded-xl bg-[#15151f] p-4 transition hover:bg-[#1a1a2e]"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-sm font-bold">
                  {track.genre?.charAt(0) ?? '♪'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{track.title}</p>
                  <p className="text-sm text-gray-400 truncate">
                    {track.artistName ?? 'Unknown'} · {track.genre ?? 'Unknown'}
                  </p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-gray-400">{formatDuration(track.duration)}</p>
                  <p className="text-xs text-gray-500">{formatPlays(track.playCount ?? 0)} plays</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Events */}
      {matchedEvents.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchedEvents.map((event) => (
              <Link
                key={event.id}
                href={`/event/${event.id}`}
                className="rounded-2xl bg-[#15151f] p-5 transition hover:bg-[#1a1a2e] block"
              >
                <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-1">
                  {new Date(event.startDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <h3 className="font-bold">{event.title}</h3>
                {event.hostName && (
                  <p className="text-sm text-gray-400 mt-1">by {event.hostName}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Listings */}
      {matchedListings.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Marketplace</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchedListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/marketplace/${listing.id}`}
                className="rounded-2xl bg-[#15151f] p-5 transition hover:bg-[#1a1a2e] block"
              >
                <h3 className="font-bold mb-1 truncate">{listing.title}</h3>
                <p className="text-xs text-gray-400 mb-2">by {listing.sellerName ?? 'Unknown'}</p>
                <span className="text-lg font-bold text-brand-400">
                  ${(listing.price / 100).toFixed(2)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {totalResults === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No results found for &quot;{query}&quot;</p>
          <p className="text-gray-500 text-sm mt-2">Try a different search term.</p>
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Search</h1>
        <Suspense fallback={<div className="animate-pulse text-gray-400 py-8">Loading...</div>}>
          <SearchResults />
        </Suspense>
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

function formatPlays(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}
