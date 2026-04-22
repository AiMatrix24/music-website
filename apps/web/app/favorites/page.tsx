'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

type FavTab = 'tracks' | 'events' | 'listings';
type SortOption = 'recent' | 'alpha' | 'played';

interface FavTrack {
  id: string;
  title: string;
  creator: string;
  genre: string;
  addedAt: string;
  playCount: number;
}

interface FavEvent {
  id: string;
  title: string;
  venue: string;
  date: string;
  month: string;
  day: string;
  price: string;
}

interface FavListing {
  id: string;
  title: string;
  seller: string;
  price: string;
  image: string;
  category: string;
}

const mockTracks: FavTrack[] = [
  { id: '1', title: 'Neon Pulse', creator: 'SYNTHEX', genre: 'Synthwave', addedAt: '2 days ago', playCount: 14 },
  { id: '2', title: 'Midnight Protocol', creator: 'DataStream', genre: 'Electronic', addedAt: '3 days ago', playCount: 8 },
  { id: '3', title: 'Dissolve', creator: 'Pale Waves', genre: 'Indie Rock', addedAt: '5 days ago', playCount: 22 },
  { id: '4', title: 'Ghost Signal', creator: 'VoidRunner', genre: 'Post-Punk', addedAt: '1 week ago', playCount: 5 },
  { id: '5', title: 'Cascade', creator: 'Echofault', genre: 'Ambient', addedAt: '1 week ago', playCount: 11 },
  { id: '6', title: 'Voltage', creator: 'Crimson Wire', genre: 'Electronic', addedAt: '2 weeks ago', playCount: 7 },
  { id: '7', title: 'Paper Thin', creator: 'The Satellites', genre: 'Alternative', addedAt: '2 weeks ago', playCount: 19 },
  { id: '8', title: 'Refraction', creator: 'Glasspoint', genre: 'Synthwave', addedAt: '3 weeks ago', playCount: 9 },
];

const mockEvents: FavEvent[] = [
  { id: '1', title: 'SYNTHEX Live at The Warehouse', venue: 'The Warehouse, Brooklyn', date: 'Apr 15, 2026', month: 'APR', day: '15', price: '$25' },
  { id: '2', title: 'Indie Nights: Spring Edition', venue: 'Mercury Lounge, NYC', date: 'Apr 22, 2026', month: 'APR', day: '22', price: '$18' },
  { id: '3', title: 'Electronic Music Festival 2026', venue: 'Pier 36, Manhattan', date: 'May 10, 2026', month: 'MAY', day: '10', price: '$65' },
  { id: '4', title: 'Ambient Soundscapes Exhibition', venue: 'Gallery 263, Boston', date: 'Jun 3, 2026', month: 'JUN', day: '03', price: 'Free' },
];

const mockListings: FavListing[] = [
  { id: '1', title: 'Limited Edition Vinyl - Neon Pulse', seller: 'SYNTHEX Official', price: '$34.99', image: '&#127926;', category: 'Vinyl' },
  { id: '2', title: 'Signed Poster - Indie Nights Tour', seller: 'MerchDirect', price: '$19.99', image: '&#127912;', category: 'Merch' },
  { id: '3', title: 'Studio Headphones Pro X4', seller: 'AudioGear', price: '$149.00', image: '&#127911;', category: 'Gear' },
];

