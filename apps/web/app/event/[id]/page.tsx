'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ShareButton } from '@/app/components/ShareButton';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';
import { useSafeHtml } from '@/app/components/podcast/useSafeHtml';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading, error } = trpc.events.getById.useQuery({ id });
  const { data: ticketTypes } = trpc.events.getTickets.useQuery(
    { eventId: id },
    { enabled: !!event }
  );
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState<'browse' | 'checkout' | 'confirmation'>('browse');

  const purchaseMutation = trpc.tickets.purchase.useMutation({
    onSuccess: (result) => {
      if (result.paymentUrl) {
        // Paid ticket — redirect to NOWPayments. Ticket activates via webhook.
        window.location.href = result.paymentUrl;
      } else {
        setStep('confirmation');
        toast('Tickets secured! Check your email for QR codes.', 'success');
      }
    },
    onError: (err) => {
      toast(err.message ?? 'Purchase failed. Try again.', 'error');
    },
  });

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
  const selected = ticketTypes?.find((t) => t.id === selectedTicket);
  const totalSold = ticketTypes?.reduce((sum, t) => sum + (t.sold ?? 0), 0) ?? 0;
  const totalCapacity = ticketTypes?.reduce((sum, t) => sum + (t.quantity ?? 0), 0) ?? 0;
  const percentSold = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;

  const handleGetTickets = () => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (!selectedTicket) {
      toast('Select a ticket tier first', 'info');
      return;
    }
    setStep('checkout');
  };

  const handlePurchase = (method: 'usdc' | 'card') => {
    if (!selectedTicket) return;
    // In production this would go through Helio/Samiteon
    // For now, create the ticket record directly
    for (let i = 0; i < quantity; i++) {
      purchaseMutation.mutate({ ticketTypeId: selectedTicket, eventId: id });
    }
  };

  // ─── Confirmation Step ───
  if (step === 'confirmation') {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-green-600/20 flex items-center justify-center text-5xl mb-6">
            ✓
          </div>
          <h1 className="text-3xl font-black mb-2">You&apos;re In!</h1>
          <p className="text-gray-400 mb-8">
            Your {quantity}x {selected?.name} ticket{quantity > 1 ? 's' : ''} for{' '}
            <span className="text-white font-semibold">{event.title}</span>{' '}
            {quantity > 1 ? 'have' : 'has'} been confirmed.
          </p>

          {/* QR Ticket Preview */}
          <div className="rounded-2xl bg-[#15151f] p-8 mb-8 border border-brand-800/20">
            <div className="w-40 h-40 mx-auto rounded-xl bg-white p-3 mb-4">
              <div className="w-full h-full bg-gradient-to-br from-brand-600 to-brand-900 rounded-lg flex items-center justify-center">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-1">Your QR ticket</p>
            <p className="font-bold">{event.title}</p>
            <p className="text-sm text-gray-400">
              {startDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}{' '}
              at{' '}
              {startDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
            <div className="mt-4 inline-block bg-brand-600/20 text-brand-400 text-xs px-3 py-1 rounded-full font-semibold">
              Non-transferable · Anti-scalp protected
            </div>
          </div>

          {/* Revenue transparency */}
          {selected && selected.price > 0 && (
            <div className="rounded-2xl bg-[#15151f] p-6 mb-8 text-left">
              <h3 className="font-bold mb-4 text-center text-sm uppercase tracking-wider text-gray-400">
                Where Your ${((selected.price * quantity) / 100).toFixed(2)} Went
              </h3>
              <div className="space-y-3">
                <WaterfallRow
                  label="Creator"
                  amount={`$${((selected.price * quantity * 0.70) / 100).toFixed(2)}`}
                  pct="70%"
                  color="text-brand-400"
                />
                <WaterfallRow
                  label="Venue"
                  amount={`$${((selected.price * quantity * 0.10) / 100).toFixed(2)}`}
                  pct="10%"
                  color="text-pink-400"
                />
                <WaterfallRow
                  label="Platform"
                  amount={`$${((selected.price * quantity * 0.15) / 100).toFixed(2)}`}
                  pct="15%"
                  color="text-cyan-400"
                />
                <WaterfallRow
                  label="Payment processing"
                  amount={`$${((selected.price * quantity * 0.05) / 100).toFixed(2)}`}
                  pct="5%"
                  color="text-gray-400"
                />
                <div className="border-t border-brand-800/30 pt-3 flex justify-between font-bold text-sm">
                  <span>Total</span>
                  <span className="text-brand-400">
                    ${((selected.price * quantity) / 100).toFixed(2)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-3">
                Verified on Polygon · No hidden fees · No scalper markups
              </p>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="rounded-full bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-500 transition"
            >
              View My Tickets
            </Link>
            <Link
              href="/explore"
              className="rounded-full border border-brand-800/30 px-6 py-3 font-semibold text-white hover:border-brand-500 transition"
            >
              Find More Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Checkout Step ───
  if (step === 'checkout' && selected) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setStep('browse')}
            className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block"
          >
            ← Back to event
          </button>

          <h1 className="text-2xl font-bold mb-6">Secure Your Tickets</h1>

          {/* Order summary */}
          <div className="rounded-2xl bg-[#15151f] p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-bold text-lg">{event.title}</h2>
                <p className="text-sm text-gray-400">
                  {startDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {' · '}
                  {startDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 flex flex-col items-center justify-center">
                <p className="text-xl font-black">{startDate.getDate()}</p>
                <p className="text-[10px] font-semibold uppercase text-brand-300">
                  {startDate.toLocaleDateString('en-US', { month: 'short' })}
                </p>
              </div>
            </div>

            <div className="border-t border-brand-800/20 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Ticket</span>
                <span className="font-semibold">{selected.name} ({selected.tier.toUpperCase()})</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-400">Quantity</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-full bg-brand-950 border border-brand-800/30 flex items-center justify-center hover:border-brand-500 transition"
                  >
                    −
                  </button>
                  <span className="font-bold w-6 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(4, q + 1))}
                    className="w-8 h-8 rounded-full bg-brand-950 border border-brand-800/30 flex items-center justify-center hover:border-brand-500 transition"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Price per ticket</span>
                <span>{selected.price === 0 ? 'Free' : `$${(selected.price / 100).toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Service fee</span>
                <span className="text-green-400">$0.00</span>
              </div>
              <div className="border-t border-brand-800/20 pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-brand-400">
                  {selected.price === 0 ? 'Free' : `$${((selected.price * quantity) / 100).toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Anti-scalp protections */}
          <div className="rounded-2xl bg-brand-600/5 border border-brand-600/20 p-4 mb-6">
            <h3 className="font-semibold text-sm mb-3 text-brand-400">Anti-Scalper Protections</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <span className="text-brand-500">✓</span> Maximum 4 tickets per person
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-500">✓</span> Non-transferable QR tickets
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-500">✓</span> ID verification at door
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-500">✓</span> Refund goes back to you, not resold
              </li>
            </ul>
          </div>

          {/* Revenue transparency */}
          {selected.price > 0 && (
            <div className="rounded-2xl bg-[#15151f] p-5 mb-6">
              <h3 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wider text-center">
                Where Your Money Goes
              </h3>
              <div className="space-y-2">
                <RevenueBar label="Creator" pct={70} color="bg-brand-500" />
                <RevenueBar label="Venue" pct={10} color="bg-pink-500" />
                <RevenueBar label="Platform" pct={15} color="bg-cyan-500" />
                <RevenueBar label="Processing" pct={5} color="bg-gray-500" />
              </div>
              <p className="text-xs text-gray-500 text-center mt-3">
                On-chain verified · Zero hidden fees
              </p>
            </div>
          )}

          {session?.user && (
            <div className="bg-brand-950/50 rounded-xl p-4 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center font-bold">
                {session.user.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="text-xs text-gray-500">Purchasing as</p>
                <p className="font-semibold text-sm">{session.user.name ?? session.user.email}</p>
              </div>
            </div>
          )}

          {/* Payment buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handlePurchase('usdc')}
              disabled={purchaseMutation.isPending}
              className="w-full rounded-full bg-gradient-to-r from-brand-600 to-brand-500 py-4 font-semibold text-white text-lg transition hover:shadow-lg hover:shadow-brand-600/30 disabled:opacity-50"
            >
              {purchaseMutation.isPending ? 'Processing...' : `Pay with USDC — $${((selected.price * quantity) / 100).toFixed(2)}`}
            </button>
            <button
              onClick={() => handlePurchase('card')}
              disabled={purchaseMutation.isPending}
              className="w-full rounded-full border-2 border-white/20 py-4 font-semibold text-white transition hover:border-brand-500 disabled:opacity-50"
            >
              Pay with Card
            </button>
            <p className="text-center text-xs text-gray-500">
              Payments verified on Polygon. Cancel for full refund up to 48h before event.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Browse Step (Main Event Page) ───
  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/explore"
          className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block"
        >
          ← Back to Explore
        </Link>

        {/* Cover image (if set by creator) */}
        {event.coverUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={event.coverUrl}
            alt=""
            className="w-full aspect-video rounded-2xl object-cover mb-6 shadow-2xl"
          />
        )}

        {/* Hero banner */}
        <div className="rounded-2xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-28 h-28 rounded-2xl bg-white/10 backdrop-blur flex flex-col items-center justify-center shrink-0">
                <p className="text-4xl font-black">{startDate.getDate()}</p>
                <p className="text-sm font-semibold uppercase tracking-wider text-brand-300">
                  {startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-block bg-white/10 text-white/80 text-xs px-3 py-1 rounded-full mb-2 font-semibold uppercase backdrop-blur">
                      {event.status}
                    </span>
                    <h1 className="text-3xl md:text-4xl font-black mb-2">{event.title}</h1>
                  </div>
                  <ShareButton title={event.title} />
                </div>
                {event.hostName && (
                  <Link
                    href={`/artist/${event.hostId}`}
                    className="text-brand-300 hover:text-white transition text-sm font-semibold"
                  >
                    by {event.hostName}
                  </Link>
                )}
                <p className="text-white/70 mt-2">
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column — event details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {event.capacity && (
                <StatCard label="Capacity" value={event.capacity.toLocaleString()} />
              )}
              <StatCard
                label="Sold"
                value={`${percentSold}%`}
              />
              {(event.venueCity || event.timezone) && (
                <StatCard
                  label="Location"
                  value={event.venueCity ?? event.timezone?.split('/')[1]?.replace('_', ' ') ?? '—'}
                />
              )}
            </div>

            {/* Venue */}
            {(event.venueName || event.venueAddress) && (
              <div className="rounded-2xl bg-[#15151f] p-5">
                <h2 className="font-bold text-lg mb-2">📍 Venue</h2>
                {event.venueName && <p className="font-semibold text-base">{event.venueName}</p>}
                {event.venueAddress && <p className="text-sm text-gray-400">{event.venueAddress}</p>}
                {event.venueCity && <p className="text-sm text-gray-400">{event.venueCity}</p>}
              </div>
            )}

            {/* Description */}
            {event.description && (
              <EventDescription html={event.description} />
            )}

            {/* Sales progress */}
            {totalCapacity > 0 && (
              <div className="rounded-2xl bg-[#15151f] p-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Ticket Sales</span>
                  <span className="font-semibold">{totalSold.toLocaleString()} / {totalCapacity.toLocaleString()}</span>
                </div>
                <div className="w-full h-3 rounded-full bg-brand-950 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-500"
                    style={{ width: `${percentSold}%` }}
                  />
                </div>
                {percentSold >= 80 && (
                  <p className="text-xs text-red-400 mt-2 font-semibold">
                    Almost sold out — {totalCapacity - totalSold} tickets remaining!
                  </p>
                )}
              </div>
            )}

            {/* Anti-scalp badge */}
            <div className="rounded-2xl bg-brand-600/5 border border-brand-600/20 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center text-xl">
                  🛡️
                </div>
                <div>
                  <h3 className="font-bold text-sm">Fan-First Ticket Sales</h3>
                  <p className="text-xs text-gray-400">Direct from creator. No scalpers. No markups.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="text-brand-500">✓</span> 4 ticket max per person
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-brand-500">✓</span> Non-transferable QR
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-brand-500">✓</span> ID verified entry
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-brand-500">✓</span> On-chain verified
                </div>
              </div>
            </div>

            {/* Revenue transparency */}
            <div className="rounded-2xl bg-[#15151f] p-5">
              <h3 className="font-bold mb-4">Where Your Ticket Money Goes</h3>
              <div className="space-y-3">
                <RevenueBar label="Creator" pct={70} color="bg-brand-500" />
                <RevenueBar label="Venue" pct={10} color="bg-pink-500" />
                <RevenueBar label="Platform (OPYNX)" pct={15} color="bg-cyan-500" />
                <RevenueBar label="Payment processing" pct={5} color="bg-gray-500" />
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">
                Payouts verified on Polygon. No hidden fees. No middlemen.
              </p>
            </div>
          </div>

          {/* Right column — ticket selection (sticky) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 overflow-hidden">
                <div className="bg-gradient-to-r from-brand-700 to-brand-600 px-5 py-4">
                  <h2 className="font-bold text-lg">Get Tickets</h2>
                  <p className="text-sm text-white/70">Direct from the creator</p>
                </div>

                <div className="p-4 space-y-3">
                  {ticketTypes?.map((ticket) => {
                    const remaining = (ticket.quantity ?? 0) - (ticket.sold ?? 0);
                    const soldOut = remaining <= 0;

                    return (
                      <button
                        key={ticket.id}
                        onClick={() => !soldOut && setSelectedTicket(ticket.id)}
                        disabled={soldOut}
                        className={`w-full text-left p-4 rounded-xl border-2 transition ${
                          selectedTicket === ticket.id
                            ? 'border-brand-500 bg-brand-600/10'
                            : soldOut
                            ? 'border-brand-800/10 bg-brand-950/30 opacity-50 cursor-not-allowed'
                            : 'border-brand-800/20 bg-brand-950/50 hover:border-brand-700/50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold">{ticket.name}</p>
                            <p className="text-xs text-gray-400 uppercase mt-0.5">{ticket.tier}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-brand-400">
                              {ticket.price === 0 ? 'Free' : `$${(ticket.price / 100).toFixed(2)}`}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2">
                          {soldOut ? (
                            <span className="text-xs text-red-400 font-semibold">Sold Out</span>
                          ) : remaining <= 20 ? (
                            <span className="text-xs text-orange-400 font-semibold">
                              Only {remaining} left!
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">
                              {remaining} available
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedTicket && (
                  <div className="px-4 pb-4">
                    <button
                      onClick={handleGetTickets}
                      className="w-full rounded-full bg-gradient-to-r from-brand-600 to-brand-500 py-3.5 font-semibold text-white transition hover:shadow-lg hover:shadow-brand-600/30"
                    >
                      Get Tickets — {selected?.price === 0 ? 'Free' : `$${((selected?.price ?? 0) / 100).toFixed(2)}`}
                    </button>
                  </div>
                )}

                <div className="px-4 pb-4 text-center">
                  <p className="text-[10px] text-gray-600">
                    No service fees · No scalper markups · Verified on Polygon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventDescription({ html }: { html: string }) {
  const safe = useSafeHtml(html);
  if (!safe) return null;
  return (
    <div className="rounded-2xl bg-[#15151f] p-6">
      <h2 className="font-bold text-lg mb-3">About this event</h2>
      <div
        className="prose prose-sm prose-invert max-w-none prose-a:text-brand-400 prose-strong:text-white prose-headings:text-white"
        dangerouslySetInnerHTML={{ __html: safe }}
      />
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

function RevenueBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-brand-950 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function WaterfallRow({
  label,
  amount,
  pct,
  color,
}: {
  label: string;
  amount: string;
  pct: string;
  color?: string;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span>
        <span className={color ?? ''}>{amount}</span>{' '}
        <span className="text-gray-500 text-xs">({pct})</span>
      </span>
    </div>
  );
}
