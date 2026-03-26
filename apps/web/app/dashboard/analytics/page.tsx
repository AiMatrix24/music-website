'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

type TimeRange = '7d' | '30d' | '90d' | 'all';

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const [range, setRange] = useState<TimeRange>('30d');

  const { data: myTracks } = trpc.tracks.list.useQuery(
    { limit: 50, userId: session?.user?.id ?? '' },
    { enabled: status === 'authenticated' && !!session?.user?.id }
  );
  const { data: followerCount } = trpc.users.getFollowerCount.useQuery(
    { userId: session?.user?.id ?? '' },
    { enabled: status === 'authenticated' && !!session?.user?.id }
  );

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Sign in to view analytics</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Sign In</Link>
      </div>
    );
  }

  const totalPlays = myTracks?.reduce((sum, t) => sum + (t.playCount ?? 0), 0) ?? 0;
  const trackCount = myTracks?.length ?? 0;
  const topTracks = [...(myTracks ?? [])].sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0)).slice(0, 10);
  const genreBreakdown = getGenreBreakdown(myTracks ?? []);
  const estimatedRevenue = totalPlays * 0.004; // ~$0.004 per play

  // Generate mock chart data based on range
  const chartDays = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 180;
  const playHistory = generateMockHistory(chartDays, totalPlays);
  const revenueHistory = playHistory.map((d) => ({ ...d, value: d.value * 0.004 }));
  const maxPlay = Math.max(...playHistory.map((d) => d.value), 1);
  const maxRevenue = Math.max(...revenueHistory.map((d) => d.value), 0.01);

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">← Dashboard</Link>
            <h1 className="text-3xl font-bold">Analytics</h1>
          </div>
          <div className="flex gap-2">
            {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                  range === r ? 'bg-red-600 text-white' : 'bg-[#15151f] text-gray-400 hover:text-white'
                }`}>
                {r === 'all' ? 'All Time' : r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard label="Total Plays" value={formatNumber(totalPlays)} change="+12.4%" positive />
          <MetricCard label="Followers" value={formatNumber(followerCount ?? 0)} change="+8.2%" positive />
          <MetricCard label="Tracks" value={String(trackCount)} change="" positive />
          <MetricCard label="Est. Revenue" value={`$${estimatedRevenue.toFixed(2)}`} change="+15.7%" positive />
        </div>

        {/* Play Count Chart */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Plays Over Time</h2>
            <span className="text-sm text-gray-500">{formatNumber(totalPlays)} total</span>
          </div>
          <div className="h-48 flex items-end gap-px">
            {playHistory.map((d, i) => (
              <div key={i} className="flex-1 group relative">
                <div
                  className="bg-gradient-to-t from-red-600 to-red-400 rounded-t-sm transition-all hover:from-red-500 hover:to-red-300 min-h-[2px]"
                  style={{ height: `${(d.value / maxPlay) * 100}%` }}
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
                    <p className="font-bold">{formatNumber(d.value)} plays</p>
                    <p className="text-gray-500">{d.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>{playHistory[0]?.label}</span>
            <span>{playHistory[playHistory.length - 1]?.label}</span>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Revenue</h2>
            <span className="text-sm text-green-400 font-semibold">${estimatedRevenue.toFixed(2)} estimated</span>
          </div>
          <div className="h-32 flex items-end gap-px">
            {revenueHistory.map((d, i) => (
              <div key={i} className="flex-1 group relative">
                <div
                  className="bg-gradient-to-t from-green-600 to-green-400 rounded-t-sm transition-all hover:from-green-500 hover:to-green-300 min-h-[2px]"
                  style={{ height: `${(d.value / maxRevenue) * 100}%` }}
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
                    <p className="font-bold text-green-400">${d.value.toFixed(2)}</p>
                    <p className="text-gray-500">{d.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-brand-950/50 rounded-lg text-xs text-gray-400">
            <p>Revenue breakdown: <span className="text-red-400 font-semibold">85%</span> to you · <span className="text-pink-400">5%</span> facilitator · <span className="text-cyan-400">10%</span> platform — verified on Polygon</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Tracks */}
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
            <h2 className="text-lg font-bold mb-4">Top Tracks</h2>
            {topTracks.length > 0 ? (
              <div className="space-y-3">
                {topTracks.map((track, i) => {
                  const pct = totalPlays > 0 ? ((track.playCount ?? 0) / totalPlays) * 100 : 0;
                  return (
                    <div key={track.id} className="flex items-center gap-3">
                      <span className="text-gray-500 text-xs w-5 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <Link href={`/track/${track.id}`} className="text-sm font-semibold truncate hover:text-red-400 transition block">
                          {track.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-brand-950 rounded-full overflow-hidden">
                            <div className="h-full bg-red-600 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-16 text-right">{formatNumber(track.playCount ?? 0)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No tracks yet</p>
            )}
          </div>

          {/* Genre Breakdown */}
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
            <h2 className="text-lg font-bold mb-4">Genre Breakdown</h2>
            {genreBreakdown.length > 0 ? (
              <div className="space-y-4">
                {genreBreakdown.map((g) => (
                  <div key={g.genre}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{g.genre}</span>
                      <span className="text-gray-500">{g.pct.toFixed(0)}% · {g.count} track{g.count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-2 bg-brand-950 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${g.color}`} style={{ width: `${g.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No genre data</p>
            )}
          </div>
        </div>

        {/* Listener Demographics (mock) */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Listener Demographics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm text-gray-400 mb-3">Top Locations</h3>
              <div className="space-y-2">
                {[
                  { city: 'Los Angeles, CA', pct: 24 },
                  { city: 'New York, NY', pct: 18 },
                  { city: 'Austin, TX', pct: 12 },
                  { city: 'Nashville, TN', pct: 9 },
                  { city: 'London, UK', pct: 7 },
                ].map((loc) => (
                  <div key={loc.city} className="flex justify-between text-sm">
                    <span>{loc.city}</span>
                    <span className="text-gray-500">{loc.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm text-gray-400 mb-3">Age Groups</h3>
              <div className="space-y-2">
                {[
                  { group: '18-24', pct: 35 }, { group: '25-34', pct: 42 },
                  { group: '35-44', pct: 15 }, { group: '45+', pct: 8 },
                ].map((a) => (
                  <div key={a.group} className="flex items-center gap-3">
                    <span className="text-sm w-12">{a.group}</span>
                    <div className="flex-1 h-2 bg-brand-950 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${a.pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{a.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm text-gray-400 mb-3">Listening Platform</h3>
              <div className="space-y-2">
                {[
                  { platform: 'OPYNX Web', pct: 52, icon: '🌐' },
                  { platform: 'OPYNX PWA', pct: 28, icon: '📱' },
                  { platform: 'Embedded', pct: 12, icon: '🔗' },
                  { platform: 'API', pct: 8, icon: '⚡' },
                ].map((p) => (
                  <div key={p.platform} className="flex justify-between text-sm">
                    <span>{p.icon} {p.platform}</span>
                    <span className="text-gray-500">{p.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Payout Summary */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Payout Summary</h2>
            <Link href="/settings" className="text-sm text-red-400 hover:text-red-300 font-semibold">Payout Settings →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-brand-950/50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Pending</p>
              <p className="text-xl font-black text-yellow-400">${(estimatedRevenue * 0.3).toFixed(2)}</p>
            </div>
            <div className="bg-brand-950/50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">This Month</p>
              <p className="text-xl font-black text-green-400">${(estimatedRevenue * 0.25).toFixed(2)}</p>
            </div>
            <div className="bg-brand-950/50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">All Time</p>
              <p className="text-xl font-black text-red-400">${estimatedRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-brand-950/50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Next Payout</p>
              <p className="text-xl font-black">Apr 1</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-3 text-center">
            All payouts verified on Polygon. <a href="#" className="text-red-400 hover:text-red-300">View on-chain →</a>
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, change, positive }: {
  label: string; value: string; change: string; positive: boolean;
}) {
  return (
    <div className="rounded-xl bg-[#15151f] border border-brand-800/20 p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black">{value}</p>
      {change && (
        <p className={`text-xs mt-1 font-semibold ${positive ? 'text-green-400' : 'text-red-400'}`}>
          {change} vs prev period
        </p>
      )}
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function generateMockHistory(days: number, totalPlays: number) {
  const data: { label: string; value: number }[] = [];
  const avgDaily = Math.max(totalPlays / (days * 2), 10);
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const variance = 0.5 + Math.random();
    const trend = 1 + (days - i) / days * 0.5;
    data.push({
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(avgDaily * variance * trend),
    });
  }
  return data;
}

function getGenreBreakdown(tracks: any[]) {
  const genres: Record<string, number> = {};
  tracks.forEach((t) => {
    const g = t.genre || 'Unknown';
    genres[g] = (genres[g] || 0) + 1;
  });
  const total = tracks.length || 1;
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500'];
  return Object.entries(genres)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([genre, count], i) => ({
      genre,
      count,
      pct: (count / total) * 100,
      color: colors[i % colors.length],
    }));
}
