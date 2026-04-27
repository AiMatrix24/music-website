'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useToast } from '@/app/components/Toast';

/**
 * Admin verification review queue. Lists pending applications oldest-first
 * (FIFO). Admin opens an application card to see full details + ID photo,
 * then approves with a public note OR rejects with a reason.
 *
 * Access guard is the `adminProcedure` upstream — non-admins get a 401 from
 * the tRPC procedure. Page also short-circuits client-side to avoid render
 * if session.user.role isn't admin.
 */
export default function AdminVerifiedQueue() {
  const { data: session, status } = useSession();
  const enabled = status === 'authenticated';

  const queueQuery = trpc.verification.adminQueue.useQuery(undefined, { enabled });

  if (!enabled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-gray-400">Sign in as an admin.</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Sign In</Link>
      </div>
    );
  }

  const isAdmin = (session?.user as { role?: string })?.role === 'admin';
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-5xl mb-2">🛑</p>
        <h1 className="text-2xl font-bold">Admin only</h1>
        <p className="text-gray-400">This page is restricted.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-red-400 transition">← Admin</Link>
          <h1 className="text-3xl font-bold mt-2">Verification Queue</h1>
          <p className="text-sm text-gray-400 mt-1">
            Pending applications, oldest first. Click to review.
          </p>
        </div>

        {queueQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-[#15151f] animate-pulse" />
            ))}
          </div>
        ) : !queueQuery.data || queueQuery.data.length === 0 ? (
          <div className="rounded-2xl bg-[#15151f] p-16 text-center">
            <p className="text-5xl mb-4">✓</p>
            <h2 className="text-xl font-bold mb-2">Queue empty</h2>
            <p className="text-gray-400">No pending applications.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {queueQuery.data.map((row) => (
              <ApplicationCard key={row.application.id} row={row} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface QueueRow {
  application: {
    id: string;
    userId: string;
    legalName: string;
    stageName: string | null;
    country: string;
    portfolioUrl: string;
    pitch: string;
    idImageKey: string | null;
    submittedAt: Date | string;
  };
  userName: string | null;
  userEmail: string | null;
  userAvatar: string | null;
}

function ApplicationCard({ row }: { row: QueueRow }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  const decideMutation = trpc.verification.adminDecide.useMutation({
    onSuccess: (_, vars) => {
      toast(`Application ${vars.decision}`);
      setOpen(false);
      setReason('');
      utils.verification.adminQueue.invalidate();
    },
    onError: (e) => toast(e.message),
  });

  const handleDecide = (decision: 'approved' | 'rejected') => {
    if (!reason.trim()) {
      toast('Add a note explaining your decision (visible to the applicant).');
      return;
    }
    if (
      !confirm(
        decision === 'approved'
          ? `Approve "${row.application.legalName}"? They'll get the verified badge immediately.`
          : `Reject "${row.application.legalName}"? They'll see the reason and can resubmit.`
      )
    )
      return;
    decideMutation.mutate({ id: row.application.id, decision, reason: reason.trim() });
  };

  return (
    <li className="rounded-2xl bg-[#15151f] border border-brand-800/20 overflow-hidden">
      {/* Summary row */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-[#1a1a2e] transition"
      >
        {row.userAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.userAvatar} alt="" className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-base font-black">
            {(row.userName ?? row.application.legalName).charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">
            {row.application.legalName}
            {row.application.stageName && (
              <span className="text-gray-500 font-normal"> ({row.application.stageName})</span>
            )}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {row.userEmail ?? '—'} · {row.application.country} · submitted {new Date(row.application.submittedAt).toLocaleDateString()}
          </p>
        </div>
        <span className="text-xs text-gray-500 shrink-0">{open ? '▴' : '▾'}</span>
      </button>

      {/* Expanded review form */}
      {open && (
        <div className="border-t border-brand-800/20 p-5 space-y-4 bg-[#0f0f17]">
          <Detail label="Portfolio">
            <a href={row.application.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline break-all">
              {row.application.portfolioUrl}
            </a>
          </Detail>

          <Detail label="Why they should be verified">
            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{row.application.pitch}</p>
          </Detail>

          {row.application.idImageKey && (
            <Detail label="Government ID">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={row.application.idImageKey}
                alt="Government ID"
                className="max-w-md rounded-lg border border-brand-800/30"
              />
              <p className="text-xs text-gray-500 mt-2">Auto-deleted 30 days after a decision is recorded.</p>
            </Detail>
          )}

          <Detail label="Applicant profile">
            <Link
              href={`/artist/${row.application.userId}`}
              target="_blank"
              className="text-sm text-red-400 hover:text-red-300 underline"
            >
              View public profile →
            </Link>
          </Detail>

          <div className="pt-3 border-t border-brand-800/20">
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
              Decision note <span className="text-gray-600 font-normal normal-case">— shown to the applicant</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="E.g., 'Verified — your Bandcamp confirms identity.' or 'Need clearer ID photo + portfolio link.'"
              className="w-full bg-[#0f0f17] border border-brand-800/30 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none resize-none"
            />
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => handleDecide('approved')}
                disabled={decideMutation.isPending}
                className="flex-1 rounded-full bg-green-600 hover:bg-green-500 px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => handleDecide('rejected')}
                disabled={decideMutation.isPending}
                className="flex-1 rounded-full bg-red-600 hover:bg-red-500 px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      {children}
    </div>
  );
}
