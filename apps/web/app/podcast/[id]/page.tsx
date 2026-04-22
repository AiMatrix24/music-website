'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { usePlayer } from '@/app/components/MusicPlayer';

// Mock podcast data until tRPC query exists
const MOCK_PODCAST = {
  id: '1',
  title: 'The OPYNX Show',
  description: 'Weekly conversations with independent creators about creativity, business, and the future of music.',
  host: 'Nova Synthwave',
  coverArt: null,
  episodeCount: 24,
  subscriberCount: 1200,
};

const MOCK_EPISODES = [
  { id: 'ep1', title: 'Ep. 24 — How to Tour Without a Label', description: 'Cipher shares his approach to booking venues, managing logistics, and making tour profitable as an independent creator.', duration: 2520, publishedAt: new Date('2026-03-20'), seasonNumber: 2, episodeNumber: 12 },
  { id: 'ep2', title: 'Ep. 23 — Building a Superfan Community', description: 'Luna Beats talks about growing from 0 to 10K followers using direct-to-fan strategies.', duration: 1980, publishedAt: new Date('2026-03-13'), seasonNumber: 2, episodeNumber: 11 },
  { id: 'ep3', title: 'Ep. 22 — Transparent Revenue: Why It Matters', description: 'A deep dive into on-chain payouts and why creators deserve to see where every dollar goes.', duration: 2340, publishedAt: new Date('2026-03-06'), seasonNumber: 2, episodeNumber: 10 },
  { id: 'ep4', title: 'Ep. 21 — Lo-fi Production Masterclass', description: 'Luna Beats walks through her DAW setup and shows how she creates the signature Moonlit Frequencies sound.', duration: 3600, publishedAt: new Date('2026-02-27'), seasonNumber: 2, episodeNumber: 9 },
  { id: 'ep5', title: 'Ep. 20 — Merch That Actually Sells', description: 'Tips on designing, pricing, and selling merchandise that fans actually want.', duration: 1800, publishedAt: new Date('2026-02-20'), seasonNumber: 2, episodeNumber: 8 },
];

export default function PodcastDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { play } = usePlayer();
  const [expandedEp, setExpandedEp] = useState<string | null>(null);

  const podcast = MOCK_PODCAST;
  const episodes = MOCK_EPISODES;

  const playEpisode = (ep: typeof episodes[0]) => {
    play({
      id: ep.id,
      title: ep.title,
      creator: podcast.host,
      genre: 'Podcast',
      duration: ep.duration,
    });
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/explore" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">← Back</Link>

        {/* Podcast header */}
        <div className="flex flex-col sm:flex-row gap-6 items-start mb-10">
          <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-5xl shrink-0 shadow-2xl">
            🎙️
          </div>
          <div className="flex-1">
            <p className="text-sm text-red-400 font-semibold uppercase tracking-wider mb-1">Podcast</p>
            <h1 className="text-4xl font-black mb-2">{podcast.title}</h1>
            <p className="text-gray-400 mb-3">Hosted by {podcast.host}</p>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">{podcast.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{podcast.episodeCount} episodes</span>
              <span>·</span>
              <span>{podcast.subscriberCount.toLocaleString()} subscribers</span>
            </div>
            <button className="mt-4 rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white hover:bg-red-500 transition">
              Subscribe to Podcast
            </button>
          </div>
        </div>

        {/* Episodes */}
        <div className="rounded-2xl bg-[#15151f] overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-800/20">
            <h2 className="text-lg font-bold">Latest Episodes</h2>
          </div>
          <div className="divide-y divide-brand-800/10">
            {episodes.map((ep) => (
              <div key={ep.id} className="px-6 py-5">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => playEpisode(ep)}
                    className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-500 transition shrink-0 mt-1"
                  >
                    <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">S{ep.seasonNumber} E{ep.episodeNumber}</span>
                      <span className="text-xs text-gray-600">·</span>
                      <span className="text-xs text-gray-500">
                        {ep.publishedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="font-bold mb-1">{ep.title}</h3>
                    <p className={`text-sm text-gray-400 ${expandedEp === ep.id ? '' : 'line-clamp-2'}`}>
                      {ep.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500">{formatDuration(ep.duration)}</span>
                      <button
                        onClick={() => setExpandedEp(expandedEp === ep.id ? null : ep.id)}
                        className="text-xs text-red-400 hover:text-red-300 font-semibold transition"
                      >
                        {expandedEp === ep.id ? 'Less' : 'More'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins} min`;
}
