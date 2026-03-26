'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

export default function TicketPurchasePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading: eventLoading } = trpc.events.getById.useQuery({ id: eventId });
  const { data: ticketTypes, isLoading: typesLoading } = trpc.tickets.getTicketTypes.useQuery({ eventId });
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const purchase = trpc.tickets.purchase.useMutation();

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchasedTicket, setPurchasedTicket] = useState<any>(null);

  const isLoading = eventLoading || typesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Event not found</p>
        <Link href="/tickets" className="text-red-400 hover:text-red-300 transition">
          ← Back to Events
        </Link>
      </div>
    );
  }

  const date = new Date(event.startDate);
  const selected = ticketTypes?.find((t) => t.id === selectedType);

  const handlePurchase = async () => {
    if (!selectedType || !agreed) return;
    if (status !== 'authenticated') {
      toast('Please sign in to purchase tickets', 'error');
      return;
    }

    setPurchasing(true);
    try {
      const ticket = await purchase.mutateAsync({
        ticketTypeId: selectedType,
        eventId,
      });
      setPurchasedTicket(ticket);
      toast('Ticket purchased successfully!', 'success');
    } catch (err: any) {
      toast(err.message || 'Purchase failed', 'error');
    } finally {
      setPurchasing(false);
    }
  };

  // Show confirmation after purchase
  if (purchasedTicket) {
    return (
      <div className="min-h-screen py-16 px-6">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-24 h-24 rounded-full bg-green-600/20 flex items-center justify-center text-5xl mx-auto mb-6">
            ✅
          </div>
          <h1 className="text-3xl font-black mb-2">You&apos;re In!</h1>
          <p className="text-gray-400 mb-8">Your ticket has been confirmed and verified on-chain.</p>

          <div className="rounded-2xl bg-[#15151f] p-8 mb-8 text-left">
            <h2 className="text-xl font-bold mb-4">{event.title}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Date</span>
                <span>{date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Time</span>
                <span>{date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tier</span>
                <span className="text-red-400 font-semibold">{selected?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className="text-green-400 font-semibold">Confirmed</span>
              </div>
            </div>

            {/* QR Code placeholder */}
            <div className="mt-6 p-6 bg-white rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-40 h-40 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-4xl">📱</span>
                </div>
                <p className="text-xs text-gray-500 font-mono">{purchasedTicket.qrToken}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="block w-full rounded-full bg-red-600 py-3 font-semibold text-white text-center transition hover:bg-red-500"
            >
              View My Tickets
            </Link>
            <Link
              href="/tickets"
              className="block w-full rounded-full border border-brand-800/30 py-3 font-semibold text-center transition hover:border-red-600"
            >
              Browse More Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/tickets" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          ← Back to Events
        </Link>

        {/* Event header */}
        <div className="rounded-2xl bg-gradient-to-br from-red-900/20 to-[#15151f] border border-brand-800/20 p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-red-600/20 flex items-center justify-center shrink-0">
              <div className="text-center">
                <p className="text-2xl font-black">{date.getDate()}</p>
                <p className="text-xs font-semibold text-red-400 uppercase">
                  {date.toLocaleDateString('en-US', { month: 'short' })}
                </p>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black mb-1">{event.title}</h1>
              <p className="text-gray-400 text-sm mb-2">
                Hosted by <span className="text-red-400">{event.hostName}</span>
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                <span>📅 {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                <span>🕐 {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                {event.timezone && <span>📍 {event.timezone.split('/')[1]?.replace('_', ' ')}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Ticket selection */}
        <h2 className="text-xl font-bold mb-4">Select Ticket Type</h2>
        <div className="space-y-3 mb-8">
          {ticketTypes?.map((tt) => {
            const available = (tt.quantity ?? 0) - (tt.sold ?? 0);
            const soldOut = available <= 0;
            const isSelected = selectedType === tt.id;

            return (
              <button
                key={tt.id}
                disabled={soldOut}
                onClick={() => setSelectedType(tt.id)}
                className={`w-full rounded-xl p-5 text-left transition-all ${
                  isSelected
                    ? 'bg-red-600/10 border-2 border-red-500 shadow-lg shadow-red-950/20'
                    : soldOut
                    ? 'bg-[#15151f] border-2 border-transparent opacity-50 cursor-not-allowed'
                    : 'bg-[#15151f] border-2 border-transparent hover:border-red-800/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg">{tt.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${
                        tt.tier === 'vip' ? 'bg-yellow-600/20 text-yellow-400' :
                        tt.tier === 'early_bird' ? 'bg-green-600/20 text-green-400' :
                        tt.tier === 'free' ? 'bg-blue-600/20 text-blue-400' :
                        'bg-gray-600/20 text-gray-400'
                      }`}>
                        {tt.tier.replace('_', ' ')}
                      </span>
                      {soldOut && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 font-semibold">
                          SOLD OUT
                        </span>
                      )}
                    </div>
                    {!soldOut && (
                      <p className="text-sm text-gray-400 mt-1">{available} of {tt.quantity} remaining</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black">
                      {tt.price === 0 ? 'FREE' : `$${(tt.price / 100).toFixed(2)}`}
                    </p>
                    {isSelected && <p className="text-xs text-red-400 mt-1">Selected ✓</p>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Anti-scalper agreement */}
        {selectedType && (
          <div className="rounded-xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <span className="text-red-500">🛡️</span> Anti-Scalper Agreement
            </h3>
            <ul className="space-y-2 text-sm text-gray-400 mb-4">
              <li>• This ticket is <strong className="text-white">non-transferable</strong> and tied to your account</li>
              <li>• One ticket per person per event — enforced on-chain</li>
              <li>• Resale on third-party platforms is prohibited</li>
              <li>• QR code is unique and verified at entry</li>
              <li>• Violators will be permanently banned from OpynX</li>
            </ul>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-5 h-5 rounded bg-brand-950 border-brand-800 text-red-600 focus:ring-red-600"
              />
              <span className="text-sm">I agree to the anti-scalper policy and understand this ticket is non-transferable</span>
            </label>
          </div>
        )}

        {/* Revenue transparency */}
        {selected && selected.price > 0 && (
          <div className="rounded-xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
            <h3 className="font-bold mb-3">Where Your Money Goes</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Artist</span>
                <span className="text-red-400 font-semibold">
                  ${((selected.price / 100) * 0.85).toFixed(2)} (85%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Facilitator</span>
                <span className="text-pink-400">
                  ${((selected.price / 100) * 0.05).toFixed(2)} (5%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Platform</span>
                <span className="text-cyan-400">
                  ${((selected.price / 100) * 0.10).toFixed(2)} (10%)
                </span>
              </div>
              <div className="border-t border-brand-800/20 pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span>${(selected.price / 100).toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              85% goes directly to the artist. Verified on Polygon.
            </p>
          </div>
        )}

        {/* Purchase button */}
        <button
          onClick={handlePurchase}
          disabled={!selectedType || !agreed || purchasing || status !== 'authenticated'}
          className="w-full rounded-full bg-red-600 py-4 font-semibold text-white text-lg transition hover:bg-red-500 hover:shadow-lg hover:shadow-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {purchasing
            ? 'Processing...'
            : status !== 'authenticated'
            ? 'Sign In to Purchase'
            : !selectedType
            ? 'Select a Ticket Type'
            : !agreed
            ? 'Agree to Anti-Scalper Policy'
            : `Buy ${selected?.name} — ${selected?.price === 0 ? 'FREE' : `$${((selected?.price ?? 0) / 100).toFixed(2)}`}`}
        </button>

        {status !== 'authenticated' && (
          <p className="text-center text-sm text-gray-500 mt-3">
            <Link href="/auth/login" className="text-red-400 hover:text-red-300">Sign in</Link> to purchase tickets.
          </p>
        )}
      </div>
    </div>
  );
}
