'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

type TimeRange = 'today' | '7d' | '30d' | '90d' | 'all';

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

  // Real timeseries from track_plays (logged by the audio player after 30s
  // of continuous play). Backend returns same-length window for the prior
  // period too so we can compute a real "+X% vs prev period" delta.
  //
  // 'today' tab uses a separate procedure that buckets by hour and pivots
  // on UTC midnight; the others bucket by day.
  const chartDays = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 180;
  const isToday = range === 'today';
  const { data: timeseries } = trpc.tracks.playsTimeseries.useQuery(
    { days: chartDays },
    { enabled: status === 'authenticated' && !isToday }
  );
  const { data: todayseries } = trpc.tracks.playsToday.useQuery(undefined, {
    enabled: status === 'authenticated' && isToday,
  });

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

  // Chart data — Today tab uses hourly buckets; other tabs use daily.
  const playHistory = isToday
    ? (todayseries?.current ?? []).map((d) => ({ value: d.count, label: d.label }))
    : (timeseries?.current ?? []).map((d) => ({
        value: d.count,
        label: new Date(d.date + 'T00:00:00Z').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      }));
  const periodPlays = isToday
    ? todayseries?.currentTotal ?? 0
    : timeseries?.currentTotal ?? 0;
  const previousPeriodPlays = isToday
    ? todayseries?.previousTotal ?? 0
    : timeseries?.previousTotal ?? 0;
  const playsDelta =
    previousPeriodPlays > 0
      ? ((periodPlays - previousPeriodPlays) / previousPeriodPlays) * 100
      : null;
  const maxPlay = Math.max(...playHistory.map((d) => d.value), 1);

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">← Dashboard</Link>
            <h1 className="text-3xl font-bold">Analytics</h1>
          </div>
          <div className="flex gap-2">
            {(['today', '7d', '30d', '90d', 'all'] as TimeRange[]).map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                  range === r ? 'bg-red-600 text-white' : 'bg-[#15151f] text-gray-400 hover:text-white'
                }`}>
                {r === 'all' ? 'All Time' : r === 'today' ? 'Today' : r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics. Total Plays delta is computed from the real
            timeseries (current period vs prior period of equal length).
            Other metrics (Followers, Revenue) don't have historical
            snapshots yet, so we don't fake a +X% indicator. */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Total Plays"
            value={formatNumber(totalPlays)}
            change={playsDelta == null ? '' : `${playsDelta >= 0 ? '+' : ''}${playsDelta.toFixed(1)}% vs ${isToday ? 'yesterday by now' : `prev ${range}`}`}
            positive={playsDelta == null || playsDelta >= 0}
          />
          <MetricCard label="Followers" value={formatNumber(followerCount ?? 0)} change="" positive />
          <MetricCard label="Tracks" value={String(trackCount)} change="" positive />
          <MetricCard
            label={isToday ? 'Plays today' : `Plays this ${range}`}
            value={formatNumber(periodPlays)}
            change=""
            positive
          />
        </div>

        {/* Play Count Chart — real per-day (or per-hour for Today) data
            from track_plays */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">{isToday ? 'Plays Today (by hour, UTC)' : 'Plays Over Time'}</h2>
            <span className="text-sm text-gray-500">
              {formatNumber(periodPlays)} {isToday ? 'today' : `in last ${range === 'all' ? '180 days' : range}`}
            </span>
          </div>
          {playHistory.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-12">No plays in this period yet.</p>
          ) : (
            <>
              {/* Wrapper has h-full + flex-col + justify-end so the bar
                  inside has a definite-height parent for its `%` height to
                  resolve against. Without this the bar collapses to 0px
                  (auto-height parent → undefined % child). */}
              <div className="h-48 flex items-end gap-px">
                {playHistory.map((d, i) => (
                  <div key={i} className="flex-1 h-full flex flex-col justify-end group relative">
                    <div
                      className="bg-gradient-to-t from-red-600 to-red-400 rounded-t-sm transition-all hover:from-red-500 hover:to-red-300 min-h-[2px] w-full"
                      style={{ height: `${(d.value / maxPlay) * 100}%` }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                      <div className="bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
                        <p className="font-bold">{formatNumber(d.value)} play{d.value === 1 ? '' : 's'}</p>
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
              <p className="text-xs text-gray-600 mt-3">
                Plays logged after 30 seconds of continuous listening (filters out skips).
              </p>
            </>
          )}
        </div>

        {/* Revenue chart removed — was charting an estimate ($0.004 × plays)
            with no relation to actual subscription revenue or commissions.
            Real revenue lives at /dashboard/earnings, which already pulls
            from the commissions + tips + sales tables. */}

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

        {/* Listener Demographics removed — was 100% mock (hardcoded
            "Los Angeles 24%, NY 18%…"). Real demographic data needs:
              - Locations: from sub attribution.scanLat/scanLng (which we
                started capturing in the QR flow) + IP geolocation on plays.
              - Age groups: requires a self-reported birth year on signup
                (not currently collected).
              - Platform: needs the play-log endpoint to capture user-agent.
            All separate data-collection projects; will return when wired. */}

        {/* Payout summary lives at /dashboard/earnings — that page already
            queries real commissions, tips, and ticket / track / merch sales.
            Was previously faked here as estimatedRevenue × {0.3, 0.25, 1}. */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 text-center">
          <h2 className="text-lg font-bold mb-2">Real revenue + payouts</h2>
          <p className="text-sm text-gray-400 mb-4">
            Live earnings, commission breakdown, and payout status are on a dedicated page.
          </p>
          <Link
            href="/dashboard/earnings"
            className="inline-block rounded-full bg-red-600 hover:bg-red-500 px-6 py-2.5 text-sm font-bold text-white transition"
          >
            Go to Earnings →
          </Link>
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
