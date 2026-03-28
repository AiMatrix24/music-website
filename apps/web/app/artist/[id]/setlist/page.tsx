'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useToast } from '@/app/components/Toast';

interface Track {
  id: string;
  title: string;
  duration: string;
  genre: string;
  durationSecs: number;
}

interface SetlistTrack extends Track {
  order: number;
}

interface VoteTrack {
  id: string;
  title: string;
  votes: number;
  voted: boolean;
}

const AVAILABLE_TRACKS: Track[] = [
  { id: 't1', title: 'Midnight Signal', duration: '3:34', genre: 'Synthwave', durationSecs: 214 },
  { id: 't2', title: 'Chrome Dreams', duration: '4:12', genre: 'Electronic', durationSecs: 252 },
  { id: 't3', title: 'Neon Rain', duration: '3:48', genre: 'Synthwave', durationSecs: 228 },
  { id: 't4', title: 'Electric Dusk', duration: '4:05', genre: 'Darkwave', durationSecs: 245 },
  { id: 't5', title: 'Vapor Trail', duration: '3:22', genre: 'Lo-fi', durationSecs: 202 },
  { id: 't6', title: 'Starlight Protocol', duration: '5:01', genre: 'Electronic', durationSecs: 301 },
  { id: 't7', title: 'Binary Sunset', duration: '3:55', genre: 'Synthwave', durationSecs: 235 },
  { id: 't8', title: 'Data Stream', duration: '4:28', genre: 'Techno', durationSecs: 268 },
  { id: 't9', title: 'Analog Heart', duration: '3:15', genre: 'Indie Electronic', durationSecs: 195 },
  { id: 't10', title: 'Phosphor Glow', duration: '4:40', genre: 'Ambient', durationSecs: 280 },
];

const INITIAL_VOTE_TRACKS: VoteTrack[] = [
  { id: 'v1', title: 'Midnight Signal', votes: 342, voted: false },
  { id: 'v2', title: 'Chrome Dreams', votes: 289, voted: false },
  { id: 'v3', title: 'Neon Rain', votes: 256, voted: false },
  { id: 'v4', title: 'Electric Dusk', votes: 198, voted: false },
  { id: 'v5', title: 'Binary Sunset', votes: 167, voted: false },
];

