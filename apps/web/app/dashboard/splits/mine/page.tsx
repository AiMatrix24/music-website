'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

/**
 * Collaborator-facing list of all splits where I'm the collaborator,
 * across statuses. Pending splits link to the accept/reject page.
 */
export default function MySplitsPage() {
  const { status: authStatus } = useSession();
  const all = trpc.splits.listMine.useQuery(undefined, { enabled: authStatus === 'authenticated' });

  if (authStatus === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;
  }

  if (authStatus !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Sign in to see your splits</p>
        <Link href="/auth/login" className="text-red-400 hover:text-red-300 transition">Sign In →</Link>
      </div>
    );
  }

  const grouped = {
    pending: all.data?.filter((r) => r.status === 'pending') ?? [],
    accepted: all.data?.filter((r) => r.status === 'accepted') ?? [],
    rejected: all.data?.filter((r) => r.status === 'rejected') ?? [],
    revoked: all.data?.filter((r) => r.status === 'revoked') ?? [],
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">My splits</h1>
          {grouped.pending.length > 0 && (
            <Link href="/dashboard/splits/pending" className="text-sm text-yellow-400 hover:text-yellow-300 transition font-semibold">
              {grouped.pending.length} pending →
            </Link>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Royalty splits where you're listed as a collaborator. Note: revenue routing follows accepted splits but isn't live yet — coming soon.
        </p>

        {all.isLoading ? (
          <div className="rounded-2xl bg-[#15151f] p-8 text-center text-gray-500">Loading…</div>
        ) : (all.data?.length ?? 0) === 0 ? (
          <div className="rounded-2xl bg-[#15151f] p-12 text-center">
            <p className="text-4xl mb-3">🎼</p>
            <p className="text-gray-400 mb-1">No splits yet.</p>
            <p className="text-xs text-gray-500">When a creator credits you on one of their tracks, it'll appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {(['pending', 'accepted', 'rejected', 'revoked'] as const).map((status) =>
              grouped[status].length > 0 ? <SplitGroup key={status} status={status} rows={grouped[status]} /> : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type SplitRow = {
  id: string;
  trackId: string;
  splitType: 'master' | 'publishing';
  role: string;
  percentBp: number;
  status: 'pending' | 'accepted' | 'rejected' | 'revoked';
  createdAt: Date | string;
  acceptedAt: Date | string | null;
  rejectionReason: string | null;
  trackTitle: string;
  trackCoverUrl: string | null;
  ownerName: string | null;
};

function SplitGroup({
  status,
  rows,
}: {
  status: 'pending' | 'accepted' | 'rejected' | 'revoked';
  rows: SplitRow[];
}) {
  const labels = {
    pending: 'Pending your acceptance',
    accepted: 'Active',
    rejected: 'Rejected',
    revoked: 'Revoked by owner',
  };

  return (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">{labels[status]} · {rows.length}</h2>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl bg-[#15151f] p-4 flex items-center gap-4">
            {row.trackCoverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.trackCoverUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center text-xl shrink-0">♪</div>
            )}
            <div className="flex-1 min-w-0">
              <Link href={`/track/${row.trackId}`} className="font-semibold hover:text-red-400 transition truncate block">{row.trackTitle}</Link>
              <p className="text-xs text-gray-500">
                {row.splitType} · {row.role.replace('_', ' ')}
                {row.ownerName && ` · owned by ${row.ownerName}`}
              </p>
              {row.rejectionReason && status !== 'pending' && (
                <p className="text-xs text-gray-600 italic mt-1">"{row.rejectionReason}"</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold">{(row.percentBp / 100).toFixed(2)}%</p>
              {status === 'pending' && (
                <Link href="/dashboard/splits/pending" className="text-[10px] text-yellow-400 hover:text-yellow-300 font-bold uppercase tracking-wider">
                  Review →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
