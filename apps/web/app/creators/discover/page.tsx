'use client';

import Link from 'next/link';
import { useState } from 'react';

const CREATORS = [
  { id: 1, name: 'Aria Moon', genre: 'Electronic', city: 'Los Angeles', followers: 8200, tracks: 24, plays: 145000, trending: true, availableForShows: true, tags: ['Electronic', 'Ambient', 'Lo-Fi'], initial: 'A', color: 'from-purple-500 to-pink-500' },
  { id: 2, name: 'Marcus Gray', genre: 'Hip Hop', city: 'Atlanta', followers: 3400, tracks: 18, plays: 89000, trending: true, availableForShows: true, tags: ['Hip Hop', 'Trap', 'R&B'], initial: 'M', color: 'from-red-500 to-orange-500' },
  { id: 3, name: 'Sage & Ivy', genre: 'Indie Folk', city: 'Portland', followers: 12100, tracks: 31, plays: 210000, trending: true, availableForShows: false, tags: ['Indie', 'Folk', 'Acoustic'], initial: 'S', color: 'from-green-500 to-teal-500' },
  { id: 4, name: 'KVLT', genre: 'Electronic', city: 'Detroit', followers: 950, tracks: 12, plays: 32000, trending: false, availableForShows: true, tags: ['Electronic', 'Techno'], initial: 'K', color: 'from-blue-500 to-indigo-500' },
  { id: 5, name: 'Juno Blaze', genre: 'Pop', city: 'Nashville', followers: 22000, tracks: 15, plays: 380000, trending: false, availableForShows: true, tags: ['Pop', 'Dance', 'Synth'], initial: 'J', color: 'from-yellow-500 to-red-500' },
  { id: 6, name: 'The Velvet Sons', genre: 'Rock', city: 'Chicago', followers: 5600, tracks: 22, plays: 120000, trending: false, availableForShows: true, tags: ['Rock', 'Garage', 'Punk'], initial: 'V', color: 'from-red-600 to-pink-600' },
  { id: 7, name: 'Nia Soulfire', genre: 'R&B', city: 'Houston', followers: 7800, tracks: 19, plays: 165000, trending: false, availableForShows: false, tags: ['R&B', 'Soul', 'Neo-Soul'], initial: 'N', color: 'from-pink-500 to-purple-500' },
  { id: 8, name: 'Flux State', genre: 'Electronic', city: 'Denver', followers: 1200, tracks: 28, plays: 45000, trending: false, availableForShows: true, tags: ['Electronic', 'IDM', 'Experimental'], initial: 'F', color: 'from-cyan-500 to-blue-500' },
  { id: 9, name: 'Cassidy Wells', genre: 'Country', city: 'Austin', followers: 4500, tracks: 14, plays: 95000, trending: false, availableForShows: true, tags: ['Country', 'Americana', 'Folk'], initial: 'C', color: 'from-amber-500 to-orange-500' },
  { id: 10, name: 'Paper Tigers', genre: 'Indie Rock', city: 'Brooklyn', followers: 18500, tracks: 20, plays: 290000, trending: false, availableForShows: true, tags: ['Indie', 'Rock', 'Alternative'], initial: 'P', color: 'from-emerald-500 to-lime-500' },
  { id: 11, name: 'DJ Phantom', genre: 'Hip Hop', city: 'Miami', followers: 650, tracks: 35, plays: 28000, trending: false, availableForShows: true, tags: ['Hip Hop', 'Beats', 'Lo-Fi'], initial: 'D', color: 'from-gray-500 to-blue-500' },
  { id: 12, name: 'Luna Strings', genre: 'Jazz', city: 'New Orleans', followers: 2900, tracks: 16, plays: 72000, trending: false, availableForShows: false, tags: ['Jazz', 'Classical', 'Fusion'], initial: 'L', color: 'from-indigo-500 to-violet-500' },
];

const GENRE_OPTIONS = ['All', 'Electronic', 'Hip Hop', 'Rock', 'Pop', 'R&B', 'Jazz', 'Indie Rock', 'Indie Folk', 'Country'];
const FOLLOWER_RANGES = [
  { label: 'All', min: 0, max: Infinity },
  { label: '0-1K', min: 0, max: 1000 },
  { label: '1K-10K', min: 1000, max: 10000 },
  { label: '10K-50K', min: 10000, max: 50000 },
  { label: '50K+', min: 50000, max: Infinity },
];
const SORT_OPTIONS = ['Trending', 'Newest', 'Most Plays'];

const TRENDING_GENRES = [
  { genre: 'Electronic', count: 1240 },
  { genre: 'Hip Hop', count: 980 },
  { genre: 'Indie Rock', count: 870 },
  { genre: 'R&B / Soul', count: 650 },
  { genre: 'Lo-Fi', count: 520 },
];

