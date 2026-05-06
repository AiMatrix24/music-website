'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
] as const;

type Status = typeof STATUS_OPTIONS[number]['value'];

export default function AdminDmcaPage() {
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const [filter, setFilter] = useState<Status | 'all'>('pending');

  const queue = trpc.dmca.adminList.useQuery(
    filter === 'all' ? undefined : { status: filter },
    { enabled: status === 'authenticated' && (role === 'admin' || role === 'super_admin') }
  );

  const decide = trpc.dmca.adminDecide.useMutation({
    onSuccess: (res) => {
      const parts = ['Decision recorded'];
      if (res.suspended) parts.push(`— user SUSPENDED (3 strikes)`);
      else if (res.newStrikes > 0) parts.push(`— user now at ${res.newStrikes} strike${res.newStrikes === 1 ? '' : 's'}`);
      toast(parts.join(' '), 'success');
      utils.dmca.adminList.invalidate();
    },
    onError: (err) => toast(err.message || 'Decision failed', 'error'),
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
        <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition mb-6 inline-block">← Back to Admin</Link>
        <h1 className="text-3xl font-bold mb-2">DMCA queue</h1>
        <p className="text-sm text-gray-500 mb-6">
          Takedown notices from rights holders. Approve = hide track + bump strike counter; 3 strikes auto-suspends the user.
        </p>

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
            {queue.data.map((row) => (
              <NoticeCard
                key={row.id}
                row={row}
                onDecide={(decision, adminNotes) => decide.mutate({ id: row.id, decision, adminNotes })}
                isDeciding={decide.isPending && decide.variables?.id === row.id}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#15151f] p-12 text-center text-gray-500">Nothing in this queue.</div>
        )}
      </div>
    </div>
  );
}

type Row = {
  id: string;
  trackId: string | null;
  targetUrl: string;
  claimantName: string;
  claimantEmail: string;
  claimantOrganization: string | null;
  infringedWorkTitle: string;
  infringedWorkOwner: string;
  description: string;
  status: Status;
  adminNotes: string | null;
  submittedAt: Date | string;
  decidedAt: Date | string | null;
  trackTitle: string | null;
  trackUserId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerStrikes: number | null;
};

function NoticeCard({
  row,
  onDecide,
  isDeciding,
}: {
  row: Row;
  onDecide: (decision: 'approved' | 'rejected' | 'withdrawn', adminNotes?: string) => void;
  isDeciding: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState(row.adminNotes ?? '');

  return (
    <div className="rounded-2xl bg-[#15151f] p-5 border border-brand-800/20">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate">{row.infringedWorkTitle}</p>
          <p className="text-xs text-gray-500">
            from <span className="text-gray-400">{row.claimantName}</span>
            {row.claimantOrganization && <> ({row.claimantOrganization})</>}
            {' · '}
            {new Date(row.submittedAt).toLocaleDateString()}
          </p>
        </div>
        <span className="shrink-0 text-xs uppercase tracking-wide text-gray-500">{row.status}</span>
      </div>

      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg bg-brand-950/40 p-3">
          <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Target</p>
          <a href={row.targetUrl} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline break-all">
            {row.targetUrl}
          </a>
          {row.trackTitle && (
            <p className="text-gray-400 mt-1">Track: {row.trackTitle}</p>
          )}
          {row.ownerName && (
            <p className="text-gray-500 mt-1">
              Owner: {row.ownerName} ({row.ownerEmail ?? 'no email'})
              {' · '}
              <span className={`font-bold ${(row.ownerStrikes ?? 0) >= 2 ? 'text-red-400' : 'text-yellow-500'}`}>
                {row.ownerStrikes ?? 0} strike{row.ownerStrikes === 1 ? '' : 's'}
              </span>
            </p>
          )}
        </div>
        <div className="rounded-lg bg-brand-950/40 p-3">
          <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Claimant</p>
          <p className="text-gray-300">{row.claimantName}</p>
          <p className="text-gray-500">{row.claimantEmail}</p>
          <p className="text-gray-500 mt-1">Owns: {row.infringedWorkOwner}</p>
        </div>
      </div>

      <button onClick={() => setOpen((v) => !v)} className="mt-3 text-xs text-red-400 hover:text-red-300 font-semibold">
        {open ? '▾ Hide' : '▸ Review + decide'}
      </button>

      {open && (
        <div className="mt-3 space-y-3 pt-3 border-t border-brand-800/20">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{row.description}</p>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-gray-500 mb-1">Admin notes (visible to claimant)</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
              maxLength={2000}
              placeholder="Reasoning, request for more info, etc."
              className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none resize-none"
            />
          </div>

          {row.status === 'pending' ? (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onDecide('approved', adminNotes || undefined)}
                disabled={isDeciding}
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition disabled:opacity-50"
              >
                Approve (hide track + strike)
              </button>
              <button
                onClick={() => onDecide('rejected', adminNotes || undefined)}
                disabled={isDeciding}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-brand-950 hover:bg-brand-900 border border-brand-800/40 text-gray-300 transition disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => onDecide('withdrawn', adminNotes || undefined)}
                disabled={isDeciding}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-brand-950 hover:bg-brand-900 border border-brand-800/40 text-gray-300 transition disabled:opacity-50"
              >
                Mark withdrawn
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Decided{row.decidedAt && <> {new Date(row.decidedAt).toLocaleDateString()}</>} — status: <span className="font-bold text-gray-300">{row.status}</span>
              {row.adminNotes && <> · <span className="text-gray-400">{row.adminNotes}</span></>}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
