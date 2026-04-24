'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { QRCode } from '@/app/components/QRCode';

export default function MyTicketsPage() {
  const { status } = useSession();
  const { data: myTickets, isLoading } = trpc.tickets.getMyTickets.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl mb-4">🎫</p>
        <p className="text-gray-400 text-lg">Sign in to view your tickets</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">My Tickets</h1>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-[#15151f] p-6 animate-pulse h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const upcoming = myTickets?.filter((t) => new Date(t.event.startDate) >= new Date()) ?? [];
  const past = myTickets?.filter((t) => new Date(t.event.startDate) < new Date()) ?? [];

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Tickets</h1>
            <p className="text-gray-400 mt-1">{myTickets?.length ?? 0} tickets total</p>
          </div>
          <Link
            href="/tickets"
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500 transition"
          >
            Browse Events
          </Link>
        </div>

        {(!myTickets || myTickets.length === 0) ? (
          <div className="rounded-2xl bg-[#15151f] p-16 text-center">
            <p className="text-5xl mb-4">🎫</p>
            <h2 className="text-xl font-bold mb-2">No tickets yet</h2>
            <p className="text-gray-400 mb-6">Browse upcoming events and grab your tickets direct from creators.</p>
            <Link
              href="/tickets"
              className="inline-block rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition"
            >
              Find Events
            </Link>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="mb-10">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="text-green-400">●</span> Upcoming ({upcoming.length})
                </h2>
                <div className="space-y-4">
                  {upcoming.map((item) => (
                    <TicketCard key={item.ticket.id} ticket={item.ticket} event={item.event} />
                  ))}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="text-gray-500">●</span> Past ({past.length})
                </h2>
                <div className="space-y-4 opacity-60">
                  {past.map((item) => (
                    <TicketCard key={item.ticket.id} ticket={item.ticket} event={item.event} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TicketCard({ ticket, event }: { ticket: any; event: any }) {
  const [showQR, setShowQR] = useState(false);
  const date = new Date(event.startDate);
  const isUpcoming = date >= new Date();

  return (
    <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 overflow-hidden">
      <div className="flex">
        {/* Date strip */}
        <div className={`w-20 flex flex-col items-center justify-center p-4 ${
          isUpcoming ? 'bg-red-900/20' : 'bg-gray-900/20'
        }`}>
          <p className="text-2xl font-black">{date.getDate()}</p>
          <p className="text-xs font-semibold uppercase text-red-400">
            {date.toLocaleDateString('en-US', { month: 'short' })}
          </p>
        </div>

        {/* Info */}
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-lg">{event.title}</h3>
              <p className="text-sm text-gray-400 mt-1">
                {date.toLocaleDateString('en-US', { weekday: 'long' })} · {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
              ticket.status === 'valid' ? 'bg-green-600/20 text-green-400' :
              ticket.status === 'used' ? 'bg-gray-600/20 text-gray-400' :
              'bg-red-600/20 text-red-400'
            }`}>
              {ticket.status === 'valid' ? '✓ Valid' : ticket.status === 'used' ? 'Used' : ticket.status}
            </span>
          </div>

          {/* QR Code section */}
          {isUpcoming && ticket.status === 'valid' && (
            <div className="mt-4">
              <button
                onClick={() => setShowQR(!showQR)}
                className="text-sm text-red-400 hover:text-red-300 font-semibold transition"
              >
                {showQR ? 'Hide QR Code ▲' : 'Show QR Code ▼'}
              </button>

              {showQR && (
                <div className="mt-3 p-6 bg-white rounded-xl inline-block">
                  <QRCode value={ticket.qrToken} size={240} errorCorrectionLevel="Q" />
                  <p className="text-xs text-gray-600 text-center mt-3 font-semibold">
                    Show this at the venue
                  </p>
                  <p className="text-[10px] text-gray-400 text-center mt-1 font-mono break-all max-w-[240px]">
                    {ticket.qrToken}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
            <span>🛡️ Non-transferable</span>
            <span>🔗 Verified on-chain</span>
          </div>
        </div>
      </div>
    </div>
  );
}
