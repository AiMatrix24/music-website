'use client';

import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

export default function WaitlistPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { status } = useSession();
  const { toast } = useToast();
  const [joined, setJoined] = useState(false);
  const [email, setEmail] = useState('');

  const { data: event } = trpc.events.getById.useQuery({ id: eventId });
  const { data: ticketTypes } = trpc.tickets.getTicketTypes.useQuery({ eventId });

  const soldOut = ticketTypes?.every((tt) => (tt.sold ?? 0) >= (tt.quantity ?? 0));

  const handleJoinWaitlist = () => {
    if (status !== 'authenticated' && !email) {
      toast('Enter your email to join the waitlist', 'error');
      return;
    }
    setJoined(true);
    toast('You\'re on the waitlist! We\'ll notify you when tickets become available.', 'success');
  };

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-lg mx-auto">
        <Link href={`/tickets/${eventId}`} className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          ← Back to Event
        </Link>

        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-yellow-600/20 flex items-center justify-center text-4xl mx-auto mb-4">
            ⏳
          </div>
          <h1 className="text-3xl font-black mb-2">Join the Waitlist</h1>
          <p className="text-gray-400">{event.title}</p>
        </div>

        {joined ? (
          <div className="rounded-2xl bg-green-900/20 border border-green-600/30 p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-green-400 mb-2">You&apos;re on the list!</h2>
            <p className="text-gray-400 text-sm mb-6">
              We&apos;ll notify you immediately when tickets become available.
              Average wait time: 2-3 days.
            </p>
            <div className="bg-brand-950/50 rounded-xl p-4 text-sm">
              <p className="text-gray-500 mb-1">Your position</p>
              <p className="text-2xl font-black text-green-400">#47</p>
              <p className="text-xs text-gray-500 mt-1">in line for {event.title}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <h2 className="font-bold mb-4">How the Waitlist Works</h2>
              <div className="space-y-4">
                <WaitlistStep num={1} title="Join" desc="Add yourself to the waitlist for this event" />
                <WaitlistStep num={2} title="Wait" desc="You'll be notified when spots open up (refunds, cancellations)" />
                <WaitlistStep num={3} title="Buy" desc="You have 24 hours to purchase once offered — at face value, no markups" />
              </div>
            </div>

            {status !== 'authenticated' && (
              <div>
                <label className="block text-sm font-semibold mb-2">Your Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-red-600 focus:outline-none transition"
                />
              </div>
            )}

            {/* Preferred tier */}
            <div>
              <label className="block text-sm font-semibold mb-2">Preferred Tier (optional)</label>
              <select className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-red-600 focus:outline-none transition">
                <option value="">Any available</option>
                {ticketTypes?.map((tt) => (
                  <option key={tt.id} value={tt.id}>
                    {tt.name} — {tt.price === 0 ? 'Free' : `$${((tt.price ?? 0) / 100).toFixed(2)}`}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleJoinWaitlist}
              className="w-full rounded-full bg-red-600 py-4 font-semibold text-white text-lg transition hover:bg-red-500"
            >
              Join Waitlist
            </button>

            <div className="rounded-xl bg-red-950/20 border border-red-800/20 p-4">
              <p className="text-xs text-gray-400">
                <span className="text-red-400 font-semibold">🛡️ No scalpers.</span> Waitlist tickets are sold at face value only.
                No bidding, no markups. Your position is based on when you joined.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WaitlistStep({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-sm font-bold shrink-0">
        {num}
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-gray-400">{desc}</p>
      </div>
    </div>
  );
}
