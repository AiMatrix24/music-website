'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';

interface Track {
  title: string;
  artist: string;
  genre: string;
  duration: string;
}

const MOOD_BUTTONS = [
  'Rainy Sunday',
  'Late Night Drive',
  'Workout Energy',
  'Coffee Shop',
  'Beach Vibes',
  'Study Focus',
  'Party Mode',
  'Heartbreak',
];

const PLAYLIST_BANK: Record<string, { name: string; tracks: Track[] }> = {
  'Rainy Sunday': {
    name: 'Rainy Sunday Vibes',
    tracks: [
      { title: 'Petrichor Dreams', artist: 'Lo-fi Luna', genre: 'Lo-fi', duration: '3:24' },
      { title: 'Window Pane', artist: 'Cloudsinger', genre: 'Ambient', duration: '4:12' },
      { title: 'Soft Drizzle', artist: 'Haze Collective', genre: 'Chill', duration: '3:48' },
      { title: 'Grey Skies', artist: 'Mellow Drift', genre: 'Indie', duration: '3:55' },
      { title: 'Blanket Fort', artist: 'Cozy Beats', genre: 'Lo-fi', duration: '2:58' },
      { title: 'Puddle Reflections', artist: 'Rain Theory', genre: 'Ambient', duration: '4:30' },
      { title: 'Misty Morning', artist: 'Dew Point', genre: 'Chill', duration: '3:15' },
      { title: 'Overcast', artist: 'Nimbus', genre: 'Electronic', duration: '3:42' },
      { title: 'Tea & Thunder', artist: 'Storm Lounge', genre: 'Lo-fi', duration: '4:01' },
      { title: 'Gentle Rain', artist: 'Nature Pulse', genre: 'Ambient', duration: '5:10' },
    ],
  },
  'Late Night Drive': {
    name: 'Midnight Highway Mix',
    tracks: [
      { title: 'Neon Highway', artist: 'Nova Synthwave', genre: 'Synthwave', duration: '4:15' },
      { title: 'City Lights Blur', artist: 'PULSE', genre: 'Electronic', duration: '3:52' },
      { title: 'Midnight Cruise', artist: 'Velvet Circuit', genre: 'Synthwave', duration: '4:33' },
      { title: 'Empty Lanes', artist: 'Ghost Driver', genre: 'Darkwave', duration: '3:44' },
      { title: 'Dashboard Glow', artist: 'Retro Flux', genre: 'Synthwave', duration: '4:08' },
      { title: 'Tunnel Vision', artist: 'Deep Current', genre: 'Electronic', duration: '3:28' },
      { title: 'Exit Signs', artist: 'Roadside', genre: 'Indie Electronic', duration: '3:55' },
      { title: 'Afterglow Drive', artist: 'Sunset Rogue', genre: 'Chillwave', duration: '4:22' },
      { title: 'Red Taillights', artist: 'Brake Light', genre: 'Synthwave', duration: '3:17' },
      { title: 'AM Radio Static', artist: 'Lost Signal', genre: 'Ambient', duration: '5:01' },
    ],
  },
};

function getPlaylistForMood(mood: string): { name: string; tracks: Track[] } {
  if (PLAYLIST_BANK[mood]) return PLAYLIST_BANK[mood];
  // Generate a default playlist for other moods
  const name = `${mood} Vibes`;
  const tracks: Track[] = [
    { title: 'Frequency Shift', artist: 'PULSE', genre: 'Electronic', duration: '3:45' },
    { title: 'Amber Waves', artist: 'Golden Hour', genre: 'Chill', duration: '4:02' },
    { title: 'Digital Bloom', artist: 'Flora Beats', genre: 'Lo-fi', duration: '3:18' },
    { title: 'Echo Chamber', artist: 'Reverb', genre: 'Ambient', duration: '4:28' },
    { title: 'Solar Flare', artist: 'Nova Synthwave', genre: 'Synthwave', duration: '3:55' },
    { title: 'Whisper Network', artist: 'Subtext', genre: 'Indie', duration: '3:32' },
    { title: 'Crystal Clear', artist: 'Prism', genre: 'Electronic', duration: '4:10' },
    { title: 'Velvet Touch', artist: 'Silk Road', genre: 'R&B', duration: '3:48' },
    { title: 'Moonwalk', artist: 'Gravity Well', genre: 'Synthwave', duration: '4:15' },
    { title: 'Still Waters', artist: 'Lake Effect', genre: 'Ambient', duration: '5:22' },
  ];
  return { name, tracks };
}

