'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { VerifiedBadge } from '@/app/components/VerifiedBadge';

/**
 * Admin dashboard — real platform data instead of the previous mock theater.
 *
 * Tabs: Overview, Users, Revenue, Payouts. Dropped:
 *   - Moderation: no flag/report system in the schema yet, so the buttons
 *     would have nothing to act on. Add when comments + reports exist.
 *   - System Health: faking green dots without a real health monitor is
 *     misleading. Add when we wire actual /healthz probes per service.
 */

const TIER_LABEL: Record<string, string> = {
  premium: 'Premium ($8.73/mo)',
  bundle: 'Superfan Bundle ($12.73/mo)',
  studio: 'Studio ($16.00/mo)',
};

type Tab = 'overview' | 'users' | 'revenue' | 'payouts';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const isAdmin =
    !!session?.user &&
    ((session.user as { role?: string }).role === 'admin' ||
      (session.user as { role?: string }).role === 'super_admin');

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-3xl font-bold mb-3">Access Denied</h1>
        <p className="text-gray-400 mb-8 max-w-sm">
          You don't have permission to view the admin dashboard.
        </p>
        <Link href="/" className="rounded-full bg-red-600 px-8 py-3 font-semibold text-white hover:bg-red-700 transition">
          Go Home
        </Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'payouts', label: 'Payouts' },
  ];

  return (
    <div className="min-h-screen bg-brand-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">OPYNX platform management</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-red-600 text-white'
                  : 'bg-[#15151f] text-gray-400 hover:text-white hover:bg-[#1a1a2e]'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <Link
            href="/admin/verified"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#15151f] text-gray-400 hover:text-white hover:bg-[#1a1a2e] transition whitespace-nowrap"
          >
            Verified Queue →
          </Link>
          <Link
            href="/admin/distribution"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#15151f] text-gray-400 hover:text-white hover:bg-[#1a1a2e] transition whitespace-nowrap"
          >
            Distribution Queue →
          </Link>
          <Link
            href="/admin/dmca"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#15151f] text-gray-400 hover:text-white hover:bg-[#1a1a2e] transition whitespace-nowrap"
          >
            DMCA Queue →
          </Link>
        </div>

        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'revenue' && <RevenueTab />}
        {activeTab === 'payouts' && <PayoutsTab />}
      </div>
    </div>
  );
}

// ───────── Overview ─────────

