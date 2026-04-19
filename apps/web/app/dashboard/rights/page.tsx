'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

type RightsStatus = 'Independent' | 'Label-Owned' | 'Co-owned' | 'Disputed';
type PRO = 'ASCAP' | 'BMI' | 'SESAC' | 'GMR' | 'None';

interface TrackRights {
  id: number;
  title: string;
  status: RightsStatus;
  masterOwner: string;
  publishingOwner: string;
  pro: PRO;
}

const TRACKS: TrackRights[] = [
  { id: 1, title: 'Neon Highway', status: 'Independent', masterOwner: 'You', publishingOwner: 'You', pro: 'ASCAP' },
  { id: 2, title: 'Midnight Rain', status: 'Label-Owned', masterOwner: 'Skyline Records', publishingOwner: 'Skyline Publishing', pro: 'BMI' },
  { id: 3, title: 'Sunset Drift', status: 'Independent', masterOwner: 'You', publishingOwner: 'You', pro: 'None' },
  { id: 4, title: 'Shadow Protocol', status: 'Co-owned', masterOwner: 'You / DarkWave Co.', publishingOwner: 'You', pro: 'ASCAP' },
  { id: 5, title: 'Rise Above', status: 'Independent', masterOwner: 'You', publishingOwner: 'You', pro: 'ASCAP' },
  { id: 6, title: 'Digital Dreams', status: 'Disputed', masterOwner: 'Disputed (You / Pulse Records)', publishingOwner: 'You', pro: 'BMI' },
  { id: 7, title: 'Velvet Touch', status: 'Co-owned', masterOwner: 'You / SoulHouse', publishingOwner: 'SoulHouse Publishing', pro: 'SESAC' },
  { id: 8, title: 'Morning Light', status: 'Independent', masterOwner: 'You', publishingOwner: 'You', pro: 'None' },
];

const STATUS_BADGE: Record<RightsStatus, string> = {
  'Independent': 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/30',
  'Label-Owned': 'bg-blue-600/20 text-blue-300 border border-blue-600/30',
  'Co-owned': 'bg-yellow-600/20 text-yellow-300 border border-yellow-600/30',
  'Disputed': 'bg-red-600/20 text-red-300 border border-red-600/30',
};

export default function RightsManagementPage() {
  const { data: session, status } = useSession();
  const [filter, setFilter] = useState<RightsStatus | 'All'>('All');

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
        <p className="text-5xl mb-2">📜</p>
        <p className="text-gray-400 text-lg">Sign in to manage your rights</p>
        <Link
          href="/auth/login"
          className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const stats = {
    total: TRACKS.length,
    independent: TRACKS.filter((t) => t.status === 'Independent').length,
    label: TRACKS.filter((t) => t.status === 'Label-Owned').length,
    coOwned: TRACKS.filter((t) => t.status === 'Co-owned').length,
    disputed: TRACKS.filter((t) => t.status === 'Disputed').length,
  };

  const tracksWithoutPRO = TRACKS.filter((t) => t.pro === 'None').length;
  const complianceScore = Math.round(((TRACKS.length - tracksWithoutPRO) / TRACKS.length) * 100);

  const visible = filter === 'All' ? TRACKS : TRACKS.filter((t) => t.status === filter);

  return (
    <div className="min-h-screen bg-brand-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Rights & Ownership Management</h1>
          <p className="text-gray-400">Track who owns what, manage label deals, ensure compliance</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Total Tracks', value: stats.total, color: 'text-white' },
            { label: 'Independent', value: stats.independent, color: 'text-emerald-300' },
            { label: 'Label-Owned', value: stats.label, color: 'text-blue-300' },
            { label: 'Co-owned', value: stats.coOwned, color: 'text-yellow-300' },
            { label: 'Disputed', value: stats.disputed, color: 'text-red-300' },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => setFilter(s.label === 'Total Tracks' ? 'All' : (s.label as RightsStatus))}
              className="bg-[#15151f] hover:bg-[#1d1d2a] transition rounded-xl p-4 text-left"
            >
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="bg-[#15151f] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">My Tracks</h2>
              <Link href="/dashboard/upload/rights" className="rounded-full bg-red-600 hover:bg-red-500 transition px-4 py-2 text-sm font-semibold">
                + Add Rights to a Track
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-800">
                    <th className="py-3 pr-4">Title</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Master Owner</th>
                    <th className="py-3 pr-4">Publishing Owner</th>
                    <th className="py-3 pr-4">PRO</th>
                    <th className="py-3 pr-4">Splits</th>
                    <th className="py-3 pr-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((t) => (
                    <tr key={t.id} className="border-b border-gray-800/60">
                      <td className="py-3 pr-4 font-semibold">{t.title}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${STATUS_BADGE[t.status]}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-300">{t.masterOwner}</td>
                      <td className="py-3 pr-4 text-gray-300">{t.publishingOwner}</td>
                      <td className="py-3 pr-4">
                        <span className={t.pro === 'None' ? 'text-red-300' : 'text-gray-300'}>
                          {t.pro}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <Link href={`/dashboard/splits/${t.id}`} className="text-red-400 hover:text-red-300">
                          View splits
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <Link href={`/dashboard/splits/${t.id}`} className="inline-block rounded-full bg-[#1d1d2a] hover:bg-[#26263a] transition px-3 py-1.5 text-xs font-semibold">
                          Edit Rights
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="bg-[#15151f] rounded-xl p-5">
              <h3 className="text-lg font-bold mb-3">Rights Compliance Score</h3>
              <div className="flex items-end gap-2 mb-2">
                <p className="text-4xl font-bold text-emerald-300">{complianceScore}%</p>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-emerald-400"
                  style={{ width: `${complianceScore}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">
                {tracksWithoutPRO} track{tracksWithoutPRO === 1 ? '' : 's'} need PRO registration
              </p>
            </div>

            <div className="bg-[#15151f] rounded-xl p-5">
              <h3 className="text-lg font-bold mb-2">Verify Independence</h3>
              <p className="text-sm text-gray-400 mb-4">
                Confirm you own master and publishing rights with our verification wizard.
              </p>
              <Link
                href="/dashboard/rights/verify"
                className="inline-block rounded-full bg-red-600 hover:bg-red-500 transition px-4 py-2 text-sm font-semibold"
              >
                Start Verification
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
