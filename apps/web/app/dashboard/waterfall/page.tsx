'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

// --- Mock Data ---
const LIFETIME_EARNED = 9891.50;
const THIS_MONTH = 1890.00;
const PENDING = 342.75;
const NEXT_PAYOUT = 'Apr 15, 2026';

const WATERFALL_SPLIT = {
  fanPayment: 8.73,
  artist: 1.00,
  facilitator: 0.33,
  platform: 7.40,
};

const LIVE_TRANSACTIONS = [
  { id: 1, amount: 4.99, source: 'Subscription', timestamp: '2m ago', txHash: '0x7a3f8b2c...e21b4d', status: 'confirmed' as const },
  { id: 2, amount: 25.00, source: 'Ticket', timestamp: '8m ago', txHash: '0x4c8d1e9a...b9f312', status: 'confirmed' as const },
  { id: 3, amount: 12.50, source: 'Merch', timestamp: '15m ago', txHash: '0x9e2a5f7d...d7c4a8', status: 'pending' as const },
  { id: 4, amount: 4.99, source: 'Subscription', timestamp: '22m ago', txHash: '0x1b5f3c6e...a8e6f2', status: 'confirmed' as const },
  { id: 5, amount: 35.00, source: 'Ticket', timestamp: '31m ago', txHash: '0x6d4c9b2a...f2a91c', status: 'confirmed' as const },
  { id: 6, amount: 4.99, source: 'Subscription', timestamp: '45m ago', txHash: '0x3e7a1d5b...c8b4e7', status: 'confirmed' as const },
  { id: 7, amount: 8.00, source: 'Merch', timestamp: '1h ago', txHash: '0x5f2c8a4d...e1d9a3', status: 'confirmed' as const },
  { id: 8, amount: 4.99, source: 'Subscription', timestamp: '1h ago', txHash: '0x2d6b9e3f...a7c5b1', status: 'pending' as const },
];

interface MonthlyData {
  month: string;
  subscriptions: number;
  tickets: number;
  merch: number;
}

const MONTHLY_DATA: MonthlyData[] = [
  { month: 'Apr', subscriptions: 320, tickets: 200, merch: 100 },
  { month: 'May', subscriptions: 380, tickets: 250, merch: 150 },
  { month: 'Jun', subscriptions: 450, tickets: 300, merch: 200 },
  { month: 'Jul', subscriptions: 520, tickets: 350, merch: 250 },
  { month: 'Aug', subscriptions: 410, tickets: 280, merch: 180 },
  { month: 'Sep', subscriptions: 580, tickets: 420, merch: 340 },
  { month: 'Oct', subscriptions: 490, tickets: 320, merch: 240 },
  { month: 'Nov', subscriptions: 620, tickets: 480, merch: 380 },
  { month: 'Dec', subscriptions: 680, tickets: 520, merch: 420 },
  { month: 'Jan', subscriptions: 560, tickets: 440, merch: 380 },
  { month: 'Feb', subscriptions: 640, tickets: 500, merch: 410 },
  { month: 'Mar', subscriptions: 720, tickets: 600, merch: 570 },
];

const PIE_SEGMENTS = [
  { label: 'Subscriptions', pct: 48, color: '#dc2626' },
  { label: 'Tickets', pct: 32, color: '#7c3aed' },
  { label: 'Merch', pct: 20, color: '#2563eb' },
];

