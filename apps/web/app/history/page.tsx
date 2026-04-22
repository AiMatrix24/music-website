'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

type FilterTab = 'all' | 'tracks' | 'podcasts';

interface HistoryTrack {
  id: string;
  title: string;
  creator: string;
  genre: string;
  playedAt: Date;
  playCount: number;
  type: 'track' | 'podcast';
}

const mockHistory: HistoryTrack[] = [
  { id: '1', title: 'Neon Pulse', creator: 'SYNTHEX', genre: 'Synthwave', playedAt: new Date(Date.now() - 1000 * 60 * 20), playCount: 14, type: 'track' },
  { id: '2', title: 'Midnight Protocol', creator: 'DataStream', genre: 'Electronic', playedAt: new Date(Date.now() - 1000 * 60 * 45), playCount: 8, type: 'track' },
  { id: '3', title: 'The Future of Music Distribution', creator: 'Indie Talks', genre: 'Podcast', playedAt: new Date(Date.now() - 1000 * 60 * 90), playCount: 1, type: 'podcast' },
  { id: '4', title: 'Dissolve', creator: 'Pale Waves', genre: 'Indie Rock', playedAt: new Date(Date.now() - 1000 * 60 * 60 * 5), playCount: 22, type: 'track' },
  { id: '5', title: 'Ghost Signal', creator: 'VoidRunner', genre: 'Post-Punk', playedAt: new Date(Date.now() - 1000 * 60 * 60 * 8), playCount: 5, type: 'track' },
  { id: '6', title: 'Lo-fi Beats Session #47', creator: 'ChillHop Collective', genre: 'Lo-fi', playedAt: new Date(Date.now() - 1000 * 60 * 60 * 26), playCount: 3, type: 'track' },
  { id: '7', title: 'Cascade', creator: 'Echofault', genre: 'Ambient', playedAt: new Date(Date.now() - 1000 * 60 * 60 * 28), playCount: 11, type: 'track' },
  { id: '8', title: 'Breaking Down Web3 Audio', creator: 'Decentralized FM', genre: 'Podcast', playedAt: new Date(Date.now() - 1000 * 60 * 60 * 30), playCount: 2, type: 'podcast' },
  { id: '9', title: 'Voltage', creator: 'Crimson Wire', genre: 'Electronic', playedAt: new Date(Date.now() - 1000 * 60 * 60 * 50), playCount: 7, type: 'track' },
  { id: '10', title: 'Paper Thin', creator: 'The Satellites', genre: 'Alternative', playedAt: new Date(Date.now() - 1000 * 60 * 60 * 72), playCount: 19, type: 'track' },
  { id: '11', title: 'Deep Focus Mix', creator: 'Ambient Works', genre: 'Ambient', playedAt: new Date(Date.now() - 1000 * 60 * 60 * 96), playCount: 31, type: 'track' },
  { id: '12', title: 'Rust & Gold', creator: 'Desert Haze', genre: 'Indie Rock', playedAt: new Date(Date.now() - 1000 * 60 * 60 * 120), playCount: 4, type: 'track' },
  { id: '13', title: 'Creator Rights Roundtable', creator: 'MusicBiz Pod', genre: 'Podcast', playedAt: new Date(Date.now() - 1000 * 60 * 60 * 144), playCount: 1, type: 'podcast' },
  { id: '14', title: 'Refraction', creator: 'Glasspoint', genre: 'Synthwave', playedAt: new Date(Date.now() - 1000 * 60 * 60 * 168), playCount: 9, type: 'track' },
  { id: '15', title: 'Tremor', creator: 'Bassweight', genre: 'Electronic', playedAt: new Date(Date.now() - 1000 * 60 * 60 * 200), playCount: 16, type: 'track' },
];

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function groupByTime(tracks: HistoryTrack[]): Record<string, HistoryTrack[]> {
  const groups: Record<string, HistoryTrack[]> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Earlier: [],
  };
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekStart = new Date(todayStart.getTime() - 7 * 86400000);

  tracks.forEach((t) => {
    if (t.playedAt >= todayStart) groups.Today.push(t);
    else if (t.playedAt >= yesterdayStart) groups.Yesterday.push(t);
    else if (t.playedAt >= weekStart) groups['This Week'].push(t);
    else groups.Earlier.push(t);
  });
  return groups;
}

export default function HistoryPage() {
  const { status } = useSession();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [cleared, setCleared] = useState(false);

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl mb-2">&#128368;</p>
        <h1 className="text-2xl font-bold mb-2">Listening History</h1>
        <p className="text-gray-400">Sign in to view your listening history.</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition mt-4">
          Sign In
        </Link>
      </div>
    );
  }

  const totalMinutes = mockHistory.reduce((sum, t) => sum + t.playCount * 3.5, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = Math.round(totalMinutes % 60);

  const filtered = cleared
    ? []
    : mockHistory.filter((t) => {
        if (filter === 'tracks') return t.type === 'track';
        if (filter === 'podcasts') return t.type === 'podcast';
        return true;
      });

  const grouped = groupByTime(filtered);

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'tracks', label: 'Tracks' },
    { id: 'podcasts', label: 'Podcasts' },
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
          <div>
            <h1 className="text-3xl font-bold mb-1">Listening History</h1>
            {!cleared && (
              <p className="text-gray-400 text-sm">
                Total listening time: <span className="text-white font-semibold">{totalHours}h {remainingMinutes}m</span> across {mockHistory.length} tracks
              </p>
            )}
          </div>
          {!cleared && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="self-start px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-600 transition text-sm"
            >
              Clear History
            </button>
          )}
        </div>

        {/* Clear confirmation modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#15151f] border border-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-bold mb-2">Clear Listening History?</h3>
              <p className="text-gray-400 text-sm mb-6">This will permanently remove all your listening history. This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setCleared(true); setShowClearConfirm(false); }}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 transition"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-8">
          {filterTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                filter === t.id ? 'bg-red-600 text-white' : 'bg-[#15151f] text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* History list grouped */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">&#128368;</p>
            <h2 className="text-xl font-bold mb-2">{cleared ? 'History Cleared' : 'No items found'}</h2>
            <p className="text-gray-400">{cleared ? 'Your listening history has been cleared.' : 'No listening history matches this filter.'}</p>
          </div>
        ) : (
          Object.entries(grouped).map(([group, tracks]) =>
            tracks.length > 0 ? (
              <div key={group} className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{group}</h2>
                <div className="space-y-1">
                  {tracks.map((track) => (
                    <Link
                      key={track.id}
                      href={`/track/${track.id}`}
                      className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-[#15151f] transition group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600/30 to-purple-600/30 flex items-center justify-center text-sm flex-shrink-0">
                        {track.type === 'podcast' ? '&#127897;' : '&#9835;'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate group-hover:text-red-400 transition">{track.title}</p>
                        <p className="text-sm text-gray-400 truncate">{track.creator}</p>
                      </div>
                      <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-red-600/10 text-red-400 text-xs font-medium">
                        {track.genre}
                      </span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{track.playCount}x played</span>
                      <span className="text-xs text-gray-600 whitespace-nowrap w-16 text-right">{timeAgo(track.playedAt)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null
          )
        )}
      </div>
    </div>
  );
}