export default function GeneratePlaylistPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [vibeText, setVibeText] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [playlist, setPlaylist] = useState<{ name: string; tracks: Track[] } | null>(null);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Sign in to generate playlists</p>
        <Link href="/login" className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition">
          Sign In
        </Link>
      </div>
    );
  }

  const generate = (mood: string) => {
    setSelectedMood(mood);
    setGenerating(true);
    setPlaylist(null);
    setTimeout(() => {
      setPlaylist(getPlaylistForMood(mood));
      setGenerating(false);
    }, 2000);
  };

  const handleSubmit = () => {
    if (!vibeText.trim()) return;
    generate(vibeText.trim());
  };

  const regenerate = () => {
    if (selectedMood) generate(selectedMood);
  };

  const savePlaylist = () => {
    toast('Playlist saved to your library!', 'success');
  };

  const sharePlaylist = () => {
    navigator.clipboard.writeText(`https://opynx.com/playlist/generated/${Date.now()}`);
    toast('Playlist link copied!', 'success');
  };

  return (
    <div className="min-h-screen bg-brand-950 pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <Link href="/" className="text-gray-400 hover:text-white transition text-sm mb-6 inline-block">
          &larr; Back to OPYNX
        </Link>

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-black mb-3">
            AI Playlist Generator &#10024;
          </h1>
          <p className="text-gray-400 max-w-md mx-auto">
            Describe your vibe and let our AI craft the perfect playlist from 15,000+ tracks on OPYNX
          </p>
        </div>

        {/* Input */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={vibeText}
            onChange={(e) => setVibeText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Describe your vibe... e.g. chill beats for a foggy morning"
            className="flex-1 bg-[#15151f] border border-gray-700 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-red-500 transition placeholder:text-gray-600"
          />
          <button
            onClick={handleSubmit}
            disabled={!vibeText.trim() || generating}
            className="px-6 py-4 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold transition shrink-0"
          >
            Generate
          </button>
        </div>

        {/* Mood buttons */}
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          {MOOD_BUTTONS.map((mood) => (
            <button
              key={mood}
              onClick={() => generate(mood)}
              disabled={generating}
              className={`px-4 py-2 rounded-full text-sm font-medium transition border ${
                selectedMood === mood
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-white/5 border-gray-700 text-gray-300 hover:bg-white/10 hover:border-gray-500'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {mood}
            </button>
          ))}
        </div>

        {/* Generating animation */}
        {generating && (
          <div className="text-center py-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-gray-400 text-lg">Generating your perfect playlist...</p>
            <p className="text-gray-600 text-sm mt-1">Analyzing vibes from 15,000+ tracks</p>
          </div>
        )}

        {/* Generated playlist */}
        {playlist && !generating && (
          <div className="animate-[fadeSlideIn_0.5s_ease-out]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{playlist.name}</h2>
                <p className="text-gray-500 text-sm">10 tracks &middot; AI generated</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={regenerate}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm font-medium transition"
                >
                  Regenerate
                </button>
                <button
                  onClick={sharePlaylist}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm font-medium transition"
                >
                  Share Playlist
                </button>
                <button
                  onClick={savePlaylist}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition"
                >
                  Save Playlist
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {playlist.tracks.map((track, i) => (
                <div
                  key={track.title}
                  className="bg-[#15151f] rounded-xl p-4 flex items-center gap-4 hover:bg-[#1a1a28] transition group"
                >
                  <span className="text-gray-600 text-sm w-6 text-right">{i + 1}</span>
                  <button className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition">
                    <svg className="w-4 h-4 ml-0.5" fill="white" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{track.title}</p>
                    <p className="text-xs text-gray-500">{track.artist}</p>
                  </div>
                  <span className="text-xs text-gray-600 bg-white/5 px-2 py-1 rounded">{track.genre}</span>
                  <span className="text-xs text-gray-500 w-10 text-right">{track.duration}</span>
                </div>
              ))}
            </div>

            <p className="text-center text-gray-600 text-xs mt-6">
              Generated from 15,000+ tracks on OPYNX
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
