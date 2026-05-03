'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useState } from 'react';
import { TrackListSkeleton, CardGridSkeleton, ArtistCardSkeleton, EventCardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

type Tab = 'tracks' | 'creators' | 'events' | 'marketplace' | 'playlists' | 'articles';

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<Tab>('tracks');

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Explore</h1>
      <p className="text-gray-400 mb-8">Discover music, events, and more on OPYNX.</p>

      <div className="flex gap-2 mb-8 overflow-x-auto">
        {(['tracks', 'creators', 'events', 'marketplace', 'playlists', 'articles'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${
              activeTab === tab
                ? 'bg-brand-600 text-white'
                : 'bg-[#15151f] text-gray-400 hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'tracks' && <TracksSection />}
      {activeTab === 'creators' && <ArtistsSection />}
      {activeTab === 'events' && <EventsSection />}
      {activeTab === 'marketplace' && <MarketplaceSection />}
      {activeTab === 'playlists' && <PlaylistsSection />}
      {activeTab === 'articles' && <ArticlesSection />}
    </div>
  );
}

function TracksSection() {
  const { data: tracks, isLoading } = trpc.tracks.list.useQuery({ limit: 20 });

  if (isLoading) return <TrackListSkeleton count={8} />;

  return (
    <div className="space-y-3">
      {tracks?.map((track, i) => (
        <Link
          key={track.id}
          href={`/track/${track.id}`}
          className="flex items-center gap-4 rounded-xl bg-[#15151f] p-4 transition hover:bg-[#1a1a2e]"
        >
          <span className="text-gray-500 text-sm w-8 text-right">{i + 1}</span>
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-lg">
            {track.genre?.charAt(0) ?? '♪'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{track.title}</p>
            <p className="text-sm text-gray-400 truncate">
              {track.artistName ?? 'Unknown creator'} · {track.genre ?? 'Unknown genre'}
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm text-gray-400">{formatDuration(track.duration)}</p>
            <p className="text-xs text-gray-500">{formatPlays(track.playCount ?? 0)} plays</p>
          </div>
        </Link>
      ))}
      {(!tracks || tracks.length === 0) && (
        <EmptyState icon="🎵" title="No tracks yet" description="Be the first to upload a track and share your music with the world." actionLabel="Learn More" actionHref="/subscribe" />
      )}
    </div>
  );
}

function ArtistsSection() {
  const { data: creators, isLoading } = trpc.users.listCreators.useQuery({ limit: 20 });

  if (isLoading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => <ArtistCardSkeleton key={i} />)}
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {creators?.map((creator) => (
        <Link
          key={creator.id}
          href={`/artist/${creator.id}`}
          className="rounded-2xl bg-[#15151f] p-6 transition hover:bg-[#1a1a2e] flex flex-col items-center text-center"
        >
          {creator.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.avatar}
              alt=""
              className="w-20 h-20 rounded-full object-cover ring-2 ring-brand-800/40 mb-4"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-2xl font-black mb-4">
              {creator.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
          )}
          <h3 className="font-bold text-lg mb-1">{creator.name}</h3>
          <span className="text-xs bg-brand-600/20 text-brand-400 px-3 py-1 rounded-full">
            {creator.role}
          </span>
        </Link>
      ))}
      {(!creators || creators.length === 0) && (
        <p className="text-gray-500 text-center py-8 col-span-3">No creators yet.</p>
      )}
    </div>
  );
}

function EventsSection() {
  const { data: events, isLoading } = trpc.events.list.useQuery({
    limit: 20,
    status: 'published',
  });

  if (isLoading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {events?.map((event) => (
        <Link
          key={event.id}
          href={`/event/${event.id}`}
          className="rounded-2xl bg-[#15151f] p-6 transition hover:bg-[#1a1a2e] block"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-1">
                {new Date(event.startDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              <h3 className="text-lg font-bold">{event.title}</h3>
              {event.hostName && (
                <p className="text-sm text-gray-400 mt-1">Hosted by {event.hostName}</p>
              )}
            </div>
            <span className="text-xs bg-brand-600/20 text-brand-400 px-3 py-1 rounded-full">
              {event.status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            {event.capacity && <span>{event.capacity.toLocaleString()} cap</span>}
            {event.timezone && <span>{event.timezone.split('/')[1]?.replace('_', ' ')}</span>}
          </div>
        </Link>
      ))}
      {(!events || events.length === 0) && (
        <div className="col-span-2">
          <EmptyState icon="📅" title="No upcoming events" description="Check back soon for live shows and listening parties." />
        </div>
      )}
    </div>
  );
}

function MarketplaceSection() {
  const { data: listings, isLoading } = trpc.marketplace.listItems.useQuery({ limit: 20 });

  if (isLoading) return <CardGridSkeleton count={6} />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings?.map((listing) => (
        <Link
          key={listing.id}
          href={`/marketplace/${listing.id}`}
          className="rounded-2xl bg-[#15151f] p-6 transition hover:bg-[#1a1a2e] block"
        >
          <div className="w-full h-32 rounded-xl bg-gradient-to-br from-brand-800 to-brand-950 flex items-center justify-center text-3xl mb-4">
            {categoryEmoji(listing.category)}
          </div>
          <h3 className="font-bold mb-1 truncate">{listing.title}</h3>
          <p className="text-xs text-gray-400 mb-2">by {listing.sellerName ?? 'Unknown'}</p>
          <p className="text-sm text-gray-400 line-clamp-2 mb-3">{listing.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-brand-400">
              ${(listing.price / 100).toFixed(2)}
            </span>
            <span className="text-xs bg-brand-600/20 text-brand-400 px-3 py-1 rounded-full">
              {listing.category.replace('_', ' ')}
            </span>
          </div>
        </Link>
      ))}
      {(!listings || listings.length === 0) && (
        <p className="text-gray-500 text-center py-8 col-span-3">No listings yet.</p>
      )}
    </div>
  );
}

function PlaylistsSection() {
  const { data: playlists, isLoading } = trpc.playlists.list.useQuery({ limit: 20 });

  if (isLoading) return <CardGridSkeleton count={4} />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {playlists?.map((playlist) => (
        <Link
          key={playlist.id}
          href={`/playlist/${playlist.id}`}
          className="rounded-2xl bg-[#15151f] p-6 transition hover:bg-[#1a1a2e] block"
        >
          <div className="w-full h-32 rounded-xl bg-gradient-to-br from-brand-500 to-purple-800 flex items-center justify-center text-4xl mb-4">
            🎧
          </div>
          <h3 className="font-bold text-lg mb-1 truncate">{playlist.title}</h3>
          {playlist.description && (
            <p className="text-sm text-gray-400 line-clamp-2 mb-2">{playlist.description}</p>
          )}
          <span className="text-xs bg-brand-600/20 text-brand-400 px-3 py-1 rounded-full capitalize">
            {playlist.visibility}
          </span>
        </Link>
      ))}
      {(!playlists || playlists.length === 0) && (
        <p className="text-gray-500 text-center py-8 col-span-3">No playlists yet.</p>
      )}
    </div>
  );
}

function ArticlesSection() {
  const { data: articles, isLoading } = trpc.articles.list.useQuery({ limit: 20 });

  if (isLoading) return <TrackListSkeleton count={3} />;

  return (
    <div className="space-y-6">
      {articles?.map((article) => (
        <div
          key={article.id}
          className="rounded-2xl bg-[#15151f] p-6 transition hover:bg-[#1a1a2e]"
        >
          <p className="text-xs text-gray-500 mb-2">
            {article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Draft'}
          </p>
          <h3 className="text-xl font-bold mb-2">{article.title}</h3>
          <p className="text-gray-400 text-sm">{article.excerpt}</p>
        </div>
      ))}
      {(!articles || articles.length === 0) && (
        <p className="text-gray-500 text-center py-8">No articles yet.</p>
      )}
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

function categoryEmoji(category: string): string {
  switch (category) {
    case 'physical_music': return '💿';
    case 'used_gear': return '🎛️';
    case 'services': return '🎵';
    case 'merch': return '👕';
    default: return '📦';
  }
}
