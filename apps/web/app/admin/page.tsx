'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

/* ─── Mock Data ─── */
const MOCK_USERS = [
  { id: '1', name: 'Alice Rivera', email: 'alice@opynx.com', role: 'creator', status: 'active', joined: '2025-08-12' },
  { id: '2', name: 'Marcus Chen', email: 'marcus@gmail.com', role: 'fan', status: 'active', joined: '2025-09-01' },
  { id: '3', name: 'DJ Phantom', email: 'phantom@proton.me', role: 'creator', status: 'active', joined: '2025-10-15' },
  { id: '4', name: 'Sara Kim', email: 'sara.k@yahoo.com', role: 'fan', status: 'suspended', joined: '2025-11-03' },
  { id: '5', name: 'Leo Beats', email: 'leo@opynx.com', role: 'facilitator', status: 'active', joined: '2025-12-20' },
];

const MOCK_FLAGGED = [
  { id: 'f1', type: 'track', title: 'Explicit Untitled Demo', reporter: 'auto-mod', reason: 'Explicit content not tagged', date: '2026-03-28' },
  { id: 'f2', type: 'comment', title: 'Spam link in comments', reporter: 'marcus@gmail.com', reason: 'Spam / phishing link', date: '2026-03-30' },
  { id: 'f3', type: 'profile', title: 'Fake creator profile "Drake"', reporter: 'sara.k@yahoo.com', reason: 'Impersonation', date: '2026-04-01' },
];

const MOCK_MRR_DATA = [
  { month: 'May', value: 420 }, { month: 'Jun', value: 680 }, { month: 'Jul', value: 950 },
  { month: 'Aug', value: 1240 }, { month: 'Sep', value: 1580 }, { month: 'Oct', value: 2100 },
  { month: 'Nov', value: 2650 }, { month: 'Dec', value: 3100 }, { month: 'Jan', value: 3800 },
  { month: 'Feb', value: 4350 }, { month: 'Mar', value: 5020 }, { month: 'Apr', value: 5480 },
];

const MOCK_REVENUE_TIERS = [
  { tier: 'Fan ($8.73/mo)', subscribers: 487, mrr: 4251.51 },
  { tier: 'Superfan ($14.99/mo)', subscribers: 62, mrr: 929.38 },
  { tier: 'Patron ($24.99/mo)', subscribers: 12, mrr: 299.88 },
];

const MOCK_PAYOUTS = [
  { id: 'p1', creator: 'Alice Rivera', amount: 342.50, status: 'pending', date: '2026-04-03' },
  { id: 'p2', creator: 'DJ Phantom', amount: 218.75, status: 'pending', date: '2026-04-03' },
  { id: 'p3', creator: 'Leo Beats', amount: 156.30, status: 'completed', txHash: '0x7a3f...e92b', date: '2026-03-28' },
  { id: 'p4', creator: 'Alice Rivera', amount: 298.10, status: 'completed', txHash: '0x1b8c...4d3a', date: '2026-03-21' },
];

