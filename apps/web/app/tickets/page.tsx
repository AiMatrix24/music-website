'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { FadeIn } from '../components/FadeIn';

export default function TicketsPage() {
  const { data: events, isLoading } = trpc.events.list.useQuery({
    limit: 20,
    status: 'published',
  });

  return (
    <div className="min-h-screen">
      {/* Hero banner */}
      <section className="relative py-20 px-6 bg-gradient-to-b from-red-950/30 via-brand-950 to-brand-950">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm font-semibold uppercase tracking-[4px] text-red-500 mb-4">
            Direct from Artists
          </p>
          <h1 className="text-4xl md:text-6xl font-black mb-4">
            Live Events & <span className="text-red-500">Tickets</span>
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto text-lg">
            Buy direct. No scalpers. No hidden fees. Every ticket verified on-chain with QR anti-fraud protection.
          </p>
        </div>
      </section>

      {/* Anti-scalper banner */}
      <section className="border-y border-brand-800/20 bg-[#15151f]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-red-500">🛡️</span> Anti-Scalper Protection
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-red-500">🔗</span> On-Chain Verification
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-red-500">📱</span> QR Code Entry
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-red-500">💰</span> Artist Gets Paid Direct
          </div>
        </div>
      </section>

      {/* Event listings */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Upcoming Events</h2>

          {isLoading && (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-[#15151f] p-6 animate-pulse h-48" />
              ))}
            </div>
          )}

          <div className="space-y-6">
            {events?.map((event) => (
              <FadeIn key={event.id}>
                <EventTicketCard event={event} />
              </FadeIn>
            ))}
          </div>

          {!isLoading && (!events || events.length === 0) && (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">🎫</p>
              <p className="text-xl font-bold mb-2">No events on sale right now</p>
              <p className="text-gray-400">Check back soon for new shows and listening parties.</p>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 bg-[#15151f]/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            How <span className="text-red-500">OpynX</span> Tickets Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <HowItWorksCard
              step="1"
              title="Artist Lists Event"
              description="Artists set their own prices, tiers, and capacity. No middlemen markup."
            />
            <HowItWorksCard
              step="2"
              title="You Buy Direct"
              description="Pay with USDC or card. One ticket per person. Anti-scalper verified."
            />
            <HowItWorksCard
              step="3"
              title="Get QR Ticket"
              description="Unique QR code tied to your identity. Non-transferable. Fraud-proof."
            />
            <HowItWorksCard
              step="4"
              title="Scan & Enter"
              description="Show your QR at the venue. Facilitator scans. Instant verification."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function EventTicketCard({ event }: { event: any }) {
  const { data: ticketTypes } = trpc.tickets.getTicketTypes.useQuery({
    eventId: event.id,
  });

  const date = new Date(event.startDate);
  const totalSold = ticketTypes?.reduce((s, t) => s + (t.sold ?? 0), 0) ?? 0;
  const totalCap = ticketTypes?.reduce((s, t) => s + (t.quantity ?? 0), 0) ?? 0;
  const lowestPrice = ticketTypes?.length
    ? Math.min(...ticketTypes.map((t) => t.price))
    : null;
  const pctSold = totalCap > 0 ? Math.round((totalSold / totalCap) * 100) : 0;

  return (
    <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 overflow-hidden transition hover:border-red-900/30 hover:shadow-xl hover:shadow-red-950/10">
      <div className="flex flex-col md:flex-row">
        {/* Date column */}
        <div className="md:w-40 bg-gradient-to-br from-red-900/30 to-brand-950 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-red-400">
              {date.toLocaleDateString('en-US', { month: 'short' })}
            </p>
            <p className="text-5xl font-black">{date.getDate()}</p>
            <p className="text-sm text-gray-400">
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </p>
          </div>
        </div>

        {/* Event info */}
        <div className="flex-1 p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1">{event.title}</h3>
              <p className="text-sm text-gray-400 mb-1">
                Hosted by <span className="text-red-400">{event.hostName ?? 'Unknown'}</span>
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
                {event.timezone && (
                  <span>📍 {event.timezone.split('/')[1]?.replace('_', ' ')}</span>
                )}
                <span>🕐 {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                {event.capacity && <span>👥 {event.capacity.toLocaleString()} capacity</span>}
              </div>

              {/* Ticket tiers */}
              {ticketTypes && ticketTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {ticketTypes.map((tt) => {
                    const available = (tt.quantity ?? 0) - (tt.sold ?? 0);
                    const soldOut = available <= 0;
                    return (
                      <span
                        key={tt.id}
                        className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                          soldOut
                            ? 'bg-gray-800 text-gray-500 line-through'
                            : 'bg-red-600/10 text-red-400 border border-red-800/30'
                        }`}
                      >
                        {tt.name} — {tt.price === 0 ? 'FREE' : `$${(tt.price / 100).toFixed(2)}`}
                        {!soldOut && ` (${available} left)`}
                        {soldOut && ' SOLD OUT'}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Progress bar */}
              {totalCap > 0 && (
                <div className="w-full max-w-xs">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{totalSold} sold</span>
                    <span>{pctSold}% sold</span>
                  </div>
                  <div className="w-full h-2 bg-brand-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pctSold > 80 ? 'bg-red-500' : pctSold > 50 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(pctSold, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              {lowestPrice !== null && (
                <p className="text-sm text-gray-400">
                  From{' '}
                  <span className="text-2xl font-black text-white">
                    {lowestPrice === 0 ? 'FREE' : `$${(lowestPrice / 100).toFixed(2)}`}
                  </span>
                </p>
              )}
              <Link
                href={`/tickets/${event.id}`}
                className="rounded-full bg-red-600 hover:bg-red-500 text-white px-8 py-3 font-semibold transition hover:shadow-lg hover:shadow-red-900/30 text-center whitespace-nowrap"
              >
                Get Tickets
              </Link>
              <p className="text-xs text-gray-600">No fees · Direct to artist</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HowItWorksCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-lg mx-auto mb-4">
        {step}
      </div>
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
