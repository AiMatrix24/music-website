'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

// --- Mock Commission Data ---
const COMMISSIONS = [
  {
    date: '2026-03-28',
    source: 'Subscription' as const,
    amount: 12.50,
    tier: 'creator' as const,
    status: 'paid' as const,
    txHash: '0x7a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
  },
  {
    date: '2026-03-25',
    source: 'Ticket' as const,
    amount: 45.00,
    tier: 'facilitator' as const,
    status: 'approved' as const,
    txHash: '0x4c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
  },
  {
    date: '2026-03-20',
    source: 'Merch' as const,
    amount: 8.75,
    tier: 'outlier' as const,
    status: 'pending' as const,
    txHash: '0x9e2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a',
  },
  {
    date: '2026-03-15',
    source: 'Subscription' as const,
    amount: 25.00,
    tier: 'creator' as const,
    status: 'paid' as const,
    txHash: '0x1b5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f',
  },
  {
    date: '2026-03-10',
    source: 'Ticket' as const,
    amount: 67.50,
    tier: 'facilitator' as const,
    status: 'paid' as const,
    txHash: '0x6d4c5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
  },
];

const MONTHLY_EARNINGS = [
  { month: 'Apr', amount: 320 },
  { month: 'May', amount: 480 },
  { month: 'Jun', amount: 610 },
  { month: 'Jul', amount: 750 },
  { month: 'Aug', amount: 590 },
  { month: 'Sep', amount: 890 },
  { month: 'Oct', amount: 720 },
  { month: 'Nov', amount: 1050 },
  { month: 'Dec', amount: 1180 },
  { month: 'Jan', amount: 980 },
  { month: 'Feb', amount: 1120 },
  { month: 'Mar', amount: 1350 },
];

const REVENUE_SPLIT = [
  { label: 'Subscriptions', amount: 4280, color: 'bg-red-600', pct: 43 },
  { label: 'Tickets', amount: 3650, color: 'bg-red-500', pct: 37 },
  { label: 'Merch', amount: 2010, color: 'bg-red-400', pct: 20 },
];

