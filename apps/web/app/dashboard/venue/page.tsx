'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useMemo } from 'react';
import { useToast } from '@/app/components/Toast';
import { trpc } from '@/lib/trpc/client';

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatEventTime(start: Date | string, end: Date | string) {
  const d = new Date(start);
  const e = new Date(end);
  const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${datePart} · ${d.toLocaleTimeString('en-US', timeOpts)} – ${e.toLocaleTimeString('en-US', timeOpts)}`;
}

function statusPillClass(status: string) {
  switch (status) {
    case 'pending': return 'bg-yellow-600/20 text-yellow-400';
    case 'accepted':
    case 'signed':
    case 'completed': return 'bg-green-600/20 text-green-400';
    case 'declined':
    case 'cancelled': return 'bg-red-600/20 text-red-400';
    case 'draft': return 'bg-blue-600/20 text-blue-400';
    default: return 'bg-gray-600/20 text-gray-400';
  }
}

export default function VenueDashboardPage() {
  const { status: sessionStatus } = useSession();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const isAuth = sessionStatus === 'authenticated';

  const { data: summary, isLoading: summaryLoading } = trpc.bookings.dashboardSummary.useQuery(undefined, { enabled: isAuth });
  const { data: myVenues } = trpc.venues.myVenues.useQuery(undefined, { enabled: isAuth });
  const { data: mySlots } = trpc.venues.mySlots.useQuery(undefined, { enabled: isAuth });
  const { data: received } = trpc.bookings.received.useQuery(undefined, { enabled: isAuth });
  const { data: contracts } = trpc.bookings.myContracts.useQuery(undefined, { enabled: isAuth });

  const venueContracts = useMemo(
    () => (contracts ?? []).filter((c) => c.venueOwnerUserId && c.venueOwnerUserId === c.venueOwnerUserId && c.creatorUserId !== c.venueOwnerUserId),
    [contracts]
  );
  // myContracts returns BOTH-role rows; filter to ones where the current user
  // is the venue owner. The session-id check happens server-side already in
  // the bookings.myContracts query (it returns rows for either role), so we
  // separate locally by comparing the venue-side vs creator-side ids.
  const venueOnly = useMemo(() => {
    if (!contracts) return [];
    return contracts.filter((c) => c.venueOwnerUserId !== c.creatorUserId);
    // The split between "as venue" and "as creator" is decided in the UI
    // grouping below — myContracts already returned both for our user.
  }, [contracts]);
  void venueOnly;
  void venueContracts;

  // From the user's POV, contracts where they're the venue owner are
  // ones where venueOwnerUserId matches their session id. We don't have
  // session id directly typed here, so we infer from the data: a row is
  // a "venue contract" if its venue is in myVenues.
  const myVenueIds = useMemo(() => new Set((myVenues ?? []).map((v) => v.id)), [myVenues]);
  const asVenueContracts = useMemo(
    () => (contracts ?? []).filter((c) => myVenueIds.has(c.venueId)),
    [contracts, myVenueIds]
  );

  const now = Date.now();
  const upcomingContracts = asVenueContracts.filter(
    (c) => c.status === 'signed' && new Date(c.eventStart).getTime() > now
  );
  const draftContracts = asVenueContracts.filter((c) => c.status === 'draft');
  const pastContracts = asVenueContracts
    .filter((c) => c.status === 'completed')
    .sort((a, b) => new Date(b.eventStart).getTime() - new Date(a.eventStart).getTime());

  const pendingApps = (received ?? []).filter((r) => r.status === 'pending');
  const openSlots = (mySlots ?? []).filter((s) => s.status === 'open');

  const accept = trpc.bookings.accept.useMutation({
    onSuccess: () => {
      toast('Application accepted.', 'success');
      void utils.bookings.received.invalidate();
      void utils.bookings.dashboardSummary.invalidate();
      void utils.bookings.myContracts.invalidate();
    },
    onError: (err) => toast(err.message || 'Accept failed', 'error'),
  });
  const decline = trpc.bookings.decline.useMutation({
    onSuccess: () => {
      toast('Application declined.', 'info');
      void utils.bookings.received.invalidate();
      void utils.bookings.dashboardSummary.invalidate();
    },
    onError: (err) => toast(err.message || 'Decline failed', 'error'),
  });

  if (!isAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-brand-950 text-white text-center px-4">
        <p className="text-5xl mb-2">🏟️</p>
        <p className="text-gray-400">Sign in to access your venue dashboard</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold hover:bg-red-700 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const s = summary?.asVenue;

  return (
    <div className="min-h-screen py-16 px-6 bg-brand-950 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">← Dashboard</Link>
          <h1 className="text-3xl font-bold">Venue Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage your venues, slots, applications, and bookings.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          <StatCard label="My venues" value={s?.venueCount ?? '—'} icon="🏟️" />
          <StatCard label="Open slots" value={s?.openSlotCount ?? '—'} icon="📅" />
          <StatCard label="Pending apps" value={s?.pendingAppCount ?? '—'} icon="📩" />
          <StatCard label="Upcoming" value={s?.upcomingContractCount ?? '—'} icon="🎤" sub="signed" />
          <StatCard label="Concession revenue" value={s ? fmt(s.concessionRevenueCents) : '—'} icon="💰" sub="all time" />
          <StatCard label="Creator fees" value={s ? fmt(s.creatorFeesOwedCents) : '—'} icon="📋" sub="committed" />
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap gap-3 mb-10">
          <Link href="/venues/create" className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500 transition">+ List a venue</Link>
          <Link href="/venues/post-slot" className="rounded-full bg-[#15151f] border border-white/10 px-5 py-2 text-sm font-semibold text-white hover:border-red-600/40 transition">+ Post a slot</Link>
          <Link href="/booking" className="rounded-full bg-[#15151f] border border-white/10 px-5 py-2 text-sm font-semibold text-white hover:border-red-600/40 transition">All bookings →</Link>
        </div>

        {/* Pending applications */}
        <Section title={`Pending applications (${pendingApps.length})`}>
          {pendingApps.length === 0 ? (
            <Empty text="No pending applications. Post more slots to attract creators." />
          ) : (
            <div className="space-y-2">
              {pendingApps.map((a) => (
                <div key={a.id} className="rounded-xl border border-white/10 bg-[#15151f] p-4 flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-sm font-bold shrink-0">
                      {a.applicantName?.charAt(0) ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold">{a.applicantName ?? 'Creator'}</p>
                      <p className="text-xs text-gray-400">{a.venueName} · {a.slotTitle}</p>
                      {a.slotStartTime && a.slotEndTime && (
                        <p className="text-[11px] text-gray-500">{formatEventTime(a.slotStartTime, a.slotEndTime)}</p>
                      )}
                      {a.message && <p className="mt-1 text-xs text-gray-400">&ldquo;{a.message}&rdquo;</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => accept.mutate({ applicationId: a.id })}
                      disabled={accept.isPending}
                      className="rounded-full bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-500 transition disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => decline.mutate({ applicationId: a.id })}
                      disabled={decline.isPending}
                      className="rounded-full border border-white/10 bg-brand-950 px-4 py-1.5 text-xs font-semibold text-gray-300 hover:text-white transition disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Drafts awaiting signature */}
        {draftContracts.length > 0 && (
          <Section title={`Contracts in draft (${draftContracts.length})`}>
            <div className="space-y-2">
              {draftContracts.map((c) => (
                <ContractRow key={c.id} c={c} />
              ))}
            </div>
          </Section>
        )}

        {/* Upcoming signed contracts */}
        <Section title={`Upcoming bookings (${upcomingContracts.length})`}>
          {upcomingContracts.length === 0 ? (
            <Empty text="No signed bookings on the books yet." />
          ) : (
            <div className="space-y-2">
              {upcomingContracts
                .sort((a, b) => new Date(a.eventStart).getTime() - new Date(b.eventStart).getTime())
                .map((c) => (
                  <ContractRow key={c.id} c={c} showPosLink />
                ))}
            </div>
          )}
        </Section>

        {/* My venues */}
        <Section title={`My venues (${(myVenues ?? []).length})`}>
          {(myVenues ?? []).length === 0 ? (
            <Empty text={<>You haven&apos;t listed any venues yet. <Link href="/venues/create" className="text-red-400 hover:underline">List one →</Link></>} />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(myVenues ?? []).map((v) => (
                <Link
                  key={v.id}
                  href={`/venues/${v.id}`}
                  className="block rounded-xl border border-white/10 bg-[#15151f] p-4 hover:border-red-600/40 transition"
                >
                  <p className="font-semibold">{v.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{[v.city, v.state].filter(Boolean).join(', ') || '—'}</p>
                  <p className="text-[11px] text-gray-500 mt-2">Cap: {v.capacity?.toLocaleString() ?? '—'}</p>
                </Link>
              ))}
            </div>
          )}
        </Section>

        {/* Open slots */}
        <Section title={`Open slots (${openSlots.length})`}>
          {openSlots.length === 0 ? (
            <Empty text={<>No open slots. <Link href="/venues/post-slot" className="text-red-400 hover:underline">Post one →</Link></>} />
          ) : (
            <div className="space-y-2">
              {openSlots
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((s) => (
                  <div key={s.id} className="rounded-xl border border-white/10 bg-[#15151f] p-3 flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{s.venueName ?? '—'}: {s.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatEventTime(s.startTime, s.endTime)}</p>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="rounded-full bg-red-600/20 px-2 py-0.5 text-[10px] uppercase text-red-400">{s.slotType.replace('_', ' ')}</span>
                        {s.compensationCents != null && (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-gray-300">{fmt(s.compensationCents)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Section>

        {/* Past bookings */}
        <Section title={`Past bookings (${pastContracts.length})`}>
          {pastContracts.length === 0 ? (
            <Empty text="No completed bookings yet." />
          ) : (
            <div className="space-y-2">
              {pastContracts.slice(0, 20).map((c) => (
                <ContractRow key={c.id} c={c} />
              ))}
              {pastContracts.length > 20 && (
                <p className="text-xs text-gray-500 text-center mt-4">Showing 20 most recent of {pastContracts.length}</p>
              )}
            </div>
          )}
        </Section>

        {summaryLoading && <p className="text-center text-gray-500 text-sm py-8">Loading…</p>}
      </div>
    </div>
  );
}

type ContractListItem = {
  id: string;
  status: string;
  eventStart: Date | string;
  eventEnd: Date | string;
  creatorFeeCents: number | null;
  concessionSplitBp: number | null;
  venueName: string | null;
  venueCity: string | null;
};

function ContractRow({ c, showPosLink }: { c: ContractListItem; showPosLink?: boolean }) {
  return (
    <Link
      href={`/booking/contract/${c.id}`}
      className="block rounded-xl border border-white/10 bg-[#15151f] p-4 hover:border-red-600/40 transition"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-semibold">{c.venueName ?? 'Venue'}{c.venueCity ? ` · ${c.venueCity}` : ''}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatEventTime(c.eventStart, c.eventEnd)}</p>
        </div>
        <div className="flex items-center gap-2">
          {c.creatorFeeCents != null && (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-gray-300">{fmt(c.creatorFeeCents)}</span>
          )}
          {c.concessionSplitBp != null && c.concessionSplitBp > 0 && (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-gray-300">{c.concessionSplitBp / 100}% F&B</span>
          )}
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPillClass(c.status)}`}>{c.status}</span>
          {showPosLink && (
            <span className="text-xs text-red-400">POS →</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function StatCard({ label, value, icon, sub }: { label: string; value: string | number; icon?: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-4">
      {icon && <span className="text-lg">{icon}</span>}
      <p className="text-xl font-bold mt-1.5">{value}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{label}{sub ? ` · ${sub}` : ''}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#15151f] p-6 text-center text-sm text-gray-500">
      {text}
    </div>
  );
}
