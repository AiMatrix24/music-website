'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

// --- Types ---
interface Contributor {
  name: string;
  initial: string;
  role: 'Owner' | 'Editor' | 'Viewer';
}

interface PlaylistTrack {
  id: string;
  title: string;
  artist: string;
  addedBy: string;
  duration: string;
  upvotes: number;
  downvotes: number;
}

interface CollabPlaylist {
  id: number;
  title: string;
  description: string;
  trackCount: number;
  contributors: Contributor[];
  visibility: 'public' | 'private' | 'invite-only';
}

// --- Mock Data ---
const PLAYLISTS: CollabPlaylist[] = [
  {
    id: 1, title: 'Late Night Vibes', description: 'Chill tracks for after-hours listening',
    trackCount: 24, visibility: 'public',
    contributors: [
      { name: 'You', initial: 'Y', role: 'Owner' },
      { name: 'ChromeVox', initial: 'C', role: 'Editor' },
      { name: 'NightBloom', initial: 'N', role: 'Editor' },
    ],
  },
  {
    id: 2, title: 'Workout Bangers', description: 'High energy electronic for the gym',
    trackCount: 18, visibility: 'invite-only',
    contributors: [
      { name: 'BeatDropper', initial: 'B', role: 'Owner' },
      { name: 'You', initial: 'Y', role: 'Editor' },
    ],
  },
  {
    id: 3, title: 'Indie Discoveries', description: 'Community-curated indie gems',
    trackCount: 42, visibility: 'public',
    contributors: [
      { name: 'MusicFan99', initial: 'M', role: 'Owner' },
      { name: 'You', initial: 'Y', role: 'Viewer' },
      { name: 'SynthLover', initial: 'S', role: 'Editor' },
      { name: 'GigGoer', initial: 'G', role: 'Editor' },
    ],
  },
];

const ACTIVE_TRACKS: PlaylistTrack[] = [
  { id: 'ct1', title: 'Midnight Drive', artist: 'ChromeVox', addedBy: 'You', duration: '4:12', upvotes: 8, downvotes: 1 },
  { id: 'ct2', title: 'Neon Skyline', artist: 'SynthLord', addedBy: 'ChromeVox', duration: '3:45', upvotes: 12, downvotes: 0 },
  { id: 'ct3', title: 'Crystal Waves', artist: 'DeepSea', addedBy: 'NightBloom', duration: '5:30', upvotes: 6, downvotes: 2 },
  { id: 'ct4', title: 'Low Frequency', artist: 'SubZero', addedBy: 'You', duration: '3:58', upvotes: 10, downvotes: 1 },
  { id: 'ct5', title: 'Velvet Echo', artist: 'DreamWeaver', addedBy: 'ChromeVox', duration: '4:48', upvotes: 5, downvotes: 0 },
  { id: 'ct6', title: 'Ghost Signal', artist: 'VoidWalker', addedBy: 'NightBloom', duration: '3:22', upvotes: 3, downvotes: 3 },
];

const SEARCH_RESULTS = [
  { id: 's1', title: 'Solar Wind', artist: 'CosmicDrift' },
  { id: 's2', title: 'Pixel Rain', artist: 'BitCrush' },
  { id: 's3', title: 'Concrete Garden', artist: 'UrbanFlora' },
];

const CONTRIBUTORS: Contributor[] = [
  { name: 'You', initial: 'Y', role: 'Owner' },
  { name: 'ChromeVox', initial: 'C', role: 'Editor' },
  { name: 'NightBloom', initial: 'N', role: 'Editor' },
];

