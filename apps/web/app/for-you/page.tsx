'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

// --- Mock Data ---
type Mood = 'All' | 'Energetic' | 'Chill' | 'Focus' | 'Party' | 'Melancholy';

const MOODS: Mood[] = ['All', 'Energetic', 'Chill', 'Focus', 'Party', 'Melancholy'];

const DAILY_MIXES = [
  { id: 1, name: 'Synthwave Mix', tracks: 24, gradient: 'from-purple-600 to-pink-500', mood: 'Energetic' as Mood },
  { id: 2, name: 'Lo-fi Focus', tracks: 32, gradient: 'from-emerald-600 to-teal-500', mood: 'Focus' as Mood },
  { id: 3, name: 'Electronic Energy', tracks: 28, gradient: 'from-red-600 to-orange-500', mood: 'Energetic' as Mood },
  { id: 4, name: 'Indie Chill', tracks: 20, gradient: 'from-blue-600 to-cyan-500', mood: 'Chill' as Mood },
  { id: 5, name: 'Post-Punk Underground', tracks: 18, gradient: 'from-gray-600 to-zinc-500', mood: 'Melancholy' as Mood },
  { id: 6, name: 'Ambient Meditation', tracks: 15, gradient: 'from-indigo-600 to-violet-500', mood: 'Chill' as Mood },
];

const BECAUSE_YOU_LISTENED = [
  {
    trigger: 'Midnight Drive',
    tracks: [
      { id: 't1', title: 'Neon Highway', creator: 'SynthLord', genre: 'Synthwave', duration: '3:42' },
      { id: 't2', title: 'City Pulse', creator: 'RetroWave', genre: 'Synthwave', duration: '4:15' },
      { id: 't3', title: 'Night Rider', creator: 'ChromeVox', genre: 'Electronic', duration: '3:58' },
      { id: 't4', title: 'Electric Dusk', creator: 'NeonGlow', genre: 'Synthwave', duration: '4:30' },
    ],
  },
  {
    trigger: 'Crystal Waves',
    tracks: [
      { id: 't5', title: 'Ocean Floor', creator: 'DeepSea', genre: 'Ambient', duration: '5:12' },
      { id: 't6', title: 'Tidal Motion', creator: 'AquaSound', genre: 'Ambient', duration: '4:48' },
      { id: 't7', title: 'Reef Echo', creator: 'CoralMind', genre: 'Chillout', duration: '6:01' },
      { id: 't8', title: 'Drift Away', creator: 'WaveForm', genre: 'Ambient', duration: '5:33' },
    ],
  },
  {
    trigger: 'Ghost Signal',
    tracks: [
      { id: 't9', title: 'Static Dreams', creator: 'HauntedFM', genre: 'Post-Punk', duration: '3:22' },
      { id: 't10', title: 'Dark Frequency', creator: 'VoidWalker', genre: 'Industrial', duration: '4:05' },
      { id: 't11', title: 'Shadow Play', creator: 'NightShift', genre: 'Post-Punk', duration: '3:47' },
      { id: 't12', title: 'Phantom Wire', creator: 'EtherDust', genre: 'Electronic', duration: '4:20' },
    ],
  },
];

const DISCOVER_WEEKLY = [
  { id: 'dw1', title: 'Velvet Horizon', creator: 'Aurora Beats', genre: 'Electronic', duration: '3:45' },
  { id: 'dw2', title: 'Broken Compass', creator: 'Nomad Sound', genre: 'Indie', duration: '4:12' },
  { id: 'dw3', title: 'Concrete Garden', creator: 'UrbanFlora', genre: 'Lo-fi', duration: '3:28' },
  { id: 'dw4', title: 'Pixel Rain', creator: 'BitCrush', genre: 'Chiptune', duration: '2:55' },
  { id: 'dw5', title: 'Solar Wind', creator: 'CosmicDrift', genre: 'Ambient', duration: '5:40' },
  { id: 'dw6', title: 'Rust & Gold', creator: 'IronMelody', genre: 'Post-Rock', duration: '6:18' },
  { id: 'dw7', title: 'Lucid State', creator: 'DreamWeaver', genre: 'Downtempo', duration: '4:33' },
  { id: 'dw8', title: 'Voltage', creator: 'ShockWire', genre: 'Electro', duration: '3:15' },
  { id: 'dw9', title: 'Moonlit Path', creator: 'NightBloom', genre: 'Chillwave', duration: '4:50' },
  { id: 'dw10', title: 'Fracture Point', creator: 'GlitchCore', genre: 'IDM', duration: '3:38' },
];

const NEW_RELEASES = [
  { id: 'nr1', title: 'Sunrise Protocol', creator: 'DayBreak', genre: 'Electronic', released: '2 hours ago' },
  { id: 'nr2', title: 'Underworld Bass', creator: 'SubZero', genre: 'Dubstep', released: '5 hours ago' },
  { id: 'nr3', title: 'Paper Planes', creator: 'FoldedWings', genre: 'Indie', released: '1 day ago' },
  { id: 'nr4', title: 'Hologram', creator: 'LightBend', genre: 'Synthwave', released: '1 day ago' },
  { id: 'nr5', title: 'Quiet Riot', creator: 'SilentStorm', genre: 'Post-Punk', released: '2 days ago' },
  { id: 'nr6', title: 'Cloudbreak', creator: 'SkyDiver', genre: 'Ambient', released: '3 days ago' },
];

