'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';
import { trpc } from '@/lib/trpc/client';

const GENRE_OPTIONS = ['Rock', 'Electronic', 'Hip Hop', 'Jazz', 'Acoustic', 'R&B', 'Pop', 'Country', 'Metal', 'Latin', 'Indie', 'Multi-Genre'];

type SlotType = 'open_mic' | 'paid' | 'door_split' | 'showcase';

const SLOT_TYPE_LABEL: Record<SlotType, string> = {
  open_mic: 'Open Mic Night',
  paid: 'Paid (Flat Fee)',
  door_split: 'Door Split',
  showcase: 'Showcase',
};

function formatSlotTime(start: Date, end: Date) {
  const d = new Date(start);
  const e = new Date(end);
  const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${datePart} · ${d.toLocaleTimeString('en-US', timeOpts)} – ${e.toLocaleTimeString('en-US', timeOpts)}`;
}

export default function PostSlotPage() {
  const { status } = useSession();
  const { toast } = useToast();
  const isAuth = status === 'authenticated';

  const { data: myVenues, refetch: refetchVenues } = trpc.venues.myVenues.useQuery(undefined, { enabled: isAuth });
  const { data: mySlots, refetch: refetchSlots } = trpc.venues.mySlots.useQuery(undefined, { enabled: isAuth });
  const openSlots = (mySlots ?? []).filter((s) => s.status === 'open');

  const [form, setForm] = useState({
    venueId: '',
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    slotType: 'paid' as SlotType,
    flatFeeDollars: '300',
    doorSplitPct: '60',
    genres: [] as string[],
    capacityHint: '',
  });

  const createSlot = trpc.venues.createSlot.useMutation({
    onSuccess: () => {
      toast('Slot posted.', 'success');
      setForm((p) => ({ ...p, title: '', description: '', date: '', startTime: '', endTime: '' }));
      void refetchSlots();
    },
    onError: (err) => toast(err.message || 'Could not post slot', 'error'),
  });

  const cancelSlot = trpc.venues.cancelSlot.useMutation({
    onSuccess: () => {
      toast('Slot cancelled.', 'info');
      void refetchSlots();
    },
    onError: (err) => toast(err.message || 'Could not cancel', 'error'),
  });

  const toggleGenre = (genre: string) => {
    setForm((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.venueId || !form.title || !form.date || !form.startTime || !form.endTime) {
      toast('Fill venue, title, date, start & end times', 'error');
      return;
    }
    const startIso = new Date(`${form.date}T${form.startTime}`).toISOString();
    const endIso = new Date(`${form.date}T${form.endTime}`).toISOString();

    createSlot.mutate({
      venueId: form.venueId,
      title: form.title,
      description: form.description || undefined,
      slotType: form.slotType,
      startTime: startIso,
      endTime: endIso,
      compensationCents: form.slotType === 'paid' ? Math.round(Number(form.flatFeeDollars) * 100) : undefined,
      doorSplitBp: form.slotType === 'door_split' ? Math.round(Number(form.doorSplitPct) * 100) : undefined,
      genres: form.genres.length > 0 ? form.genres : undefined,
      capacityHint: form.capacityHint ? Number(form.capacityHint) : undefined,
    });
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-950 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuth) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-950 px-4 text-center text-white">
        <svg className="h-16 w-16 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        <h1 className="mt-4 text-2xl font-bold">Sign In Required</h1>
        <p className="mt-2 text-gray-400">You need to be signed in as a venue owner to post slots.</p>
        <Link href="/auth/login" className="mt-6 rounded-lg bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700">Sign In</Link>
      </div>
    );
  }

  if (!myVenues || myVenues.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-950 px-4 text-center text-white">
        <h1 className="text-2xl font-bold">List a venue first</h1>
        <p className="mt-2 text-gray-400">You need to list at least one venue before you can post slots.</p>
        <Link
          href="/venues/create"
          className="mt-6 rounded-lg bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700"
          onClick={() => setTimeout(() => refetchVenues(), 500)}
        >
          List a Venue
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-950 text-white">
      {/* Hero */}
      <div className="border-b border-white/10 bg-gradient-to-br from-brand-950 via-brand-900 to-red-950 py-12">
        <div className="mx-auto max-w-4xl px-4">
          <Link href="/venues/discover" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Venues
          </Link>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">Post an Available Slot</h1>
          <p className="mt-2 text-gray-300">Let creators know when your stage is open. Fill out the details below and start receiving applications.</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Venue & Date/Time */}
          <div className="rounded-xl border border-white/10 bg-[#15151f] p-6">
            <h2 className="text-lg font-bold">Venue & Schedule</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Venue *</label>
                <select
                  value={form.venueId}
                  onChange={(e) => setForm({ ...form, venueId: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-brand-950 px-4 py-2.5 text-sm text-white focus:border-red-600 focus:outline-none"
                >
                  <option value="">Select a venue…</option>
                  {myVenues.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}{v.city ? ` — ${v.city}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Slot Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Friday Headliner Slot"
                  className="w-full rounded-lg border border-white/10 bg-brand-950 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-red-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-brand-950 px-4 py-2.5 text-sm text-white focus:border-red-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Start *</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-brand-950 px-4 py-2.5 text-sm text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">End *</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-brand-950 px-4 py-2.5 text-sm text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Slot Type & Compensation */}
          <div className="rounded-xl border border-white/10 bg-[#15151f] p-6">
            <h2 className="text-lg font-bold">Slot Type & Compensation</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Slot Type *</label>
                <select
                  value={form.slotType}
                  onChange={(e) => setForm({ ...form, slotType: e.target.value as SlotType })}
                  className="w-full rounded-lg border border-white/10 bg-brand-950 px-4 py-2.5 text-sm text-white focus:border-red-600 focus:outline-none"
                >
                  {(Object.keys(SLOT_TYPE_LABEL) as SlotType[]).map((k) => (
                    <option key={k} value={k}>{SLOT_TYPE_LABEL[k]}</option>
                  ))}
                </select>
              </div>
              {form.slotType === 'paid' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Flat Fee</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                    <input
                      type="number"
                      min="0"
                      value={form.flatFeeDollars}
                      onChange={(e) => setForm({ ...form, flatFeeDollars: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-brand-950 py-2.5 pl-7 pr-4 text-sm text-white focus:border-red-600 focus:outline-none"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Trust-based — money moves off-platform.</p>
                </div>
              )}
              {form.slotType === 'door_split' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Creator Door %</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={form.doorSplitPct}
                      onChange={(e) => setForm({ ...form, doorSplitPct: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-brand-950 px-4 py-2.5 pr-8 text-sm text-white focus:border-red-600 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                  </div>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Capacity Hint</label>
                <input
                  type="number"
                  min="1"
                  value={form.capacityHint}
                  onChange={(e) => setForm({ ...form, capacityHint: e.target.value })}
                  placeholder="(optional)"
                  className="w-full rounded-lg border border-white/10 bg-brand-950 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-red-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Genres */}
          <div className="rounded-xl border border-white/10 bg-[#15151f] p-6">
            <h2 className="text-lg font-bold">Preferred Genres</h2>
            <p className="mt-1 text-sm text-gray-400">Optional — leave blank to accept all</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {GENRE_OPTIONS.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    form.genres.includes(genre)
                      ? 'bg-red-600 text-white'
                      : 'border border-white/10 bg-white/5 text-gray-300 hover:border-red-600/50'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl border border-white/10 bg-[#15151f] p-6">
            <h2 className="text-lg font-bold">Notes for Applicants</h2>
            <div className="mt-4">
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                placeholder="Equipment provided, set length, vibe, anything an applicant should know."
                className="w-full rounded-lg border border-white/10 bg-brand-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-red-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createSlot.isPending}
            className="w-full rounded-lg bg-red-600 py-3 text-lg font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {createSlot.isPending ? 'Posting…' : 'Post Slot'}
          </button>
        </form>

        {/* Your Active Slots */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold">Your Open Slots</h2>
          <div className="mt-6 space-y-4">
            {openSlots.map((slot) => (
              <div key={slot.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#15151f] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{slot.venueName ?? '—'}</p>
                  <p className="mt-0.5 text-sm">{slot.title}</p>
                  <p className="mt-1 text-sm text-gray-400">{formatSlotTime(slot.startTime, slot.endTime)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-red-600/20 px-2.5 py-0.5 text-xs text-red-400">{SLOT_TYPE_LABEL[slot.slotType as SlotType]}</span>
                    {slot.compensationCents != null && (
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-gray-300">${(slot.compensationCents / 100).toFixed(2)}</span>
                    )}
                    {slot.doorSplitBp != null && (
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-gray-300">{(slot.doorSplitBp / 100).toFixed(0)}% door</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => cancelSlot.mutate({ slotId: slot.id })}
                  disabled={cancelSlot.isPending}
                  className="rounded-lg border border-red-600/30 bg-red-600/10 px-4 py-2 text-sm text-red-400 transition hover:bg-red-600/20 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ))}
            {openSlots.length === 0 && (
              <p className="py-8 text-center text-gray-500">No open slots. Post one above.</p>
            )}
          </div>
        </div>

        <div className="h-16" />
      </div>
    </div>
  );
}
