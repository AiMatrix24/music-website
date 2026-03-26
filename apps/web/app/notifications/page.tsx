'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

type FilterType = 'all' | 'unread' | 'follow' | 'ticket' | 'payout' | 'broadcast';

const NOTIFICATIONS = [
  { id: '1', type: 'follow' as const, title: 'New Follower', message: 'Alex Rivera started following you', read: false, href: '/dashboard', createdAt: new Date(Date.now() - 1800000) },
  { id: '2', type: 'ticket' as const, title: 'Ticket Sold', message: 'Someone purchased a VIP ticket to Neon Nights Tour', read: false, href: '/dashboard/tickets', createdAt: new Date(Date.now() - 7200000) },
  { id: '3', type: 'milestone' as const, title: '🎉 Play Milestone!', message: 'Your track "Midnight Drive" hit 10,000 plays!', read: false, href: '/dashboard/analytics', createdAt: new Date(Date.now() - 14400000) },
  { id: '4', type: 'broadcast' as const, title: 'Artist Update', message: 'Cipher posted: "New album dropping next week! Stay tuned."', read: true, createdAt: new Date(Date.now() - 86400000) },
  { id: '5', type: 'payout' as const, title: 'Payout Complete', message: '$42.50 USDC sent to your Polygon wallet (0x7a3...f2e1)', read: true, href: '/settings', createdAt: new Date(Date.now() - 172800000) },
  { id: '6', type: 'comment' as const, title: 'New Comment', message: 'Jordan Kim commented on "Neon Horizon": "This track is fire 🔥"', read: true, createdAt: new Date(Date.now() - 259200000) },
  { id: '7', type: 'ticket' as const, title: '3 Tickets Sold', message: '3 General Admission tickets sold for Wanderer Festival', read: true, href: '/dashboard/tickets', createdAt: new Date(Date.now() - 345600000) },
  { id: '8', type: 'follow' as const, title: 'New Follower', message: 'Sam Chen started following you', read: true, createdAt: new Date(Date.now() - 432000000) },
  { id: '9', type: 'payout' as const, title: 'Payout Scheduled', message: 'Your next payout of $28.75 is scheduled for April 1', read: true, createdAt: new Date(Date.now() - 518400000) },
  { id: '10', type: 'broadcast' as const, title: 'System Update', message: 'OPYNX v2.0 is live! Check out the new analytics dashboard.', read: true, createdAt: new Date(Date.now() - 604800000) },
];

export default function NotificationsPage() {
  const { status } = useSession();
  const [filter, setFilter] = useState<FilterType>('all');
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl mb-2">🔔</p>
        <p className="text-gray-400">Sign in to view notifications</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Sign In</Link>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const typeIcon = (type: string) => {
    const map: Record<string, string> = { follow: '👤', ticket: '🎫', broadcast: '📢', payout: '💰', milestone: '🎉', comment: '💬', system: '⚙️' };
    return map[type] ?? '🔔';
  };

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' }, { id: 'unread', label: `Unread (${unreadCount})` },
    { id: 'follow', label: 'Follows' }, { id: 'ticket', label: 'Tickets' },
    { id: 'payout', label: 'Payouts' }, { id: 'broadcast', label: 'Updates' },
  ];

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm text-red-400 hover:text-red-300 font-semibold transition">
              Mark all as read
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                filter === f.id ? 'bg-red-600 text-white' : 'bg-[#15151f] text-gray-400 hover:text-white'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map((n) => (
            <div key={n.id} className={`rounded-xl p-4 transition ${!n.read ? 'bg-red-950/10 border border-red-800/20' : 'bg-[#15151f] border border-brand-800/20'} ${n.href ? 'cursor-pointer hover:bg-[#1a1a2e]' : ''}`}>
              {n.href ? (
                <Link href={n.href} className="flex items-start gap-3">
                  <NotifContent n={n} typeIcon={typeIcon} />
                </Link>
              ) : (
                <div className="flex items-start gap-3">
                  <NotifContent n={n} typeIcon={typeIcon} />
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">🔔</p>
              <p className="text-gray-500">No notifications in this category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotifContent({ n, typeIcon }: { n: any; typeIcon: (t: string) => string }) {
  return (
    <>
      <span className="text-xl mt-0.5">{typeIcon(n.type)}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-semibold ${!n.read ? 'text-white' : 'text-gray-400'}`}>{n.title}</p>
          {!n.read && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
        <p className="text-xs text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
      </div>
    </>
  );
}

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
