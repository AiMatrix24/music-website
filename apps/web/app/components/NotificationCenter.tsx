'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'follow' | 'ticket' | 'broadcast' | 'payout' | 'milestone' | 'comment' | 'system';
  title: string;
  message: string;
  read: boolean;
  href?: string;
  createdAt: Date;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'follow', title: 'New Follower', message: 'Alex Rivera started following you', read: false, href: '/dashboard', createdAt: new Date(Date.now() - 1800000) },
  { id: '2', type: 'ticket', title: 'Ticket Sold', message: 'Someone purchased a VIP ticket to your event', read: false, href: '/dashboard/tickets', createdAt: new Date(Date.now() - 7200000) },
  { id: '3', type: 'milestone', title: 'Play Milestone!', message: 'Your track "Midnight Drive" hit 10K plays!', read: false, href: '/dashboard/analytics', createdAt: new Date(Date.now() - 14400000) },
  { id: '4', type: 'broadcast', title: 'Artist Update', message: 'Cipher posted: "New album dropping next week!"', read: true, href: '/artist/cipher', createdAt: new Date(Date.now() - 86400000) },
  { id: '5', type: 'payout', title: 'Payout Complete', message: '$42.50 USDC sent to your wallet', read: true, href: '/settings', createdAt: new Date(Date.now() - 172800000) },
  { id: '6', type: 'comment', title: 'New Comment', message: 'Jordan Kim commented on "Neon Horizon"', read: true, createdAt: new Date(Date.now() - 259200000) },
  { id: '7', type: 'system', title: 'Welcome to OPYNX!', message: 'Complete your profile to get started.', read: true, href: '/settings', createdAt: new Date(Date.now() - 604800000) },
];

export function NotificationBell() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (status !== 'authenticated') return null;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const typeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'follow': return '👤';
      case 'ticket': return '🎫';
      case 'broadcast': return '📢';
      case 'payout': return '💰';
      case 'milestone': return '🎉';
      case 'comment': return '💬';
      case 'system': return '⚙️';
    }
  };

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
              <button onClick={markAllRead} className="text-xs text-red-400 hover:text-red-300 font-semibold transition">
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-gray-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Wrapper = n.href ? Link : 'div';
                const wrapperProps = n.href ? { href: n.href, onClick: () => { markRead(n.id); setOpen(false); } } : {};
                return (
                  <Wrapper
                    key={n.id}
                    {...(wrapperProps as any)}
                    className={`flex items-start gap-3 px-4 py-3 transition hover:bg-brand-950/50 cursor-pointer border-b border-brand-800/10 last:border-0 ${
                      !n.read ? 'bg-red-950/10' : ''
                    }`}
                  >
                    <span className="text-lg mt-0.5">{typeIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold truncate ${!n.read ? 'text-white' : 'text-gray-400'}`}>
                          {n.title}
                        </p>
                        {!n.read && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.message}</p>
                      <p className="text-xs text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
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
