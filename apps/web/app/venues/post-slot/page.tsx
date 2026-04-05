'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

const MY_VENUES = [
  { id: 1, name: 'The Warehouse - Los Angeles' },
  { id: 2, name: 'Neon Garden - Nashville' },
  { id: 3, name: 'Soundstage - Denver' },
  { id: 4, name: 'The Roxy - Los Angeles' },
];

const SLOT_TYPES = [
  'Open Mic Night',
  'Support Act / Opener',
  'Headliner',
  'New Music Test Night',
  'Showcase / Multi-Artist',
  'Private Event',
];

const COMPENSATION_TYPES = [
  { value: 'free', label: 'Free (Exposure)' },
  { value: 'revenue_share', label: 'Revenue Share' },
  { value: 'flat_fee', label: 'Flat Fee' },
  { value: 'door_split', label: 'Door Split' },
];

const GENRE_OPTIONS = ['Rock', 'Electronic', 'Hip Hop', 'Jazz', 'Acoustic', 'R&B', 'Pop', 'Country', 'Metal', 'Latin', 'Indie', 'Multi-Genre'];

const EXPERIENCE_LEVELS = [
  { value: 'any', label: 'Any Level' },
  { value: 'emerging', label: 'Emerging (0-1K followers)' },
  { value: 'growing', label: 'Growing (1K-10K)' },
  { value: 'established', label: 'Established (10K+)' },
];

const ACTIVE_SLOTS = [
  { id: 1, venue: 'The Warehouse', date: '2026-04-18', time: '7:00 PM - 8:30 PM', type: 'Support Act / Opener', applications: 5 },
  { id: 2, venue: 'Neon Garden', date: '2026-04-22', time: '9:00 PM - 11:00 PM', type: 'Headliner', applications: 12 },
  { id: 3, venue: 'Soundstage', date: '2026-04-25', time: '6:00 PM - 10:00 PM', type: 'Open Mic Night', applications: 3 },
];

export default function PostSlotPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const isAuth = status === 'authenticated';

  const [form, setForm] = useState({
    venueId: '',
    date: '',
    startTime: '',
    endTime: '',
    slotType: '',
    compensationType: 'free',
    revenueSharePct: '20',
    flatFee: '300',
    doorSplitPct: '60',
    genres: [] as string[],
    experienceLevel: 'any',
    requirements: '',
    artistCount: '1',
    soundCheckTime: '',
  });

  const [activeSlots, setActiveSlots] = useState(ACTIVE_SLOTS);

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
    if (!form.venueId || !form.date || !form.startTime || !form.endTime || !form.slotType) {
      toast('Please fill in all required fields', 'error');
      return;
    }
    toast('Slot posted successfully! Artists can now apply.', 'success');
  };

  const handleRemoveSlot = (id: number) => {
    setActiveSlots((prev) => prev.filter((s) => s.id !== id));
    toast('Slot removed', 'info');
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
        <p className="mt-2 text-gray-400">You need to be signed in as a venue owner to post available slots.</p>
        <Link href="/auth/login" className="mt-6 rounded-lg bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700">
          Sign In
        </Link>
        <Link href="/venues/discover" className="mt-3 text-sm text-gray-400 hover:text-white transition">
          Browse venues instead
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
          <p className="mt-2 text-gray-300">Let artists know when your stage is available. Fill out the details below and start receiving applications.</p>
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
                  <option value="">Select a venue...</option>
                  {MY_VENUES.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
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
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Start Time *</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-brand-950 px-4 py-2.5 text-sm text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">End Time *</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-brand-950 px-4 py-2.5 text-sm text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Sound Check Time</label>
                <input
                  type="time"
                  value={form.soundCheckTime}
                  onChange={(e) => setForm({ ...form, soundCheckTime: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-brand-950 px-4 py-2.5 text-sm text-white focus:border-red-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Slot Type */}
          <div className="rounded-xl border border-white/10 bg-[#15151f] p-6">
            <h2 className="text-lg font-bold">Slot Details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Slot Type *</label>
                <select
                  value={form.slotType}
                  onChange={(e) => setForm({ ...form, slotType: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-brand-950 px-4 py-2.5 text-sm text-white focus:border-red-600 focus:outline-none"
                >
                  <option value="">Select slot type...</option>
                  {SLOT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">How Many Artists</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={form.artistCount}
                  onChange={(e) => setForm({ ...form, artistCount: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-brand-950 px-4 py-2.5 text-sm text-white focus:border-red-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Experience Level</label>
                <select
                  value={form.experienceLevel}
                  onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-brand-950 px-4 py-2.5 text-sm text-white focus:border-red-600 focus:outline-none"
                >
                  {EXPERIENCE_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="rounded-xl border border-white/10 bg-[#15151f] p-6">
            <h2 className="text-lg font-bold">Compensation</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Compensation Type</label>
                <select
                  value={form.compensationType}
                  onChange={(e) => setForm({ ...form, compensationType: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-brand-950 px-4 py-2.5 text-sm text-white focus:border-red-600 focus:outline-none"
                >
                  {COMPENSATION_TYPES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              {form.compensationType === 'revenue_share' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Revenue Share %</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={form.revenueSharePct}
                      onChange={(e) => setForm({ ...form, revenueSharePct: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-brand-950 px-4 py-2.5 pr-8 text-sm text-white focus:border-red-600 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                  </div>
                </div>
              )}
              {form.compensationType === 'flat_fee' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Fee Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                    <input
                      type="number"
                      min="0"
                      value={form.flatFee}
                      onChange={(e) => setForm({ ...form, flatFee: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-brand-950 py-2.5 pl-7 pr-4 text-sm text-white focus:border-red-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}
              {form.compensationType === 'door_split' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Artist Door Split %</label>
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
            </div>
          </div>

          {/* Genre Preferences */}
          <div className="rounded-xl border border-white/10 bg-[#15151f] p-6">
            <h2 className="text-lg font-bold">Genre Preferences</h2>
            <p className="mt-1 text-sm text-gray-400">Select the genres you&apos;re looking for</p>
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

          {/* Requirements */}
          <div className="rounded-xl border border-white/10 bg-[#15151f] p-6">
            <h2 className="text-lg font-bold">Requirements</h2>
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Equipment, set length, or other requirements</label>
              <textarea
                value={form.requirements}
                onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                rows={4}
                placeholder="e.g., Must bring own instruments. 30-minute set. No explicit lyrics."
                className="w-full rounded-lg border border-white/10 bg-brand-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-red-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-red-600 py-3 text-lg font-bold text-white transition hover:bg-red-700"
          >
            Post Slot
          </button>
        </form>

        {/* Your Active Slots */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold">Your Active Slots</h2>
          <p className="mt-1 text-sm text-gray-400">Manage your currently posted time slots</p>
          <div className="mt-6 space-y-4">
            {activeSlots.map((slot) => (
              <div key={slot.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#15151f] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{slot.venue}</p>
                  <p className="mt-1 text-sm text-gray-400">{slot.date} &middot; {slot.time}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-red-600/20 px-2.5 py-0.5 text-xs text-red-400">{slot.type}</span>
                    <span className="text-xs text-gray-500">{slot.applications} application{slot.applications !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toast('Edit feature coming soon', 'info')}
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/10"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRemoveSlot(slot.id)}
                    className="rounded-lg border border-red-600/30 bg-red-600/10 px-4 py-2 text-sm text-red-400 transition hover:bg-red-600/20"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {activeSlots.length === 0 && (
              <p className="py-8 text-center text-gray-500">No active slots. Post one above!</p>
            )}
          </div>
        </div>

        <div className="h-16" />
      </div>
    </div>
  );
}
