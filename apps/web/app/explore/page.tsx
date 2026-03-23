'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useState } from 'react';

type Tab = 'tracks' | 'events' | 'marketplace' | 'articles';

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<Tab>('tracks');

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Explore</h1>
      <p className="text-gray-400 mb-8">Discover music, events, and more on OPYNX.</p>

      <div className="flex gap-2 mb-8 overflow-x-auto">
        {(['tracks', 'events', 'marketplace', 'articles'] as Tab[]).map((tab) => (
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
      {activeTab === 'events' && <EventsSection />}
      {activeTab === 'marketplace' && <MarketplaceSection />}
      {activeTab === 'articles' && <ArticlesSection />}
    </div>
  );
}

function TracksSection() {
  const { data: tracks, isLoading } = trpc.tracks.list.useQuery({ limit: 20 });

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-3">
      {tracks?.map((track, i) => (
        <div
          key={track.id}
          className="flex items-center gap-4 rounded-xl bg-[#15151f] p-4 transition hover:bg-[#1a1a2e]"
        >
          <span className="text-gray-500 text-sm w-8 text-right">{i + 1}</span>
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-lg">
            {track.genre?.charAt(0) ?? '♪'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{track.title}</p>
            <p className="text-sm text-gray-400 truncate">{track.genre ?? 'Unknown genre'}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm text-gray-400">{formatDuration(track.duration)}</p>
            <p className="text-xs text-gray-500">{formatPlays(track.playCount ?? 0)} plays</p>
          </div>
        </div>
      ))}
      {(!tracks || tracks.length === 0) && (
        <p className="text-gray-500 text-center py-8">No tracks yet.</p>
      )}
    </div>
  );
}

function EventsSection() {
  const { data: events, isLoading } = trpc.events.list.useQuery({
    limit: 20,
    status: 'published',
  });

  if (isLoading) return <LoadingState />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {events?.map((event) => (
        <div
          key={event.id}
          className="rounded-2xl bg-[#15151f] p-6 transition hover:bg-[#1a1a2e]"
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
            </div>
            <span className="text-xs bg-brand-600/20 text-brand-400 px-3 py-1 rounded-full">
              {event.status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            {event.capacity && <span>{event.capacity.toLocaleString()} cap</span>}
            {event.timezone && <span>{event.timezone.split('/')[1]?.replace('_', ' ')}</span>}
          </div>
        </div>
      ))}
      {(!events || events.length === 0) && (
        <p className="text-gray-500 text-center py-8 col-span-2">No upcoming events.</p>
      )}
    </div>
  );
}

function MarketplaceSection() {
  const { data: listings, isLoading } = trpc.marketplace.listItems.useQuery({ limit: 20 });

  if (isLoading) return <LoadingState />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings?.map((listing) => (
        <div
          key={listing.id}
          className="rounded-2xl bg-[#15151f] p-6 transition hover:bg-[#1a1a2e]"
        >
          <div className="w-full h-32 rounded-xl bg-gradient-to-br from-brand-800 to-brand-950 flex items-center justify-center text-3xl mb-4">
            {categoryEmoji(listing.category)}
          </div>
          <h3 className="font-bold mb-1 truncate">{listing.title}</h3>
          <p className="text-sm text-gray-400 line-clamp-2 mb-3">{listing.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-brand-400">
              ${(listing.price / 100).toFixed(2)}
            </span>
            <span className="text-xs bg-brand-600/20 text-brand-400 px-3 py-1 rounded-full">
              {listing.category.replace('_', ' ')}
            </span>
          </div>
        </div>
      ))}
      {(!listings || listings.length === 0) && (
        <p className="text-gray-500 text-center py-8 col-span-3">No listings yet.</p>
      )}
    </div>
  );
}

function ArticlesSection() {
  const { data: articles, isLoading } = trpc.articles.list.useQuery({ limit: 20 });

  if (isLoading) return <LoadingState />;

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

function LoadingState() {
  return (
    <div className="flex justify-center py-12">
      <div className="animate-pulse text-gray-400">Loading...</div>
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
