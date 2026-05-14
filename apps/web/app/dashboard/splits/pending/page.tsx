'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

/**
 * Collaborator's pending-splits inbox. One card per pending invitation;
 * Accept / Reject buttons inline. Rejected splits drop out of this view.
 */
export default function PendingSplitsPage() {
  const { status: authStatus } = useSession();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const all = trpc.splits.listMine.useQuery(undefined, { enabled: authStatus === 'authenticated' });
  const pending = all.data?.filter((r) => r.status === 'pending') ?? [];

  const accept = trpc.splits.accept.useMutation({
    onSuccess: () => {
      toast('Split accepted', 'success');
      utils.splits.listMine.invalidate();
    },
    onError: (err) => toast(err.message || 'Accept failed', 'error'),
  });

  const reject = trpc.splits.reject.useMutation({
    onSuccess: () => {
      toast('Split rejected', 'success');
      utils.splits.listMine.invalidate();
    },
    onError: (err) => toast(err.message || 'Reject failed', 'error'),
  });

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  if (authStatus === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;
  }

  if (authStatus !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Sign in to see split invitations</p>
        <Link href="/auth/login" className="text-red-400 hover:text-red-300 transition">Sign In →</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Pending split invitations</h1>
          <Link href="/dashboard/splits/mine" className="text-sm text-red-400 hover:text-red-300 transition">My splits →</Link>
        </div>

        {all.isLoading ? (
          <div className="rounded-2xl bg-[#15151f] p-8 text-center text-gray-500">Loading…</div>
        ) : pending.length === 0 ? (
          <div className="rounded-2xl bg-[#15151f] p-12 text-center">
            <p className="text-4xl mb-3">📬</p>
            <p className="text-gray-400 mb-2">No pending invitations.</p>
            <p className="text-xs text-gray-500">When a creator invites you to a royalty split, it'll show up here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((row) => (
              <div key={row.id} className="rounded-2xl bg-[#15151f] p-5 border border-yellow-700/30">
                <div className="flex items-start gap-4">
                  {row.trackCoverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.trackCoverUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center text-2xl shrink-0">♪</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link href={`/track/${row.trackId}`} className="font-bold hover:text-red-400 transition">{row.trackTitle}</Link>
                    <p className="text-xs text-gray-500 mt-1">
                      Invited by {row.ownerName ?? 'the track owner'} · {new Date(row.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[10px] uppercase tracking-wide bg-brand-950 text-gray-400 px-2 py-0.5 rounded-full">
                        {row.splitType} · {row.role.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide bg-yellow-950/40 text-yellow-400 px-2 py-0.5 rounded-full font-bold">
                        {(row.percentBp / 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {rejectingId === row.id ? (
                  <div className="mt-4 space-y-3">
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason (optional, shown to the track owner)"
                      rows={2}
                      maxLength={500}
                      className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { reject.mutate({ splitId: row.id, reason: rejectReason.trim() || undefined }); setRejectingId(null); setRejectReason(''); }}
                        disabled={reject.isPending}
                        className="px-4 py-1.5 rounded-full text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition disabled:opacity-50"
                      >
                        Confirm reject
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason(''); }}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold text-gray-400 hover:text-white transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => accept.mutate({ splitId: row.id })}
                      disabled={accept.isPending}
                      className="px-4 py-1.5 rounded-full text-xs font-bold bg-green-600 hover:bg-green-500 text-white transition disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => setRejectingId(row.id)}
                      className="px-4 py-1.5 rounded-full text-xs font-semibold bg-brand-950 hover:bg-brand-900 border border-brand-800/40 text-gray-300 transition"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