const SERVICES = [
  { name: 'Database', status: 'healthy' as const, latency: '4ms' },
  { name: 'Redis', status: 'healthy' as const, latency: '1ms' },
  { name: 'Search', status: 'degraded' as const, latency: '120ms' },
  { name: 'CDN', status: 'healthy' as const, latency: '12ms' },
];

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [userSearch, setUserSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'revenue' | 'payouts' | 'health'>('overview');

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const userRole = (session?.user as { role?: string })?.role;
  if (!session || (userRole !== 'super_admin' && userRole !== 'admin')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-3xl font-bold mb-3">Access Denied</h1>
        <p className="text-gray-400 mb-8 max-w-sm">
          You do not have permission to view the admin dashboard. Contact a super admin if you believe this is an error.
        </p>
        <Link href="/" className="rounded-full bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700">
          Go Home
        </Link>
      </div>
    );
  }

  const filteredUsers = MOCK_USERS.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const maxMrr = Math.max(...MOCK_MRR_DATA.map(d => d.value));

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'users' as const, label: 'Users' },
    { key: 'content' as const, label: 'Moderation' },
    { key: 'revenue' as const, label: 'Revenue' },
    { key: 'payouts' as const, label: 'Payouts' },
    { key: 'health' as const, label: 'System' },
  ];

  return (
    <div className="min-h-screen bg-brand-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">OPYNX Platform Management</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="rounded-lg bg-[#15151f] border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 hover:border-red-600/40 transition">
              Feature Flags
            </button>
            <button className="rounded-lg bg-[#15151f] border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 hover:border-red-600/40 transition">
              DLQ Viewer
            </button>
            <button className="rounded-lg bg-[#15151f] border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 hover:border-red-600/40 transition">
              Export Data
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
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
        </div>

        {/* ─── Overview Tab ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Total Users', value: '561', change: '+23 this week' },
                { label: 'Active Subscribers', value: '487', change: '+12 this week' },
                { label: 'MRR', value: '$5,480', change: '+8.3%' },
                { label: 'Total Tracks', value: '1,247', change: '+34 this month' },
                { label: 'Total Events', value: '89', change: '12 upcoming' },
                { label: 'Pending Payouts', value: '$561', change: '2 batches' },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl bg-[#15151f] p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-red-400 mt-1">{stat.change}</p>
                </div>
              ))}
            </div>

            {/* Quick Summaries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Users */}
              <div className="rounded-xl bg-[#15151f] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Recent Users</h3>
                  <Link href="/admin/users" className="text-sm text-red-400 hover:text-red-300 transition">View All</Link>
                </div>
                <div className="space-y-3">
                  {MOCK_USERS.slice(0, 3).map(user => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center text-sm font-bold text-red-400">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        user.role === 'creator' ? 'bg-purple-600/20 text-purple-400' :
                        user.role === 'facilitator' ? 'bg-blue-600/20 text-blue-400' :
                        'bg-gray-600/20 text-gray-400'
                      }`}>{user.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flagged Content */}
              <div className="rounded-xl bg-[#15151f] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Flagged Content</h3>
                  <span className="text-xs bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full">{MOCK_FLAGGED.length} pending</span>
                </div>
                <div className="space-y-3">
                  {MOCK_FLAGGED.map(item => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.reason}</p>
                      </div>
                      <span className="text-xs text-gray-500">{item.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* System Health Quick */}
            <div className="rounded-xl bg-[#15151f] p-6">
              <h3 className="font-semibold text-lg mb-4">System Health</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {SERVICES.map(svc => (
                  <div key={svc.name} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      svc.status === 'healthy' ? 'bg-green-500' :
                      svc.status === 'degraded' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{svc.name}</p>
                      <p className="text-xs text-gray-500">{svc.latency}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Users Tab ─── */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full sm:w-80 bg-[#15151f] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-red-600/50 outline-none transition text-sm"
              />
              <Link href="/admin/users" className="text-sm text-red-400 hover:text-red-300 font-semibold transition">
                Full User Management →
              </Link>
            </div>

            <div className="rounded-xl bg-[#15151f] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Role</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                        <td className="px-4 py-3 font-medium">{user.name}</td>
                        <td className="px-4 py-3 text-gray-400">{user.email}</td>
                        <td className="px-4 py-3">
                          <select
                            defaultValue={user.role}
                            className="bg-transparent border border-white/10 rounded px-2 py-1 text-xs text-gray-300 outline-none focus:border-red-600/50"
                          >
                            <option value="fan">Fan</option>
                            <option value="creator">Creator</option>
                            <option value="facilitator">Facilitator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            user.status === 'active' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                          }`}>{user.status}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{user.joined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── Content Moderation Tab ─── */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-2">Flagged Content</h2>
            {MOCK_FLAGGED.map(item => (
              <div key={item.id} className="rounded-xl bg-[#15151f] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                    item.type === 'track' ? 'bg-purple-600/20' :
                    item.type === 'comment' ? 'bg-blue-600/20' :
                    'bg-orange-600/20'
                  }`}>
                    {item.type === 'track' ? '🎵' : item.type === 'comment' ? '💬' : '👤'}
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.reason} &middot; Reported by {item.reporter} &middot; {item.date}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="rounded-lg bg-green-600/20 text-green-400 px-4 py-2 text-sm font-medium hover:bg-green-600/30 transition">
                    Approve
                  </button>
                  <button className="rounded-lg bg-red-600/20 text-red-400 px-4 py-2 text-sm font-medium hover:bg-red-600/30 transition">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Revenue Tab ─── */}
        {activeTab === 'revenue' && (
          <div className="space-y-8">
            {/* MRR Chart */}
            <div className="rounded-xl bg-[#15151f] p-6">
              <h3 className="font-semibold text-lg mb-6">Monthly Recurring Revenue (12 Months)</h3>
              <div className="flex items-end gap-2 h-48">
                {MOCK_MRR_DATA.map(d => (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-500">${(d.value / 1000).toFixed(1)}k</span>
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-red-700 to-red-500 transition-all duration-500"
                      style={{ height: `${(d.value / maxMrr) * 100}%`, minHeight: '4px' }}
                    />
                    <span className="text-[10px] text-gray-500 mt-1">{d.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue by Tier */}
            <div className="rounded-xl bg-[#15151f] p-6">
              <h3 className="font-semibold text-lg mb-4">Revenue by Tier</h3>
              <div className="space-y-4">
                {MOCK_REVENUE_TIERS.map(tier => {
                  const totalMrr = MOCK_REVENUE_TIERS.reduce((s, t) => s + t.mrr, 0);
                  const pct = (tier.mrr / totalMrr) * 100;
                  return (
                    <div key={tier.tier}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">{tier.tier}</span>
                        <span className="text-gray-400">{tier.subscribers} subs &middot; ${tier.mrr.toLocaleString()}/mo</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-red-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── Payouts Tab ─── */}
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            {/* Pending Batches */}
            <div className="rounded-xl bg-[#15151f] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Pending Payout Batches</h3>
                <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition">
                  Execute Batch
                </button>
              </div>
              <div className="space-y-3">
                {MOCK_PAYOUTS.filter(p => p.status === 'pending').map(payout => (
                  <div key={payout.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{payout.creator}</p>
                      <p className="text-xs text-gray-500">{payout.date}</p>
                    </div>
                    <span className="font-bold text-red-400">${payout.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Completed */}
            <div className="rounded-xl bg-[#15151f] p-6">
              <h3 className="font-semibold text-lg mb-4">Recent Payouts</h3>
              <div className="space-y-3">
                {MOCK_PAYOUTS.filter(p => p.status === 'completed').map(payout => (
                  <div key={payout.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{payout.creator}</p>
                      <p className="text-xs text-gray-500">{payout.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">${payout.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 font-mono">{payout.txHash}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── System Health Tab ─── */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SERVICES.map(svc => (
                <div key={svc.name} className="rounded-xl bg-[#15151f] p-6 text-center">
                  <div className={`w-5 h-5 rounded-full mx-auto mb-3 ${
                    svc.status === 'healthy' ? 'bg-green-500 shadow-lg shadow-green-500/30' :
                    svc.status === 'degraded' ? 'bg-yellow-500 shadow-lg shadow-yellow-500/30' :
                    'bg-red-500 shadow-lg shadow-red-500/30'
                  }`} />
                  <h4 className="font-semibold text-lg mb-1">{svc.name}</h4>
                  <p className="text-sm text-gray-400 capitalize">{svc.status}</p>
                  <p className="text-xs text-gray-500 mt-1">Latency: {svc.latency}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
