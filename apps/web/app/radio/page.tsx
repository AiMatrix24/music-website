'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Station {
  id: string;
  name: string;
  trackCount: number;
  gradient: string;
  icon: string;
}

const stations: Station[] = [
  { id: 'synthwave', name: 'Synthwave', trackCount: 342, gradient: 'from-purple-600 to-pink-600', icon: '&#127774;' },
  { id: 'lofi-hip-hop', name: 'Lo-fi Hip Hop', trackCount: 518, gradient: 'from-amber-600 to-orange-500', icon: '&#9749;' },
  { id: 'electronic', name: 'Electronic', trackCount: 723, gradient: 'from-cyan-500 to-blue-600', icon: '&#9889;' },
  { id: 'indie-rock', name: 'Indie Rock', trackCount: 456, gradient: 'from-red-600 to-rose-500', icon: '&#127928;' },
  { id: 'post-punk', name: 'Post-Punk', trackCount: 289, gradient: 'from-gray-600 to-zinc-500', icon: '&#128165;' },
  { id: 'ambient', name: 'Ambient', trackCount: 631, gradient: 'from-teal-500 to-emerald-600', icon: '&#127752;' },
  { id: 'alternative', name: 'Alternative', trackCount: 412, gradient: 'from-indigo-600 to-violet-500', icon: '&#128308;' },
  { id: 'jazz', name: 'Jazz', trackCount: 267, gradient: 'from-yellow-600 to-amber-500', icon: '&#127911;' },
];

const genreOptions = ['Synthwave', 'Lo-fi', 'Electronic', 'Indie Rock', 'Post-Punk', 'Ambient', 'Alternative', 'Jazz', 'R&B', 'Hip Hop', 'Classical', 'Folk'];

export default function RadioPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [moodValue, setMoodValue] = useState(50);
  const [playingStation, setPlayingStation] = useState<string | null>('synthwave');

  const currentStation = stations.find((s) => s.id === playingStation);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Back nav */}
        <Link href="/explore" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Explore
        </Link>

        <h1 className="text-3xl font-bold mb-2">Radio Stations</h1>
        <p className="text-gray-400 mb-8">Curated genre stations powered by independent artists.</p>

        {/* Now Playing */}
        {currentStation && (
          <div className={`rounded-2xl bg-gradient-to-r ${currentStation.gradient} p-6 mb-10 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-3xl flex-shrink-0">
                <span dangerouslySetInnerHTML={{ __html: currentStation.icon }} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">Now Playing</p>
                <h2 className="text-2xl font-bold text-white">{currentStation.name} Radio</h2>
                <p className="text-white/70 text-sm">{currentStation.trackCount} tracks from independent artists</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:scale-105 transition">
                  <svg className="w-6 h-6 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </button>
                <button className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Custom Station */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Genre Stations</h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-5 py-2 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition"
          >
            {showCreate ? 'Close' : '+ Create Custom Station'}
          </button>
        </div>

        {/* Custom Station Form */}
        {showCreate && (
          <div className="bg-[#15151f] border border-gray-800 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold mb-4">Create Your Station</h3>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-400 mb-3">Select Genres</label>
              <div className="flex flex-wrap gap-2">
                {genreOptions.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                      selectedGenres.includes(genre)
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Mood: <span className="text-white">{moodValue <= 25 ? 'Chill' : moodValue <= 50 ? 'Relaxed' : moodValue <= 75 ? 'Energetic' : 'Hype'}</span>
              </label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Chill</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={moodValue}
                  onChange={(e) => setMoodValue(Number(e.target.value))}
                  className="flex-1 accent-red-600 h-2"
                />
                <span className="text-sm text-gray-500">Hype</span>
              </div>
            </div>
            <button
              className="px-6 py-2.5 rounded-full bg-red-600 text-white font-semibold hover:bg-red-500 transition disabled:opacity-40"
              disabled={selectedGenres.length === 0}
            >
              Generate Station
            </button>
          </div>
        )}

        {/* Station Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stations.map((station) => (
            <Link
              key={station.id}
              href="#"
              className="group relative rounded-2xl overflow-hidden aspect-square flex flex-col justify-end p-5 hover:scale-[1.02] transition-transform"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${station.gradient} opacity-80 group-hover:opacity-100 transition`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="relative z-10">
                <p className="text-3xl mb-2"><span dangerouslySetInnerHTML={{ __html: station.icon }} /></p>
                <h3 className="text-xl font-bold text-white mb-1">{station.name}</h3>
                <p className="text-white/70 text-sm mb-3">{station.trackCount} tracks</p>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setPlayingStation(station.id);
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
                    playingStation === station.id
                      ? 'bg-white text-black'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {playingStation === station.id ? (
                    <>
                      <span className="flex gap-0.5">
                        <span className="w-0.5 h-3 bg-black rounded animate-pulse" />
                        <span className="w-0.5 h-3 bg-black rounded animate-pulse" style={{ animationDelay: '0.15s' }} />
                        <span className="w-0.5 h-3 bg-black rounded animate-pulse" style={{ animationDelay: '0.3s' }} />
                      </span>
                      Playing
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      Play
                    </>
                  )}
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
