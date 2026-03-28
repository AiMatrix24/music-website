'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

const MOCK_LYRICS = [
  [
    'Beneath the neon glow we chase the sound',
    'Electric pulses shaking frozen ground',
    'A melody that pulls us through the night',
    'We lose ourselves in waves of amber light',
  ],
  [
    'The city hums a song we used to know',
    'Through tangled streets where midnight rivers flow',
    'Our voices rise above the static haze',
    'Dancing through the echoes of our days',
  ],
  [
    'Dreams are woven into every beat',
    'A rhythm born from rain on empty streets',
    'We carry hope like fire in our hands',
    'Building worlds from dust and shifting sands',
  ],
  [
    'When silence falls we start the song again',
    'A chorus forged from joy and gentle pain',
    'The music never fades it only grows',
    'A thread of light that everyone here knows',
  ],
];

export default function LyricsPage() {
  const { id } = useParams<{ id: string }>();
  const [syncedEnabled, setSyncedEnabled] = useState(false);

  // Mock track info
  const track = {
    title: 'Neon Horizons',
    artist: 'Stellar Drift',
    genre: 'Synthwave',
    bpm: 128,
    duration: '3:42',
    album: 'Electric Dreams',
    releaseDate: '2025-11-15',
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Back link */}
        <Link
          href={`/track/${id}`}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to track
        </Link>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main lyrics area */}
          <div className="flex-1">
            {/* Track header */}
            <div className="mb-8">
              <h1 className="text-4xl font-black mb-2">{track.title}</h1>
              <p className="text-xl text-gray-400">{track.artist}</p>
            </div>

            {/* Synced lyrics toggle */}
            <div className="flex items-center gap-3 mb-8 p-4 rounded-xl bg-[#15151f] border border-brand-800/30">
              <button
                onClick={() => setSyncedEnabled(!syncedEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  syncedEnabled ? 'bg-red-600' : 'bg-brand-800'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    syncedEnabled ? 'translate-x-6' : ''
                  }`}
                />
              </button>
              <span className="text-sm text-gray-300">Synced Lyrics</span>
              <span className="text-xs bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full font-medium">
                Coming Soon
              </span>
            </div>

            {/* Lyrics display */}
            <div className="space-y-8 mb-10">
              {MOCK_LYRICS.map((verse, vi) => (
                <div key={vi} className="space-y-2">
                  {verse.map((line, li) => (
                    <p
                      key={li}
                      className="text-xl md:text-2xl text-gray-200 leading-relaxed font-light tracking-wide"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 pt-6 border-t border-brand-800/30">
              <button className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-full transition">
                Contribute Lyrics
              </button>
              <button className="px-6 py-3 bg-[#15151f] hover:bg-brand-800/60 text-gray-300 font-medium rounded-full border border-brand-800/30 transition">
                Report Incorrect Lyrics
              </button>
            </div>
          </div>

          {/* Side panel */}
          <div className="lg:w-72 shrink-0">
            <div className="bg-[#15151f] rounded-2xl border border-brand-800/30 p-6 sticky top-28">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Track Info
              </h3>
              <div className="space-y-4">
                <InfoRow label="Genre" value={track.genre} />
                <InfoRow label="BPM" value={String(track.bpm)} />
                <InfoRow label="Duration" value={track.duration} />
                <InfoRow label="Album" value={track.album} />
                <InfoRow label="Released" value={track.releaseDate} />
              </div>

              <div className="mt-6 pt-6 border-t border-brand-800/30">
                <Link
                  href={`/track/${id}`}
                  className="block w-full text-center px-4 py-2.5 bg-red-600/10 text-red-400 hover:bg-red-600/20 rounded-xl font-medium transition text-sm"
                >
                  View Full Track
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-200 font-medium">{value}</span>
    </div>
  );
}
