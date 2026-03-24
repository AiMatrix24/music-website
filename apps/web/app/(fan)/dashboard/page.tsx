'use client';

import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useState } from 'react';

export default function FanDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'overview' | 'inbox'>('overview');

  const subscription = trpc.subscriptions.getMySubscription.useQuery(undefined, {
    enabled: status === 'authenticated',
  });
  const tickets = trpc.tickets.getMyTickets.useQuery(undefined, {
    enabled: status === 'authenticated',
  });
  // Get all recent broadcasts (fan inbox)
  const broadcasts = trpc.broadcasts.list.useQuery(
    { limit: 20 },
    { enabled: status === 'authenticated' }
  );

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Sign in to view your dashboard</h1>
          <Link
            href="/auth/login"
            className="rounded-full bg-brand-600 px-8 py-3 font-semibold text-white"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const tierLabel = subscription.data?.tier ?? 'free';
  const ticketCount = tickets.data?.length ?? 0;
  const inboxCount = broadcasts.data?.length ?? 0;

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
      <p className="text-gray-400 mb-6">
        Welcome back, {session?.user?.name ?? 'Superfan'}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <DashCard
          title="Subscription"
          value={tierLabel.charAt(0).toUpperCase() + tierLabel.slice(1)}
          sub={subscription.data?.status === 'active' ? 'Active' : 'Inactive'}
        />
        <DashCard
          title="Tickets"
          value={String(ticketCount)}
          sub={ticketCount === 1 ? 'Upcoming event' : 'Upcoming events'}
        />
        <DashCard
          title="Inbox"
          value={String(inboxCount)}
          sub="Artist messages"
        />
        <DashCard title="Library" value="—" sub="Liked tracks" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
            activeTab === 'overview'
              ? 'bg-brand-600 text-white'
              : 'bg-[#15151f] text-gray-400 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('inbox')}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition relative ${
            activeTab === 'inbox'
              ? 'bg-brand-600 text-white'
              : 'bg-[#15151f] text-gray-400 hover:text-white'
          }`}
        >
          Inbox
          {inboxCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full text-xs flex items-center justify-center font-bold">
              {inboxCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="rounded-2xl bg-[#15151f] p-6">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          {ticketCount > 0 ? (
            <ul className="space-y-3">
              {tickets.data?.slice(0, 5).map((item) => (
                <li key={item.ticket.id} className="flex items-center gap-3 text-sm">
                  <span className="text-brand-400">🎟️</span>
                  <span className="text-gray-400">
                    Ticket for <span className="text-white font-medium">{item.event.title}</span>
                    {' — '}
                    {new Date(item.event.startDate).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">🎵</p>
              <p className="text-gray-400 mb-2">No activity yet</p>
              <p className="text-gray-500 text-sm mb-4">Subscribe to an artist and explore music to get started.</p>
              <Link
                href="/explore"
                className="inline-block rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white"
              >
                Explore Music
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inbox' && (
        <div className="space-y-4">
          {broadcasts.data && broadcasts.data.length > 0 ? (
            broadcasts.data.map((b) => (
              <div key={b.id} className="rounded-2xl bg-[#15151f] p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-sm font-bold shrink-0">
                    {b.artistName?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/artist/${b.artistId}`}
                        className="font-semibold hover:text-brand-400 transition"
                      >
                        {b.artistName ?? 'Unknown Artist'}
                      </Link>
                      <span className="text-xs bg-brand-600/20 text-brand-400 px-2 py-0.5 rounded-full">
                        {b.type}
                      </span>
                      {b.subscribersOnly && (
                        <span className="text-xs bg-pink-600/20 text-pink-400 px-2 py-0.5 rounded-full">
                          Exclusive
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg mb-2">{b.title}</h3>
                    <p className="text-gray-400 text-sm whitespace-pre-wrap">{b.body}</p>
                    <p className="text-xs text-gray-600 mt-3">
                      {new Date(b.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-[#15151f] p-12 text-center">
              <p className="text-4xl mb-3">✉️</p>
              <p className="text-gray-400 text-lg mb-2">No messages yet</p>
              <p className="text-gray-500 text-sm">
                When artists you follow send updates, they&apos;ll appear here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DashCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-[#15151f] p-6">
      <p className="text-sm text-gray-400 mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}
