'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useToast } from '@/app/components/Toast';

const VENUE_SECTIONS = [
  { id: 'floor', name: 'Floor / GA', color: 'from-red-600 to-red-800', capacity: '200' },
  { id: 'lower', name: 'Lower Bowl', color: 'from-orange-600 to-orange-800', capacity: '150' },
  { id: 'upper', name: 'Upper Bowl', color: 'from-yellow-600 to-yellow-800', capacity: '300' },
  { id: 'vip', name: 'VIP Section', color: 'from-purple-600 to-purple-800', capacity: '50' },
  { id: 'ada', name: 'Accessible (ADA)', color: 'from-blue-600 to-blue-800', capacity: '20' },
];

export default function TicketPurchasePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading: eventLoading } = trpc.events.getById.useQuery({ id: eventId });
  const { data: ticketTypes, isLoading: typesLoading } = trpc.tickets.getTicketTypes.useQuery({ eventId });
  const { data: allEvents } = trpc.events.list.useQuery({ limit: 10, status: 'published' });
  const { status } = useSession();
  const { toast } = useToast();
  const purchase = trpc.tickets.purchase.useMutation();

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [addInsurance, setAddInsurance] = useState(false);
  const [addVIPBundle, setAddVIPBundle] = useState(false);
  const [isGroupBooking, setIsGroupBooking] = useState(false);
  const [needsADA, setNeedsADA] = useState(false);
  const [companionTicket, setCompanionTicket] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchasedTicket, setPurchasedTicket] = useState<any>(null);

  // Countdown timer (10 minutes)
  const [timerActive, setTimerActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(600);

  useEffect(() => {
    if (selectedType && !timerActive) {
      setTimerActive(true);
      setSecondsLeft(600);
    }
  }, [selectedType, timerActive]);

  useEffect(() => {
    if (!timerActive || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setTimerActive(false);
          setSelectedType(null);
          toast('Your ticket hold has expired. Please select again.', 'error');
          return 600;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, secondsLeft, toast]);

  const isLoading = eventLoading || typesLoading;
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-400 text-lg">Loading event...</div></div>;
  if (!event) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><p className="text-gray-400 text-lg">Event not found</p><Link href="/tickets" className="text-red-400">← Back to Events</Link></div>;

  const date = new Date(event.startDate);
  const selected = ticketTypes?.find((t) => t.id === selectedType);
  const basePrice = (selected?.price ?? 0) / 100;
  const insuranceCost = addInsurance ? basePrice * 0.08 : 0;
  const vipBundleCost = addVIPBundle ? 49.99 : 0;
  const groupDiscount = isGroupBooking && quantity >= 10 ? 0.15 : 0;
  const subtotal = (basePrice + insuranceCost + vipBundleCost) * quantity;
  const discount = subtotal * groupDiscount;
  const total = subtotal - discount + (companionTicket ? 0 : 0); // companion is free

  const formatTimer = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const otherEvents = allEvents?.filter((e) => e.id !== eventId).slice(0, 3) ?? [];

  const handlePurchase = async () => {
    if (!selectedType || !agreed) return;
    if (status !== 'authenticated') { toast('Please sign in', 'error'); return; }
    setPurchasing(true);
    try {
      const ticket = await purchase.mutateAsync({ ticketTypeId: selectedType, eventId });
      setPurchasedTicket(ticket);
      toast('Ticket purchased!', 'success');
    } catch (err: any) { toast(err.message || 'Purchase failed', 'error'); }
    finally { setPurchasing(false); }
  };

  if (purchasedTicket) {
    return (
      <div className="min-h-screen py-16 px-6">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-24 h-24 rounded-full bg-green-600/20 flex items-center justify-center text-5xl mx-auto mb-6">✅</div>
          <h1 className="text-3xl font-black mb-2">You&apos;re In!</h1>
          <p className="text-gray-400 mb-8">Your ticket has been confirmed and verified on-chain.</p>
          <div className="rounded-2xl bg-[#15151f] p-8 mb-8 text-left">
            <h2 className="text-xl font-bold mb-4">{event.title}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Date</span><span>{date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Tier</span><span className="text-red-400 font-semibold">{selected?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Qty</span><span>{quantity}</span></div>
              {selectedSection && <div className="flex justify-between"><span className="text-gray-400">Section</span><span>{VENUE_SECTIONS.find((s) => s.id === selectedSection)?.name}</span></div>}
              {addInsurance && <div className="flex justify-between"><span className="text-gray-400">Insurance</span><span className="text-green-400">✓ Protected</span></div>}
              {addVIPBundle && <div className="flex justify-between"><span className="text-gray-400">VIP Bundle</span><span className="text-yellow-400">✓ Included</span></div>}
              {needsADA && <div className="flex justify-between"><span className="text-gray-400">Accessibility</span><span className="text-blue-400">♿ ADA Seating</span></div>}
              <div className="flex justify-between border-t border-brand-800/20 pt-3 font-bold"><span>Total Paid</span><span className="text-red-400">${total.toFixed(2)}</span></div>
            </div>
            <div className="mt-6 p-6 bg-white rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-40 h-40 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-2"><span className="text-4xl">📱</span></div>
                <p className="text-xs text-gray-500 font-mono">{purchasedTicket.qrToken}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Link href="/my-tickets" className="block w-full rounded-full bg-red-600 py-3 font-semibold text-white text-center hover:bg-red-500 transition">View My Tickets</Link>
            <Link href="/tickets" className="block w-full rounded-full border border-brand-800/30 py-3 font-semibold text-center hover:border-red-600 transition">Browse More Events</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/tickets" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">← Back to Events</Link>

        {/* Countdown timer */}
        {timerActive && selectedType && (
          <div className={`rounded-xl p-3 mb-6 flex items-center justify-between ${
            secondsLeft < 120 ? 'bg-red-900/30 border border-red-600/30' : 'bg-brand-950 border border-brand-800/20'
          }`}>
            <span className="text-sm text-gray-400">⏱️ Tickets held for you</span>
            <span className={`font-mono font-bold ${secondsLeft < 120 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {formatTimer(secondsLeft)}
            </span>
          </div>
        )}

        {/* Event header */}
        <div className="rounded-2xl bg-gradient-to-br from-red-900/20 to-[#15151f] border border-brand-800/20 p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-red-600/20 flex items-center justify-center shrink-0">
              <div className="text-center">
                <p className="text-2xl font-black">{date.getDate()}</p>
                <p className="text-xs font-semibold text-red-400 uppercase">{date.toLocaleDateString('en-US', { month: 'short' })}</p>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black mb-1">{event.title}</h1>
              <p className="text-gray-400 text-sm mb-2">Hosted by <span className="text-red-400">{event.hostName}</span></p>
              <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                <span>📅 {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                <span>🕐 {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                {event.timezone && <span>📍 {event.timezone.split('/')[1]?.replace('_', ' ')}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: selection */}
          <div className="lg:col-span-2 space-y-8">
            {/* Venue section map */}
            <div>
              <h2 className="text-xl font-bold mb-4">Select Section</h2>
              <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {VENUE_SECTIONS.map((s) => (
                    <button key={s.id} onClick={() => setSelectedSection(s.id)}
                      className={`rounded-xl p-4 text-center transition border-2 ${
                        selectedSection === s.id ? 'border-red-500 shadow-lg shadow-red-950/20' : 'border-transparent'
                      }`}>
                      <div className={`w-full h-12 rounded-lg bg-gradient-to-br ${s.color} mb-2 flex items-center justify-center text-xs font-bold`}>
                        {s.id === 'ada' ? '♿' : ''}
                      </div>
                      <p className="text-xs font-semibold">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.capacity} seats</p>
                    </button>
                  ))}
                </div>
                <div className="text-center">
                  <div className="inline-block bg-brand-950 rounded-full px-8 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                    🎤 Stage
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket type selection */}
            <div>
              <h2 className="text-xl font-bold mb-4">Select Ticket Type</h2>
              <div className="space-y-3">
                {ticketTypes?.map((tt) => {
                  const available = (tt.quantity ?? 0) - (tt.sold ?? 0);
                  const soldOut = available <= 0;
                  const isSelected = selectedType === tt.id;
                  return (
                    <button key={tt.id} disabled={soldOut} onClick={() => setSelectedType(tt.id)}
                      className={`w-full rounded-xl p-5 text-left transition-all ${
                        isSelected ? 'bg-red-600/10 border-2 border-red-500 shadow-lg shadow-red-950/20'
                        : soldOut ? 'bg-[#15151f] border-2 border-transparent opacity-50 cursor-not-allowed'
                        : 'bg-[#15151f] border-2 border-transparent hover:border-red-800/30'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg">{tt.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${
                              tt.tier === 'vip' ? 'bg-yellow-600/20 text-yellow-400' :
                              tt.tier === 'early_bird' ? 'bg-green-600/20 text-green-400' :
                              tt.tier === 'free' ? 'bg-blue-600/20 text-blue-400' :
                              'bg-gray-600/20 text-gray-400'
                            }`}>{tt.tier.replace('_', ' ')}</span>
                            {soldOut && <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 font-semibold">SOLD OUT</span>}
                          </div>
                          {!soldOut && <p className="text-sm text-gray-400 mt-1">{available} of {tt.quantity} remaining</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black">{tt.price === 0 ? 'FREE' : `$${(tt.price / 100).toFixed(2)}`}</p>
                          {isSelected && <p className="text-xs text-red-400 mt-1">Selected ✓</p>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity selector */}
            {selectedType && (
              <div>
                <h2 className="text-xl font-bold mb-4">Quantity</h2>
                <div className="rounded-xl bg-[#15151f] border border-brand-800/20 p-6">
                  <div className="flex items-center justify-center gap-6">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-12 rounded-full bg-brand-950 border border-brand-800/30 flex items-center justify-center text-xl font-bold hover:border-red-600 transition">
                      −
                    </button>
                    <span className="text-4xl font-black w-16 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(8, quantity + 1))}
                      className="w-12 h-12 rounded-full bg-brand-950 border border-brand-800/30 flex items-center justify-center text-xl font-bold hover:border-red-600 transition">
                      +
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-3">Max 8 tickets per purchase</p>

                  {/* Group booking toggle */}
                  {quantity >= 10 && (
                    <div className="mt-4 p-3 bg-green-900/10 border border-green-800/20 rounded-lg text-center">
                      <p className="text-sm text-green-400 font-semibold">🎉 Group Discount: 15% off!</p>
                      <p className="text-xs text-gray-400 mt-1">Automatically applied for 10+ tickets</p>
                    </div>
                  )}

                  <label className="flex items-center gap-3 mt-4 cursor-pointer">
                    <input type="checkbox" checked={isGroupBooking} onChange={(e) => setIsGroupBooking(e.target.checked)}
                      className="w-5 h-5 rounded bg-brand-950 border-brand-800 accent-red-600" />
                    <div>
                      <span className="text-sm font-semibold">Group Booking</span>
                      <p className="text-xs text-gray-500">Need 10+? Get 15% off. Contact us for 50+.</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Add-ons */}
            {selectedType && selected && selected.price > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Add-Ons</h2>
                <div className="space-y-3">
                  {/* Ticket Insurance */}
                  <button onClick={() => setAddInsurance(!addInsurance)}
                    className={`w-full rounded-xl p-5 text-left transition-all border-2 ${
                      addInsurance ? 'border-green-500 bg-green-900/10' : 'bg-[#15151f] border-transparent hover:border-brand-800/30'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">🛡️</span>
                        <div>
                          <h3 className="font-bold">Ticket Insurance</h3>
                          <p className="text-xs text-gray-400 mt-0.5">Full refund if you can&apos;t attend — no questions asked</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-400">+${(basePrice * 0.08).toFixed(2)}</p>
                        <p className="text-xs text-gray-500">8% of ticket</p>
                      </div>
                    </div>
                  </button>

                  {/* VIP Bundle */}
                  <button onClick={() => setAddVIPBundle(!addVIPBundle)}
                    className={`w-full rounded-xl p-5 text-left transition-all border-2 ${
                      addVIPBundle ? 'border-yellow-500 bg-yellow-900/10' : 'bg-[#15151f] border-transparent hover:border-brand-800/30'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">⭐</span>
                        <div>
                          <h3 className="font-bold">VIP Experience Bundle</h3>
                          <p className="text-xs text-gray-400 mt-0.5">Early entry + exclusive merch + meet & greet pass</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-yellow-400">+$49.99</p>
                        <p className="text-xs text-gray-500">per ticket</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Accessibility */}
            {selectedType && (
              <div>
                <h2 className="text-xl font-bold mb-4">Accessibility</h2>
                <div className="rounded-xl bg-[#15151f] border border-brand-800/20 p-6 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={needsADA} onChange={(e) => setNeedsADA(e.target.checked)}
                      className="w-5 h-5 rounded bg-brand-950 border-brand-800 accent-red-600" />
                    <div>
                      <span className="text-sm font-semibold">♿ ADA Accessible Seating</span>
                      <p className="text-xs text-gray-500">Wheelchair-accessible section with clear sightlines</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={companionTicket} onChange={(e) => setCompanionTicket(e.target.checked)}
                      className="w-5 h-5 rounded bg-brand-950 border-brand-800 accent-red-600" />
                    <div>
                      <span className="text-sm font-semibold">👤 Companion Ticket (Free)</span>
                      <p className="text-xs text-gray-500">Free ticket for a personal care attendant</p>
                    </div>
                  </label>
                  <p className="text-xs text-gray-600">Need additional accommodations? <Link href="/contact" className="text-red-400 hover:text-red-300">Contact us</Link></p>
                </div>
              </div>
            )}

            {/* Anti-scalper agreement */}
            {selectedType && (
              <div className="rounded-xl bg-[#15151f] border border-brand-800/20 p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2"><span className="text-red-500">🛡️</span> Anti-Scalper Agreement</h3>
                <ul className="space-y-2 text-sm text-gray-400 mb-4">
                  <li>• Ticket is <strong className="text-white">non-transferable</strong> and tied to your account</li>
                  <li>• One purchase per person per event — enforced on-chain</li>
                  <li>• Resale on third-party platforms is prohibited</li>
                  <li>• QR code is unique and verified at entry</li>
                </ul>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                    className="w-5 h-5 rounded bg-brand-950 border-brand-800 accent-red-600" />
                  <span className="text-sm">I agree to the anti-scalper policy</span>
                </label>
              </div>
            )}
          </div>

          {/* Right column: order summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
                <h2 className="text-lg font-bold mb-4">Order Summary</h2>

                {!selectedType ? (
                  <p className="text-gray-500 text-sm text-center py-4">Select a ticket type to continue</p>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">{selected?.name} × {quantity}</span>
                      <span>${(basePrice * quantity).toFixed(2)}</span>
                    </div>
                    {addInsurance && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">🛡️ Insurance × {quantity}</span>
                        <span className="text-green-400">${(insuranceCost * quantity).toFixed(2)}</span>
                      </div>
                    )}
                    {addVIPBundle && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">⭐ VIP Bundle × {quantity}</span>
                        <span className="text-yellow-400">${(vipBundleCost * quantity).toFixed(2)}</span>
                      </div>
                    )}
                    {companionTicket && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">👤 Companion</span>
                        <span className="text-blue-400">FREE</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>🎉 Group Discount (15%)</span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Service fees</span>
                      <span className="text-green-400">$0.00</span>
                    </div>
                    <div className="border-t border-brand-800/20 pt-3 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-red-400">${total.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Revenue transparency */}
                {selected && selected.price > 0 && (
                  <div className="mt-4 p-3 bg-brand-950/50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-2">Where your money goes:</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-gray-500">Artist (85%)</span><span className="text-red-400">${(total * 0.85).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Facilitator (5%)</span><span className="text-pink-400">${(total * 0.05).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Platform (10%)</span><span className="text-cyan-400">${(total * 0.10).toFixed(2)}</span></div>
                    </div>
                  </div>
                )}

                <button onClick={handlePurchase}
                  disabled={!selectedType || !agreed || purchasing || status !== 'authenticated'}
                  className="w-full mt-6 rounded-full bg-red-600 py-4 font-semibold text-white text-lg transition hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  {purchasing ? 'Processing...'
                    : status !== 'authenticated' ? 'Sign In to Buy'
                    : !selectedType ? 'Select Ticket'
                    : !agreed ? 'Agree to Policy'
                    : `Buy Now — $${total.toFixed(2)}`}
                </button>

                {status !== 'authenticated' && (
                  <p className="text-center text-xs text-gray-500 mt-3">
                    <Link href="/auth/login" className="text-red-400 hover:text-red-300">Sign in</Link> to purchase.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* You might also like */}
        {otherEvents.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {otherEvents.map((e) => {
                const d = new Date(e.startDate);
                return (
                  <Link key={e.id} href={`/tickets/${e.id}`}
                    className="rounded-2xl bg-[#15151f] border border-brand-800/20 overflow-hidden transition hover:-translate-y-1 hover:shadow-xl block">
                    <div className="h-24 bg-gradient-to-br from-red-800/30 to-brand-950 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-xl font-black">{d.getDate()}</p>
                        <p className="text-xs font-semibold text-red-400 uppercase">{d.toLocaleDateString('en-US', { month: 'short' })}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold truncate">{e.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{e.hostName}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
