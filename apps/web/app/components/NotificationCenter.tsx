'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';

type NotificationType =
  | 'ticket_sale'
  | 'track_sale'
  | 'subscription'
  | 'tip_received'
  | 'marketplace_sale'
  | 'follow'
  | 'comment'
  | 'mention'
  | 'payout_processed'
  | 'payout_rejected'
  | 'milestone'
  | 'verification_status'
  | 'system';

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

export function NotificationBell() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const enabled = status === 'authenticated';

  // Bell badge — refetches every 60s while page is open
  const unreadQuery = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  // Notification list — fetched only when dropdown opens
  const listQuery = trpc.notifications.list.useQuery(
    { limit: 10 },
    { enabled: enabled && open }
  );

  const utils = trpc.useUtils();
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!enabled) return null;

  const unreadCount = unreadQuery.data ?? 0;
  const notifications = listQuery.data ?? [];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative text-gray-400 hover:text-white transition p-1"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#15151f] border border-brand-800/30 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-800/20">
            <h3 className="font-bold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-xs text-red-400 hover:text-red-300 font-semibold transition disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {listQuery.isLoading ? (
              <div className="p-8 text-center text-gray-500 text-sm">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-gray-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isRead = n.readAt !== null;
                const Wrapper = n.link ? Link : 'div';
                const wrapperProps = n.link
                  ? {
                      href: n.link,
                      onClick: () => {
                        if (!isRead) markRead.mutate({ id: n.id });
                        setOpen(false);
                      },
                    }
                  : {};
                return (
                  <Wrapper
                    key={n.id}
                    {...(wrapperProps as any)}
                    className={`flex items-start gap-3 px-4 py-3 transition hover:bg-brand-950/50 cursor-pointer border-b border-brand-800/10 last:border-0 ${
                      !isRead ? 'bg-red-950/10' : ''
                    }`}
                  >
                    <span className="text-lg mt-0.5">{TYPE_ICON[n.type as NotificationType] ?? '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold truncate ${!isRead ? 'text-white' : 'text-gray-400'}`}>
                          {n.title}
                        </p>
                        {!isRead && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.body}</p>
                      <p className="text-xs text-gray-600 mt-1">{timeAgo(new Date(n.createdAt))}</p>
                    </div>
                  </Wrapper>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-brand-800/20 px-4 py-2">
            <Link href="/notifications" onClick={() => setOpen(false)}
              className="text-xs text-red-400 hover:text-red-300 font-semibold transition">
              View All Notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
