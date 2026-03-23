'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ShareButton } from '@/app/components/ShareButton';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading, error } = trpc.events.getById.useQuery({ id });
  const { data: tickets } = trpc.events.getTickets.useQuery(
    { eventId: id },
    { enabled: !!event }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading event...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Event not found</p>
        <Link href="/explore" className="text-brand-400 hover:text-brand-300 transition">
          ← Back to Explore
        </Link>
      </div>
    );
  }

  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/explore"
          className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block"
        >
          ← Back to Explore
        </Link>

        {/* Event header */}
        <div className="flex flex-col sm:flex-row gap-6 items-start mb-10">
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 flex flex-col items-center justify-center shrink-0">
            <p className="text-4xl font-black">{startDate.getDate()}</p>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-300">
              {startDate.toLocaleDateString('en-US', { month: 'short' })}
            </p>
          </div>
          <div className="flex-1">
            <span className="inline-block bg-brand-600/20 text-brand-400 text-xs px-3 py-1 rounded-full mb-2 font-semibold uppercase">
              {event.status}
            </span>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-4xl font-black mb-2">{event.title}</h1>
              <ShareButton title={event.title} />
            </div>
            {event.hostName && (
              <Link
                href={`/artist/${event.hostId}`}
                className="text-gray-400 hover:text-brand-400 transition text-sm mb-2 inline-block"
              >
                Hosted by {event.hostName}
              </Link>
            )}
            <p className="text-gray-400">
              {startDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              {' · '}
              {startDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
              {endDate && (
                <>
                  {' — '}
                  {endDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          {event.capacity && (
            <StatCard label="Capacity" value={event.capacity.toLocaleString()} />
          )}
          {event.timezone && (
            <StatCard
              label="Timezone"
              value={event.timezone.split('/')[1]?.replace('_', ' ') ?? event.timezone}
            />
          )}
          {event.countryCode && <StatCard label="Country" value={event.countryCode} />}
        </div>

        {/* Ticket Types */}
        {tickets && tickets.length > 0 && (
          <div className="rounded-2xl bg-[#15151f] p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Tickets</h2>
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-brand-950/50 border border-brand-800/20"
                >
                  <div>
                    <p className="font-semibold">{ticket.name}</p>
                    <p className="text-sm text-gray-400">
                      {ticket.sold}/{ticket.quantity} sold
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-brand-400">
                      {ticket.price === 0 ? 'Free' : `$${(ticket.price / 100).toFixed(2)}`}
                    </p>
                    <p className="text-xs text-gray-500 uppercase">{ticket.tier}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Get Tickets CTA */}
        <div className="rounded-2xl bg-gradient-to-r from-brand-700 to-brand-900 p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Ready to go?</h2>
          <p className="text-gray-300 text-sm mb-4">
            Secure your spot before tickets sell out.
          </p>
          <button className="rounded-full bg-white text-brand-950 px-8 py-3 font-semibold hover:bg-gray-100 transition">
            Get Tickets
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#15151f] p-4 text-center">
      <p className="text-2xl font-bold text-brand-400">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