export default function FavoritesPage() {
  const { status } = useSession();
  const [tab, setTab] = useState<FavTab>('tracks');
  const [sort, setSort] = useState<SortOption>('recent');
  const [removedTracks, setRemovedTracks] = useState<string[]>([]);
  const [removedEvents, setRemovedEvents] = useState<string[]>([]);
  const [removedListings, setRemovedListings] = useState<string[]>([]);

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl mb-2">&#10084;&#65039;</p>
        <h1 className="text-2xl font-bold mb-2">Your Favorites</h1>
        <p className="text-gray-400">Sign in to see your saved tracks, events, and listings.</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition mt-4">
          Sign In
        </Link>
      </div>
    );
  }

  const tracks = mockTracks.filter((t) => !removedTracks.includes(t.id));
  const events = mockEvents.filter((e) => !removedEvents.includes(e.id));
  const listings = mockListings.filter((l) => !removedListings.includes(l.id));

  const sortedTracks = [...tracks].sort((a, b) => {
    if (sort === 'alpha') return a.title.localeCompare(b.title);
    if (sort === 'played') return b.playCount - a.playCount;
    return 0; // 'recent' keeps default order
  });

  const tabs: { id: FavTab; label: string; count: number }[] = [
    { id: 'tracks', label: 'Tracks', count: tracks.length },
    { id: 'events', label: 'Events', count: events.length },
    { id: 'listings', label: 'Listings', count: listings.length },
  ];

  const sortOptions: { id: SortOption; label: string }[] = [
    { id: 'recent', label: 'Recently Added' },
    { id: 'alpha', label: 'Alphabetical' },
    { id: 'played', label: 'Most Played' },
  ];

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back nav */}
        <Link href="/library" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Library
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">Favorites</h1>
          <div className="flex items-center gap-3">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-4 py-2 rounded-xl bg-[#15151f] border border-gray-800 text-sm text-gray-300 focus:border-red-600 focus:outline-none transition appearance-none"
            >
              {sortOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <button className="px-4 py-2 rounded-xl border border-gray-800 text-sm text-gray-400 hover:text-white hover:border-gray-700 transition">
              Export Favorites
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                tab === t.id ? 'bg-red-600 text-white' : 'bg-[#15151f] text-gray-400 hover:text-white'
              }`}
            >
              {t.label} <span className="ml-1 opacity-70">({t.count})</span>
            </button>
          ))}
        </div>

        {/* Tracks Tab */}
        {tab === 'tracks' && (
          sortedTracks.length === 0 ? (
            <EmptyState icon="&#9835;" title="No favorite tracks yet" description="Tap the heart icon on any track to save it here." actionLabel="Explore Music" actionHref="/explore" />
          ) : (
            <div className="space-y-1">
              {sortedTracks.map((track) => (
                <div key={track.id} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-[#15151f] transition group">
                  <Link href={`/track/${track.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600/30 to-purple-600/30 flex items-center justify-center text-sm flex-shrink-0">
                      &#9835;
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate group-hover:text-red-400 transition">{track.title}</p>
                      <p className="text-sm text-gray-400 truncate">{track.creator}</p>
                    </div>
                    <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-red-600/10 text-red-400 text-xs font-medium">
                      {track.genre}
                    </span>
                    <span className="text-xs text-gray-500">{track.addedAt}</span>
                  </Link>
                  <button className="text-red-500 hover:text-red-400 transition flex-shrink-0" title="Favorited">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                  </button>
                  <button
                    onClick={() => setRemovedTracks((prev) => [...prev, track.id])}
                    className="text-gray-600 hover:text-red-400 transition flex-shrink-0"
                    title="Remove from favorites"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {/* Events Tab */}
        {tab === 'events' && (
          events.length === 0 ? (
            <EmptyState icon="&#127915;" title="No saved events" description="Save upcoming events to keep track of shows you want to attend." actionLabel="Browse Events" actionHref="/event" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {events.map((event) => (
                <div key={event.id} className="bg-[#15151f] border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition group">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-red-600/10 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-red-400 uppercase">{event.month}</span>
                      <span className="text-lg font-black text-white leading-none">{event.day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate group-hover:text-red-400 transition">{event.title}</h3>
                      <p className="text-sm text-gray-400 truncate">{event.venue}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-semibold text-red-400">{event.price}</span>
                        <button
                          onClick={() => setRemovedEvents((prev) => [...prev, event.id])}
                          className="text-xs text-gray-500 hover:text-red-400 transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Listings Tab */}
        {tab === 'listings' && (
          listings.length === 0 ? (
            <EmptyState icon="&#128722;" title="No saved listings" description="Browse the marketplace and save items you're interested in." actionLabel="Browse Marketplace" actionHref="/marketplace" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {listings.map((listing) => (
                <div key={listing.id} className="bg-[#15151f] border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition group">
                  <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-red-600/10 to-purple-600/10 flex items-center justify-center text-5xl mb-4">
                    <span dangerouslySetInnerHTML={{ __html: listing.image }} />
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-600/10 text-red-400 font-medium">{listing.category}</span>
                  <h3 className="font-semibold text-white mt-2 truncate group-hover:text-red-400 transition">{listing.title}</h3>
                  <p className="text-sm text-gray-400 truncate">{listing.seller}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-white">{listing.price}</span>
                    <button
                      onClick={() => setRemovedListings((prev) => [...prev, listing.id])}
                      className="text-xs text-gray-500 hover:text-red-400 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description, actionLabel, actionHref }: { icon: string; title: string; description: string; actionLabel: string; actionHref: string }) {
  return (
    <div className="text-center py-20">
      <p className="text-4xl mb-4"><span dangerouslySetInnerHTML={{ __html: icon }} /></p>
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-gray-400 mb-6">{description}</p>
      <Link href={actionHref} className="px-6 py-3 rounded-full bg-red-600 text-white font-semibold hover:bg-red-500 transition">
        {actionLabel}
      </Link>
    </div>
  );
}
