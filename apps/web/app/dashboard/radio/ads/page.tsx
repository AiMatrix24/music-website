'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

type CampaignStatus = 'running' | 'paused' | 'ended';

type Campaign = {
  id: string;
  advertiser: string;
  title: string;
  budget: number;
  spent: number;
  impressions: number;
  remaining: string;
  status: CampaignStatus;
};

type PendingAd = {
  id: string;
  advertiser: string;
  product: string;
  message: string;
  bid: number;
};

type Sponsorship = {
  id: string;
  brand: string;
  show: string;
  offer: number;
  cadence: string;
};

const STATUS_STYLE: Record<CampaignStatus, { label: string; className: string }> = {
  running: { label: 'Running', className: 'bg-green-600/20 text-green-400 border border-green-600/40' },
  paused: { label: 'Paused', className: 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/40' },
  ended: { label: 'Ended', className: 'bg-gray-600/20 text-gray-400 border border-gray-600/40' },
};

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'c1',
    advertiser: 'NovaBeats Audio',
    title: 'Wireless XR Headphones — Summer',
    budget: 1200,
    spent: 840,
    impressions: 42_800,
    remaining: '4 days',
    status: 'running',
  },
  {
    id: 'c2',
    advertiser: 'Hyperline Energy',
    title: 'Energy drink 30s spot',
    budget: 500,
    spent: 500,
    impressions: 28_100,
    remaining: '0 days',
    status: 'ended',
  },
  {
    id: 'c3',
    advertiser: 'Flux Threads',
    title: 'Streetwear drop — 15s pre-roll',
    budget: 800,
    spent: 210,
    impressions: 10_400,
    remaining: '11 days',
    status: 'paused',
  },
];

const INITIAL_PENDING: PendingAd[] = [
  {
    id: 'p1',
    advertiser: 'Midnight Coffee Co.',
    product: 'Cold Brew Launch',
    message: 'Fuel your late night sessions with Midnight Coffee...',
    bid: 45,
  },
  {
    id: 'p2',
    advertiser: 'Vector Gear',
    product: 'Studio Monitors Sale',
    message: 'Upgrade your studio with 20% off Vector Gear monitors...',
    bid: 75,
  },
];

const SPONSORSHIPS: Sponsorship[] = [
  { id: 's1', brand: 'Brand X', show: 'Tuesday Show', offer: 500, cadence: 'per week' },
  { id: 's2', brand: 'Echo Labs', show: 'Weekend Takeover', offer: 1800, cadence: 'per month' },
];

