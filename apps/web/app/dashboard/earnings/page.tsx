'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';

const SOURCE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  subscriptions: { label: 'Subscriptions', icon: '📅', color: 'bg-red-700' },
  tips: { label: 'Tips', icon: '💰', color: 'bg-red-600' },
  tracks: { label: 'Track sales', icon: '🎵', color: 'bg-red-500' },
  tickets: { label: 'Tickets', icon: '🎫', color: 'bg-red-400' },
  marketplace: { label: 'Marketplace', icon: '🛍️', color: 'bg-red-300' },
};

export default function EarningsPage() {
  const { status } = useSession();
  const { data: summary, isLoading: summaryLoading } = trpc.earnings.summary.useQuery(
    undefined,
    { enabled: status === 'authenticated' }
  );
  const { data: recent, isLoading: recentLoading } = trpc.earnings.recentTransactions.useQuery(
    undefined,
    { enabled: status === 'authenticated' }
  );

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
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const lifetime = summary?.lifetime ?? 0;
  const thirtyDay = summary?.thirtyDay ?? 0;
  const bySource = summary?.bySource;

  // Compute per-source percentages of lifetime
  const sources = bySource
    ? Object.entries(bySource)
        .map(([key, v]) => ({
          key,
          lifetime: (v as { lifetime: number }).lifetime,
          recent: (v as { recent: number }).recent,
          count: (v as { count: number }).count,
          pct: lifetime > 0 ? Math.round(((v as { lifetime: number }).lifetime / lifetime) * 100) : 0,
        }))
        .sort((a, b) => b.lifetime - a.lifetime)
    : [];

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">← Dashboard</Link>
        <h1 className="text-3xl font-bold mt-2">
          Earnings <span className="text-red-500">Overview</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          All revenue you&apos;ve earned across the platform. Amounts settled on-chain via Polygon.
        </p>
      </div>

      {summaryLoading ? (
        <div className="rounded-2xl bg-[#15151f] p-12 text-center">
          <div className="animate-pulse text-gray-400">Loading earnings…</div>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="rounded-2xl bg-gradient-to-br from-red-600/20 to-red-900/10 border border-red-800/30 p-6">
              <p className="text-xs text-red-400 uppercase tracking-wider mb-1">Lifetime earnings</p>
              <p className="text-4xl font-black">${(lifetime / 100).toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-2">Across all revenue streams</p>
            </div>
            <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Last 30 days</p>
              <p className="text-4xl font-black">${(thirtyDay / 100).toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-2">
                {recent?.length ?? 0} transaction{recent?.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          {/* Breakdown by source */}
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-8">
            <h2 className="font-bold mb-4">Breakdown by source</h2>
            {lifetime === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">
                No earnings yet. Upload a track with a price, create a paid event, or enable the tip jar to start earning.
              </p>
            ) : (
              <div className="space-y-3">
                {sources.map((s) => {
                  const meta = SOURCE_LABELS[s.key];
                  if (!meta) return null;
                  return (
                    <div key={s.key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <span>{meta.icon}</span>
                          <span className="text-gray-300 font-semibold">{meta.label}</span>
                          <span className="text-xs text-gray-500">
                            {s.count} transaction{s.count === 1 ? '' : 's'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">
                            30d: ${(s.recent / 100).toFixed(2)}
                          </span>
                          <span className="font-bold">${(s.lifetime / 100).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-brand-950 overflow-hidden">
                        <div
                          className={`h-full ${meta.color} transition-all`}
                          style={{ width: `${s.pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent transactions */}
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
            <h2 className="font-bold mb-4">Recent activity (last 30 days)</h2>
            {recentLoading ? (
              <div className="animate-pulse text-gray-400 py-6 text-center">Loading…</div>
            ) : (recent?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">
                No transactions in the last 30 days.
              </p>
            ) : (
              <div className="divide-y divide-brand-800/20">
                {recent!.map((t) => {
                  // Normalize singular txn source → plural SOURCE_LABELS key
                  const labelKey =
                    t.source === 'tip' ? 'tips' :
                    t.source === 'track' ? 'tracks' :
                    t.source === 'ticket' ? 'tickets' :
                    t.source === 'subscription' ? 'subscriptions' :
                    t.source; // marketplace stays as-is
                  const meta = SOURCE_LABELS[labelKey] ?? {
                    label: t.source,
                    icon: '•',
                    color: 'bg-gray-500',
                  };
                  return (
                    <div key={`${t.source}-${t.id}`} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-lg">{meta.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{t.label}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(t.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-green-400 shrink-0">
                        +${(t.amount / 100).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
