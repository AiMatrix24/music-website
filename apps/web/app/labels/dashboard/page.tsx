'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

type ContractStatus = 'Active' | 'Expiring soon' | 'Expired';
type ReleaseStatus = 'Live' | 'Pending' | 'Takedown';
type ClaimStatus = 'Investigating' | 'Contested' | 'Approved';

interface Creator {
  id: number;
  name: string;
  contract: ContractStatus;
  releases: number;
  initials: string;
}

interface Release {
  id: number;
  title: string;
  creator: string;
  releaseDate: string;
  streams: number;
  revenue: number;
  status: ReleaseStatus;
}

interface Claim {
  id: number;
  track: string;
  status: ClaimStatus;
  filed: string;
}

const LABEL_NAME = 'Skyline Records';
const IS_VERIFIED = true;

const ROSTER: Creator[] = [
  { id: 1, name: 'Aria Lane', contract: 'Active', releases: 12, initials: 'AL' },
  { id: 2, name: 'Echo Drift', contract: 'Active', releases: 8, initials: 'ED' },
  { id: 3, name: 'Nova Knight', contract: 'Expiring soon', releases: 24, initials: 'NK' },
  { id: 4, name: 'Solar Pulse', contract: 'Active', releases: 6, initials: 'SP' },
  { id: 5, name: 'Midnight Cypher', contract: 'Expired', releases: 18, initials: 'MC' },
  { id: 6, name: 'Velvet Bloom', contract: 'Active', releases: 9, initials: 'VB' },
  { id: 7, name: 'Crimson Tide', contract: 'Expiring soon', releases: 14, initials: 'CT' },
  { id: 8, name: 'Static Gold', contract: 'Active', releases: 3, initials: 'SG' },
];

const RECENT_RELEASES: Release[] = [
  {
    id: 1,
    title: 'Neon Highway',
    creator: 'Aria Lane',
    releaseDate: '2026-04-01',
    streams: 482000,
    revenue: 1928,
    status: 'Live',
  },
  {
    id: 2,
    title: 'Midnight Rain',
    creator: 'Nova Knight',
    releaseDate: '2026-03-15',
    streams: 1240000,
    revenue: 4960,
    status: 'Live',
  },
  {
    id: 3,
    title: 'Velvet Touch',
    creator: 'Velvet Bloom',
    releaseDate: '2026-03-08',
    streams: 87000,
    revenue: 348,
    status: 'Live',
  },
  {
    id: 4,
    title: 'Sunset Drift',
    creator: 'Echo Drift',
    releaseDate: '2026-02-20',
    streams: 312000,
    revenue: 1248,
    status: 'Live',
  },
  {
    id: 5,
    title: 'Shadow Protocol',
    creator: 'Crimson Tide',
    releaseDate: '2026-02-12',
    streams: 156000,
    revenue: 624,
    status: 'Pending',
  },
  {
    id: 6,
    title: 'Static Bloom',
    creator: 'Static Gold',
    releaseDate: '2026-01-30',
    streams: 24000,
    revenue: 96,
    status: 'Takedown',
  },
];

const PENDING_CLAIMS: Claim[] = [
  { id: 1, track: 'Digital Dreams (unauthorized cover)', status: 'Investigating', filed: '2026-04-12' },
  { id: 2, track: 'Neon Highway (sample dispute)', status: 'Contested', filed: '2026-04-08' },
  { id: 3, track: 'Velvet Touch (master claim)', status: 'Approved', filed: '2026-04-02' },
];

const REVENUE_DATA = [
  { month: 'May', value: 18200 },
  { month: 'Jun', value: 22400 },
  { month: 'Jul', value: 19800 },
  { month: 'Aug', value: 24600 },
  { month: 'Sep', value: 28900 },
  { month: 'Oct', value: 26200 },
  { month: 'Nov', value: 31400 },
  { month: 'Dec', value: 38600 },
  { month: 'Jan', value: 34200 },
  { month: 'Feb', value: 29800 },
  { month: 'Mar', value: 33500 },
  { month: 'Apr', value: 41200 },
];

const CONTRACT_BADGE: Record<ContractStatus, string> = {
  Active: 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/30',
  'Expiring soon': 'bg-yellow-600/20 text-yellow-300 border border-yellow-600/30',
  Expired: 'bg-red-600/20 text-red-300 border border-red-600/30',
};

