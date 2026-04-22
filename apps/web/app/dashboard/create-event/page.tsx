'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';
import Link from 'next/link';

interface TicketTier {
  name: string;
  tier: 'free' | 'early_bird' | 'general' | 'vip';
  price: string;
  quantity: string;
}

export default function CreateEventPage() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const createEvent = trpc.events.create.useMutation();
  const createTicketType = trpc.tickets.createTicketType.useMutation();

  const [step, setStep] = useState<'details' | 'tickets' | 'review'>('details');
  const [submitting, setSubmitting] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  // Event details
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('20:00');
  const [endTime, setEndTime] = useState('23:00');
  const [timezone, setTimezone] = useState('America/New_York');
  const [capacity, setCapacity] = useState('');
  const [location, setLocation] = useState('');

  // Ticket tiers
  const [tiers, setTiers] = useState<TicketTier[]>([
    { name: 'General Admission', tier: 'general', price: '25.00', quantity: '200' },
  ]);

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Sign in to create events</p>
        <Link href="/auth/login" className="text-red-400 hover:text-red-300">Sign In →</Link>
      </div>
    );
  }

  const addTier = () => {
    setTiers([...tiers, { name: '', tier: 'general', price: '0', quantity: '100' }]);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof TicketTier, value: string) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    setTiers(updated);
  };

  const handleCreateEvent = async () => {
    if (!title || !startDate) {
      toast('Please fill in event title and date', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const startDateTime = new Date(`${startDate}T${startTime}:00`).toISOString();
      const endDateTime = new Date(`${startDate}T${endTime}:00`).toISOString();

      const event = await createEvent.mutateAsync({
        title,
        startDate: startDateTime,
        endDate: endDateTime,
        timezone,
        capacity: capacity ? parseInt(capacity) : undefined,
      });

      setCreatedEventId(event.id);

      // Create ticket types
      for (const tier of tiers) {
        if (!tier.name || !tier.quantity) continue;
        await createTicketType.mutateAsync({
          eventId: event.id,
          name: tier.name,
          tier: tier.tier,
          price: Math.round(parseFloat(tier.price || '0') * 100),
          quantity: parseInt(tier.quantity),
        });
      }

      toast('Event created with ticket tiers!', 'success');
      router.push('/dashboard/tickets');
    } catch (err: any) {
      toast(err.message || 'Failed to create event', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard/tickets" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          ← Back to Ticket Dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-2">Create Event</h1>
        <p className="text-gray-400 mb-8">Set up your event and ticket tiers. Sell direct to fans.</p>

        {/* Step indicator */}
        <div className="flex items-center gap-4 mb-8">
          {['details', 'tickets', 'review'].map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(s as any)}
              className={`flex items-center gap-2 text-sm font-semibold transition ${
                step === s ? 'text-red-400' : 'text-gray-500'
              }`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s ? 'bg-red-600 text-white' : 'bg-[#15151f] text-gray-500'
              }`}>
                {i + 1}
              </span>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Step 1: Event Details */}
        {step === 'details' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Event Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Neon Nights Tour — Los Angeles"
                className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-red-600 focus:outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-red-600 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-red-600 focus:outline-none transition"
                >
                  <option value="America/New_York">Eastern (ET)</option>
                  <option value="America/Chicago">Central (CT)</option>
                  <option value="America/Denver">Mountain (MT)</option>
                  <option value="America/Los_Angeles">Pacific (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-red-600 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-red-600 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Venue / Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. The Warehouse, Los Angeles"
                className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-red-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Total Capacity</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="e.g. 500"
                className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-red-600 focus:outline-none transition"
              />
            </div>

            <button
              onClick={() => setStep('tickets')}
              disabled={!title || !startDate}
              className="w-full rounded-full bg-red-600 py-3 font-semibold text-white transition hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Set Up Tickets →
            </button>
          </div>
        )}

        {/* Step 2: Ticket Tiers */}
        {step === 'tickets' && (
          <div className="space-y-6">
            {tiers.map((tier, i) => (
              <div key={i} className="rounded-xl bg-[#15151f] border border-brand-800/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Tier {i + 1}</h3>
                  {tiers.length > 1 && (
                    <button
                      onClick={() => removeTier(i)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Tier Name</label>
                    <input
                      value={tier.name}
                      onChange={(e) => updateTier(i, 'name', e.target.value)}
                      placeholder="e.g. General Admission"
                      className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-red-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Tier Type</label>
                    <select
                      value={tier.tier}
                      onChange={(e) => updateTier(i, 'tier', e.target.value)}
                      className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none"
                    >
                      <option value="free">Free</option>
                      <option value="early_bird">Early Bird</option>
                      <option value="general">General</option>
                      <option value="vip">VIP</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tier.price}
                      onChange={(e) => updateTier(i, 'price', e.target.value)}
                      className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={tier.quantity}
                      onChange={(e) => updateTier(i, 'quantity', e.target.value)}
                      className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none"
                    />
                  </div>
                </div>

                {parseFloat(tier.price) > 0 && (
                  <div className="mt-3 p-3 bg-brand-950/50 rounded-lg text-xs text-gray-400">
                    Creator receives: <span className="text-red-400 font-semibold">${(parseFloat(tier.price) * 0.85).toFixed(2)}</span> per ticket (85%)
                    {' · '}Revenue if sold out: <span className="text-white font-semibold">${(parseFloat(tier.price) * 0.85 * parseInt(tier.quantity || '0')).toFixed(2)}</span>
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={addTier}
              className="w-full rounded-xl border-2 border-dashed border-brand-800/30 py-4 text-sm text-gray-400 hover:border-red-600 hover:text-red-400 transition"
            >
              + Add Another Tier
            </button>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('details')}
                className="flex-1 rounded-full border border-brand-800/30 py-3 font-semibold transition hover:border-red-600"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep('review')}
                className="flex-1 rounded-full bg-red-600 py-3 font-semibold text-white transition hover:bg-red-500"
              >
                Review →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && (
          <div className="space-y-6">
            <div className="rounded-xl bg-[#15151f] border border-brand-800/20 p-6">
              <h3 className="font-bold text-lg mb-4">{title || 'Untitled Event'}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Date</span>
                  <span>{startDate ? new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time</span>
                  <span>{startTime} – {endTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Timezone</span>
                  <span>{timezone.split('/')[1]?.replace('_', ' ')}</span>
                </div>
                {location && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Location</span>
                    <span>{location}</span>
                  </div>
                )}
                {capacity && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Capacity</span>
                    <span>{parseInt(capacity).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-[#15151f] border border-brand-800/20 p-6">
              <h3 className="font-bold mb-4">Ticket Tiers ({tiers.length})</h3>
              <div className="space-y-3">
                {tiers.map((tier, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-semibold">{tier.name || `Tier ${i + 1}`}</span>
                      <span className="text-xs text-gray-500 ml-2 uppercase">{tier.tier.replace('_', ' ')}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{parseFloat(tier.price) === 0 ? 'FREE' : `$${parseFloat(tier.price).toFixed(2)}`}</span>
                      <span className="text-gray-500 ml-2">× {tier.quantity}</span>
                    </div>
                  </div>
                ))}
                <div className="border-t border-brand-800/20 pt-3 flex justify-between font-bold">
                  <span>Potential Revenue (85%)</span>
                  <span className="text-red-400">
                    ${tiers.reduce((sum, t) => sum + parseFloat(t.price || '0') * 0.85 * parseInt(t.quantity || '0'), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('tickets')}
                className="flex-1 rounded-full border border-brand-800/30 py-3 font-semibold transition hover:border-red-600"
              >
                ← Back
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={submitting}
                className="flex-1 rounded-full bg-red-600 py-4 font-semibold text-white text-lg transition hover:bg-red-500 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Publish Event 🎫'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