export default function RadioAdsPage() {
  const { status } = useSession();
  const { toast } = useToast();

  const [slotsPerHour, setSlotsPerHour] = useState(4);
  const [slotLength, setSlotLength] = useState<15 | 30 | 60>(30);
  const [minPrice, setMinPrice] = useState(50);
  const [preMid, setPreMid] = useState({ pre: 30, mid: 50, post: 20 });
  const [autoPrice, setAutoPrice] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [pending, setPending] = useState<PendingAd[]>(INITIAL_PENDING);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [rates, setRates] = useState({
    preDrive: 75,
    preOffPeak: 35,
    midDrive: 95,
    midOffPeak: 45,
    postDrive: 60,
    postOffPeak: 25,
  });

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-brand-950">
        <p className="text-gray-400">Sign in to manage your ad inventory</p>
        <Link href="/auth/login" className="text-red-400 hover:text-red-300 transition">
          Sign In →
        </Link>
      </div>
    );
  }

  const toggleCampaign = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === 'running' ? 'paused' : c.status === 'paused' ? 'running' : c.status }
          : c
      )
    );
  };

  const approvePending = (id: string) => {
    const p = pending.find((x) => x.id === id);
    setPending((prev) => prev.filter((x) => x.id !== id));
    if (p) toast(`Approved ad from ${p.advertiser}`, 'success');
  };

  const rejectPending = (id: string) => {
    const p = pending.find((x) => x.id === id);
    setPending((prev) => prev.filter((x) => x.id !== id));
    if (p) toast(`Rejected ad from ${p.advertiser}`, 'info');
  };

  const setMix = (key: 'pre' | 'mid' | 'post', val: number) => {
    setPreMid((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="min-h-screen py-12 px-6 bg-brand-950 text-white">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/dashboard/radio/channel"
          className="text-sm text-gray-400 hover:text-white transition mb-6 inline-block"
        >
          ← Back to Channel
        </Link>

        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">💵</span>
            <h1 className="text-4xl md:text-5xl font-bold">Your Ad Inventory</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Sell ads on your channel and earn 85% of every placement
          </p>
        </div>

        {/* Revenue Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'This Month', val: '$1,247', color: 'text-green-400' },
            { label: 'Last Month', val: '$890', color: 'text-white' },
            { label: 'All Time', val: '$8,430', color: 'text-white' },
            { label: 'Pending', val: '$340', color: 'text-yellow-400' },
          ].map((s) => (
            <div key={s.label} className="bg-[#15151f] rounded-xl p-5 border border-white/5">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {s.label}
              </div>
              <div className={`text-2xl md:text-3xl font-bold tabular-nums ${s.color}`}>
                {s.val}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Slot Configuration */}
            <section className="bg-[#15151f] rounded-xl p-6 border border-white/5">
              <h2 className="text-xl font-semibold mb-5">Ad Slot Configuration</h2>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Slots per hour</span>
                    <span className="font-semibold tabular-nums">{slotsPerHour}</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={8}
                    value={slotsPerHour}
                    onChange={(e) => setSlotsPerHour(Number(e.target.value))}
                    className="w-full accent-red-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>2</span>
                    <span>8</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-2">Slot length</div>
                  <div className="flex gap-2">
                    {([15, 30, 60] as const).map((len) => (
                      <button
                        key={len}
                        onClick={() => setSlotLength(len)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                          slotLength === len
                            ? 'bg-red-600 text-white'
                            : 'bg-brand-950 border border-white/10 text-gray-400 hover:border-red-600/40'
                        }`}
                      >
                        {len}s
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Minimum price per slot</span>
                    <span className="font-semibold tabular-nums">${minPrice}</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={500}
                    step={5}
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    className="w-full accent-red-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>$10</span>
                    <span>$500</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-2">
                    Pre-roll / Mid-roll / Post-roll mix
                  </div>
                  <div className="space-y-2">
                    {(['pre', 'mid', 'post'] as const).map((k) => (
                      <div key={k} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-16 capitalize">{k}-roll</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={preMid[k]}
                          onChange={(e) => setMix(k, Number(e.target.value))}
                          className="flex-1 accent-red-600"
                        />
                        <span className="text-xs font-semibold tabular-nums w-10 text-right">
                          {preMid[k]}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revenue Split */}
                <div className="bg-brand-950 border border-white/10 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-2">Revenue Split</div>
                  <div className="flex h-8 rounded-md overflow-hidden">
                    <div className="bg-red-600 flex items-center justify-center text-xs font-bold w-[85%]">
                      85% You
                    </div>
                    <div className="bg-white/10 flex items-center justify-center text-xs w-[15%]">
                      15%
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1.5">
                    OPYNX keeps 15% for distribution & ad serving
                  </div>
                </div>
              </div>
            </section>

            {/* Active Campaigns */}
            <section className="bg-[#15151f] rounded-xl p-6 border border-white/5">
              <h2 className="text-xl font-semibold mb-5">Active Campaigns</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase tracking-wide">
                      <th className="text-left font-semibold py-2 px-2">Campaign</th>
                      <th className="text-right font-semibold py-2 px-2">Budget</th>
                      <th className="text-right font-semibold py-2 px-2">Spent</th>
                      <th className="text-right font-semibold py-2 px-2">Impressions</th>
                      <th className="text-right font-semibold py-2 px-2">Remaining</th>
                      <th className="text-right font-semibold py-2 px-2">Status</th>
                      <th className="text-right font-semibold py-2 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => {
                      const s = STATUS_STYLE[c.status];
                      const pct = Math.round((c.spent / c.budget) * 100);
                      return (
                        <tr
                          key={c.id}
                          className="border-t border-white/5 hover:bg-white/[0.02] transition"
                        >
                          <td className="py-3 px-2">
                            <div className="font-medium">{c.title}</div>
                            <div className="text-xs text-gray-500">{c.advertiser}</div>
                          </td>
                          <td className="py-3 px-2 text-right tabular-nums">${c.budget}</td>
                          <td className="py-3 px-2 text-right">
                            <div className="tabular-nums">${c.spent}</div>
                            <div className="text-[10px] text-gray-500 tabular-nums">{pct}%</div>
                          </td>
                          <td className="py-3 px-2 text-right tabular-nums">
                            {c.impressions.toLocaleString()}
                          </td>
                          <td className="py-3 px-2 text-right text-gray-400">{c.remaining}</td>
                          <td className="py-3 px-2 text-right">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.className}`}>
                              {s.label}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => toast(`Previewing "${c.title}"`, 'info')}
                                className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition"
                              >
                                🎧 Listen
                              </button>
                              {c.status !== 'ended' && (
                                <button
                                  onClick={() => toggleCampaign(c.id)}
                                  className="text-xs px-2 py-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600/30 transition"
                                >
                                  {c.status === 'running' ? 'Pause' : 'Resume'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Pending Approvals */}
            <section className="bg-[#15151f] rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold">Pending Approvals</h2>
                <span className="text-xs text-yellow-400">{pending.length} awaiting review</span>
              </div>

              <div className="space-y-4">
                {pending.map((p) => (
                  <div
                    key={p.id}
                    className="bg-brand-950 rounded-lg p-4 border border-yellow-600/30"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                      <div>
                        <div className="font-semibold">{p.advertiser}</div>
                        <div className="text-sm text-gray-400">{p.product}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Bid</div>
                        <div className="font-bold text-green-400 tabular-nums">
                          ${p.bid}/slot
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#15151f] border border-white/10 rounded-md p-3 text-sm text-gray-300 italic mb-3">
                      "{p.message}"
                    </div>
                    <textarea
                      value={rejectReason[p.id] ?? ''}
                      onChange={(e) =>
                        setRejectReason((prev) => ({ ...prev, [p.id]: e.target.value }))
                      }
                      placeholder="Why reject? (optional)"
                      rows={1}
                      className="w-full bg-[#15151f] border border-white/10 rounded-md px-3 py-2 text-sm focus:border-red-600 focus:outline-none transition mb-3 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => approvePending(p.id)}
                        className="flex-1 px-3 py-2 rounded-md bg-green-600/20 text-green-400 border border-green-600/40 hover:bg-green-600/30 transition text-sm font-semibold"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => rejectPending(p.id)}
                        className="flex-1 px-3 py-2 rounded-md bg-red-600/20 text-red-400 border border-red-600/40 hover:bg-red-600/30 transition text-sm font-semibold"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
                {pending.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No pending ads to review
                  </div>
                )}
              </div>
            </section>

            {/* Rate Table */}
            <section className="bg-[#15151f] rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <h2 className="text-xl font-semibold">Set Your Rates</h2>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <span className="text-gray-400">Auto-price based on demand</span>
                  <button
                    onClick={() => setAutoPrice(!autoPrice)}
                    className={`relative w-10 h-5 rounded-full transition ${
                      autoPrice ? 'bg-red-600' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition ${
                        autoPrice ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </label>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase tracking-wide">
                      <th className="text-left font-semibold py-2 px-3">Ad Type</th>
                      <th className="text-right font-semibold py-2 px-3">Drive Time (Premium)</th>
                      <th className="text-right font-semibold py-2 px-3">Off-Peak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {([
                      { k: 'pre', label: 'Pre-roll', drive: 'preDrive', off: 'preOffPeak' },
                      { k: 'mid', label: 'Mid-roll', drive: 'midDrive', off: 'midOffPeak' },
                      { k: 'post', label: 'Post-roll', drive: 'postDrive', off: 'postOffPeak' },
                    ] as const).map((row) => (
                      <tr key={row.k} className="border-t border-white/5">
                        <td className="py-3 px-3 font-medium">{row.label}</td>
                        <td className="py-3 px-3 text-right">
                          <input
                            type="number"
                            value={rates[row.drive]}
                            disabled={autoPrice}
                            onChange={(e) =>
                              setRates((prev) => ({
                                ...prev,
                                [row.drive]: Number(e.target.value),
                              }))
                            }
                            className="w-20 bg-brand-950 border border-white/10 rounded px-2 py-1 text-right tabular-nums disabled:opacity-40"
                          />
                          <span className="text-xs text-gray-500 ml-1">$</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <input
                            type="number"
                            value={rates[row.off]}
                            disabled={autoPrice}
                            onChange={(e) =>
                              setRates((prev) => ({
                                ...prev,
                                [row.off]: Number(e.target.value),
                              }))
                            }
                            className="w-20 bg-brand-950 border border-white/10 rounded px-2 py-1 text-right tabular-nums disabled:opacity-40"
                          />
                          <span className="text-xs text-gray-500 ml-1">$</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-[10px] text-gray-500 mt-3">
                Drive time: 6-10am and 3-7pm weekdays · premium slots earn more
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Revenue by Ad Type */}
            <section className="bg-[#15151f] rounded-xl p-6 border border-white/5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-4">
                Revenue by Ad Type
              </h2>
              <div className="space-y-4">
                {[
                  { label: 'Pre-roll', val: 420, max: 650, color: 'bg-red-600' },
                  { label: 'Mid-roll', val: 650, max: 650, color: 'bg-red-500' },
                  { label: 'Sponsorship', val: 177, max: 650, color: 'bg-red-700' },
                ].map((r) => (
                  <div key={r.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span>{r.label}</span>
                      <span className="font-semibold tabular-nums">${r.val}/mo</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${r.color} rounded-full transition-all`}
                        style={{ width: `${(r.val / r.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-white/5 flex justify-between text-sm">
                <span className="text-gray-400">Monthly total</span>
                <span className="font-bold text-green-400 tabular-nums">$1,247</span>
              </div>
            </section>

            {/* Direct Sponsorships */}
            <section className="bg-[#15151f] rounded-xl p-6 border border-white/5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-4">
                Direct Sponsorship Offers
              </h2>
              <div className="space-y-3">
                {SPONSORSHIPS.map((s) => (
                  <div
                    key={s.id}
                    className="bg-brand-950 rounded-lg p-4 border border-white/10 hover:border-red-600/30 transition"
                  >
                    <div className="mb-2">
                      <div className="font-semibold">{s.brand}</div>
                      <div className="text-xs text-gray-500">
                        wants to sponsor your {s.show}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-400 tabular-nums mb-3">
                      ${s.offer.toLocaleString()}
                      <span className="text-xs text-gray-500 font-normal ml-1">
                        {s.cadence}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toast(`${s.brand} sponsorship accepted`, 'success')}
                        className="flex-1 text-xs py-1.5 rounded bg-green-600/20 text-green-400 border border-green-600/40 hover:bg-green-600/30 transition font-semibold"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => toast(`Negotiating with ${s.brand}`, 'info')}
                        className="flex-1 text-xs py-1.5 rounded bg-[#15151f] border border-white/10 hover:border-red-600/40 transition"
                      >
                        Negotiate
                      </button>
                      <button
                        onClick={() => toast(`${s.brand} rejected`, 'info')}
                        className="flex-1 text-xs py-1.5 rounded bg-red-600/20 text-red-400 border border-red-600/40 hover:bg-red-600/30 transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