export default function SetlistBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [setlist, setSetlist] = useState<SetlistTrack[]>([]);
  const [voteTracks, setVoteTracks] = useState<VoteTrack[]>(INITIAL_VOTE_TRACKS);
  const [suggestion, setSuggestion] = useState('');

  const addToSetlist = (track: Track) => {
    if (setlist.find((s) => s.id === track.id)) {
      toast('Track already in setlist', 'info');
      return;
    }
    setSetlist((prev) => [...prev, { ...track, order: prev.length + 1 }]);
    toast(`Added "${track.title}"`, 'success');
  };

  const removeFromSetlist = (trackId: string) => {
    setSetlist((prev) =>
      prev.filter((s) => s.id !== trackId).map((s, i) => ({ ...s, order: i + 1 }))
    );
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setSetlist((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  const moveDown = (index: number) => {
    if (index === setlist.length - 1) return;
    setSetlist((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  const toggleVote = (voteId: string) => {
    setVoteTracks((prev) =>
      prev.map((v) =>
        v.id === voteId
          ? { ...v, voted: !v.voted, votes: v.voted ? v.votes - 1 : v.votes + 1 }
          : v
      )
    );
  };

  const submitSuggestion = () => {
    if (!suggestion.trim()) return;
    toast(`Suggestion submitted: "${suggestion}"`, 'success');
    setSuggestion('');
  };

  // Stats
  const totalDuration = setlist.reduce((acc, t) => acc + t.durationSecs, 0);
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  const genres = setlist.reduce<Record<string, number>>((acc, t) => {
    acc[t.genre] = (acc[t.genre] || 0) + 1;
    return acc;
  }, {});

  const topVoted = [...voteTracks].sort((a, b) => b.votes - a.votes)[0];

  const inSetlistIds = new Set(setlist.map((s) => s.id));

  return (
    <div className="min-h-screen bg-brand-950 pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Back */}
        <Link href={`/artist/${id}`} className="text-gray-400 hover:text-white transition text-sm mb-6 inline-block">
          &larr; Back to Artist
        </Link>

        {/* Artist header */}
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-purple-700 flex items-center justify-center text-xl font-bold shrink-0">
            NS
          </div>
          <div>
            <h1 className="text-2xl font-bold">Nova Synthwave</h1>
            <p className="text-gray-400 text-sm">Concert Setlist Builder</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-8">
          This setlist is for <span className="text-red-400 font-medium">OPYNX Live @ The Neon Arena — April 15, 2026</span>
        </p>

        {/* Setlist stats */}
        {setlist.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-[#15151f] rounded-xl px-5 py-3">
              <p className="text-xs text-gray-500">Tracks</p>
              <p className="text-xl font-bold">{setlist.length}</p>
            </div>
            <div className="bg-[#15151f] rounded-xl px-5 py-3">
              <p className="text-xs text-gray-500">Est. Duration</p>
              <p className="text-xl font-bold">{formatDuration(totalDuration)}</p>
            </div>
            {Object.entries(genres).map(([genre, count]) => (
              <div key={genre} className="bg-[#15151f] rounded-xl px-5 py-3">
                <p className="text-xs text-gray-500">{genre}</p>
                <p className="text-xl font-bold">{count}</p>
              </div>
            ))}
          </div>
        )}

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Left — Available Tracks */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Available Tracks</h2>
            <div className="space-y-2">
              {AVAILABLE_TRACKS.map((track) => {
                const inSetlist = inSetlistIds.has(track.id);
                return (
                  <div
                    key={track.id}
                    className={`bg-[#15151f] rounded-xl p-4 flex items-center gap-3 transition ${
                      inSetlist ? 'opacity-40' : 'hover:bg-[#1a1a28]'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{track.title}</p>
                      <p className="text-xs text-gray-500">
                        {track.genre} &middot; {track.duration}
                      </p>
                    </div>
                    <button
                      onClick={() => addToSetlist(track)}
                      disabled={inSetlist}
                      className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center text-lg font-bold transition shrink-0"
                    >
                      +
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right — Setlist */}
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Setlist {setlist.length > 0 && <span className="text-gray-500 text-sm font-normal">({setlist.length} tracks)</span>}
            </h2>
            {setlist.length === 0 ? (
              <div className="bg-[#15151f] rounded-xl p-8 text-center">
                <p className="text-gray-500">No tracks added yet</p>
                <p className="text-gray-600 text-sm mt-1">Click + to add tracks from the left</p>
              </div>
            ) : (
              <div className="space-y-2">
                {setlist.map((track, index) => (
                  <div
                    key={track.id}
                    className="bg-[#15151f] rounded-xl p-4 flex items-center gap-3 hover:bg-[#1a1a28] transition"
                  >
                    <span className="text-red-500 font-bold text-sm w-6 text-center">{track.order}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{track.title}</p>
                      <p className="text-xs text-gray-500">{track.duration}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs transition"
                      >
                        &#9650;
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === setlist.length - 1}
                        className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs transition"
                      >
                        &#9660;
                      </button>
                      <button
                        onClick={() => removeFromSetlist(track.id)}
                        className="w-7 h-7 rounded bg-red-600/20 hover:bg-red-600/40 flex items-center justify-center text-red-400 text-xs font-bold transition"
                      >
                        &#10005;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {setlist.length > 0 && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://opynx.com/artist/${id}/setlist/shared`);
                  toast('Setlist link copied!', 'success');
                }}
                className="mt-4 w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition text-sm"
              >
                Share Setlist
              </button>
            )}
          </div>
        </div>

        {/* Fan Voting */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Fan Voting</h2>
          <p className="text-sm text-gray-500 mb-4">Vote for the tracks you want to hear at the show</p>
          <div className="space-y-2">
            {voteTracks
              .sort((a, b) => b.votes - a.votes)
              .map((track) => (
                <div
                  key={track.id}
                  className="bg-[#15151f] rounded-xl p-4 flex items-center gap-4 hover:bg-[#1a1a28] transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{track.title}</p>
                      {track.id === topVoted.id && (
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-semibold uppercase">
                          Most Requested
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-400 font-mono">{track.votes}</span>
                  <button
                    onClick={() => toggleVote(track.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      track.voted
                        ? 'bg-red-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/15'
                    }`}
                  >
                    {track.voted ? 'Voted' : 'Vote'}
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Submit Request */}
        <div className="bg-[#15151f] rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-2">Submit a Request</h2>
          <p className="text-sm text-gray-500 mb-4">Suggest a track to add to the setlist</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitSuggestion()}
              placeholder="Enter a track name..."
              className="flex-1 bg-white/5 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition placeholder:text-gray-600"
            />
            <button
              onClick={submitSuggestion}
              disabled={!suggestion.trim()}
              className="px-5 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-semibold text-sm transition"
            >
              Submit Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
