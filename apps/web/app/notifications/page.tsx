'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';

type FilterType =
  | 'all'
  | 'unread'
  | 'revenue'   // ticket_sale | track_sale | subscription | tip_received | marketplace_sale
  | 'social'    // follow | comment | mention
  | 'payouts'   // payout_processed | payout_rejected
  | 'system';   // system | milestone | verification_status

type NotificationType =
  | 'ticket_sale' | 'track_sale' | 'subscription' | 'tip_received' | 'marketplace_sale'
  | 'follow' | 'comment' | 'mention'
  | 'payout_processed' | 'payout_rejected'
  | 'milestone' | 'verification_status' | 'system';

const TYPE_ICON: Record<NotificationType, string> = {
  ticket_sale: '🎫',
  track_sale: '🎵',
  subscription: '⭐',
  tip_received: '💵',
  marketplace_sale: '🛍️',
  follow: '👤',
  comment: '💬',
  mention: '@',
  payout_processed: '💰',
  payout_rejected: '⚠️',
  milestone: '🎉',
  verification_status: '✅',
  system: '⚙️',
};

const REVENUE_TYPES: NotificationType[] = ['ticket_sale', 'track_sale', 'subscription', 'tip_received', 'marketplace_sale'];
const SOCIAL_TYPES: NotificationType[] = ['follow', 'comment', 'mention'];
const PAYOUT_TYPES: NotificationType[] = ['payout_processed', 'payout_rejected'];
const SYSTEM_TYPES: NotificationType[] = ['system', 'milestone', 'verification_status'];

export default function NotificationsPage() {
  const { status } = useSession();
  const [filter, setFilter] = useState<FilterType>('all');

  const enabled = status === 'authenticated';
  const listQuery = trpc.notifications.list.useQuery({ limit: 100 }, { enabled });
  const unreadQuery = trpc.notifications.unreadCount.useQuery(undefined, { enabled });

  const utils = trpc.useUtils();
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  if (!enabled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl mb-2">🔔</p>
        <p className="text-gray-400">Sign in to view notifications</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Sign In</Link>
      </div>
    );
  }

  const notifications = listQuery.data ?? [];
  const unreadCount = unreadQuery.data ?? 0;

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return n.readAt === null;
    if (filter === 'revenue') return REVENUE_TYPES.includes(n.type as NotificationType);
    if (filter === 'social') return SOCIAL_TYPES.includes(n.type as NotificationType);
    if (filter === 'payouts') return PAYOUT_TYPES.includes(n.type as NotificationType);
    if (filter === 'system') return SYSTEM_TYPES.includes(n.type as NotificationType);
    return true;
  });

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: `Unread (${unreadCount})` },
    { id: 'revenue', label: 'Revenue' },
    { id: 'social', label: 'Social' },
    { id: 'payouts', label: 'Payouts' },
    { id: 'system', label: 'System' },
  ];

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="text-sm text-red-400 hover:text-red-300 font-semibold transition disabled:opacity-50"
            >
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

        {listQuery.isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((n) => {
              const isRead = n.readAt !== null;
              const onActivate = () => {
                if (!isRead) markRead.mutate({ id: n.id });
              };
              return (
                <div
                  key={n.id}
                  className={`rounded-xl p-4 transition ${
                    !isRead ? 'bg-red-950/10 border border-red-800/20' : 'bg-[#15151f] border border-brand-800/20'
                  } ${n.link ? 'cursor-pointer hover:bg-[#1a1a2e]' : ''}`}
                >
                  {n.link ? (
                    <Link href={n.link} onClick={onActivate} className="flex items-start gap-3">
                      <NotifContent n={n} />
                    </Link>
                  ) : (
                    <div onClick={onActivate} className="flex items-start gap-3">
                      <NotifContent n={n} />
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-gray-500">No notifications in this category</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NotifContent({ n }: { n: { type: string; title: string; body: string; readAt: Date | string | null; createdAt: Date | string } }) {
  const isRead = n.readAt !== null;
  return (
    <>
      <span className="text-xl mt-0.5">{TYPE_ICON[n.type as NotificationType] ?? '🔔'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-semibold ${!isRead ? 'text-white' : 'text-gray-400'}`}>{n.title}</p>
          {!isRead && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
        <p className="text-xs text-gray-600 mt-1">{timeAgo(new Date(n.createdAt))}</p>
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
