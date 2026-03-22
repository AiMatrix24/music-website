'use client';

import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';

export default function FanDashboard() {
  const { data: session, status } = useSession();
  const subscription = trpc.subscriptions.getMySubscription.useQuery(undefined, {
    enabled: status === 'authenticated',
  });
  const tickets = trpc.tickets.getMyTickets.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

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

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
      <p className="text-gray-400 mb-6">
        Welcome back, {session?.user?.name ?? 'Superfan'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <DashCard title="Library" value="—" sub="Liked tracks" />
      </div>

      <div className="mt-8 rounded-2xl bg-[#15151f] p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        {ticketCount > 0 ? (
          <ul className="space-y-2">
            {tickets.data?.slice(0, 5).map((item) => (
              <li key={item.ticket.id} className="text-sm text-gray-400">
                Ticket for <span className="text-white font-medium">{item.event.title}</span>
                {' — '}
                {new Date(item.event.startDate).toLocaleDateString()}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">
            No activity yet. Subscribe to an artist to get started.
          </p>
        )}
      </div>
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