function formatNumber(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

export default function CreatorsDiscoverPage() {
  const [genreFilter, setGenreFilter] = useState('All');
  const [followerFilter, setFollowerFilter] = useState(0);
  const [sortBy, setSortBy] = useState('Trending');
  const [locationSearch, setLocationSearch] = useState('');

  const filtered = CREATORS
    .filter((c) => {
      if (genreFilter !== 'All' && c.genre !== genreFilter) return false;
      const range = FOLLOWER_RANGES[followerFilter];
      if (range && (c.followers < range.min || c.followers > range.max)) return false;
      if (locationSearch && !c.city.toLowerCase().includes(locationSearch.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'Trending') return (b.trending ? 1 : 0) - (a.trending ? 1 : 0) || b.plays - a.plays;
      if (sortBy === 'Most Plays') return b.plays - a.plays;
      return b.id - a.id; // Newest
    });

  return (
    <div className="min-h-screen bg-brand-950 text-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-red-950 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Home
          </Link>
          <h1 className="mt-4 text-4xl font-bold md:text-5xl">
            <span className="mr-3">⭐</span>Discover Rising Talent
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            Find your next opener, collaborator, or showcase creator
          </p>
          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <span className="text-red-400">🏟️</span>
              <span className="text-gray-300">Venues looking for creators</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <span className="text-red-400">🎤</span>
              <span className="text-gray-300">Super creators finding openers</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <span className="text-red-400">🎧</span>
              <span className="text-gray-300">Fans discovering new music</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-brand-950/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4">
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#15151f] px-4 py-2.5 text-sm text-white focus:border-red-600 focus:outline-none"
          >
            {GENRE_OPTIONS.map((g) => (
              <option key={g} value={g}>{g === 'All' ? 'All Genres' : g}</option>
            ))}
          </select>
          <div className="relative min-w-[160px]">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
            <input
              type="text"
              placeholder="City..."
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#15151f] py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-red-600 focus:outline-none"
            />
          </div>
          <select
            value={followerFilter}
            onChange={(e) => setFollowerFilter(Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-[#15151f] px-4 py-2.5 text-sm text-white focus:border-red-600 focus:outline-none"
          >
            {FOLLOWER_RANGES.map((r, i) => (
              <option key={i} value={i}>{r.label === 'All' ? 'All Followers' : r.label + ' followers'}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#15151f] px-4 py-2.5 text-sm text-white focus:border-red-600 focus:outline-none"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-10 lg:flex-row">
          {/* Main Grid */}
          <div className="flex-1">
            <p className="mb-6 text-sm text-gray-400">{filtered.length} creator{filtered.length !== 1 ? 's' : ''} found</p>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((creator) => (
                <div key={creator.id} className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#15151f] transition hover:border-red-600/50">
                  {/* Trending Badge */}
                  {creator.trending && (
                    <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
                      Trending
                    </div>
                  )}

                  <div className="p-5">
                    {/* Avatar & Info */}
                    <div className="flex items-start gap-4">
                      <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${creator.color} text-lg font-bold text-white`}>
                        {creator.initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-lg font-bold group-hover:text-red-400 transition">{creator.name}</h3>
                          {creator.availableForShows && (
                            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-green-500" title="Available for shows" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{creator.genre} &middot; {creator.city}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-4 flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-white">{formatNumber(creator.followers)}</p>
                        <p className="text-xs text-gray-500">Followers</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-white">{creator.tracks}</p>
                        <p className="text-xs text-gray-500">Tracks</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-white">{formatNumber(creator.plays)}</p>
                        <p className="text-xs text-gray-500">Plays</p>
                      </div>
                      <div className="ml-auto flex items-center gap-1 text-gray-400" title="Audio preview">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                      </div>
                    </div>

                    {/* Genre Tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {creator.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300">{tag}</span>
                      ))}
                    </div>

                    {creator.availableForShows && (
                      <p className="mt-3 flex items-center gap-1.5 text-xs text-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                        Available for shows
                      </p>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      <Link
                        href={`/artist/${creator.id}`}
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-center text-sm font-medium text-gray-300 transition hover:bg-white/10"
                      >
                        View Profile
                      </Link>
                      <Link
                        href="/booking"
                        className="flex-1 rounded-lg bg-red-600 py-2 text-center text-sm font-semibold text-white transition hover:bg-red-700"
                      >
                        Book Creator
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="py-20 text-center text-gray-400">
                <p className="text-lg">No creators match your filters</p>
                <p className="mt-2 text-sm">Try adjusting your search criteria</p>
              </div>
            )}

            {/* Apply CTA */}
            <div className="mt-16 rounded-2xl border border-white/10 bg-gradient-to-r from-red-950/50 to-brand-900 p-8 text-center">
              <h2 className="text-2xl font-bold">Are You an Emerging Creator?</h2>
              <p className="mx-auto mt-2 max-w-lg text-gray-300">
                Get discovered by venues, established creators, and new fans. Apply to be featured on OPYNX and take your music career to the next level.
              </p>
              <Link
                href="/apply"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700"
              >
                Apply to be Featured
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-72">
            <div className="sticky top-20 rounded-xl border border-white/10 bg-[#15151f] p-5">
              <h3 className="text-lg font-bold">Top Genres Right Now</h3>
              <p className="mt-1 text-xs text-gray-400">Trending genres by creator count</p>
              <div className="mt-4 space-y-3">
                {TRENDING_GENRES.map((tg, i) => (
                  <div key={tg.genre} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600/20 text-xs font-bold text-red-400">{i + 1}</span>
                      <span className="text-sm text-gray-300">{tg.genre}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatNumber(tg.count)} creators</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
