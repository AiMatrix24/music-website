'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

// --- Mock Segments ---
const SEGMENTS = [
  { id: 'superfans', name: 'Superfans', description: 'Top 10% by engagement', icon: '🔥', count: 1248, metric: '42 plays/month avg', color: 'from-red-600 to-orange-500' },
  { id: 'new-fans', name: 'New Fans', description: 'Joined last 30 days', icon: '🌟', count: 834, metric: '18% conversion rate', color: 'from-blue-600 to-cyan-500' },
  { id: 'event-goers', name: 'Event Goers', description: 'Bought tickets', icon: '🎫', count: 2156, metric: '$45 avg spend', color: 'from-purple-600 to-pink-500' },
  { id: 'merch-buyers', name: 'Merch Buyers', description: 'Purchased merchandise', icon: '👕', count: 1672, metric: '$32 avg order', color: 'from-green-600 to-emerald-500' },
  { id: 'dormant', name: 'Dormant', description: 'No activity 60+ days', icon: '💤', count: 3210, metric: '12% re-engagement', color: 'from-gray-600 to-gray-500' },
  { id: 'high-spenders', name: 'High Spenders', description: 'Top 10% by revenue', icon: '💎', count: 620, metric: '$280 avg LTV', color: 'from-yellow-600 to-amber-500' },
];

const COMPARISON_DATA = {
  superfans: { plays: 420, spend: 180, events: 8 },
  'new-fans': { plays: 85, spend: 22, events: 1 },
  'event-goers': { plays: 210, spend: 95, events: 5 },
  'merch-buyers': { plays: 175, spend: 120, events: 3 },
  dormant: { plays: 12, spend: 5, events: 0 },
  'high-spenders': { plays: 380, spend: 280, events: 7 },
} as Record<string, { plays: number; spend: number; events: number }>;

