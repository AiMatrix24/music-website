'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';

const SLIDES = [
  'hero',
  'topArtist',
  'topTracks',
  'musicDna',
  'byTheNumbers',
  'share',
] as const;

const SLIDE_GRADIENTS = [
  'from-brand-950 via-purple-950 to-black',
  'from-red-950 via-purple-950 to-black',
  'from-purple-950 via-indigo-950 to-black',
  'from-red-900 via-brand-950 to-black',
  'from-indigo-950 via-brand-950 to-black',
  'from-purple-900 via-red-950 to-black',
];

const TOP_TRACKS = [
  { title: 'Midnight Signal', artist: 'Nova Synthwave', plays: 187 },
  { title: 'Chrome Dreams', artist: 'PULSE', plays: 156 },
  { title: 'Neon Rain', artist: 'Nova Synthwave', plays: 134 },
  { title: 'Electric Dusk', artist: 'Velvet Circuit', plays: 121 },
  { title: 'Vapor Trail', artist: 'Lo-fi Luna', plays: 98 },
];

const GENRES = [
  { name: 'Synthwave', pct: 42, color: 'bg-red-500' },
  { name: 'Electronic', pct: 28, color: 'bg-purple-500' },
  { name: 'Lo-fi', pct: 18, color: 'bg-indigo-500' },
  { name: 'Indie', pct: 12, color: 'bg-pink-500' },
];

export default function WrappedPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [current, setCurrent] = useState(0);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading your Wrapped...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Sign in to view your Wrapped</p>
        <Link href="/login" className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition">
          Sign In
        </Link>
      </div>
    );
  }

  const userName = session.user?.name ?? 'Music Lover';
  const year = new Date().getFullYear();

  const prev = () => setCurrent((c) => Math.max(0, c - 1));
  const next = () => setCurrent((c) => Math.min(SLIDES.length - 1, c + 1));

  const copyLink = () => {
    navigator.clipboard.writeText(`https://opynx.com/wrapped/2025/share/${session.user?.name ?? 'user'}`);
    toast('Link copied to clipboard!', 'success');
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`Check out my ${year} OPYNX Wrapped! 🎵`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=https://opynx.com/wrapped`, '_blank');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${SLIDE_GRADIENTS[current]} transition-all duration-700`}
      />

      {/* Back link */}
      <div className="relative z-10 pt-6 px-6">
        <Link href="/" className="text-gray-400 hover:text-white transition text-sm">
          &larr; Back to OPYNX
        </Link>
      </div>

      {/* Slide container */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-140px)] px-6">
        <div className="w-full max-w-lg text-center">
          {/* Slide transition wrapper */}
          <div
            key={current}
            className="animate-[fadeSlideIn_0.5s_ease-out]"
          >
            {/* Slide 1 — Hero */}
            {current === 0 && (
              <div className="space-y-6">
                <p className="text-red-400 font-semibold uppercase tracking-widest text-sm">
                  OPYNX Wrapped
                </p>
                <h1 className="text-5xl sm:text-7xl font-black leading-tight">
                  Your Year<br />on <span className="text-red-500">OPYNX</span>
                </h1>
                <p className="text-2xl text-gray-300">{userName}</p>
                <p className="text-6xl font-black text-white/20">{year}</p>
              </div>
            )}

            {/* Slide 2 — Top Artist */}
            {current === 1 && (
              <div className="space-y-6">
                <p className="text-red-400 font-semibold uppercase tracking-widest text-sm">
                  Your Top Artist
                </p>
                <h2 className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
                  Nova Synthwave
                </h2>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 inline-block">
                  <p className="text-4xl font-bold text-white">1,247</p>
                  <p className="text-gray-400">minutes listened</p>
                </div>
                <p className="text-gray-400 text-sm">
                  That&apos;s more than 95% of OPYNX listeners
                </p>
              </div>
            )}

            {/* Slide 3 — Top 5 Tracks */}
            {current === 2 && (
              <div className="space-y-6">
                <p className="text-red-400 font-semibold uppercase tracking-widest text-sm">
                  Your Top 5 Tracks
                </p>
                <div className="space-y-3 text-left">
                  {TOP_TRACKS.map((track, i) => (
                    <div
                      key={track.title}
                      className="flex items-center gap-4 bg-white/5 backdrop-blur rounded-xl p-4 hover:bg-white/10 transition"
                    >
                      <span className="text-2xl font-black text-red-500 w-8">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{track.title}</p>
                        <p className="text-sm text-gray-400">{track.artist}</p>
                      </div>
                      <span className="text-sm text-gray-400 shrink-0">{track.plays} plays</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Slide 4 — Music DNA */}
            {current === 3 && (
              <div className="space-y-6">
                <p className="text-red-400 font-semibold uppercase tracking-widest text-sm">
                  Your Music DNA
                </p>
                <h2 className="text-3xl font-bold">Genre Breakdown</h2>
                <div className="space-y-4 text-left">
                  {GENRES.map((genre) => (
                    <div key={genre.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{genre.name}</span>
                        <span className="text-gray-400">{genre.pct}%</span>
                      </div>
                      <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${genre.color} rounded-full transition-all duration-1000`}
                          style={{ width: `${genre.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Slide 5 — By The Numbers */}
            {current === 4 && (
              <div className="space-y-6">
                <p className="text-red-400 font-semibold uppercase tracking-widest text-sm">
                  By The Numbers
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: '2,847', label: 'Tracks Played' },
                    { value: '312', label: 'Hours Listened' },
                    { value: '184', label: 'Artists Supported' },
                    { value: '7', label: 'Events Attended' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-white/10 backdrop-blur rounded-2xl p-5"
                    >
                      <p className="text-3xl font-black text-white">{stat.value}</p>
                      <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-5">
                  <p className="text-sm text-gray-400">Top Listening Hour</p>
                  <p className="text-4xl font-black text-red-400">11 PM</p>
                  <p className="text-xs text-gray-500">Night owl vibes</p>
                </div>
              </div>
            )}

            {/* Slide 6 — Share */}
            {current === 5 && (
              <div className="space-y-6">
                <p className="text-red-400 font-semibold uppercase tracking-widest text-sm">
                  Share Your Wrapped
                </p>
                <div className="bg-gradient-to-br from-red-900/60 to-purple-900/60 backdrop-blur rounded-2xl p-8 border border-white/10">
                  <p className="text-sm text-gray-400 mb-2">OPYNX Wrapped {year}</p>
                  <p className="text-xl font-bold">{userName}</p>
                  <p className="text-gray-400 text-sm mt-2">
                    2,847 tracks &middot; 312 hours &middot; Top artist: Nova Synthwave
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={copyLink}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={shareTwitter}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
                  >
                    Share on Twitter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="relative z-10 pb-8 px-6">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={prev}
            disabled={current === 0}
            className="px-5 py-2 rounded-lg font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed bg-white/10 hover:bg-white/20"
          >
            Previous
          </button>
          {/* Progress dots */}
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === current ? 'bg-red-500 scale-125' : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
          <button
            onClick={next}
            disabled={current === SLIDES.length - 1}
            className="px-5 py-2 rounded-lg font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700"
          >
            Next
          </button>
        </div>
      </div>

      {/* Keyframe animation */}
      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
