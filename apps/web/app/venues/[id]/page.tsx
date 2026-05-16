'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';
import { trpc } from '@/lib/trpc/client';

const GRADIENTS = [
  'from-red-600 to-orange-500',
  'from-purple-600 to-pink-500',
  'from-blue-600 to-cyan-500',
  'from-green-600 to-teal-500',
  'from-indigo-600 to-blue-500',
  'from-yellow-600 to-red-500',
  'from-pink-600 to-red-500',
  'from-emerald-600 to-lime-500',
];

function gradientFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

function formatSlotTime(start: Date, end: Date) {
  const d = new Date(start);
  const e = new Date(end);
  const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${datePart} · ${d.toLocaleTimeString('en-US', timeOpts)} – ${e.toLocaleTimeString('en-US', timeOpts)}`;
}

function compensationLabel(slot: { slotType: string; compensationCents: number | null; doorSplitBp: number | null }) {
  if (slot.slotType === 'open_mic') return 'Open Mic';
  if (slot.slotType === 'showcase') return 'Showcase';
  if (slot.slotType === 'paid' && slot.compensationCents != null) return `Flat $${(slot.compensationCents / 100).toFixed(2)}`;
  if (slot.slotType === 'door_split' && slot.doorSplitBp != null) return `Door Split ${(slot.doorSplitBp / 100).toFixed(0)}%`;
  return slot.slotType;
}

export default function VenueProfilePage() {
  const params = useParams();
  const { toast } = useToast();
  const { status } = useSession();
  const id = params?.id as string;

  const { data, isLoading, refetch } = trpc.venues.get.useQuery({ id }, { enabled: !!id });
  const [appliedSlotIds, setAppliedSlotIds] = useState<string[]>([]);
  const [applyingSlotId, setApplyingSlotId] = useState<string | null>(null);
  const [messageBySlot, setMessageBySlot] = useState<Record<string, string>>({});

  const applyMutation = trpc.bookings.applyToSlot.useMutation({
    onSuccess: (_, vars) => {
      setAppliedSlotIds((prev) => [...prev, vars.slotId]);
      setApplyingSlotId(null);
      toast('Application sent.', 'success');
      void refetch();
    },
    onError: (err) => {
      setApplyingSlotId(null);
      toast(err.message || 'Could not apply', 'error');
    },
  });

  const handleApply = (slotId: string) => {
    if (status !== 'authenticated') {
      toast('Sign in first to apply', 'info');
      return;
    }
    setApplyingSlotId(slotId);
    applyMutation.mutate({ slotId, message: messageBySlot[slotId] || undefined });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-950 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-950 px-4 text-center text-white">
        <h1 className="text-2xl font-bold">Venue not found</h1>
        <Link href="/venues/discover" className="mt-4 text-red-400 hover:underline">Browse venues</Link>
      </div>
    );
  }

  const { venue, slots, owner } = data;
  const amenities = (venue.amenities as string[] | null) ?? [];
  const genres = (venue.genres as string[] | null) ?? [];

  return (
    <div className="min-h-screen bg-brand-950 text-white">
      {/* Cover Image */}
      <div className={`relative h-64 bg-gradient-to-br ${gradientFor(venue.id)} md:h-80`}>
        <div className="absolute inset-0 flex items-center justify-center text-white/20">
          <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        </div>
        <div className="absolute left-4 top-4">
          <Link href="/venues/discover" className="inline-flex items-center gap-2 rounded-lg bg-black/40 px-3 py-2 text-sm text-white backdrop-blur hover:bg-black/60 transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            All Venues
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        {/* Venue Header */}
        <div className="-mt-12 relative z-10 rounded-xl border border-white/10 bg-[#15151f] p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold md:text-4xl">{venue.name}</h1>
              <p className="mt-1 text-gray-400">
                {[venue.address, venue.city, venue.state].filter(Boolean).join(', ') || '—'}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-gray-300">Capacity: {venue.capacity?.toLocaleString() ?? '—'}</span>
                {genres.map((g) => (
                  <span key={g} className="rounded-full bg-red-600/20 px-3 py-1 text-sm text-red-400">{g}</span>
                ))}
              </div>
            </div>
            {owner && (
              <div className="text-right text-xs text-gray-500">
                Hosted by<br />
                <span className="text-gray-300 font-medium">{owner.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* About */}
        {venue.description && (
          <div className="mt-8 rounded-xl border border-white/10 bg-[#15151f] p-6">
            <h2 className="text-xl font-bold">About</h2>
            <p className="mt-3 leading-relaxed text-gray-300 whitespace-pre-wrap">{venue.description}</p>
          </div>
        )}

        {/* Available Slots */}
        <div className="mt-8 rounded-xl border border-white/10 bg-[#15151f] p-6">
          <h2 className="text-xl font-bold">Available Slots</h2>
          <p className="mt-1 text-sm text-gray-400">Apply for an open time slot at this venue</p>
          {slots.length === 0 ? (
            <p className="mt-6 rounded-lg border border-white/5 bg-brand-950/50 p-6 text-center text-sm text-gray-500">
              No open slots right now. Check back later.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {slots.map((slot) => {
                const applied = appliedSlotIds.includes(slot.id);
                const isMine = owner?.id && status === 'authenticated' && /* owner viewing their own */ false;
                void isMine;
                return (
                  <div key={slot.id} className="rounded-lg border border-white/5 bg-brand-950/50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-white">{slot.title}</p>
                        <p className="mt-0.5 text-sm text-gray-400">{formatSlotTime(slot.startTime, slot.endTime)}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-red-600/20 px-2.5 py-0.5 text-xs font-medium text-red-400">{slot.slotType.replace('_', ' ')}</span>
                          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-gray-300">{compensationLabel(slot)}</span>
                        </div>
                        {slot.description && (
                          <p className="mt-2 text-sm text-gray-400 whitespace-pre-wrap">{slot.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleApply(slot.id)}
                        disabled={applied || applyingSlotId === slot.id}
                        className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                          applied
                            ? 'bg-green-600/20 text-green-400 cursor-default'
                            : 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                        }`}
                      >
                        {applied ? 'Applied' : applyingSlotId === slot.id ? 'Applying…' : 'Apply'}
                      </button>
                    </div>
                    {!applied && (
                      <textarea
                        value={messageBySlot[slot.id] ?? ''}
                        onChange={(e) => setMessageBySlot((prev) => ({ ...prev, [slot.id]: e.target.value }))}
                        placeholder="Optional: a brief pitch (set length, similar shows, etc.)"
                        rows={2}
                        className="mt-3 w-full resize-none rounded-lg border border-white/10 bg-brand-950 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-red-600/50 focus:outline-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="mt-8 rounded-xl border border-white/10 bg-[#15151f] p-6">
            <h2 className="text-xl font-bold">Amenities</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {amenities.map((a) => (
                <div key={a} className="flex items-center gap-3 rounded-lg border border-white/5 bg-brand-950/50 p-3">
                  <span className="text-sm text-gray-300">{a}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        {(venue.contactEmail || venue.contactPhone || venue.website) && (
          <div className="mt-8 rounded-xl border border-white/10 bg-[#15151f] p-6">
            <h2 className="text-xl font-bold">Contact</h2>
            <div className="mt-4 space-y-3 text-sm">
              {venue.contactEmail && (
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="text-gray-500">Email</span>
                  <a href={`mailto:${venue.contactEmail}`} className="hover:text-red-400">{venue.contactEmail}</a>
                </div>
              )}
              {venue.contactPhone && (
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="text-gray-500">Phone</span>
                  <span>{venue.contactPhone}</span>
                </div>
              )}
              {venue.website && (
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="text-gray-500">Web</span>
                  <a href={venue.website} target="_blank" rel="noreferrer noopener" className="hover:text-red-400">{venue.website}</a>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="h-16" />
      </div>
    </div>
  );
}
