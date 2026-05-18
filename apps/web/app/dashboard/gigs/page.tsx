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
    case 'withdrawn': return 'bg-gray-600/20 text-gray-400';
    case 'draft': return 'bg-blue-600/20 text-blue-400';
    default: return 'bg-gray-600/20 text-gray-400';
  }
}

export default function GigsDashboardPage() {
  const { status: sessionStatus, data: session } = useSession();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const isAuth = sessionStatus === 'authenticated';

  const { data: summary, isLoading: summaryLoading } = trpc.bookings.dashboardSummary.useQuery(undefined, { enabled: isAuth });
  const { data: applications } = trpc.bookings.myApplications.useQuery(undefined, { enabled: isAuth });
  const { data: contracts } = trpc.bookings.myContracts.useQuery(undefined, { enabled: isAuth });
  const { data: myVenues } = trpc.venues.myVenues.useQuery(undefined, { enabled: isAuth });

  // myContracts returns both venue-side and creator-side rows. Filter to
  // contracts where the user is the booked creator (i.e. venue is NOT theirs).
  const myVenueIds = useMemo(() => new Set((myVenues ?? []).map((v) => v.id)), [myVenues]);
  const asCreatorContracts = useMemo(
    () => (contracts ?? []).filter((c) => !myVenueIds.has(c.venueId) && c.creatorUserId === session?.user?.id),
    [contracts, myVenueIds, session]
  );

  const now = Date.now();
  const pendingApps = (applications ?? []).filter((a) => a.status === 'pending');
  const draftContracts = asCreatorContracts.filter((c) => c.status === 'draft');
  const upcomingContracts = asCreatorContracts.filter(
    (c) => c.status === 'signed' && new Date(c.eventStart).getTime() > now
  );
  const pastContracts = asCreatorContracts
    .filter((c) => c.status === 'completed')
    .sort((a, b) => new Date(b.eventStart).getTime() - new Date(a.eventStart).getTime());
  const decidedApps = (applications ?? []).filter((a) => a.status !== 'pending').slice(0, 20);

  const withdraw = trpc.bookings.withdraw.useMutation({
    onSuccess: () => {
      toast('Application withdrawn.', 'info');
      void utils.bookings.myApplications.invalidate();
      void utils.bookings.dashboardSummary.invalidate();
    },
    onError: (err) => toast(err.message || 'Could not withdraw', 'error'),
  });

  if (!isAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-brand-950 text-white text-center px-4">
        <p className="text-5xl mb-2">🎤</p>
        <p className="text-gray-400">Sign in to view your gigs</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold hover:bg-red-700 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const s = summary?.asCreator;

  return (
    <div className="min-h-screen py-16 px-6 bg-brand-950 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">← Dashboard</Link>
          <h1 className="text-3xl font-bold">My Gigs</h1>
          <p className="text-gray-400 mt-1">Your applications, signed contracts, and earnings from venue bookings.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
          <StatCard label="Pending apps" value={s?.pendingAppCount ?? '—'} icon="📩" />
          <StatCard label="Upcoming gigs" value={s?.upcomingGigCount ?? '—'} icon="🎤" />
          <StatCard label="Past gigs" value={s?.completedGigCount ?? '—'} icon="✅" />
          <StatCard label="Fees earned" value={s ? fmt(s.feesEarnedCents) : '—'} icon="💰" sub="signed + done" />
          <StatCard label="Concession share" value={s ? fmt(s.concessionEarnedCents) : '—'} icon="🍻" sub="from F&B" />
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap gap-3 mb-10">
          <Link href="/venues/discover" className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500 transition">Find venues →</Link>
          <Link href="/booking" className="rounded-full bg-[#15151f] border border-white/10 px-5 py-2 text-sm font-semibold text-white hover:border-red-600/40 transition">All bookings →</Link>
        </div>

        {/* Pending applications */}
        <Section title={`Pending applications (${pendingApps.length})`}>
          {pendingApps.length === 0 ? (
            <Empty text={<>No pending applications. <Link href="/venues/discover" className="text-red-400 hover:underline">Browse venues →</Link></>} />
          ) : (
            <div className="space-y-2">
              {pendingApps.map((a) => (
                <div key={a.id} className="rounded-xl border border-white/10 bg-[#15151f] p-4 flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-semibold">{a.venueName ?? 'Venue'} · {a.slotTitle ?? 'Slot'}</p>
                    {a.slotStartTime && a.slotEndTime && (
                      <p className="text-xs text-gray-400 mt-0.5">{formatEventTime(a.slotStartTime, a.slotEndTime)}</p>
                    )}
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPillClass(a.status)}`}>{a.status}</span>
                      {a.compensationCents != null && (
                        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-gray-300">{fmt(a.compensationCents)}</span>
                      )}
                    </div>
                    {a.message && <p className="mt-2 text-xs text-gray-400">&ldquo;{a.message}&rdquo;</p>}
                  </div>
                  <button
                    onClick={() => withdraw.mutate({ applicationId: a.id })}
                    disabled={withdraw.isPending}
                    className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-gray-300 hover:bg-white/10 transition disabled:opacity-50 shrink-0"
                  >
                    Withdraw
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Drafts needing signature */}
        {draftContracts.length > 0 && (
          <Section title={`Contracts awaiting your signature (${draftContracts.length})`}>
            <div className="space-y-2">
              {draftContracts.map((c) => (
                <ContractRow key={c.id} c={c} accent={c.creatorSignedAt ? null : 'Sign required'} />
              ))}
            </div>
          </Section>
        )}

        {/* Upcoming */}
        <Section title={`Upcoming gigs (${upcomingContracts.length})`}>
          {upcomingContracts.length === 0 ? (
            <Empty text="No signed gigs on the books." />
          ) : (
            <div className="space-y-2">
              {upcomingContracts
                .sort((a, b) => new Date(a.eventStart).getTime() - new Date(b.eventStart).getTime())
                .map((c) => (
                  <ContractRow key={c.id} c={c} />
                ))}
            </div>
          )}
        </Section>

        {/* Past gigs */}
        <Section title={`Past gigs (${pastContracts.length})`}>
          {pastContracts.length === 0 ? (
            <Empty text="No completed gigs yet." />
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

        {/* Recently decided apps (declined, withdrawn, accepted-but-old) */}
        {decidedApps.length > 0 && (
          <Section title="Recent application decisions">
            <div className="space-y-2">
              {decidedApps.map((a) => (
                <div key={a.id} className="rounded-xl border border-white/10 bg-[#15151f] p-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{a.venueName ?? 'Venue'} · {a.slotTitle ?? 'Slot'}</p>
                    {a.decisionMessage && <p className="text-xs text-gray-400 mt-0.5">&ldquo;{a.decisionMessage}&rdquo;</p>}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPillClass(a.status)}`}>{a.status}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

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
  creatorSignedAt?: Date | string | null;
};

function ContractRow({ c, accent }: { c: ContractListItem; accent?: string | null }) {
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
          {accent && <span className="text-xs text-yellow-400">{accent}</span>}
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
