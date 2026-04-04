'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

/* ─── Mock Users ─── */
const MOCK_USERS = Array.from({ length: 15 }, (_, i) => ({
  id: `u${i + 1}`,
  name: [
    'Alice Rivera', 'Marcus Chen', 'DJ Phantom', 'Sara Kim', 'Leo Beats',
    'Nina Vasquez', 'Tyler Oaks', 'Priya Sharma', 'Jake Monroe', 'Aisha Toure',
    'Cody Blaze', 'Mei Lin', 'Oscar Reyes', 'Fatima Al-Rashid', 'Devon Clarke',
  ][i],
  email: [
    'alice@opynx.com', 'marcus@gmail.com', 'phantom@proton.me', 'sara.k@yahoo.com', 'leo@opynx.com',
    'nina.v@outlook.com', 'tyler.oaks@gmail.com', 'priya.s@hotmail.com', 'jake.monroe@opynx.com', 'aisha.t@gmail.com',
    'cody.blaze@proton.me', 'mei.lin@yahoo.com', 'oscar.r@gmail.com', 'fatima@opynx.com', 'devon.c@outlook.com',
  ][i],
  role: ['artist', 'fan', 'artist', 'fan', 'facilitator', 'fan', 'artist', 'fan', 'admin', 'fan', 'artist', 'fan', 'facilitator', 'artist', 'fan'][i],
  subscriptionTier: ['superfan', 'fan', 'patron', 'fan', 'none', 'fan', 'superfan', 'patron', 'none', 'fan', 'fan', 'superfan', 'fan', 'none', 'fan'][i],
  status: i === 3 || i === 10 ? 'suspended' : 'active',
  avatar: null as string | null,
  createdAt: new Date(2025, 5 + Math.floor(i / 2), 1 + i * 2).toISOString(),
}));

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const { data: session, status: authStatus } = useSession();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [subFilter, setSubFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (authStatus === 'loading') {
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
        <p className="text-gray-400 mb-8">Admin privileges required to view this page.</p>
        <Link href="/" className="rounded-full bg-red-600 px-8 py-3 font-semibold text-white hover:bg-red-700 transition">
          Go Home
        </Link>
      </div>
    );
  }

  // Filters
  let filtered = MOCK_USERS;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  if (roleFilter !== 'all') {
    filtered = filtered.filter(u => u.role === roleFilter);
  }
  if (subFilter !== 'all') {
    if (subFilter === 'active') filtered = filtered.filter(u => u.subscriptionTier !== 'none');
    else if (subFilter === 'none') filtered = filtered.filter(u => u.subscriptionTier === 'none');
    else filtered = filtered.filter(u => u.subscriptionTier === subFilter);
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats
  const totalUsers = MOCK_USERS.length;
  const newThisMonth = MOCK_USERS.filter(u => {
    const d = new Date(u.createdAt);
    return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
  }).length;
  const activeCount = MOCK_USERS.filter(u => u.status === 'active').length;
  const suspendedCount = MOCK_USERS.filter(u => u.status === 'suspended').length;

  const handleExportCSV = () => {
    const header = 'Name,Email,Role,Subscription,Status,Created\n';
    const rows = filtered.map(u =>
      `"${u.name}","${u.email}","${u.role}","${u.subscriptionTier}","${u.status}","${u.createdAt}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'opynx-users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-brand-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition">Admin</Link>
              <span className="text-gray-600">/</span>
              <span className="text-sm text-white font-medium">Users</span>
            </div>
            <h1 className="text-3xl font-bold">User Management</h1>
          </div>
          <button
            onClick={handleExportCSV}
            className="rounded-lg bg-[#15151f] border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 hover:border-red-600/40 transition"
          >
            Export as CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: totalUsers, color: 'text-white' },
            { label: 'New This Month', value: newThisMonth, color: 'text-red-400' },
            { label: 'Active', value: activeCount, color: 'text-green-400' },
            { label: 'Suspended', value: suspendedCount, color: 'text-yellow-400' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl bg-[#15151f] p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 sm:max-w-sm bg-[#15151f] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-red-600/50 outline-none transition text-sm"
          />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="bg-[#15151f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-red-600/50"
          >
            <option value="all">All Roles</option>
            <option value="fan">Fan</option>
            <option value="artist">Artist</option>
            <option value="facilitator">Facilitator</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={subFilter}
            onChange={(e) => { setSubFilter(e.target.value); setPage(1); }}
            className="bg-[#15151f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-red-600/50"
          >
            <option value="all">All Subscriptions</option>
            <option value="active">Has Subscription</option>
            <option value="none">No Subscription</option>
            <option value="fan">Fan Tier</option>
            <option value="superfan">Superfan Tier</option>
            <option value="patron">Patron Tier</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-xl bg-[#15151f] overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">User</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Role</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Subscription</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Created</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(user => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center text-sm font-bold text-red-400 shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            user.status === 'active' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                          }`}>{user.status}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{user.email}</td>
                    <td className="px-4 py-3">
                      <select
                        defaultValue={user.role}
                        className="bg-transparent border border-white/10 rounded px-2 py-1 text-xs text-gray-300 outline-none focus:border-red-600/50"
                      >
                        <option value="fan">Fan</option>
                        <option value="artist">Artist</option>
                        <option value="facilitator">Facilitator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        user.subscriptionTier === 'none' ? 'bg-gray-600/20 text-gray-500' :
                        user.subscriptionTier === 'patron' ? 'bg-purple-600/20 text-purple-400' :
                        user.subscriptionTier === 'superfan' ? 'bg-red-600/20 text-red-400' :
                        'bg-blue-600/20 text-blue-400'
                      }`}>{user.subscriptionTier}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/profile/${user.id}`}
                          className="text-xs text-red-400 hover:text-red-300 font-medium transition"
                        >
                          View
                        </Link>
                        <button className="text-xs text-yellow-400 hover:text-yellow-300 font-medium transition">
                          {user.status === 'active' ? 'Suspend' : 'Unsuspend'}
                        </button>
                        {confirmDelete === user.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-xs text-gray-400 hover:text-white font-medium transition"
                            >
                              Cancel
                            </button>
                            <button className="text-xs text-red-500 hover:text-red-400 font-bold transition">
                              Confirm
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(user.id)}
                            className="text-xs text-red-500/60 hover:text-red-400 font-medium transition"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {paged.length} of {filtered.length} users
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg bg-[#15151f] border border-white/10 px-3 py-1.5 text-sm text-gray-300 disabled:opacity-30 hover:border-red-600/40 transition"
            >
              Previous
            </button>
            <span className="flex items-center text-sm text-gray-400 px-2">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg bg-[#15151f] border border-white/10 px-3 py-1.5 text-sm text-gray-300 disabled:opacity-30 hover:border-red-600/40 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