export default function EarningsPage() {
  const { data: session, status } = useSession();
  const [csvDownloading, setCsvDownloading] = useState(false);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl mb-2">💰</p>
        <p className="text-gray-400 text-lg">Sign in to view your earnings</p>
        <Link
          href="/auth/login"
          className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const totalEarned = COMMISSIONS.reduce((s, c) => s + c.amount, 0);
  const pendingAmount = COMMISSIONS.filter((c) => c.status === 'pending').reduce(
    (s, c) => s + c.amount,
    0
  );
  const paidAmount = COMMISSIONS.filter((c) => c.status === 'paid').reduce(
    (s, c) => s + c.amount,
    0
  );
  const maxMonthly = Math.max(...MONTHLY_EARNINGS.map((m) => m.amount));
  const isFoundingMember = true; // placeholder — derive from user data
  const userRole = (session.user as { role?: string })?.role;

  const handleDownloadCsv = () => {
    setCsvDownloading(true);
    // Placeholder CSV generation
    const header = 'Date,Source,Amount,Tier,Status,TxHash\n';
    const rows = COMMISSIONS.map(
      (c) => `${c.date},${c.source},${c.amount.toFixed(2)},${c.tier},${c.status},${c.txHash}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'opynx-earnings.csv';
    a.click();
    URL.revokeObjectURL(url);
    setCsvDownloading(false);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black">Earnings</h1>
            <p className="text-gray-400 text-sm mt-1">
              Track your commissions and payouts across OPYNX
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isFoundingMember && (
              <span className="rounded-full bg-yellow-600/20 border border-yellow-500/30 px-3 py-1 text-xs font-semibold text-yellow-400">
                Founding Member — 2x Bonus Active
              </span>
            )}
            <Link
              href="https://polygonscan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-purple-600/20 border border-purple-500/30 px-3 py-1 text-xs font-semibold text-purple-400 hover:bg-purple-600/30 transition"
            >
              All payouts verified on Polygon
            </Link>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <OverviewCard label="Total Earned" value={`$${totalEarned.toFixed(2)}`} accent="text-green-400" />
          <OverviewCard label="Pending" value={`$${pendingAmount.toFixed(2)}`} accent="text-yellow-400" />
          <OverviewCard label="Paid" value={`$${paidAmount.toFixed(2)}`} accent="text-brand-400" />
          <OverviewCard label="Next Payout" value="Apr 15, 2026" accent="text-gray-300" />
        </div>

        {/* Monthly Earnings Chart */}
        <div className="rounded-2xl bg-[#15151f] p-6 mb-8">
          <h2 className="text-lg font-bold mb-6">Monthly Earnings</h2>
          <div className="flex items-end gap-2 h-48">
            {MONTHLY_EARNINGS.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-500">${m.amount}</span>
                <div
                  className="w-full bg-red-600/80 rounded-t-md transition-all duration-300 hover:bg-red-500"
                  style={{ height: `${(m.amount / maxMonthly) * 100}%`, minHeight: '4px' }}
                />
                <span className="text-[10px] text-gray-500">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Split */}
        <div className="rounded-2xl bg-[#15151f] p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Revenue Sources</h2>
          <div className="space-y-4">
            {REVENUE_SPLIT.map((src) => (
              <div key={src.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{src.label}</span>
                  <span className="text-gray-400">
                    ${src.amount.toLocaleString()} ({src.pct}%)
                  </span>
                </div>
                <div className="w-full bg-brand-950/50 rounded-full h-3">
                  <div
                    className={`${src.color} h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${src.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commission Breakdown Table */}
        <div className="rounded-2xl bg-[#15151f] p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Commission Breakdown</h2>
            <button
              onClick={handleDownloadCsv}
              disabled={csvDownloading}
              className="rounded-lg bg-brand-600/20 border border-brand-500/30 px-4 py-2 text-sm font-semibold text-brand-400 hover:bg-brand-600/30 transition disabled:opacity-50"
            >
              {csvDownloading ? 'Downloading...' : 'Download CSV'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-800/20">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Date</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Source</th>
                  <th className="text-right py-3 px-2 text-gray-500 font-medium">Amount</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Tier</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {COMMISSIONS.map((c, i) => (
                  <tr key={i} className="border-b border-brand-800/10 hover:bg-brand-950/30 transition">
                    <td className="py-3 px-2 text-gray-300">{c.date}</td>
                    <td className="py-3 px-2">
                      <SourceBadge source={c.source} />
                    </td>
                    <td className="py-3 px-2 text-right font-semibold text-white">
                      ${c.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-2">
                      <TierBadge tier={c.tier} />
                    </td>
                    <td className="py-3 px-2">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3 px-2">
                      <Link
                        href={`https://polygonscan.com/tx/${c.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 transition font-mono text-xs"
                      >
                        {c.txHash.slice(0, 6)}...{c.txHash.slice(-4)}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="https://www.moonpay.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-2xl bg-red-600 px-6 py-4 text-center font-bold text-white hover:bg-red-500 transition text-lg"
          >
            Cash Out to Bank
          </Link>
          <Link
            href="/dashboard/revenue"
            className="flex-1 rounded-2xl bg-[#15151f] border border-brand-800/20 px-6 py-4 text-center font-bold text-gray-300 hover:text-white hover:border-brand-600/30 transition text-lg"
          >
            Full Revenue Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function OverviewCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl bg-[#15151f] p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-black ${accent}`}>{value}</p>
    </div>
  );
}

function SourceBadge({ source }: { source: 'Subscription' | 'Ticket' | 'Merch' }) {
  const styles = {
    Subscription: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
    Ticket: 'bg-green-600/20 text-green-400 border-green-500/30',
    Merch: 'bg-orange-600/20 text-orange-400 border-orange-500/30',
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${styles[source]}`}>
      {source}
    </span>
  );
}

function TierBadge({ tier }: { tier: 'creator' | 'facilitator' | 'outlier' }) {
  const styles = {
    creator: 'bg-red-600/20 text-red-400 border-red-500/30',
    facilitator: 'bg-purple-600/20 text-purple-400 border-purple-500/30',
    outlier: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
  };
  const labels = {
    creator: 'Creator',
    facilitator: 'Facilitator',
    outlier: 'Outlier',
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${styles[tier]}`}>
      {labels[tier]}
    </span>
  );
}

function StatusBadge({ status }: { status: 'pending' | 'approved' | 'paid' }) {
  const styles = {
    pending: 'bg-yellow-600/20 text-yellow-400',
    approved: 'bg-blue-600/20 text-blue-400',
    paid: 'bg-green-600/20 text-green-400',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
