'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

/**
 * Owner-facing splits manager for a single track. Shows both master and
 * publishing split tables side-by-side, with invite/revoke controls.
 *
 * Owner row is system-managed — percent auto-decreases when a
 * collaborator is invited, auto-increases when one is rejected/revoked.
 * Owner can't be revoked.
 *
 * Note: splits are recorded but NOT yet routed through payouts (that's
 * Commit B). The header banner makes this explicit so creators don't
 * expect splits to affect their next tip-share.
 */
export default function TrackSplitsPage() {
  const { trackId } = useParams<{ trackId: string }>();
  const { data: session, status: authStatus } = useSession();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data, isLoading, error } = trpc.splits.list.useQuery({ trackId }, { enabled: !!trackId });
  const isOwner = !!data && data.track.userId === session?.user?.id;

  const [activeTab, setActiveTab] = useState<'master' | 'publishing'>('master');

  if (authStatus !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Sign in to manage splits</p>
        <Link href="/auth/login" className="text-red-400 hover:text-red-300 transition">Sign In →</Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Track not found or you don't have access</p>
        <Link href="/dashboard" className="text-red-400 hover:text-red-300 transition">← Back to Dashboard</Link>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/dashboard/splits/mine" className="text-sm text-gray-400 hover:text-white transition mb-6 inline-block">← My splits</Link>
          <h1 className="text-2xl font-bold mb-2">Splits for "{data.track.title}"</h1>
          <p className="text-sm text-gray-500 mb-6">You're a collaborator on this track but not the owner. Manage your acceptance status from <Link href="/dashboard/splits/mine" className="text-red-400 hover:underline">My splits</Link>.</p>
          <SplitTable splitType="master" rows={data.master} hasSplits={data.masterHasSplits} viewerIsOwner={false} />
          <SplitTable splitType="publishing" rows={data.publishing} hasSplits={data.publishingHasSplits} viewerIsOwner={false} />
        </div>
      </div>
    );
  }

  const visibleRows = activeTab === 'master' ? data.master : data.publishing;
  const hasSplits = activeTab === 'master' ? data.masterHasSplits : data.publishingHasSplits;

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href={`/dashboard/track/${trackId}/edit`} className="text-sm text-gray-400 hover:text-white transition mb-6 inline-block">← Back to track</Link>
        <h1 className="text-2xl font-bold mb-1">Royalty splits</h1>
        <p className="text-sm text-gray-400 mb-2">{data.track.title}</p>

        <div className="rounded-2xl bg-yellow-950/20 border border-yellow-700/30 p-4 mb-6 text-sm">
          <p className="font-bold text-yellow-400 mb-1">Splits aren't paying out yet</p>
          <p className="text-xs text-yellow-200/80">
            You can configure splits now and they'll be saved + audited. Money routing follows the splits in a separate release (coming soon). Until then you'll receive 100% of payouts on this track regardless of what's configured here.
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          {(['master', 'publishing'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition ${
                activeTab === t ? 'bg-red-600 text-white' : 'bg-brand-950 text-gray-400 hover:text-white border border-brand-800/40'
              }`}
            >
              {t} split
            </button>
          ))}
        </div>

        <SplitTable splitType={activeTab} rows={visibleRows} hasSplits={hasSplits} viewerIsOwner={true} />
        <InviteForm
          trackId={trackId}
          splitType={activeTab}
          existingRows={visibleRows}
          onDone={() => utils.splits.list.invalidate({ trackId })}
        />
      </div>
    </div>
  );

  function SplitTable({
    splitType,
    rows,
    hasSplits,
    viewerIsOwner,
  }: {
    splitType: 'master' | 'publishing';
    rows: NonNullable<typeof data>['master'];
    hasSplits: boolean;
    viewerIsOwner: boolean;
  }) {
    const revoke = trpc.splits.revoke.useMutation({
      onSuccess: () => {
        toast('Split revoked', 'success');
        utils.splits.list.invalidate({ trackId });
      },
      onError: (err) => toast(err.message || 'Revoke failed', 'error'),
    });

    if (!hasSplits) {
      return (
        <div className="rounded-2xl bg-[#15151f] p-6 mb-6">
          <p className="text-sm text-gray-300">
            <span className="font-bold capitalize">{splitType}</span> split: 100% to you. Invite a collaborator below to start splitting this revenue stream.
          </p>
        </div>
      );
    }

    const sortedRows = [...rows].sort((a, b) => {
      // Owner row first, then by status (accepted before pending), then by createdAt
      if (a.role === 'owner') return -1;
      if (b.role === 'owner') return 1;
      const statusOrder = { accepted: 0, pending: 1, rejected: 2, revoked: 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    });

    return (
      <div className="rounded-2xl bg-[#15151f] p-6 mb-6">
        <h2 className="text-lg font-bold mb-1 capitalize">{splitType} split</h2>
        <p className="text-xs text-gray-500 mb-4">
          {splitType === 'master'
            ? 'Sound-recording revenue: tips, purchases, streaming master royalties.'
            : 'Composition revenue: mechanical royalties (MLC), performance royalties (PROs).'}
        </p>
        <div className="space-y-2">
          {sortedRows.map((row) => (
            <div key={row.id} className="flex items-center gap-3 rounded-xl bg-brand-950/40 p-3">
              {row.collaboratorAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.collaboratorAvatar} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-brand-700 flex items-center justify-center text-xs font-bold">
                  {row.collaboratorName?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{row.collaboratorName ?? 'Unknown'}</p>
                <p className="text-xs text-gray-500 capitalize">{row.role.replace('_', ' ')}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{(row.percentBp / 100).toFixed(2)}%</p>
                <StatusBadge status={row.status} />
              </div>
              {viewerIsOwner && row.role !== 'owner' && row.status !== 'rejected' && row.status !== 'revoked' && (
                <button
                  onClick={() => {
                    if (confirm(`Revoke ${row.collaboratorName ?? 'this collaborator'}'s ${(row.percentBp / 100).toFixed(2)}% ${splitType} split?`)) {
                      revoke.mutate({ splitId: row.id });
                    }
                  }}
                  disabled={revoke.isPending}
                  className="text-xs text-gray-500 hover:text-red-400 transition disabled:opacity-50 px-2"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
}