const RISING_ARTISTS = [
  { id: 'ra1', name: 'ChromeVox', genre: 'Synthwave', followers: 12400, growth: 340 },
  { id: 'ra2', name: 'UrbanFlora', genre: 'Lo-fi', followers: 8900, growth: 280 },
  { id: 'ra3', name: 'VoidWalker', genre: 'Industrial', followers: 6200, growth: 520 },
  { id: 'ra4', name: 'DreamWeaver', genre: 'Downtempo', followers: 15300, growth: 190 },
];

export default function ForYouPage() {
  const { data: session } = useSession();
  const [activeMood, setActiveMood] = useState<Mood>('All');
  const [isLoading, setIsLoading] = useState(false);

  const userName = session?.user?.name?.split(' ')[0] || 'Music Lover';

  const filteredMixes = activeMood === 'All'
    ? DAILY_MIXES
    : DAILY_MIXES.filter((m) => m.mood === activeMood);

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          &larr; Back to Home
        </Link>

        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-4xl font-black mb-2">Made for You</h1>
          <p className="text-gray-400 text-lg">
            Good {getTimeOfDay()}, {userName}. Here&apos;s your personalized music discovery.
          </p>
        </div>

        {/* Mood Filters */}
        <div className="flex gap-2 mb-10 overflow-x-auto pb-2">
          {MOODS.map((mood) => (
            <button
              key={mood}
              onClick={() => setActiveMood(mood)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${
                activeMood === mood
                  ? 'bg-red-600 text-white'
                  : 'bg-[#15151f] text-gray-400 hover:text-white'
              }`}
            >
              {mood}
            </button>
          ))}
        </div>

        {/* Daily Mix */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Daily Mix</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMixes.map((mix) => (
              <Link
                key={mix.id}
                href={`/playlist/${mix.id}`}
                className="group relative rounded-2xl overflow-hidden h-48 flex flex-col justify-end p-5 transition hover:scale-[1.02]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${mix.gradient} opacity-80`} />
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white">{mix.name}</h3>
                  <p className="text-white/70 text-sm">{mix.tracks} tracks</p>
                </div>
                <button className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <span className="text-white text-lg">&#9654;</span>
                </button>
              </Link>
            ))}
          </div>
        </section>

        {/* Because You Listened To... */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Because You Listened To...</h2>
          <div className="space-y-8">
            {BECAUSE_YOU_LISTENED.map((row) => (
              <div key={row.trigger}>
                <h3 className="text-lg font-semibold text-gray-300 mb-4">
                  Because you liked <span className="text-red-500">{row.trigger}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {row.tracks.map((track) => (
                    <Link
                      key={track.id}
                      href={`/track/${track.id}`}
                      className="rounded-xl bg-[#15151f] p-4 hover:bg-[#1a1a2e] transition group"
                    >
                      <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-red-600/30 to-brand-800/30 mb-3 flex items-center justify-center">
                        <span className="text-3xl opacity-0 group-hover:opacity-100 transition">&#9654;</span>
                      </div>
                      <p className="font-semibold truncate">{track.title}</p>
                      <p className="text-sm text-gray-400 truncate">{track.creator} &middot; {track.genre}</p>
                      <p className="text-xs text-gray-500 mt-1">{track.duration}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Discover Weekly */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Discover Weekly</h2>
              <p className="text-sm text-gray-500">Refreshed every Monday &middot; 10 tracks</p>
            </div>
            <Link href="/playlist/discover-weekly" className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition">
              Play All
            </Link>
          </div>
          <div className="rounded-2xl bg-[#15151f] overflow-hidden">
            {DISCOVER_WEEKLY.map((track, i) => (
              <Link
                key={track.id}
                href={`/track/${track.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#1a1a2e] transition border-b border-white/5 last:border-b-0"
              >
                <span className="text-gray-500 text-sm w-6 text-right">{i + 1}</span>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600/40 to-purple-600/40 flex items-center justify-center text-sm font-bold">
                  {track.genre.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{track.title}</p>
                  <p className="text-sm text-gray-400 truncate">{track.creator}</p>
                </div>
                <span className="text-xs text-gray-500 hidden sm:block">{track.genre}</span>
                <span className="text-sm text-gray-400 w-12 text-right">{track.duration}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* New Releases For You */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">New Releases For You</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {NEW_RELEASES.map((track) => (
              <Link
                key={track.id}
                href={`/track/${track.id}`}
                className="rounded-xl bg-[#15151f] p-4 hover:bg-[#1a1a2e] transition group"
              >
                <div className="w-full aspect-video rounded-lg bg-gradient-to-br from-red-600/20 to-orange-600/20 mb-3 flex items-center justify-center">
                  <span className="text-3xl opacity-0 group-hover:opacity-100 transition">&#9654;</span>
                </div>
                <p className="font-semibold truncate">{track.title}</p>
                <p className="text-sm text-gray-400 truncate">{track.creator} &middot; {track.genre}</p>
                <p className="text-xs text-green-400 mt-1">{track.released}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Rising Creators */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Rising Creators</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RISING_ARTISTS.map((creator) => (
              <Link
                key={creator.id}
                href={`/artist/${creator.id}`}
                className="rounded-xl bg-[#15151f] p-5 hover:bg-[#1a1a2e] transition text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-pink-600 mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                  {creator.name.charAt(0)}
                </div>
                <p className="font-bold text-lg">{creator.name}</p>
                <p className="text-sm text-gray-400 mb-2">{creator.genre}</p>
                <p className="text-sm text-gray-500">{creator.followers.toLocaleString()} followers</p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-green-600/20 text-green-400 text-xs font-semibold">
                  +{creator.growth}% this month
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
