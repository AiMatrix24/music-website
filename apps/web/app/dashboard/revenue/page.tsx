'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

// --- Mock Data ---
const REVENUE_SOURCES = [
  { label: 'Subscriptions', amount: 4280.50, color: 'bg-red-600' },
  { label: 'Ticket Sales', amount: 3150.00, color: 'bg-red-500' },
  { label: 'Marketplace', amount: 1820.75, color: 'bg-red-400' },
  { label: 'Tips', amount: 640.25, color: 'bg-red-300' },
];

const PER_TRACK_EARNINGS = [
  { title: 'Midnight Drive', plays: 48200, revenue: 192.80, rpp: 0.0040 },
  { title: 'Neon Skyline', plays: 35600, revenue: 142.40, rpp: 0.0040 },
  { title: 'Low Frequency', plays: 29100, revenue: 116.40, rpp: 0.0040 },
  { title: 'Crystal Waves', plays: 22400, revenue: 89.60, rpp: 0.0040 },
  { title: 'After Hours', plays: 18700, revenue: 74.80, rpp: 0.0040 },
  { title: 'Ghost Signal', plays: 15300, revenue: 61.20, rpp: 0.0040 },
  { title: 'Velvet Echo', plays: 12800, revenue: 51.20, rpp: 0.0040 },
];

const MONTHLY_REVENUE = [
  { month: 'Apr', amount: 620 },
  { month: 'May', amount: 780 },
  { month: 'Jun', amount: 950 },
  { month: 'Jul', amount: 1120 },
  { month: 'Aug', amount: 870 },
  { month: 'Sep', amount: 1340 },
  { month: 'Oct', amount: 1050 },
  { month: 'Nov', amount: 1480 },
  { month: 'Dec', amount: 1620 },
  { month: 'Jan', amount: 1380 },
  { month: 'Feb', amount: 1550 },
  { month: 'Mar', amount: 1890 },
];

const PAYOUT_HISTORY = [
  { date: '2026-03-15', amount: 1890.00, status: 'completed' as const, txHash: '0x7a3f...e21b' },
  { date: '2026-02-15', amount: 1550.00, status: 'completed' as const, txHash: '0x4c8d...b9f3' },
  { date: '2026-01-15', amount: 1380.00, status: 'completed' as const, txHash: '0x9e2a...d7c4' },
  { date: '2025-12-15', amount: 1620.00, status: 'completed' as const, txHash: '0x1b5f...a8e6' },
  { date: '2025-11-15', amount: 1480.00, status: 'pending' as const, txHash: '0x6d4c...f2a9' },
];

export default function RevenuePage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading revenue data...</div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Sign in to view revenue</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const totalEarned = REVENUE_SOURCES.reduce((s, r) => s + r.amount, 0);
  const maxSource = Math.max(...REVENUE_SOURCES.map((r) => r.amount));
  const maxMonthly = Math.max(...MONTHLY_REVENUE.map((m) => m.amount));

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Revenue &amp; Royalties</h1>
          <p className="text-gray-400 mt-1">Track your earnings across all sources</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Earned" value={`$${totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} sub="All time" />
          <StatCard label="Pending" value="$342.50" sub="Next payout" accent />
          <StatCard label="Last Payout" value="$1,890.00" sub="Mar 15, 2026" />
          <StatCard label="Lifetime" value="$9,891.50" sub="Since joined" />
        </div>

        {/* Revenue by Source */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-lg font-bold mb-6">Revenue by Source</h2>
          <div className="space-y-4">
            {REVENUE_SOURCES.map((source) => (
              <button
                key={source.label}
                onClick={() => setSelectedSource(selectedSource === source.label ? null : source.label)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${selectedSource === source.label ? 'text-white' : 'text-gray-300'}`}>
                    {source.label}
                  </span>
                  <span className="text-sm text-gray-400">${source.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="h-3 rounded-full bg-brand-900/50 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${source.color} transition-all duration-500`}
                    style={{ width: `${(source.amount / maxSource) * 100}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Per-Track Earnings */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Per-Track Earnings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-800/30">
                  <th className="text-left py-3 px-2 text-gray-400 font-medium">#</th>
                  <th className="text-left py-3 px-2 text-gray-400 font-medium">Track</th>
                  <th className="text-right py-3 px-2 text-gray-400 font-medium">Plays</th>
                  <th className="text-right py-3 px-2 text-gray-400 font-medium">Revenue</th>
                  <th className="text-right py-3 px-2 text-gray-400 font-medium">RPP</th>
                </tr>
              </thead>
              <tbody>
                {PER_TRACK_EARNINGS.map((track, i) => (
                  <tr key={track.title} className="border-b border-brand-800/10 hover:bg-brand-900/20 transition">
                    <td className="py-3 px-2 text-gray-500">{i + 1}</td>
                    <td className="py-3 px-2 font-medium text-white">{track.title}</td>
                    <td className="py-3 px-2 text-right text-gray-300">{track.plays.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right text-green-400">${track.revenue.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right text-gray-400">${track.rpp.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-lg font-bold mb-6">Monthly Revenue</h2>
          <div className="h-48 flex items-end gap-2">
            {MONTHLY_REVENUE.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-400">${m.amount}</span>
                <div
                  className="w-full rounded-t bg-gradient-to-t from-red-700 to-red-500 transition-all duration-500 hover:from-red-600 hover:to-red-400"
                  style={{ height: `${(m.amount / maxMonthly) * 100}%` }}
                />
                <span className="text-xs text-gray-500 mt-1">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payout History */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Payout History</h2>
            <span className="inline-flex items-center gap-1.5 text-xs bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              All payouts verified on Polygon
            </span>
          </div>
          <div className="space-y-3">
            {PAYOUT_HISTORY.map((payout, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-brand-950/50 p-4">
                <div>
                  <p className="font-medium text-white">${payout.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  <p className="text-sm text-gray-400">{new Date(payout.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    payout.status === 'completed'
                      ? 'bg-green-600/20 text-green-400'
                      : 'bg-yellow-600/20 text-yellow-400'
                  }`}>
                    {payout.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(payout.txHash);
                      toast('Transaction hash copied!');
                    }}
                    className="text-xs text-gray-500 hover:text-white font-mono transition"
                    title="Copy full hash"
                  >
                    {payout.txHash}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-red-400' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
