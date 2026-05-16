'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useToast } from '@/app/components/Toast';
import { trpc } from '@/lib/trpc/client';

type Role = 'venue' | 'creator';

function formatSlotTime(start: Date, end: Date) {
  const d = new Date(start);
  const e = new Date(end);
  const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${datePart} · ${d.toLocaleTimeString('en-US', timeOpts)} – ${e.toLocaleTimeString('en-US', timeOpts)}`;
}

function compensationLabel(slot: { slotType: string; compensationCents: number | null }) {
  if (slot.slotType === 'open_mic') return 'Open Mic';
  if (slot.slotType === 'showcase') return 'Showcase';
  if (slot.compensationCents != null) return `$${(slot.compensationCents / 100).toFixed(0)}`;
  return slot.slotType;
}

function statusPillClass(status: string) {
  switch (status) {
    case 'pending': return 'bg-yellow-600/20 text-yellow-400';
    case 'accepted': return 'bg-green-600/20 text-green-400';
    case 'declined': return 'bg-red-600/20 text-red-400';
    case 'withdrawn': return 'bg-gray-600/20 text-gray-400';
    default: return 'bg-gray-600/20 text-gray-400';
  }
}

export default function BookingPage() {
  const { status } = useSession();
  const { toast } = useToast();
  const [role, setRole] = useState<Role>('creator');
  const isAuth = status === 'authenticated';

  const myApps = trpc.bookings.myApplications.useQuery(undefined, { enabled: isAuth });
  const received = trpc.bookings.received.useQuery(undefined, { enabled: isAuth });

  const withdraw = trpc.bookings.withdraw.useMutation({
    onSuccess: () => {
      toast('Application withdrawn.', 'info');
      void myApps.refetch();
    },
    onError: (err) => toast(err.message || 'Could not withdraw', 'error'),
  });

  const accept = trpc.bookings.accept.useMutation({
    onSuccess: () => {
      toast('Application accepted. Slot is now filled.', 'success');
      void received.refetch();
    },
    onError: (err) => toast(err.message || 'Could not accept', 'error'),
  });

  const decline = trpc.bookings.decline.useMutation({
    onSuccess: () => {
      toast('Application declined.', 'info');
      void received.refetch();
    },
    onError: (err) => toast(err.message || 'Could not decline', 'error'),
  });

  // Group received apps by slot for the venue view
  const receivedBySlot = useMemo(() => {
    const m = new Map<string, { slot: NonNullable<typeof received.data>[number]; apps: NonNullable<typeof received.data> }>();
    for (const r of received.data ?? []) {
      if (!m.has(r.slotId)) m.set(r.slotId, { slot: r, apps: [] });
      m.get(r.slotId)!.apps.push(r);
    }
    return Array.from(m.values());
  }, [received.data]);

  if (!isAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-950 text-white px-4 text-center">
        <p className="text-5xl mb-2">🎤</p>
        <h1 className="text-2xl font-bold">Sign in to manage bookings</h1>
        <p className="mt-2 text-gray-400">See your applications and any slots booked at your venues.</p>
        <Link href="/auth/login" className="mt-6 rounded-full bg-red-600 px-8 py-3 font-semibold text-white hover:bg-red-500 transition">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-6 bg-brand-950 text-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">← Home</Link>
          <h1 className="text-3xl font-bold">Booking Portal</h1>
          <p className="text-gray-400 mt-1">Connect creators with venues. Trust-based fees — money moves off-platform.</p>
        </div>

        {/* Role Toggle */}
        <div className="flex items-center gap-1 rounded-full bg-[#15151f] border border-brand-800/20 p-1 w-fit mb-8">
          <button
            onClick={() => setRole('creator')}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${role === 'creator' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            I&apos;m a Creator
          </button>
          <button
            onClick={() => setRole('venue')}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${role === 'venue' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            I&apos;m a Venue
          </button>
        </div>

        {/* ========= CREATOR VIEW ========= */}
        {role === 'creator' && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">My Applications</h2>
              <Link href="/venues/discover" className="text-sm text-red-400 hover:underline">Browse venues →</Link>
            </div>
            {myApps.isLoading ? (
              <p className="py-8 text-center text-gray-500">Loading…</p>
            ) : (myApps.data ?? []).length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-[#15151f] p-8 text-center">
                <p className="text-gray-400">You haven&apos;t applied to any slots yet.</p>
                <Link href="/venues/discover" className="mt-4 inline-block rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition">Find a slot</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {(myApps.data ?? []).map((app) => (
                  <div key={app.id} className="rounded-xl border border-white/10 bg-[#15151f] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/venues/${app.venueId}`} className="font-semibold hover:text-red-400">{app.venueName ?? 'Venue'}</Link>
                          <span className="text-gray-500">·</span>
                          <span className="text-sm">{app.slotTitle ?? 'Slot'}</span>
                        </div>
                        {app.slotStartTime && app.slotEndTime && (
                          <p className="text-xs text-gray-500 mt-1">{formatSlotTime(app.slotStartTime, app.slotEndTime)}</p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPillClass(app.status)}`}>{app.status}</span>
                          {app.slotType && (
                            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-gray-300">{compensationLabel({ slotType: app.slotType, compensationCents: app.compensationCents })}</span>
                          )}
                        </div>
                        {app.message && <p className="mt-2 text-xs text-gray-400">Your note: &ldquo;{app.message}&rdquo;</p>}
                        {app.decisionMessage && (
                          <p className="mt-1 text-xs text-gray-400">Venue: &ldquo;{app.decisionMessage}&rdquo;</p>
                        )}
                      </div>
                      {app.status === 'pending' && (
                        <button
                          onClick={() => withdraw.mutate({ applicationId: app.id })}
                          disabled={withdraw.isPending}
                          className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-gray-300 hover:bg-white/10 transition disabled:opacity-50"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ========= VENUE VIEW ========= */}
        {role === 'venue' && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">Applications to My Slots</h2>
              <div className="flex gap-3">
                <Link href="/venues/post-slot" className="text-sm text-red-400 hover:underline">Post a slot →</Link>
                <Link href="/venues/create" className="text-sm text-gray-400 hover:text-white">List a venue</Link>
              </div>
            </div>
            {received.isLoading ? (
              <p className="py-8 text-center text-gray-500">Loading…</p>
            ) : receivedBySlot.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-[#15151f] p-8 text-center">
                <p className="text-gray-400">No applications yet.</p>
                <p className="text-xs text-gray-500 mt-1">Post a slot to start receiving applications from creators.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {receivedBySlot.map(({ slot, apps }) => (
                  <div key={slot.slotId} className="rounded-xl border border-white/10 bg-[#15151f] p-5">
                    <div className="mb-3 border-b border-white/5 pb-3">
                      <p className="font-semibold">{slot.venueName} · {slot.slotTitle}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatSlotTime(slot.slotStartTime!, slot.slotEndTime!)} · {compensationLabel({ slotType: slot.slotType!, compensationCents: slot.compensationCents })}</p>
                    </div>
                    <div className="space-y-3">
                      {apps.map((a) => (
                        <div key={a.id} className="rounded-lg bg-brand-950/50 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                {a.applicantName?.charAt(0) ?? '?'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">{a.applicantName ?? 'Creator'}</p>
                                <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusPillClass(a.status)}`}>{a.status}</span>
                                {a.message && <p className="mt-1 text-xs text-gray-400">&ldquo;{a.message}&rdquo;</p>}
                                {a.proposedFeeCents != null && (
                                  <p className="mt-1 text-xs text-yellow-400">Counter-offer: ${(a.proposedFeeCents / 100).toFixed(2)}</p>
                                )}
                              </div>
                            </div>
                            {a.status === 'pending' && (
                              <div className="flex gap-2 flex-shrink-0">
                                <button
                                  onClick={() => accept.mutate({ applicationId: a.id })}
                                  disabled={accept.isPending}
                                  className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-500 transition disabled:opacity-50"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => decline.mutate({ applicationId: a.id })}
                                  disabled={decline.isPending}
                                  className="rounded-full border border-white/10 bg-brand-950 px-3 py-1 text-xs font-semibold text-gray-300 hover:text-white transition disabled:opacity-50"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