export default function FanSegmentsPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [customForm, setCustomForm] = useState({ name: '', activityType: 'plays', timeframe: '30', threshold: '10' });
  const [compareA, setCompareA] = useState('superfans');
  const [compareB, setCompareB] = useState('new-fans');

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading segments...</div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Sign in to view fan segments</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const totalFans = 12480;
  const activeFans = 8940;
  const superfanCount = SEGMENTS.find((s) => s.id === 'superfans')?.count ?? 0;
  const atRiskCount = SEGMENTS.find((s) => s.id === 'dormant')?.count ?? 0;

  const dataA = COMPARISON_DATA[compareA] ?? { plays: 0, spend: 0, events: 0 };
  const dataB = COMPARISON_DATA[compareB] ?? { plays: 0, spend: 0, events: 0 };
  const maxPlays = Math.max(dataA.plays, dataB.plays, 1);
  const maxSpend = Math.max(dataA.spend, dataB.spend, 1);
  const maxEvents = Math.max(dataA.events, dataB.events, 1);

  const handleCreateSegment = () => {
    if (!customForm.name.trim()) {
      toast('Please enter a segment name', 'error');
      return;
    }
    toast(`Segment "${customForm.name}" created!`, 'success');
    setShowCreateForm(false);
    setCustomForm({ name: '', activityType: 'plays', timeframe: '30', threshold: '10' });
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">
              ← Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Fan Segments</h1>
            <p className="text-gray-400 mt-1">Understand and target your audience</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition"
          >
            + Create Segment
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <OverviewCard label="Total Fans" value={totalFans.toLocaleString()} icon="👥" />
          <OverviewCard label="Active (30d)" value={activeFans.toLocaleString()} icon="📊" />
          <OverviewCard label="Superfans" value={superfanCount.toLocaleString()} icon="🔥" accent />
          <OverviewCard label="At Risk" value={atRiskCount.toLocaleString()} icon="⚠️" />
        </div>

        {/* Create Custom Segment Form */}
        {showCreateForm && (
          <div className="rounded-2xl bg-[#15151f] border border-red-600/30 p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Create Custom Segment</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Segment Name</label>
                <input
                  type="text"
                  value={customForm.name}
                  onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                  placeholder="e.g. Weekend Warriors"
                  className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Activity Type</label>
                <select
                  value={customForm.activityType}
                  onChange={(e) => setCustomForm({ ...customForm, activityType: e.target.value })}
                  className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-red-600/50"
                >
                  <option value="plays">Plays</option>
                  <option value="purchases">Purchases</option>
                  <option value="events">Events Attended</option>
                  <option value="shares">Shares</option>
                  <option value="comments">Comments</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Timeframe (days)</label>
                <input
                  type="number"
                  value={customForm.timeframe}
                  onChange={(e) => setCustomForm({ ...customForm, timeframe: e.target.value })}
                  className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-red-600/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Minimum Threshold</label>
                <input
                  type="number"
                  value={customForm.threshold}
                  onChange={(e) => setCustomForm({ ...customForm, threshold: e.target.value })}
                  className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-red-600/50"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateSegment}
                className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition"
              >
                Create Segment
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="rounded-full bg-brand-950 border border-brand-800/30 px-6 py-2.5 text-sm font-semibold text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Segment Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {SEGMENTS.map((seg) => (
            <div key={seg.id} className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5 hover:border-red-600/30 transition group">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${seg.color} flex items-center justify-center text-lg`}>
                  {seg.icon}
                </div>
                <button
                  onClick={() => { toast(`Exporting "${seg.name}" segment...`, 'info'); }}
                  className="text-xs text-gray-500 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                >
                  Export
                </button>
              </div>
              <h3 className="font-bold text-sm mb-0.5">{seg.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{seg.description}</p>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold">{seg.count.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">fans</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-300">{seg.metric}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toast(`Composing message to ${seg.name}...`, 'info')}
                  className="flex-1 rounded-full bg-red-600 py-2 text-xs font-semibold text-white hover:bg-red-500 transition"
                >
                  Message Segment
                </button>
                <button
                  onClick={() => toast(`Viewing ${seg.name} fans...`, 'info')}
                  className="flex-1 rounded-full bg-brand-950 border border-brand-800/30 py-2 text-xs font-semibold text-gray-400 hover:text-white hover:border-red-600/50 transition"
                >
                  View Fans
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Segment Comparison */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
          <h2 className="text-lg font-bold mb-4">Segment Comparison</h2>
          <div className="flex flex-wrap gap-3 mb-6">
            <select
              value={compareA}
              onChange={(e) => setCompareA(e.target.value)}
              className="rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/50"
            >
              {SEGMENTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <span className="text-gray-500 self-center text-sm">vs</span>
            <select
              value={compareB}
              onChange={(e) => setCompareB(e.target.value)}
              className="rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/50"
            >
              {SEGMENTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="space-y-6">
            {/* Plays */}
            <ComparisonRow
              label="Avg Plays/Month"
              valueA={dataA.plays}
              valueB={dataB.plays}
              max={maxPlays}
              nameA={SEGMENTS.find((s) => s.id === compareA)?.name ?? ''}
              nameB={SEGMENTS.find((s) => s.id === compareB)?.name ?? ''}
            />
            {/* Spend */}
            <ComparisonRow
              label="Avg Spend ($)"
              valueA={dataA.spend}
              valueB={dataB.spend}
              max={maxSpend}
              nameA={SEGMENTS.find((s) => s.id === compareA)?.name ?? ''}
              nameB={SEGMENTS.find((s) => s.id === compareB)?.name ?? ''}
            />
            {/* Events */}
            <ComparisonRow
              label="Avg Events"
              valueA={dataA.events}
              valueB={dataB.events}
              max={maxEvents}
              nameA={SEGMENTS.find((s) => s.id === compareA)?.name ?? ''}
              nameB={SEGMENTS.find((s) => s.id === compareB)?.name ?? ''}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewCard({ label, value, icon, accent }: { label: string; value: string; icon: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5">
      <span className="text-lg">{icon}</span>
      <p className={`text-2xl font-bold mt-2 ${accent ? 'text-red-500' : ''}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function ComparisonRow({ label, valueA, valueB, max, nameA, nameB }: {
  label: string; valueA: number; valueB: number; max: number; nameA: string; nameB: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-400 mb-2">{label}</p>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-24 truncate">{nameA}</span>
          <div className="flex-1 h-3 rounded-full bg-brand-950/50 overflow-hidden">
            <div className="h-full rounded-full bg-red-600 transition-all duration-500" style={{ width: `${(valueA / max) * 100}%` }} />
          </div>
          <span className="text-sm font-bold w-12 text-right">{valueA}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-24 truncate">{nameB}</span>
          <div className="flex-1 h-3 rounded-full bg-brand-950/50 overflow-hidden">
            <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${(valueB / max) * 100}%` }} />
          </div>
          <span className="text-sm font-bold w-12 text-right">{valueB}</span>
        </div>
      </div>
    </div>
  );
}
