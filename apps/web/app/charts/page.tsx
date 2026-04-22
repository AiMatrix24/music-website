'use client';

import Link from 'next/link';
import { useState } from 'react';

type Tab = 'tracks' | 'creators' | 'trending';
type Period = 'today' | 'week' | 'month' | 'all';

const topTracks = [
  { id: 1, title: 'Midnight Protocol', creator: 'KAEL', genre: 'Electronic', plays: 2847193, change: 'NEW' },
  { id: 2, title: 'Velvet Chains', creator: 'Luna Voss', genre: 'R&B', plays: 2103847, change: '↑3' },
  { id: 3, title: 'Shatter', creator: 'DVRK MATTER', genre: 'Hip-Hop', plays: 1987234, change: '↑1' },
  { id: 4, title: 'Neon Skyline', creator: 'Aria Frost', genre: 'Synthwave', plays: 1856002, change: '↓1' },
  { id: 5, title: 'Burning Low', creator: 'The Koda', genre: 'Indie Rock', plays: 1743891, change: '—' },
  { id: 6, title: 'Ghost Frequency', creator: 'KAEL', genre: 'Electronic', plays: 1698234, change: '↑2' },
  { id: 7, title: 'Wildfire', creator: 'Sage & the Saints', genre: 'Alternative', plays: 1587112, change: '↓2' },
  { id: 8, title: 'Paper Crowns', creator: 'Mira Chen', genre: 'Pop', plays: 1423098, change: '↑5' },
  { id: 9, title: 'Low Tide', creator: 'Oceanic', genre: 'Lo-Fi', plays: 1389001, change: 'NEW' },
  { id: 10, title: 'Fracture Point', creator: 'DVRK MATTER', genre: 'Hip-Hop', plays: 1298456, change: '↓3' },
  { id: 11, title: 'Solar Flare', creator: 'Prism Collective', genre: 'Jazz Fusion', plays: 1187234, change: '↑1' },
  { id: 12, title: 'Echoes of You', creator: 'Luna Voss', genre: 'R&B', plays: 1098712, change: '—' },
  { id: 13, title: 'Static Bloom', creator: 'Hex Theory', genre: 'Post-Punk', plays: 987654, change: '↑4' },
  { id: 14, title: 'Terminal Bliss', creator: 'Aria Frost', genre: 'Synthwave', plays: 923471, change: '↓1' },
  { id: 15, title: 'Rust & Gold', creator: 'The Koda', genre: 'Indie Rock', plays: 876234, change: '↑2' },
];

const topArtists = [
  { id: 1, name: 'KAEL', followers: 487200, tracks: 34, genre: 'Electronic' },
  { id: 2, name: 'Luna Voss', followers: 412800, tracks: 28, genre: 'R&B' },
  { id: 3, name: 'DVRK MATTER', followers: 389100, tracks: 41, genre: 'Hip-Hop' },
  { id: 4, name: 'Aria Frost', followers: 356700, tracks: 22, genre: 'Synthwave' },
  { id: 5, name: 'The Koda', followers: 298400, tracks: 19, genre: 'Indie Rock' },
  { id: 6, name: 'Sage & the Saints', followers: 267300, tracks: 25, genre: 'Alternative' },
  { id: 7, name: 'Mira Chen', followers: 234100, tracks: 16, genre: 'Pop' },
  { id: 8, name: 'Oceanic', followers: 198700, tracks: 31, genre: 'Lo-Fi' },
  { id: 9, name: 'Prism Collective', followers: 176200, tracks: 12, genre: 'Jazz Fusion' },
  { id: 10, name: 'Hex Theory', followers: 154800, tracks: 20, genre: 'Post-Punk' },
  { id: 11, name: 'NOVA SYN', followers: 143200, tracks: 18, genre: 'Electronic' },
  { id: 12, name: 'Velvet Ember', followers: 128900, tracks: 14, genre: 'Soul' },
];

const trendingTracks = [
  { id: 1, title: 'Paper Crowns', creator: 'Mira Chen', plays: 1423098, growth: 342 },
  { id: 2, title: 'Midnight Protocol', creator: 'KAEL', plays: 2847193, growth: 278 },
  { id: 3, title: 'Low Tide', creator: 'Oceanic', plays: 1389001, growth: 215 },
  { id: 4, title: 'Static Bloom', creator: 'Hex Theory', plays: 987654, growth: 189 },
  { id: 5, title: 'Velvet Chains', creator: 'Luna Voss', plays: 2103847, growth: 156 },
  { id: 6, title: 'Ghost Frequency', creator: 'KAEL', plays: 1698234, growth: 134 },
  { id: 7, title: 'Rust & Gold', creator: 'The Koda', plays: 876234, growth: 121 },
  { id: 8, title: 'Shatter', creator: 'DVRK MATTER', plays: 1987234, growth: 98 },
  { id: 9, title: 'Solar Flare', creator: 'Prism Collective', plays: 1187234, growth: 87 },
  { id: 10, title: 'Burning Low', creator: 'The Koda', plays: 1743891, growth: 45 },
];

