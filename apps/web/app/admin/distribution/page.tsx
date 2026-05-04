'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_review', label: 'In review' },
  { value: 'submitted', label: 'Forwarded' },
  { value: 'live', label: 'Live' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

const TIER_LABELS: Record<string, string> = {
  'major-streaming': 'Major streaming',
  'video-audio-hybrid': 'Video-audio',
  'social-platforms': 'Social',
  'high-fidelity': 'Hi-fi',
  'regional': 'Regional',
};

export default function AdminDistributionPage() {
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const [filter, setFilter] = useState<typeof STATUS_OPTIONS[number]['value'] | 'all'>('pending');
  const queue = trpc.distribution.adminList.useQuery(
    filter === 'all' ? undefined : { status: filter },
    { enabled: status === 'authenticated' && (role === 'admin' || role === 'super_admin') }
  );

  const updateMutation = trpc.distribution.adminUpdate.useMutation({
    onSuccess: () => {
      toast('Updated', 'success');
      utils.distribution.adminList.invalidate();
    },
    onError: (err) => toast(err.message || 'Update failed', 'error'),
  });

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;
  }

  if (status !== 'authenticated' || (role !== 'admin' && role !== 'super_admin')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Admin access required</p>
        <Link href="/" className="text-red-400 hover:text-red-300 transition">← Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition mb-6 inline-block">
          ← Back to Admin
        </Link>
        <h1 className="text-3xl font-bold mb-2">Distribution queue</h1>
        <p className="text-sm text-gray-500 mb-6">
          Submissions from creators awaiting review and forwarding to our distributor.
        </p>

        {/* Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${filter === 'all' ? 'bg-red-600 text-white' : 'bg-brand-950 text-gray-400 hover:text-white border border-brand-800/40'}`}
          >
            All
          </button>
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setFilter(o.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${filter === o.value ? 'bg-red-600 text-white' : 'bg-brand-950 text-gray-400 hover:text-white border border-brand-800/40'}`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {queue.isLoading ? (
          <div className="rounded-2xl bg-[#15151f] p-12 text-center text-gray-500">Loading…</div>
        ) : queue.data && queue.data.length > 0 ? (
          <div className="space-y-4">
            {queue.data.map((s) => (
              <Row
                key={s.id}
                row={s}
                onUpdate={(input) => updateMutation.mutate({ id: s.id, ...input })}
                isPending={updateMutation.isPending && updateMutation.variables?.id === s.id}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#15151f] p-12 text-center text-gray-500">
            Nothing in this queue.
          </div>
        )}
      </div>
    </div>
  );
}

type DistRow = {
  id: string;
  userId: string;
  subjectType: 'track' | 'album';
  subjectId: string;
  status: typeof STATUS_OPTIONS[number]['value'];
  targetTiers: string[];
  releaseDate: Date | string | null;
  copyrightCertified: boolean;
  splitsConfirmed: boolean;
  creatorNotes: string | null;
  adminNotes: string | null;
  aggregatorName: string | null;
  aggregatorRefId: string | null;
  submittedAt: Date | string;
  decidedAt: Date | string | null;
  creatorName: string | null;
  creatorAvatar: string | null;
};

type RowProps = {
  row: DistRow;
  onUpdate: (input: { status?: typeof STATUS_OPTIONS[number]['value']; adminNotes?: string; aggregatorName?: string; aggregatorRefId?: string }) => void;
  isPending: boolean;
};

function Row({ row, onUpdate, isPending }: RowProps) {
  const [open, setOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState(row.adminNotes ?? '');
  const [aggregatorName, setAggregatorName] = useState(row.aggregatorName ?? '');
  const [aggregatorRefId, setAggregatorRefId] = useState(row.aggregatorRefId ?? '');

  const subjectHref = row.subjectType === 'track' ? `/track/${row.subjectId}` : `/album/${row.subjectId}`;

  return (
    <div className="rounded-2xl bg-[#15151f] p-5 border border-brand-800/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {row.creatorAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.creatorAvatar} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-800/40" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center text-sm font-bold">
              {row.creatorName?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold truncate">{row.creatorName ?? 'Unknown creator'}</p>
            <p className="text-xs text-gray-500">
              <Link href={subjectHref} className="text-red-400 hover:underline capitalize">{row.subjectType}</Link>
              {' · '}
              Submitted {new Date(row.submittedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs uppercase tracking-wide text-gray-500">{row.status.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {row.targetTiers.map((tier) => (
          <span key={tier} className="text-[10px] uppercase tracking-wide bg-brand-950 text-gray-400 px-2 py-0.5 rounded-full">
            {TIER_LABELS[tier] ?? tier}
          </span>
        ))}
        {row.releaseDate && (
          <span className="text-[10px] uppercase tracking-wide bg-purple-950/40 text-purple-400 px-2 py-0.5 rounded-full">
            Release: {new Date(row.releaseDate).toLocaleDateString()}
          </span>
        )}
        <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${row.copyrightCertified ? 'bg-green-950/40 text-green-400' : 'bg-red-950/40 text-red-400'}`}>
          {row.copyrightCertified ? '✓ Copyright' : '✗ Copyright'}
        </span>
        <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${row.splitsConfirmed ? 'bg-green-950/40 text-green-400' : 'bg-red-950/40 text-red-400'}`}>
          {row.splitsConfirmed ? '✓ Splits' : '✗ Splits'}
        </span>
      </div>

      {row.creatorNotes && (
        <div className="mt-3 rounded-lg bg-brand-950/60 p-3 text-xs text-gray-300">
          <p className="font-semibold text-gray-500 mb-1">Creator notes:</p>
          {row.creatorNotes}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-3 text-xs text-red-400 hover:text-red-300 font-semibold"
      >
        {open ? '▾ Hide' : '▸ Manage'}
      </button>

      {open && (
        <div className="mt-3 space-y-3 pt-3 border-t border-brand-800/20">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Aggregator name</label>
            <input
              type="text"
              value={aggregatorName}
              onChange={(e) => setAggregatorName(e.target.value)}
              placeholder="Which distributor did you forward to?"
              className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Aggregator reference id</label>
            <input
              type="text"
              value={aggregatorRefId}
              onChange={(e) => setAggregatorRefId(e.target.value)}
              placeholder="ID/URL from the distributor for tracking"
              className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Admin notes (visible to creator)</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
              maxLength={2000}
              placeholder="Reason for rejection, follow-up needed, etc."
              className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none resize-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() =>
                  onUpdate({
                    status: o.value,
                    adminNotes: adminNotes || undefined,
                    aggregatorName: aggregatorName || undefined,
                    aggregatorRefId: aggregatorRefId || undefined,
                  })
                }
                disabled={isPending}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition disabled:opacity-50 ${row.status === o.value ? 'bg-red-600 text-white' : 'bg-brand-950 text-gray-400 hover:text-white border border-brand-800/40'}`}
              >
                {row.status === o.value ? `✓ ${o.label}` : `→ ${o.label}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
