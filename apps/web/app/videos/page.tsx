'use client';

import Link from 'next/link';
import { useState } from 'react';

type FilterTab = 'all' | 'official' | 'live' | 'bts' | 'visualizers';

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'official', label: 'Official Videos' },
  { key: 'live', label: 'Live Performances' },
  { key: 'bts', label: 'Behind the Scenes' },
  { key: 'visualizers', label: 'Visualizers' },
];

const videos = [
  { id: 1, title: 'Midnight Drive (Official Video)', artist: 'KAEL', views: 1283400, date: 'Mar 15, 2026', duration: '4:12', gradient: 'from-red-700 to-purple-800', category: 'official' as FilterTab },
  { id: 2, title: 'Neon Horizon — Live at The Warehouse', artist: 'Aria Frost', views: 847200, date: 'Mar 10, 2026', duration: '6:45', gradient: 'from-cyan-700 to-blue-900', category: 'live' as FilterTab },
  { id: 3, title: 'Velvet Chains (Visualizer)', artist: 'Luna Voss', views: 592100, date: 'Mar 8, 2026', duration: '3:48', gradient: 'from-pink-600 to-violet-800', category: 'visualizers' as FilterTab },
  { id: 4, title: 'Making of "Shatter" — Studio Session', artist: 'DVRK MATTER', views: 324700, date: 'Mar 5, 2026', duration: '12:34', gradient: 'from-amber-700 to-red-900', category: 'bts' as FilterTab },
  { id: 5, title: 'Ghost Frequency (Official Video)', artist: 'KAEL', views: 1102300, date: 'Feb 28, 2026', duration: '3:55', gradient: 'from-emerald-700 to-teal-900', category: 'official' as FilterTab },
  { id: 6, title: 'Paper Crowns — Rooftop Session', artist: 'Mira Chen', views: 678900, date: 'Feb 22, 2026', duration: '5:20', gradient: 'from-orange-600 to-rose-800', category: 'live' as FilterTab },
  { id: 7, title: 'Low Tide (Visualizer)', artist: 'Oceanic', views: 445600, date: 'Feb 18, 2026', duration: '4:02', gradient: 'from-indigo-600 to-blue-900', category: 'visualizers' as FilterTab },
  { id: 8, title: 'Wildfire (Official Video)', artist: 'Sage & the Saints', views: 923400, date: 'Feb 12, 2026', duration: '4:38', gradient: 'from-yellow-600 to-amber-900', category: 'official' as FilterTab },
];

function formatViews(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export default function VideosPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filtered = activeTab === 'all' ? videos : videos.filter((v) => v.category === activeTab);

  return (
    <div className="min-h-screen bg-brand-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Back nav */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 text-sm">
          <span>&larr;</span> Back to Home
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-black">Music Videos</h1>
          <button className="bg-red-600 hover:bg-red-700 transition text-white font-bold px-5 py-2.5 rounded-lg text-sm self-start">
            Upload Video
          </button>
        </div>

        {/* Featured video hero */}
        <div className="relative rounded-2xl overflow-hidden mb-10">
          <div className="aspect-video bg-gradient-to-br from-red-800 via-purple-900 to-brand-950 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-black/30" />
            <button className="relative z-10 w-20 h-20 bg-red-600/90 hover:bg-red-600 transition rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20"><polygon points="6,3 18,10 6,17" /></svg>
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 sm:p-8">
            <span className="inline-block bg-red-600 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded mb-2">Featured</span>
            <h2 className="text-2xl sm:text-3xl font-black">Midnight Drive (Official Video)</h2>
            <p className="text-gray-300 mt-1">KAEL &middot; 1.3M views &middot; Mar 15, 2026</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-red-600 text-white'
                  : 'bg-[#15151f] text-gray-400 hover:text-white hover:bg-brand-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Video grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((video) => (
            <Link
              key={video.id}
              href="#"
              className="group bg-[#15151f] rounded-xl overflow-hidden hover:ring-1 hover:ring-red-600/50 transition"
            >
              <div className={`aspect-video bg-gradient-to-br ${video.gradient} relative flex items-center justify-center`}>
                <div className="opacity-0 group-hover:opacity-100 transition absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-12 h-12 bg-red-600/90 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20"><polygon points="7,4 16,10 7,16" /></svg>
                  </div>
                </div>
                <span className="absolute bottom-2 right-2 bg-black/80 text-xs text-white px-2 py-0.5 rounded font-mono">
                  {video.duration}
                </span>
              </div>
              <div className="p-3">
                <h3 className="font-bold text-sm text-white group-hover:text-red-400 transition line-clamp-2">{video.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{video.artist}</p>
                <p className="text-xs text-gray-600 mt-1">{formatViews(video.views)} views &middot; {video.date}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
