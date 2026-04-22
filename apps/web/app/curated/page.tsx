'use client';

import Link from 'next/link';
import { useState } from 'react';

const genres = ['All', 'Electronic', 'Hip-Hop', 'R&B', 'Lo-Fi', 'Indie', 'Pop', 'Jazz', 'Rock', 'Ambient'];

const playlists = [
  { id: 'synthwave-essentials', title: 'Synthwave Essentials', tracks: 42, gradient: 'from-purple-600 to-pink-500', description: 'The definitive synthwave collection' },
  { id: 'lofi-study', title: 'Lo-fi Study Session', tracks: 65, gradient: 'from-teal-600 to-cyan-400', description: 'Focus-friendly beats for deep work' },
  { id: 'underground-gems', title: 'Underground Gems', tracks: 38, gradient: 'from-amber-600 to-orange-400', description: 'Hidden tracks from emerging talent' },
  { id: 'new-creator-spotlight', title: 'New Creator Spotlight', tracks: 24, gradient: 'from-green-600 to-emerald-400', description: 'Fresh faces making waves' },
  { id: 'festival-warmup', title: 'Festival Warm-Up', tracks: 55, gradient: 'from-red-600 to-rose-400', description: 'Get hyped for festival season' },
  { id: 'late-night-vibes', title: 'Late Night Vibes', tracks: 48, gradient: 'from-indigo-600 to-violet-400', description: 'Smooth sounds for after hours' },
];

export default function CuratedPage() {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [trackUrl, setTrackUrl] = useState('');
  const [genre, setGenre] = useState('');
  const [note, setNote] = useState('');

  return (
    <div className="min-h-screen bg-brand-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Back nav */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 text-sm">
          <span>&larr;</span> Back to Home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-black mb-2">
          <span className="text-red-500">OPYNX</span> Picks — Curated Playlists
        </h1>
        <p className="text-gray-400 mb-8">Hand-picked by our editorial team, updated weekly.</p>

        {/* Featured playlist hero */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-red-700 via-red-900 to-brand-950 p-8 sm:p-12 mb-12">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="relative z-10">
            <span className="inline-block bg-red-600 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">Featured Playlist</span>
            <h2 className="text-3xl sm:text-5xl font-black mb-3">The Weekly Drop</h2>
            <p className="text-gray-300 max-w-lg mb-4">
              Our editors scour the platform to bring you the freshest releases every week. 30 tracks, zero skips.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">30 tracks &middot; Updated Mar 28, 2026</span>
            </div>
            <button className="mt-6 bg-red-600 hover:bg-red-700 transition text-white font-bold px-8 py-3 rounded-full flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><polygon points="6,4 16,10 6,16" /></svg>
              Play All
            </button>
          </div>
        </div>

        {/* Genre pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                selectedGenre === g
                  ? 'bg-red-600 text-white'
                  : 'bg-[#15151f] text-gray-400 hover:text-white hover:bg-brand-800'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Playlist grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {playlists.map((pl) => (
            <Link
              key={pl.id}
              href="#"
              className="group bg-[#15151f] rounded-xl overflow-hidden hover:ring-1 hover:ring-red-600/50 transition"
            >
              <div className={`h-40 bg-gradient-to-br ${pl.gradient} flex items-end p-4`}>
                <div className="opacity-0 group-hover:opacity-100 transition">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><polygon points="7,4 16,10 7,16" /></svg>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white group-hover:text-red-400 transition">{pl.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{pl.description}</p>
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <span>{pl.tracks} tracks</span>
                  <span>OPYNX Editorial</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Submit Your Track */}
        <div className="bg-[#15151f] rounded-2xl p-6 sm:p-10 mb-12">
          <h2 className="text-2xl font-black mb-2">Submit Your Track</h2>
          <p className="text-gray-400 mb-6">Want your music featured in an OPYNX editorial playlist? Submit below for consideration.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Track URL</label>
              <input
                type="url"
                value={trackUrl}
                onChange={(e) => setTrackUrl(e.target.value)}
                placeholder="https://opynx.dev/track/..."
                className="w-full bg-brand-950 border border-brand-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Genre</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-brand-950 border border-brand-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="">Select genre</option>
                <option>Electronic</option>
                <option>Hip-Hop</option>
                <option>R&B</option>
                <option>Lo-Fi</option>
                <option>Indie</option>
                <option>Pop</option>
                <option>Jazz</option>
                <option>Rock</option>
                <option>Ambient</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Brief Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Tell us about your track and why it fits..."
              className="w-full bg-brand-950 border border-brand-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
            />
          </div>
          <button className="bg-red-600 hover:bg-red-700 transition text-white font-bold px-6 py-2.5 rounded-lg">
            Submit for Review
          </button>
        </div>
      </div>
    </div>
  );
}
