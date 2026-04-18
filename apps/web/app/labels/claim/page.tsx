'use client';

import Link from 'next/link';
import { useState } from 'react';

type ClaimStatus = 'Pending' | 'Approved' | 'Disputed';

interface RecentClaim {
  id: number;
  track: string;
  claimant: string;
  status: ClaimStatus;
  filed: string;
}

const RECENT_CLAIMS: RecentClaim[] = [
  { id: 1, track: 'Neon Highway', claimant: 'Skyline Records', status: 'Pending', filed: '2026-04-12' },
  { id: 2, track: 'Velvet Touch', claimant: 'SoulHouse', status: 'Approved', filed: '2026-04-08' },
  { id: 3, track: 'Digital Dreams', claimant: 'Pulse Records', status: 'Disputed', filed: '2026-04-05' },
  { id: 4, track: 'Shadow Protocol', claimant: 'DarkWave Co.', status: 'Approved', filed: '2026-03-28' },
  { id: 5, track: 'Sunset Drift', claimant: 'Indie Wave LLC', status: 'Pending', filed: '2026-03-22' },
];

const STATUS_BADGE: Record<ClaimStatus, string> = {
  'Pending': 'bg-yellow-600/20 text-yellow-300 border border-yellow-600/30',
  'Approved': 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/30',
  'Disputed': 'bg-red-600/20 text-red-300 border border-red-600/30',
};

const VERIFIED_LABELS = [
  'Skyline Records',
  'SoulHouse',
  'Pulse Records',
  'DarkWave Co.',
  'Indie Wave LLC',
  'Atlas Music Group',
  'Northern Lights Records',
  'Velocity Sound',
];

export default function LabelClaimPortalPage() {
  const [trackQuery, setTrackQuery] = useState('');

  return (
    <div className="min-h-screen bg-brand-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <p className="text-5xl mb-3">🏢</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Label Rights Portal</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Verify your label, claim ownership, manage artist roster
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* For Labels */}
          <section className="bg-[#15151f] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-1">For Labels</h2>
            <p className="text-sm text-gray-400 mb-5">Claim, verify, manage</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Claim a Track</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trackQuery}
                    onChange={(e) => setTrackQuery(e.target.value)}
                    placeholder="Track URL or ID"
                    className="flex-1 bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                  <button className="rounded-full bg-red-600 hover:bg-red-500 transition px-4 py-2 text-sm font-semibold">
                    Search
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4 space-y-2">
                <Link
                  href="/labels/verify"
                  className="block bg-brand-950 hover:bg-[#1d1d2a] transition rounded-lg px-4 py-3"
                >
                  <p className="font-semibold">Verify Your Label</p>
                  <p className="text-xs text-gray-400">Submit verification documents</p>
                </Link>
                <Link
                  href="/labels/dashboard"
                  className="block bg-brand-950 hover:bg-[#1d1d2a] transition rounded-lg px-4 py-3"
                >
                  <p className="font-semibold">Roster Management</p>
                  <p className="text-xs text-gray-400">View and manage your artist roster</p>
                </Link>
                <Link
                  href="/labels/takedown"
                  className="block bg-brand-950 hover:bg-[#1d1d2a] transition rounded-lg px-4 py-3"
                >
                  <p className="font-semibold">Submit Takedown Request</p>
                  <p className="text-xs text-gray-400">DMCA-style content removal form</p>
                </Link>
              </div>
            </div>
          </section>

          {/* For Artists */}
          <section className="bg-[#15151f] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-1">For Artists</h2>
            <p className="text-sm text-gray-400 mb-5">Respond to claims and protect your work</p>

            <div className="space-y-2">
              <Link
                href="/labels/claim/help"
                className="block bg-brand-950 hover:bg-[#1d1d2a] transition rounded-lg px-4 py-3"
              >
                <p className="font-semibold">How to respond to a claim</p>
                <p className="text-xs text-gray-400">Step-by-step guide</p>
              </Link>
              <Link
                href="/labels/claim/dispute"
                className="block bg-brand-950 hover:bg-[#1d1d2a] transition rounded-lg px-4 py-3"
              >
                <p className="font-semibold">Dispute a false claim</p>
                <p className="text-xs text-gray-400">File a counter-claim</p>
              </Link>
              <Link
                href="/labels/claim/preclear"
                className="block bg-brand-950 hover:bg-[#1d1d2a] transition rounded-lg px-4 py-3"
              >
                <p className="font-semibold">Pre-clear your release</p>
                <p className="text-xs text-gray-400">Preventive verification before release</p>
              </Link>
            </div>
          </section>
        </div>

        {/* Recent Claims */}
        <section className="bg-[#15151f] rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-1">Recent Claims</h2>
          <p className="text-sm text-gray-400 mb-5">Latest filings on the platform</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-800">
                  <th className="py-2 pr-3">Track Title</th>
                  <th className="py-2 pr-3">Claimant</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Filed</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_CLAIMS.map((c) => (
                  <tr key={c.id} className="border-b border-gray-800/60">
                    <td className="py-3 pr-3 font-semibold">{c.track}</td>
                    <td className="py-3 pr-3 text-gray-300">{c.claimant}</td>
                    <td className="py-3 pr-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${STATUS_BADGE[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-gray-400">{c.filed}</td>
                    <td className="py-3 pr-3">
                      <Link
                        href={`/labels/claim/${c.id}`}
                        className="rounded-full bg-[#1d1d2a] hover:bg-[#26263a] transition px-3 py-1.5 text-xs font-semibold"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Verified Labels */}
        <section className="bg-[#15151f] rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-1">Verified Labels</h2>
          <p className="text-sm text-gray-400 mb-5">Labels confirmed by OPYNX trust & safety</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {VERIFIED_LABELS.map((label) => (
              <div
                key={label}
                className="bg-brand-950 rounded-lg px-4 py-5 flex flex-col items-center justify-center text-center border border-gray-800"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-400 flex items-center justify-center font-bold mb-2">
                  {label.charAt(0)}
                </div>
                <p className="font-semibold text-sm truncate w-full">{label}</p>
                <p className="text-xs text-emerald-300 mt-1">✓ Verified</p>
              </div>
            ))}
          </div>
        </section>

        {/* Legal footer */}
        <p className="text-center text-xs text-gray-500 max-w-3xl mx-auto">
          All claims investigated within 7 business days. False claims may result in account termination.
        </p>
      </div>
    </div>
  );
}
