'use client';

import Link from 'next/link';
import { useState } from 'react';

const liveStreams = [
  {
    id: 1,
    artist: 'KAEL',
    title: 'Late Night Synth Session',
    viewers: 1243,
    gradient: 'from-red-600 to-purple-800',
    started: '42 min ago',
  },
  {
    id: 2,
    artist: 'Luna Voss',
    title: 'New Album Listening Party',
    viewers: 3891,
    gradient: 'from-pink-600 to-red-800',
    started: '1h 15m ago',
  },
  {
    id: 3,
    artist: 'Prism Collective',
    title: 'Jazz Fusion Jam - Open Collab',
    viewers: 672,
    gradient: 'from-amber-600 to-orange-800',
    started: '28 min ago',
  },
];

const upcomingStreams = [
  { id: 1, artist: 'DVRK MATTER', title: 'Freestyle Friday', date: 'Mar 28, 2026', time: '8:00 PM EST', reminded: false },
  { id: 2, artist: 'Aria Frost', title: 'Studio Session: New EP Preview', date: 'Mar 29, 2026', time: '3:00 PM EST', reminded: false },
  { id: 3, artist: 'The Koda', title: 'Acoustic Unplugged Set', date: 'Mar 30, 2026', time: '7:00 PM EST', reminded: false },
  { id: 4, artist: 'Sage & the Saints', title: 'Songwriting Workshop', date: 'Apr 1, 2026', time: '5:00 PM EST', reminded: false },
  { id: 5, artist: 'Mira Chen', title: 'Pop Production Masterclass', date: 'Apr 3, 2026', time: '2:00 PM EST', reminded: false },
];

const pastStreams = [
  { id: 1, artist: 'KAEL', title: 'Beat Making Marathon', views: 12400, duration: '2h 34m', gradient: 'from-blue-600 to-indigo-800' },
  { id: 2, artist: 'Luna Voss', title: 'Fan Q&A + Acoustic Covers', views: 8900, duration: '1h 12m', gradient: 'from-pink-600 to-rose-800' },
  { id: 3, artist: 'Hex Theory', title: 'Post-Punk Noise Experiment', views: 5300, duration: '1h 45m', gradient: 'from-violet-600 to-purple-800' },
  { id: 4, artist: 'Oceanic', title: 'Lo-Fi Chill Vibes', views: 15600, duration: '3h 10m', gradient: 'from-teal-600 to-cyan-800' },
  { id: 5, artist: 'DVRK MATTER', title: 'Cypher Night Vol. 3', views: 21200, duration: '2h 05m', gradient: 'from-orange-600 to-red-800' },
  { id: 6, artist: 'Prism Collective', title: 'Live from Jazz Cafe', views: 7100, duration: '1h 30m', gradient: 'from-amber-600 to-yellow-800' },
];

function formatViewers(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

export default function LivePage() {
  const [reminders, setReminders] = useState<Set<number>>(new Set());

  const toggleReminder = (id: number) => {
    setReminders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <span className="text-red-400 text-sm font-semibold uppercase tracking-wider">Live on OPYNX</span>
        </div>
        <h1 className="text-4xl font-bold mb-3">Live Streaming</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Watch artists perform live, join listening parties, and connect with creators in real-time.
        </p>
      </div>

      {/* Currently Live */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-bold">Currently Live</h2>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-sm text-gray-400">{liveStreams.length} streams</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveStreams.map((stream) => (
            <div
              key={stream.id}
              className="rounded-xl bg-[#15151f] overflow-hidden transition hover:bg-[#1a1a2e] cursor-pointer group"
            >
              {/* Thumbnail */}
              <div className={`relative h-44 bg-gradient-to-br ${stream.gradient}`}>
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 px-2.5 py-1 rounded-full text-xs font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                  </span>
                  LIVE
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-full text-xs">
                  👁 {formatViewers(stream.viewers)}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-2xl ml-1">▶</span>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold truncate">{stream.title}</h3>
                <p className="text-sm text-gray-400">{stream.artist}</p>
                <p className="text-xs text-gray-500 mt-1">Started {stream.started}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Streams */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-6">Upcoming Streams</h2>
        <div className="space-y-3">
          {upcomingStreams.map((stream) => (
            <div
              key={stream.id}
              className="flex items-center gap-4 rounded-xl bg-[#15151f] p-4 transition hover:bg-[#1a1a2e]"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-600/30 to-red-900/30 flex items-center justify-center text-lg">
                📅
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{stream.title}</p>
                <p className="text-sm text-gray-400">{stream.artist}</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-300">{stream.date}</p>
                <p className="text-xs text-gray-500">{stream.time}</p>
              </div>
              <button
                onClick={() => toggleReminder(stream.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  reminders.has(stream.id)
                    ? 'bg-red-600/20 text-red-400 border border-red-600/30'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {reminders.has(stream.id) ? '🔔 Reminded' : 'Set Reminder'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Past Streams */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-6">Past Streams</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pastStreams.map((stream) => (
            <div
              key={stream.id}
              className="rounded-xl bg-[#15151f] overflow-hidden transition hover:bg-[#1a1a2e] cursor-pointer group"
            >
              <div className={`relative h-36 bg-gradient-to-br ${stream.gradient}`}>
                <div className="absolute top-3 left-3 bg-black/50 px-2.5 py-1 rounded-full text-xs font-medium">
                  ▶ Replay
                </div>
                <div className="absolute bottom-3 right-3 bg-black/50 px-2.5 py-1 rounded-full text-xs">
                  {stream.duration}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-xl ml-0.5">▶</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold truncate text-sm">{stream.title}</h3>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-400">{stream.artist}</p>
                  <p className="text-xs text-gray-500">{formatViewers(stream.views)} views</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Start Streaming (Creator Section) */}
      <section className="rounded-xl bg-[#15151f] p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-3">Start Streaming</h2>
            <p className="text-gray-400 mb-6">
              Go live on OPYNX and connect with your fans in real-time. Stream directly from your browser or use OBS for professional setups.
            </p>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
              </span>
              Go Live
            </Link>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm text-gray-400 uppercase tracking-wider">OBS Setup</h3>
            <div className="space-y-3">
              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-sm font-medium mb-1">Stream Key</p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    readOnly
                    value="sk_live_xxxxxxxxxxxxxxxxxxxx"
                    className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-400 font-mono"
                  />
                  <button className="px-3 py-2 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10 transition">
                    Show
                  </button>
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-sm font-medium mb-1">Server URL</p>
                <code className="text-sm text-gray-400 font-mono">rtmp://live.opynx.com/stream</code>
              </div>
              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-sm font-medium mb-2">Quick Setup Steps</p>
                <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Open OBS Studio and go to Settings &gt; Stream</li>
                  <li>Select &quot;Custom&quot; as the service</li>
                  <li>Paste the Server URL and Stream Key above</li>
                  <li>Set output resolution to 1080p, 30fps recommended</li>
                  <li>Click &quot;Start Streaming&quot; in OBS</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