function OverviewTab() {
  const dash = trpc.admin.getDashboard.useQuery();
  const recent = trpc.admin.getUsers.useQuery({ limit: 5, offset: 0 });

  const stats = [
    { label: 'Total Users', value: dash.data?.totalUsers, change: dash.data ? `+${dash.data.newUsersLast7Days} this week` : '' },
    { label: 'Active Subscribers', value: dash.data?.activeSubscriptions, change: '' },
    { label: 'MRR', value: dash.data ? `$${(dash.data.mrrCents / 100).toFixed(2)}` : undefined, change: '' },
    { label: 'Total Tracks', value: dash.data?.totalTracks, change: '' },
    { label: 'Total Events', value: dash.data?.totalEvents, change: '' },
    { label: 'Pending Payouts', value: dash.data ? `$${(dash.data.pendingPayoutCents / 100).toFixed(2)}` : undefined, change: '' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-[#15151f] p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-white">
              {stat.value === undefined ? <span className="text-gray-700">—</span> : stat.value}
            </p>
            {stat.change && <p className="text-xs text-red-400 mt-1">{stat.change}</p>}
          </div>
        ))}
      </div>

      {/* Recent Users */}
      <div className="rounded-xl bg-[#15151f] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Recent signups</h3>
        </div>
        {recent.isLoading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : !recent.data || recent.data.length === 0 ? (
          <p className="text-gray-500 text-sm">No users yet.</p>
        ) : (
          <div className="space-y-3">
            {recent.data.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {u.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center text-sm font-bold text-red-400 shrink-0">
                      {(u.name ?? u.email ?? '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium flex items-center gap-1 truncate">
                      {u.name ?? '(no name)'}
                      {u.verifiedAt && <VerifiedBadge size="sm" />}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{u.email ?? '—'}</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    u.role === 'creator' ? 'bg-purple-600/20 text-purple-400' :
                    u.role === 'facilitator' ? 'bg-blue-600/20 text-blue-400' :
                    u.role === 'admin' || u.role === 'super_admin' ? 'bg-red-600/20 text-red-400' :
                    'bg-gray-600/20 text-gray-400'
                  }`}
                >
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes about deferred features (honest, not theatrical) */}
      <div className="rounded-xl bg-[#15151f] border border-brand-800/20 p-6">
        <h3 className="font-semibold text-lg mb-3">Coming soon</h3>
        <ul className="text-sm text-gray-400 space-y-2 list-disc list-inside">
          <li>Content moderation queue (needs a flag/report table — not yet built)</li>
          <li>System health probes (real /healthz checks per service — not yet wired)</li>
          <li>Historical MRR chart (needs monthly snapshot job — not yet wired)</li>
          <li>Feature flags / DLQ viewer / data export (post-launch)</li>
        </ul>
      </div>
    </div>
  );
}

// ───────── Users ─────────

function UsersTab() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const usersQuery = trpc.admin.getUsers.useQuery({
    limit: 100,
    offset: 0,
    role: roleFilter || undefined,
  });

  const filtered = useMemo(() => {
    if (!usersQuery.data) return [];
    if (!search.trim()) return usersQuery.data;
    const q = search.trim().toLowerCase();
    return usersQuery.data.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [usersQuery.data, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 sm:max-w-md bg-[#15151f] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-red-600/50 outline-none transition text-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-[#15151f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-red-600/50"
        >
          <option value="">All roles</option>
          <option value="free">Free</option>
          <option value="subscriber">Subscriber</option>
          <option value="creator">Creator</option>
          <option value="facilitator">Facilitator</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super admin</option>
        </select>
      </div>

      <div className="rounded-xl bg-[#15151f] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Verified</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    {search || roleFilter ? 'No users match those filters.' : 'No users yet.'}
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        {u.name ?? <span className="text-gray-500">—</span>}
                        {u.verifiedAt && <VerifiedBadge size="sm" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{u.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-600/20 text-gray-400 capitalize">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {u.verifiedAt ? new Date(u.verifiedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Showing the most recent 100 users. Server-side filter by role above; client-side text search across name/email.
      </p>
    </div>
  );
}

// ───────── Revenue ─────────

function RevenueTab() {
  const dash = trpc.admin.getDashboard.useQuery();
  const tiers = trpc.admin.revenueByTier.useQuery();

  const totalMrrCents = tiers.data?.reduce((s, t) => s + t.mrrCents, 0) ?? 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="MRR" value={dash.data ? `$${(dash.data.mrrCents / 100).toFixed(2)}` : undefined} sub="Across all tiers" />
        <Stat label="Active Subscribers" value={dash.data?.activeSubscriptions} sub="Status = active" />
        <Stat label="Pending Payouts" value={dash.data ? `$${(dash.data.pendingPayoutCents / 100).toFixed(2)}` : undefined} sub="Awaiting admin disbursal" />
      </div>

      <div className="rounded-xl bg-[#15151f] p-6">
        <h3 className="font-semibold text-lg mb-4">Revenue by tier</h3>
        {tiers.isLoading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : !tiers.data || tiers.data.length === 0 ? (
          <p className="text-gray-500 text-sm">No active subscribers yet.</p>
        ) : (
          <div className="space-y-4">
            {tiers.data.map((t) => {
              const pct = totalMrrCents > 0 ? (t.mrrCents / totalMrrCents) * 100 : 0;
              return (
                <div key={t.tier}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{TIER_LABEL[t.tier] ?? t.tier}</span>
                    <span className="text-gray-400">
                      {t.subscribers} sub{t.subscribers === 1 ? '' : 's'} · ${(t.mrrCents / 100).toFixed(2)}/mo
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-red-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Historical MRR chart pending — needs a daily snapshot job to capture
        sub counts per tier over time.
      </p>
    </div>
  );
}

// ───────── Payouts ─────────

function PayoutsTab() {
  const queueQuery = trpc.payouts.adminQueue.useQuery();

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-[#15151f] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Pending payout requests</h3>
          {queueQuery.data && (
            <span className="text-xs text-gray-500">{queueQuery.data.length} pending</span>
          )}
        </div>
        {queueQuery.isLoading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : !queueQuery.data || queueQuery.data.length === 0 ? (
          <p className="text-gray-500 text-sm">No pending requests.</p>
        ) : (
          <div className="space-y-3">
            {queueQuery.data.map((row) => (
              <div
                key={row.request.id}
                className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{row.userName ?? '—'}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {row.userEmail ?? '—'} · requested {new Date(row.request.requestedAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-600 font-mono mt-1 truncate">
                    {row.request.walletAddress}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-red-400">${(row.request.amountCents / 100).toFixed(2)}</p>
                  <p className="text-xs text-gray-500 capitalize">{row.request.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Admin approval / mark-paid actions live on the existing payout-request
        flow — extend this view if you want one-click approval here too.
      </p>
    </div>
  );
}

// ───────── Helpers ─────────

function Stat({ label, value, sub }: { label: string; value: string | number | undefined; sub?: string }) {
  return (
    <div className="rounded-xl bg-[#15151f] p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">
        {value === undefined ? <span className="text-gray-700">—</span> : value}
      </p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}
