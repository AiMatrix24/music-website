'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// --- Mock Data ---
const REGIONS = [
  { name: 'North America', listeners: 18, color: 'bg-red-600' },
  { name: 'Europe', listeners: 12, color: 'bg-red-500' },
  { name: 'Asia', listeners: 8, color: 'bg-red-400' },
  { name: 'South America', listeners: 5, color: 'bg-red-400/70' },
  { name: 'Africa', listeners: 2, color: 'bg-red-300/50' },
  { name: 'Oceania', listeners: 2, color: 'bg-red-300/40' },
];

const NOW_PLAYING = [
  { title: 'Midnight Hour', artist: 'You', listeners: 14, trend: 'up' },
  { title: 'Neon Nights', artist: 'You', listeners: 11, trend: 'up' },
  { title: 'Broken Glass', artist: 'You', listeners: 9, trend: 'down' },
  { title: 'Echoes', artist: 'You', listeners: 7, trend: 'stable' },
  { title: 'Summertime Blues', artist: 'You', listeners: 6, trend: 'up' },
];

const HOURLY_PEAKS = [
  12, 8, 5, 3, 2, 4, 10, 18, 32, 45, 52, 48,
  44, 47, 42, 38, 35, 40, 46, 50, 47, 38, 28, 18,
];

const SUPERFANS_ONLINE = [
  { name: 'Sarah K.', avatar: 'S', track: 'Midnight Hour', since: '12 min ago' },
  { name: 'Marcus T.', avatar: 'M', track: 'Neon Nights', since: '8 min ago' },
  { name: 'Jade W.', avatar: 'J', track: 'Echoes', since: '22 min ago' },
  { name: 'Deon R.', avatar: 'D', track: 'Broken Glass', since: '5 min ago' },
  { name: 'Priya M.', avatar: 'P', track: 'Midnight Hour', since: '3 min ago' },
];

export default function LiveListenersPage() {
  const { data: session, status } = useSession();
  const [totalListeners, setTotalListeners] = useState(47);
  const [streamsPerMin, setStreamsPerMin] = useState(3.2);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [countdown, setCountdown] = useState(30);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setTotalListeners((v) => v + Math.floor(Math.random() * 5) - 2);
          setStreamsPerMin(+(Math.random() * 2 + 2).toFixed(1));
          setLastRefresh(new Date());
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading live data...</div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Sign in to view live listeners</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const maxPeak = Math.max(...HOURLY_PEAKS);
  const newFollowersToday = 23;
  const tipsToday = 14.50;

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">
              ← Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Live Now</h1>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
            </div>
            <p className="text-gray-400 mt-1">
              <span className="text-white font-bold text-xl">{totalListeners}</span> listening right now
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Updates every 30 seconds ({countdown}s)
          </div>
        </div>

        {/* Live Stats Ticker */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Current Listeners" value={String(totalListeners)} icon="🎧" accent />
          <StatCard label="Streams / Min" value={String(streamsPerMin)} icon="⚡" />
          <StatCard label="New Followers Today" value={`+${newFollowersToday}`} icon="📈" accent />
          <StatCard label="Tips Today" value={`$${tipsToday.toFixed(2)}`} icon="💰" />
        </div>

        {/* Geographic Heat Map */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Listener Geography</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {REGIONS.map((region) => {
              const intensity = Math.max(0.2, region.listeners / 20);
              return (
                <div
                  key={region.name}
                  className="rounded-xl border border-brand-800/20 p-4 transition hover:border-red-600/30"
                  style={{ backgroundColor: `rgba(220, 38, 38, ${intensity * 0.15})` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">{region.name}</span>
                    <span className={`w-3 h-3 rounded-full ${region.color}`} />
                  </div>
                  <div className="text-2xl font-bold">{region.listeners}</div>
                  <div className="text-xs text-gray-500">listeners</div>
                  <div className="mt-2 h-1.5 rounded-full bg-brand-950/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-600 transition-all duration-500"
                      style={{ width: `${(region.listeners / 20) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Currently Playing */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Currently Playing</h2>
          <div className="space-y-3">
            {NOW_PLAYING.map((track, i) => (
              <div key={track.title} className="flex items-center justify-between rounded-xl bg-brand-950/50 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-6 font-mono">{i + 1}</span>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                    <span className="text-xs">♫</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{track.title}</p>
                    <p className="text-xs text-gray-500">{track.artist}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">{track.listeners}</span>
                  <span className="text-xs text-gray-500">listeners</span>
                  <span className={`text-xs ${track.trend === 'up' ? 'text-green-400' : track.trend === 'down' ? 'text-red-400' : 'text-gray-500'}`}>
                    {track.trend === 'up' ? '↑' : track.trend === 'down' ? '↓' : '→'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Peak Listeners Chart */}
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
            <h2 className="text-lg font-bold mb-4">Peak Listeners Today</h2>
            <div className="h-40 flex items-end gap-px">
              {HOURLY_PEAKS.map((val, i) => (
                <div key={i} className="flex-1 group relative">
                  <div
                    className="w-full rounded-t bg-red-600/70 hover:bg-red-500 transition-all cursor-pointer"
                    style={{ height: `${(val / maxPeak) * 100}%` }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-brand-950 text-xs text-white px-2 py-1 rounded whitespace-nowrap">
                    {i}:00 — {val}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>11 PM</span>
            </div>
          </div>

          {/* Device Breakdown */}
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
            <h2 className="text-lg font-bold mb-4">Device Breakdown</h2>
            <div className="space-y-4">
              {[
                { device: 'Mobile', pct: 54, icon: '📱' },
                { device: 'Desktop', pct: 32, icon: '💻' },
                { device: 'Smart Speaker', pct: 14, icon: '🔊' },
              ].map((d) => (
                <div key={d.device}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm flex items-center gap-2">
                      <span>{d.icon}</span> {d.device}
                    </span>
                    <span className="text-sm font-bold">{d.pct}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-brand-950/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-600 transition-all duration-700"
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Superfans */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
          <h2 className="text-lg font-bold mb-4">Active Superfans Right Now</h2>
          <div className="space-y-3">
            {SUPERFANS_ONLINE.map((fan) => (
              <div key={fan.name} className="flex items-center justify-between rounded-xl bg-brand-950/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-sm font-bold">
                      {fan.avatar}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#15151f]" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{fan.name}</p>
                    <p className="text-xs text-gray-500">Listening since {fan.since}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-300">{fan.track}</p>
                  <p className="text-xs text-green-400">Now playing</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg">{icon}</span>
        {accent && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
      </div>
      <p className={`text-2xl font-bold ${accent ? 'text-red-500' : ''}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