function StatusBadge({ status }: { status: 'pending' | 'accepted' | 'rejected' | 'revoked' }) {
  const colors = {
    pending: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    accepted: 'bg-green-600/20 text-green-400 border-green-600/30',
    rejected: 'bg-red-600/20 text-red-400 border-red-600/30',
    revoked: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${colors[status]}`}>
      {status}
    </span>
  );
}

function InviteForm({
  trackId,
  splitType,
  existingRows,
  onDone,
}: {
  trackId: string;
  splitType: 'master' | 'publishing';
  existingRows: { collaboratorUserId: string; status: string; percentBp: number; role: string }[];
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [collab, setCollab] = useState<{ id: string; name: string } | null>(null);
  const [role, setRole] = useState<'co_writer' | 'producer' | 'featured_artist' | 'mixer' | 'publisher' | 'other'>('co_writer');
  const [percent, setPercent] = useState('');

  const searchResults = trpc.users.searchUsers.useQuery(
    { query: query.trim(), limit: 8 },
    { enabled: query.trim().length >= 2 && !collab }
  );

  const invite = trpc.splits.invite.useMutation({
    onSuccess: () => {
      toast('Invitation sent', 'success');
      setQuery('');
      setCollab(null);
      setPercent('');
      onDone();
    },
    onError: (err) => toast(err.message || 'Invite failed', 'error'),
  });

  // Compute available bp: 10000 minus owner's bp (i.e., what's reserved by other non-terminal splits)
  const ownerRow = existingRows.find((r) => r.role === 'owner');
  const ownerBp = ownerRow?.percentBp ?? 10000;
  const availableBp = ownerBp - 1; // owner must keep at least 1 bp

  const handleInvite = () => {
    if (!collab) {
      toast('Pick a collaborator first', 'error');
      return;
    }
    const pct = parseFloat(percent);
    if (!isFinite(pct) || pct <= 0 || pct > availableBp / 100) {
      toast(`Percent must be between 0 and ${(availableBp / 100).toFixed(2)}%`, 'error');
      return;
    }
    const percentBp = Math.round(pct * 100);
    invite.mutate({
      trackId,
      splitType,
      collaboratorUserId: collab.id,
      role,
      percentBp,
    });
  };

  return (
    <div className="rounded-2xl bg-[#15151f] border border-brand-800/30 p-6">
      <h2 className="text-lg font-bold mb-1">Invite a collaborator</h2>
      <p className="text-xs text-gray-500 mb-4">
        Up to <span className="font-bold text-gray-300">{(availableBp / 100).toFixed(2)}%</span> available on this {splitType} split. Your share auto-adjusts.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Collaborator</label>
          {collab ? (
            <div className="flex items-center justify-between rounded-lg bg-brand-950 border border-brand-800/30 px-3 py-2">
              <span className="text-sm">{collab.name}</span>
              <button onClick={() => setCollab(null)} className="text-xs text-gray-500 hover:text-red-400">Change</button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search creators by name or email…"
                className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-red-600 outline-none"
              />
              {searchResults.data && searchResults.data.length > 0 && (
                <div className="mt-2 rounded-lg bg-brand-950/60 border border-brand-800/30 max-h-48 overflow-y-auto">
                  {searchResults.data
                    .filter((u) => !existingRows.some((r) => r.collaboratorUserId === u.id && (r.status === 'pending' || r.status === 'accepted')))
                    .map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { setCollab({ id: u.id, name: u.name ?? u.email ?? 'Unknown' }); setQuery(''); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-brand-900/50 transition border-b border-brand-800/20 last:border-0"
                      >
                        <span className="text-gray-200">{u.name ?? 'Unknown'}</span>
                        {u.email && <span className="text-xs text-gray-500 ml-2">{u.email}</span>}
                      </button>
                    ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white focus:border-red-600 outline-none"
            >
              <option value="co_writer">Co-writer</option>
              <option value="producer">Producer</option>
              <option value="featured_artist">Featured artist</option>
              <option value="mixer">Mixer</option>
              <option value="publisher">Publisher</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Percent (%)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={availableBp / 100}
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              placeholder="e.g. 25"
              className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white focus:border-red-600 outline-none font-mono"
            />
          </div>
        </div>

        <button
          onClick={handleInvite}
          disabled={invite.isPending || !collab || !percent}
          className="w-full rounded-full bg-red-600 hover:bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition disabled:opacity-50"
        >
          {invite.isPending ? 'Inviting…' : 'Send invitation'}
        </button>
      </div>
    </div>
  );
}