export default function WaterfallPage() {
  const { data: session, status } = useSession();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  if (status === 'loading') {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="rounded-2xl bg-[#15151f] h-48 animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="rounded-xl bg-[#15151f] h-28 animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-black mb-4">Sign In Required</h1>
          <p className="text-gray-400 mb-6">Sign in to view your revenue waterfall.</p>
          <Link href="/auth/login" className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const maxMonthly = Math.max(...MONTHLY_DATA.map((m) => m.subscriptions + m.tickets + m.merch));

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          &larr; Back to Dashboard
        </Link>

        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">Revenue Waterfall</h1>
          <p className="text-gray-400 mb-4">See exactly where every dollar flows.</p>
          <p className="text-5xl font-black text-green-400">${LIFETIME_EARNED.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-sm text-gray-500 mt-1">Lifetime Earnings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="rounded-xl bg-[#15151f] p-5">
            <p className="text-sm text-gray-400 mb-1">Lifetime Earned</p>
            <p className="text-2xl font-bold text-green-400">${LIFETIME_EARNED.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-xl bg-[#15151f] p-5">
            <p className="text-sm text-gray-400 mb-1">This Month</p>
            <p className="text-2xl font-bold">${THIS_MONTH.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-xl bg-[#15151f] p-5">
            <p className="text-sm text-gray-400 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-400">${PENDING.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-xl bg-[#15151f] p-5">
            <p className="text-sm text-gray-400 mb-1">Next Payout</p>
            <p className="text-2xl font-bold">{NEXT_PAYOUT}</p>
          </div>
        </div>

        {/* Waterfall Diagram */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Payment Flow</h2>
          <div className="rounded-2xl bg-[#15151f] p-6 sm:p-8">
            {/* Fan Payment */}
            <div className="text-center mb-6">
              <p className="text-sm text-gray-400 mb-2">Fan Payment</p>
              <div className="inline-block px-8 py-4 rounded-xl bg-white/10 border border-white/20">
                <p className="text-3xl font-black">${WATERFALL_SPLIT.fanPayment.toFixed(2)}</p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center mb-6">
              <div className="w-0.5 h-10 bg-gray-600 relative">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent border-t-gray-600" />
              </div>
            </div>

            {/* Split Bars */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-green-400">Artist</span>
                  <span className="text-sm font-bold text-green-400">${WATERFALL_SPLIT.artist.toFixed(2)}</span>
                </div>
                <div className="w-full h-8 rounded-lg bg-brand-950 overflow-hidden">
                  <div
                    className="h-full rounded-lg bg-green-600 transition-all duration-1000"
                    style={{ width: `${(WATERFALL_SPLIT.artist / WATERFALL_SPLIT.fanPayment) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-blue-400">Facilitator</span>
                  <span className="text-sm font-bold text-blue-400">${WATERFALL_SPLIT.facilitator.toFixed(2)}</span>
                </div>
                <div className="w-full h-8 rounded-lg bg-brand-950 overflow-hidden">
                  <div
                    className="h-full rounded-lg bg-blue-600 transition-all duration-1000"
                    style={{ width: `${(WATERFALL_SPLIT.facilitator / WATERFALL_SPLIT.fanPayment) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-gray-400">Platform</span>
                  <span className="text-sm font-bold text-gray-400">${WATERFALL_SPLIT.platform.toFixed(2)}</span>
                </div>
                <div className="w-full h-8 rounded-lg bg-brand-950 overflow-hidden">
                  <div
                    className="h-full rounded-lg bg-gray-600 transition-all duration-1000"
                    style={{ width: `${(WATERFALL_SPLIT.platform / WATERFALL_SPLIT.fanPayment) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <a
                href="https://polygonscan.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition text-sm font-semibold"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Verify on Polygon
              </a>
            </div>
          </div>
        </section>

        {/* Monthly Waterfall Chart */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Monthly Revenue Breakdown</h2>
          <div className="rounded-2xl bg-[#15151f] p-6">
            <div className="flex items-center gap-6 mb-6">
              <span className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-sm bg-red-600" />
                Subscriptions
              </span>
              <span className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-sm bg-purple-600" />
                Tickets
              </span>
              <span className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-sm bg-blue-600" />
                Merch
              </span>
            </div>
            <div className="flex items-end gap-2 h-64">
              {MONTHLY_DATA.map((month) => {
                const total = month.subscriptions + month.tickets + month.merch;
                const heightPct = (total / maxMonthly) * 100;
                const subPct = (month.subscriptions / total) * 100;
                const tickPct = (month.tickets / total) * 100;
                const merchPct = (month.merch / total) * 100;
                return (
                  <div
                    key={month.month}
                    className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
                    onClick={() => setSelectedMonth(selectedMonth === month.month ? null : month.month)}
                  >
                    <div
                      className="w-full rounded-t-lg overflow-hidden flex flex-col transition-all group-hover:opacity-80"
                      style={{ height: `${heightPct}%` }}
                    >
                      <div className="bg-red-600 flex-shrink-0" style={{ height: `${subPct}%` }} />
                      <div className="bg-purple-600 flex-shrink-0" style={{ height: `${tickPct}%` }} />
                      <div className="bg-blue-600 flex-shrink-0" style={{ height: `${merchPct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{month.month}</span>
                    {selectedMonth === month.month && (
                      <div className="absolute mt-1 px-3 py-2 rounded-lg bg-brand-950 border border-white/10 text-xs z-10 whitespace-nowrap shadow-xl">
                        <p className="font-bold mb-1">${total.toLocaleString()}</p>
                        <p className="text-red-400">Sub: ${month.subscriptions}</p>
                        <p className="text-purple-400">Tick: ${month.tickets}</p>
                        <p className="text-blue-400">Merch: ${month.merch}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Payout Split Pie Chart */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Revenue Sources</h2>
            <div className="rounded-2xl bg-[#15151f] p-6">
              <div className="w-48 h-48 mx-auto rounded-full relative mb-6" style={{
                background: `conic-gradient(
                  ${PIE_SEGMENTS[0].color} 0% ${PIE_SEGMENTS[0].pct}%,
                  ${PIE_SEGMENTS[1].color} ${PIE_SEGMENTS[0].pct}% ${PIE_SEGMENTS[0].pct + PIE_SEGMENTS[1].pct}%,
                  ${PIE_SEGMENTS[2].color} ${PIE_SEGMENTS[0].pct + PIE_SEGMENTS[1].pct}% 100%
                )`
              }}>
                <div className="absolute inset-6 rounded-full bg-[#15151f] flex items-center justify-center">
                  <p className="text-sm font-bold text-gray-400">100%</p>
                </div>
              </div>
              <div className="space-y-2">
                {PIE_SEGMENTS.map((seg) => (
                  <div key={seg.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: seg.color }} />
                      {seg.label}
                    </span>
                    <span className="text-sm font-semibold">{seg.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Live Transactions */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Live Transactions</h2>
            <div className="rounded-2xl bg-[#15151f] overflow-hidden max-h-[420px] overflow-y-auto">
              {LIVE_TRANSACTIONS.map((tx) => (
                <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/5 last:border-b-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                    tx.source === 'Subscription' ? 'bg-red-600/20 text-red-400' :
                    tx.source === 'Ticket' ? 'bg-purple-600/20 text-purple-400' :
                    'bg-blue-600/20 text-blue-400'
                  }`}>
                    {tx.source === 'Subscription' ? '$' : tx.source === 'Ticket' ? 'T' : 'M'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">${tx.amount.toFixed(2)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        tx.status === 'confirmed'
                          ? 'bg-green-600/20 text-green-400'
                          : 'bg-yellow-600/20 text-yellow-400'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{tx.source} &middot; {tx.timestamp}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="font-mono">{tx.txHash}</span>
                    <a
                      href={`https://polygonscan.com/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 transition"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