function formatPlays(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function getChangeColor(change: string): string {
  if (change === 'NEW') return 'text-red-400';
  if (change.startsWith('↑')) return 'text-green-400';
  if (change.startsWith('↓')) return 'text-red-500';
  return 'text-gray-500';
}

const genreColors: Record<string, string> = {
  Electronic: 'bg-purple-600/20 text-purple-400',
  'R&B': 'bg-pink-600/20 text-pink-400',
  'Hip-Hop': 'bg-orange-600/20 text-orange-400',
  Synthwave: 'bg-cyan-600/20 text-cyan-400',
  'Indie Rock': 'bg-yellow-600/20 text-yellow-400',
  Alternative: 'bg-green-600/20 text-green-400',
  Pop: 'bg-rose-600/20 text-rose-400',
  'Lo-Fi': 'bg-teal-600/20 text-teal-400',
  'Jazz Fusion': 'bg-amber-600/20 text-amber-400',
  'Post-Punk': 'bg-violet-600/20 text-violet-400',
  Soul: 'bg-red-600/20 text-red-400',
};

export default function ChartsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('tracks');
  const [period, setPeriod] = useState<Period>('week');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'tracks', label: 'Top Tracks' },
    { key: 'creators', label: 'Top Creators' },
    { key: 'trending', label: 'Trending This Week' },
  ];

  const periods: { key: Period; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Charts</h1>
        <p className="text-gray-400">See what&#39;s topping the leaderboard on OPYNX.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-red-600 text-white'
                  : 'bg-[#15151f] text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap ${
                period === p.key
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'tracks' && <TopTracksSection />}
      {activeTab === 'creators' && <TopArtistsSection />}
      {activeTab === 'trending' && <TrendingSection />}
    </div>
  );
}

function TopTracksSection() {
  return (
    <div className="space-y-2">
      {topTracks.map((track, i) => {
        const rank = i + 1;
        return (
          <div
            key={track.id}
            className="flex items-center gap-4 rounded-xl bg-[#15151f] p-4 transition hover:bg-[#1a1a2e] group"
          >
            <span className="w-8 text-right font-bold text-lg">
              {rank === 1 ? (
                <span className="text-2xl" title="Number 1">👑</span>
              ) : (
                <span className="text-gray-500">{rank}</span>
              )}
            </span>

            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-lg font-bold text-white/80">
              {track.genre.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{track.title}</p>
              <p className="text-sm text-gray-400 truncate">{track.creator}</p>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${genreColors[track.genre] ?? 'bg-gray-600/20 text-gray-400'}`}>
              {track.genre}
            </span>

            <div className="text-right hidden sm:block w-24">
              <p className="text-sm text-gray-300">{formatPlays(track.plays)} plays</p>
            </div>

            <span className={`text-sm font-semibold w-12 text-right ${getChangeColor(track.change)}`}>
              {track.change}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TopArtistsSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {topArtists.map((creator, i) => {
        const rank = i + 1;
        return (
          <Link
            key={creator.id}
            href={`/artist/${creator.id}`}
            className="relative rounded-xl bg-[#15151f] p-6 transition hover:bg-[#1a1a2e] group"
          >
            {/* Rank Badge */}
            <div className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              rank === 1 ? 'bg-yellow-500 text-black' :
              rank === 2 ? 'bg-gray-300 text-black' :
              rank === 3 ? 'bg-amber-700 text-white' :
              'bg-white/10 text-gray-400'
            }`}>
              {rank === 1 ? '👑' : rank}
            </div>

            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-2xl font-black text-white mb-4">
              {creator.name.charAt(0)}
            </div>

            <h3 className="font-bold text-lg mb-1">{creator.name}</h3>
            <p className="text-sm text-gray-400 mb-3">{creator.genre}</p>

            <div className="flex gap-4 text-sm">
              <span className="text-gray-300">
                <span className="font-semibold text-white">{formatFollowers(creator.followers)}</span>{' '}
                followers
              </span>
              <span className="text-gray-300">
                <span className="font-semibold text-white">{creator.tracks}</span>{' '}
                tracks
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function TrendingSection() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 mb-4">Tracks that gained the most plays in the last 7 days</p>
      {trendingTracks.map((track, i) => {
        const rank = i + 1;
        return (
          <div
            key={track.id}
            className="flex items-center gap-4 rounded-xl bg-[#15151f] p-4 transition hover:bg-[#1a1a2e]"
          >
            <span className="w-8 text-right font-bold text-lg">
              {rank === 1 ? (
                <span className="text-2xl">👑</span>
              ) : (
                <span className="text-gray-500">{rank}</span>
              )}
            </span>

            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-emerald-900 flex items-center justify-center text-lg font-bold text-white/80">
              ↑
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{track.title}</p>
              <p className="text-sm text-gray-400 truncate">{track.creator}</p>
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-sm text-gray-300">{formatPlays(track.plays)} plays</p>
            </div>

            <div className="flex items-center gap-1 bg-green-600/20 text-green-400 px-3 py-1.5 rounded-full text-sm font-semibold">
              <span>↑</span>
              <span>{track.growth}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