const RELEASE_BADGE: Record<ReleaseStatus, string> = {
  Live: 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/30',
  Pending: 'bg-yellow-600/20 text-yellow-300 border border-yellow-600/30',
  Takedown: 'bg-red-600/20 text-red-300 border border-red-600/30',
};

const CLAIM_BADGE: Record<ClaimStatus, string> = {
  Investigating: 'bg-yellow-600/20 text-yellow-300 border border-yellow-600/30',
  Contested: 'bg-red-600/20 text-red-300 border border-red-600/30',
  Approved: 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/30',
};

const QUICK_ACTIONS = [
  { icon: '📋', label: 'Claim a Track', desc: 'File a master claim', href: '/labels/claim' },
  { icon: '🚫', label: 'Submit Takedown', desc: 'DMCA-style request', href: '/labels/takedown' },
  { icon: '➕', label: 'Add Creator to Roster', desc: 'Onboard a new creator', href: '#' },
  { icon: '🔍', label: 'Run Catalog Audit', desc: 'Check for issues', href: '#' },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

export default function LabelDashboardPage() {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-950 text-white">
        <div className="animate-pulse text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-brand-950 text-white">
        <p className="text-5xl mb-2">🏢</p>
        <p className="text-gray-400 text-lg">Sign in to access label dashboard</p>
        <Link
          href="/auth/login"
          className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const totalRevenue = REVENUE_DATA.reduce((sum, m) => sum + m.value, 0);
  const monthlyRevenue = REVENUE_DATA[REVENUE_DATA.length - 1].value;
  const maxRevenue = Math.max(...REVENUE_DATA.map((d) => d.value));

  const stats = [
    { label: 'Active Creators', value: ROSTER.filter((a) => a.contract === 'Active').length },
    { label: 'Total Releases', value: RECENT_RELEASES.length * 14 },
    { label: 'Pending Claims', value: PENDING_CLAIMS.filter((c) => c.status !== 'Approved').length },
    { label: 'Monthly Revenue', value: formatCurrency(monthlyRevenue) },
    { label: 'Pending Takedowns', value: 4 },
  ];

  return (
    <div className="min-h-screen bg-brand-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Back nav */}
        <Link
          href="/labels/claim"
          className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-6"
        >
          ← Back to Label Portal
        </Link>

        {/* Hero */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-3xl md:text-4xl font-bold">{LABEL_NAME} Dashboard</h1>
              {IS_VERIFIED && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-600/30 px-3 py-1 rounded-full text-xs font-semibold">
                  <span>✓</span> Verified Label
                </span>
              )}
            </div>
            <p className="text-gray-400">
              Total lifetime revenue: <span className="text-white font-semibold">{formatCurrency(totalRevenue)}</span>
            </p>
          </div>
          <Link
            href="/labels/takedown"
            className="rounded-full bg-red-600 hover:bg-red-500 transition px-5 py-2.5 text-sm font-semibold inline-block text-center"
          >
            Submit Takedown
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#15151f] rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Main column */}
          <div className="space-y-6">
            {/* Roster */}
            <section className="bg-[#15151f] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Roster</h2>
                <button className="text-xs text-red-400 hover:text-red-300 font-semibold">
                  View all
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ROSTER.map((a) => (
                  <div
                    key={a.id}
                    className="bg-brand-950 rounded-lg p-4 border border-gray-800 hover:border-red-500 transition"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {a.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{a.name}</p>
                        <p className="text-xs text-gray-400">{a.releases} releases</p>
                      </div>
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] mb-3 ${CONTRACT_BADGE[a.contract]}`}
                    >
                      {a.contract}
                    </span>
                    <button className="w-full rounded-full bg-[#1d1d2a] hover:bg-[#26263a] transition px-3 py-1.5 text-xs font-semibold">
                      Manage
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Releases */}
            <section className="bg-[#15151f] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Recent Releases</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-800">
                      <th className="py-2 pr-3">Title</th>
                      <th className="py-2 pr-3">Creator</th>
                      <th className="py-2 pr-3">Release Date</th>
                      <th className="py-2 pr-3 text-right">Streams (30d)</th>
                      <th className="py-2 pr-3 text-right">Revenue (30d)</th>
                      <th className="py-2 pr-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RECENT_RELEASES.map((r) => (
                      <tr key={r.id} className="border-b border-gray-800/60">
                        <td className="py-3 pr-3 font-semibold">{r.title}</td>
                        <td className="py-3 pr-3 text-gray-300">{r.creator}</td>
                        <td className="py-3 pr-3 text-gray-400">{r.releaseDate}</td>
                        <td className="py-3 pr-3 text-right">{formatNumber(r.streams)}</td>
                        <td className="py-3 pr-3 text-right">{formatCurrency(r.revenue)}</td>
                        <td className="py-3 pr-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${RELEASE_BADGE[r.status]}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Pending Claims */}
            <section className="bg-[#15151f] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Pending Claims</h2>
              <div className="space-y-3">
                {PENDING_CLAIMS.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between bg-brand-950 rounded-lg p-4 border border-gray-800"
                  >
                    <div>
                      <p className="font-semibold text-sm">{c.track}</p>
                      <p className="text-xs text-gray-400 mt-1">Filed {c.filed}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${CLAIM_BADGE[c.status]}`}>
                        {c.status}
                      </span>
                      <button className="rounded-full bg-[#1d1d2a] hover:bg-[#26263a] transition px-3 py-1.5 text-xs font-semibold">
                        Review
                      </button>
                      <button className="rounded-full bg-red-600 hover:bg-red-500 transition px-3 py-1.5 text-xs font-semibold">
                        Action
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Revenue Chart */}
            <section className="bg-[#15151f] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Revenue (12 months)</h2>
                <p className="text-sm text-emerald-300 font-semibold">
                  +{Math.round(((monthlyRevenue - REVENUE_DATA[0].value) / REVENUE_DATA[0].value) * 100)}% YoY
                </p>
              </div>
              <div className="flex items-end gap-2 h-48">
                {REVENUE_DATA.map((m) => {
                  const heightPct = (m.value / maxRevenue) * 100;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-gradient-to-t from-red-600 to-red-400 rounded-t-md transition hover:opacity-80 relative group"
                        style={{ height: `${heightPct}%` }}
                      >
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                          {formatCurrency(m.value)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{m.month}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Quick Actions */}
            <section className="bg-[#15151f] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {QUICK_ACTIONS.map((a) => (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="bg-brand-950 hover:bg-[#1d1d2a] transition rounded-lg p-4 border border-gray-800 hover:border-red-500"
                  >
                    <p className="text-2xl mb-2">{a.icon}</p>
                    <p className="font-semibold text-sm">{a.label}</p>
                    <p className="text-xs text-gray-400 mt-1">{a.desc}</p>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="bg-[#15151f] rounded-xl p-5">
              <p className="text-xs text-gray-400 mb-2">Status</p>
              {IS_VERIFIED ? (
                <div className="inline-flex items-center gap-2 bg-emerald-600/20 text-emerald-300 border border-emerald-600/30 px-3 py-1.5 rounded-full text-sm font-semibold mb-3">
                  <span>✓</span>
                  <span>Verified Label</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-yellow-600/20 text-yellow-300 border border-yellow-600/30 px-3 py-1.5 rounded-full text-sm font-semibold mb-3">
                  <span>⏳</span>
                  <span>Verification Pending</span>
                </div>
              )}
              <p className="text-xs text-gray-400">
                Verified labels can claim masters and submit takedowns.
              </p>
            </div>

            <div className="bg-[#15151f] rounded-xl p-5 space-y-2">
              <Link
                href="#"
                className="block bg-brand-950 hover:bg-[#1d1d2a] transition rounded-lg px-4 py-3"
              >
                <p className="font-semibold text-sm">Manage Settings</p>
                <p className="text-xs text-gray-400">Label profile, payment, team</p>
              </Link>
              <Link
                href="/contact"
                className="block bg-brand-950 hover:bg-[#1d1d2a] transition rounded-lg px-4 py-3"
              >
                <p className="font-semibold text-sm">Contact Support</p>
                <p className="text-xs text-gray-400">Get help from the team</p>
              </Link>
            </div>

            <div className="bg-[#15151f] rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-3">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total creators</span>
                  <span className="font-semibold">{ROSTER.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active contracts</span>
                  <span className="font-semibold">
                    {ROSTER.filter((a) => a.contract === 'Active').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Expiring soon</span>
                  <span className="font-semibold text-yellow-300">
                    {ROSTER.filter((a) => a.contract === 'Expiring soon').length}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