export default function CollaborativePlaylistPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const [activePlaylist, setActivePlaylist] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [trackVotes, setTrackVotes] = useState<Record<string, { up: number; down: number }>>(
    Object.fromEntries(ACTIVE_TRACKS.map((t) => [t.id, { up: t.upvotes, down: t.downvotes }]))
  );
  const [sortByVotes, setSortByVotes] = useState(false);

  // Create form state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formVisibility, setFormVisibility] = useState<'public' | 'private' | 'invite-only'>('public');
  const [formMaxContributors, setFormMaxContributors] = useState('10');

  if (status === 'loading') {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {[1, 2, 3].map((i) => <div key={i} className="rounded-2xl bg-[#15151f] h-32 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-black mb-4">Sign In Required</h1>
          <p className="text-gray-400 mb-6">Sign in to create and join collaborative playlists.</p>
          <Link href="/auth/login" className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    toast(`Playlist "${formTitle}" created!`, 'success');
    setShowCreateForm(false);
    setFormTitle('');
    setFormDesc('');
  };

  const handleCopyLink = () => {
    toast('Share link copied to clipboard!', 'success');
  };

  const handleVote = (trackId: string, direction: 'up' | 'down') => {
    setTrackVotes((prev) => ({
      ...prev,
      [trackId]: {
        ...prev[trackId],
        [direction]: (prev[trackId]?.[direction] ?? 0) + 1,
      },
    }));
  };

  const sortedTracks = sortByVotes
    ? [...ACTIVE_TRACKS].sort((a, b) => {
        const scoreA = (trackVotes[a.id]?.up ?? 0) - (trackVotes[a.id]?.down ?? 0);
        const scoreB = (trackVotes[b.id]?.up ?? 0) - (trackVotes[b.id]?.down ?? 0);
        return scoreB - scoreA;
      })
    : ACTIVE_TRACKS;

  const ROLE_COLORS: Record<string, string> = {
    Owner: 'bg-red-600/20 text-red-400',
    Editor: 'bg-blue-600/20 text-blue-400',
    Viewer: 'bg-gray-600/20 text-gray-400',
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          &larr; Back to Home
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black mb-2">Collaborative Playlists</h1>
            <p className="text-gray-400">Create and curate playlists together.</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition self-start"
          >
            + Create Playlist
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="rounded-2xl bg-[#15151f] p-6 mb-8 border border-red-600/30">
            <h2 className="text-xl font-bold mb-4">Create Collaborative Playlist</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Playlist name..."
                  className="w-full px-4 py-2.5 rounded-lg bg-brand-950 border border-white/10 focus:border-red-600 outline-none transition text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="What is this playlist about?"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg bg-brand-950 border border-white/10 focus:border-red-600 outline-none transition text-white resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Visibility</label>
                  <select
                    value={formVisibility}
                    onChange={(e) => setFormVisibility(e.target.value as typeof formVisibility)}
                    className="w-full px-4 py-2.5 rounded-lg bg-brand-950 border border-white/10 focus:border-red-600 outline-none transition text-white"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="invite-only">Invite Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max Contributors</label>
                  <input
                    type="number"
                    value={formMaxContributors}
                    onChange={(e) => setFormMaxContributors(e.target.value)}
                    min={2}
                    max={50}
                    className="w-full px-4 py-2.5 rounded-lg bg-brand-950 border border-white/10 focus:border-red-600 outline-none transition text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition">
                  Create
                </button>
                <button type="button" onClick={() => setShowCreateForm(false)} className="px-6 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 font-semibold transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Playlist List */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Your Collaborative Playlists</h2>
          <div className="space-y-4">
            {PLAYLISTS.map((pl) => (
              <button
                key={pl.id}
                onClick={() => setActivePlaylist(activePlaylist === pl.id ? null : pl.id)}
                className={`w-full text-left rounded-xl bg-[#15151f] p-5 hover:bg-[#1a1a2e] transition ${
                  activePlaylist === pl.id ? 'ring-2 ring-red-600' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">{pl.title}</h3>
                  <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-gray-400 capitalize">{pl.visibility}</span>
                </div>
                <p className="text-sm text-gray-400 mb-3">{pl.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {pl.contributors.map((c) => (
                        <div key={c.name} className="w-7 h-7 rounded-full bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center text-xs font-bold border-2 border-[#15151f]">
                          {c.initial}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{pl.contributors.length} contributors</span>
                  </div>
                  <span className="text-sm text-gray-500">{pl.trackCount} tracks</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Active Playlist View */}
        {activePlaylist !== null && (
          <section className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">{PLAYLISTS.find((p) => p.id === activePlaylist)?.title}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1.5 text-sm text-green-400">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    3 people editing now
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortByVotes(!sortByVotes)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    sortByVotes ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  Sort by Votes
                </button>
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 text-sm font-semibold transition flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  Copy Link
                </button>
              </div>
            </div>

            {/* Add Track Search */}
            <div className="relative mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(e.target.value.length > 0);
                }}
                placeholder="Search tracks to add..."
                className="w-full px-4 py-3 rounded-xl bg-[#15151f] border border-white/10 focus:border-red-600 outline-none transition text-white"
              />
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-[#1a1a2e] border border-white/10 overflow-hidden z-20 shadow-xl">
                  {SEARCH_RESULTS.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => {
                        toast(`Added "${result.title}" to playlist`, 'success');
                        setSearchQuery('');
                        setShowSearchResults(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition text-left"
                    >
                      <div>
                        <p className="font-semibold text-sm">{result.title}</p>
                        <p className="text-xs text-gray-400">{result.artist}</p>
                      </div>
                      <span className="text-xs text-red-500 font-semibold">+ Add</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Track List */}
            <div className="rounded-2xl bg-[#15151f] overflow-hidden mb-6">
              {sortedTracks.map((track, i) => {
                const votes = trackVotes[track.id] ?? { up: track.upvotes, down: track.downvotes };
                return (
                  <div key={track.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/5 last:border-b-0 hover:bg-[#1a1a2e] transition">
                    <span className="text-gray-500 text-sm w-6 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <Link href={`/track/${track.id}`} className="font-semibold truncate hover:text-red-500 transition block">
                        {track.title}
                      </Link>
                      <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                      <p className="text-xs text-gray-500">Added by {track.addedBy}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVote(track.id, 'up')}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-400 transition"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                        {votes.up}
                      </button>
                      <button
                        onClick={() => handleVote(track.id, 'down')}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                        {votes.down}
                      </button>
                    </div>
                    <span className="text-sm text-gray-400 w-12 text-right">{track.duration}</span>
                  </div>
                );
              })}
            </div>

            {/* Contributors */}
            <div className="rounded-2xl bg-[#15151f] p-5">
              <h3 className="text-lg font-bold mb-4">Contributors</h3>
              <div className="space-y-3">
                {CONTRIBUTORS.map((c) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center text-sm font-bold shrink-0">
                      {c.initial}
                    </div>
                    <span className="flex-1 font-semibold text-sm">{c.name}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${ROLE_COLORS[c.role]}`}>
                      {c.role}
                    </span>
                    {c.role !== 'Owner' && c.name !== 'You' && (
                      <button className="text-xs text-gray-500 hover:text-red-500 transition">Remove</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
