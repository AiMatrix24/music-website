'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function ArtistTicketDashboard() {
  const { status } = useSession();
  const { data: events, isLoading } = trpc.events.getMyEvents.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Sign in to manage your events and tickets</p>
        <Link href="/auth/login" className="text-red-400 hover:text-red-300">Sign In →</Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Ticket Sales Dashboard</h1>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-[#15151f] p-6 animate-pulse h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Ticket Sales</h1>
            <p className="text-gray-400 mt-1">Manage your events and track ticket sales</p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-white transition"
          >
            ← Dashboard
          </Link>
        </div>

        {events && events.length > 0 ? (
          <div className="space-y-6">
            {events.map((event) => (
              <EventSalesCard key={event.id} eventId={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#15151f] p-16 text-center">
            <p className="text-5xl mb-4">🎫</p>
            <h2 className="text-xl font-bold mb-2">No events yet</h2>
            <p className="text-gray-400 mb-6">Create your first event and start selling tickets direct to fans.</p>
            <Link
              href="/dashboard/artist"
              className="inline-block rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition"
            >
              Create Event
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function EventSalesCard({ eventId, event }: { eventId: string; event: any }) {
  const { data: salesData } = trpc.tickets.getEventSales.useQuery({ eventId });

  if (!salesData) {
    return <div className="rounded-2xl bg-[#15151f] p-6 animate-pulse h-32" />;
  }

  const date = new Date(event.startDate);
  const revenueArtist = salesData.totalRevenue * 0.85;

  return (
    <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-brand-800/20">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">{event.title}</h2>
            <p className="text-sm text-gray-400 mt-1">
              {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              {' · '}
              {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
            event.status === 'published' ? 'bg-green-600/20 text-green-400' :
            event.status === 'active' ? 'bg-blue-600/20 text-blue-400' :
            'bg-gray-600/20 text-gray-400'
          }`}>
            {event.status}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-brand-800/20">
        <StatCell label="Tickets Sold" value={String(salesData.totalSold)} />
        <StatCell label="Total Capacity" value={String(salesData.totalCapacity)} />
        <StatCell
          label="Total Revenue"
          value={`$${(salesData.totalRevenue / 100).toFixed(2)}`}
        />
        <StatCell
          label="Your Earnings (85%)"
          value={`$${(revenueArtist / 100).toFixed(2)}`}
          highlight
        />
      </div>

      {/* Ticket type breakdown */}
      <div className="p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Ticket Tiers</h3>
        <div className="space-y-3">
          {salesData.ticketTypes.map((tt) => {
            const available = (tt.quantity ?? 0) - (tt.sold ?? 0);
            const pctSold = tt.quantity ? Math.round(((tt.sold ?? 0) / tt.quantity) * 100) : 0;

            return (
              <div key={tt.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">{tt.name}</span>
                    <span className="text-sm text-gray-400">
                      {tt.sold ?? 0}/{tt.quantity ?? 0} sold · ${((tt.sold ?? 0) * tt.price / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-brand-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pctSold > 80 ? 'bg-red-500' : pctSold > 50 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${pctSold}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent purchases */}
      {salesData.soldTickets.length > 0 && (
        <div className="p-6 border-t border-brand-800/20">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
            Recent Purchases ({salesData.soldTickets.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {salesData.soldTickets.slice(0, 10).map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold">
                    {t.attendeeName?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <span>{t.attendeeName ?? 'Anonymous'}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  t.status === 'valid' ? 'bg-green-600/20 text-green-400' :
                  t.status === 'used' ? 'bg-gray-600/20 text-gray-400' :
                  'bg-red-600/20 text-red-400'
                }`}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="p-4 text-center">
      <p className={`text-2xl font-black ${highlight ? 'text-red-400' : ''}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
