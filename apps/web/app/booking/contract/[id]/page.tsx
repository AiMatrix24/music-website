'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';
import { trpc } from '@/lib/trpc/client';

type PaymentTerms = 'upfront' | 'at_event' | 'after_event' | 'door_split_only';

const PAYMENT_LABELS: Record<PaymentTerms, string> = {
  upfront: 'Paid upfront',
  at_event: 'Paid at event',
  after_event: 'Paid after event (~7 days)',
  door_split_only: 'No flat fee — door split only',
};

function toLocalInput(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = new Date(d);
  // Local-time YYYY-MM-DDTHH:mm for datetime-local input
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { status: sessionStatus, data: session } = useSession();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.bookings.getContract.useQuery({ id }, { enabled: !!id && sessionStatus === 'authenticated' });
  const c = data?.contract;
  const userId = session?.user?.id;
  const isVenueOwner = !!c && !!userId && c.venueOwnerUserId === userId;
  const isCreator = !!c && !!userId && c.creatorUserId === userId;
  const isDraft = c?.status === 'draft';
  const canEdit = isDraft && (isVenueOwner || isCreator);

  // Editable state
  const [form, setForm] = useState({
    eventStart: '',
    eventEnd: '',
    creatorFeeDollars: '',
    ticketSplitPct: '',
    concessionSplitPct: '',
    paymentTerms: 'at_event' as PaymentTerms,
    setLengthMinutes: '',
    soundcheckAt: '',
    riderText: '',
    cancellationPolicy: '',
  });

  useEffect(() => {
    if (!c) return;
    setForm({
      eventStart: toLocalInput(c.eventStart),
      eventEnd: toLocalInput(c.eventEnd),
      creatorFeeDollars: c.creatorFeeCents != null ? (c.creatorFeeCents / 100).toFixed(2) : '',
      ticketSplitPct: c.ticketSplitBp != null ? (c.ticketSplitBp / 100).toString() : '',
      concessionSplitPct: c.concessionSplitBp != null ? (c.concessionSplitBp / 100).toString() : '',
      paymentTerms: c.paymentTerms,
      setLengthMinutes: c.setLengthMinutes != null ? String(c.setLengthMinutes) : '',
      soundcheckAt: toLocalInput(c.soundcheckAt),
      riderText: c.riderText ?? '',
      cancellationPolicy: c.cancellationPolicy ?? '',
    });
  }, [c]);

  const amend = trpc.bookings.amendContract.useMutation({
    onSuccess: () => {
      toast('Saved. Both signatures reset — both parties need to re-sign.', 'success');
      void utils.bookings.getContract.invalidate({ id });
      void utils.bookings.myContracts.invalidate();
    },
    onError: (err) => toast(err.message || 'Save failed', 'error'),
  });
  const sign = trpc.bookings.signContract.useMutation({
    onSuccess: () => {
      toast('Signed.', 'success');
      void utils.bookings.getContract.invalidate({ id });
      void utils.bookings.myContracts.invalidate();
    },
    onError: (err) => toast(err.message || 'Sign failed', 'error'),
  });
  const complete = trpc.bookings.completeContract.useMutation({
    onSuccess: () => {
      toast('Contract marked complete.', 'success');
      void utils.bookings.getContract.invalidate({ id });
    },
    onError: (err) => toast(err.message || 'Complete failed', 'error'),
  });
  const cancel = trpc.bookings.cancelContract.useMutation({
    onSuccess: () => {
      toast('Contract cancelled.', 'info');
      void utils.bookings.getContract.invalidate({ id });
      void utils.bookings.myContracts.invalidate();
    },
    onError: (err) => toast(err.message || 'Cancel failed', 'error'),
  });

  if (sessionStatus !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-brand-950 text-white text-center">
        <h1 className="text-2xl font-bold">Sign in to view contracts</h1>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">Sign In</Link>
      </div>
    );
  }
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;
  if (!c) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-brand-950 text-white text-center">
      <h1 className="text-2xl font-bold">Contract not found</h1>
      <Link href="/booking" className="text-red-400 hover:underline">Back to bookings</Link>
    </div>
  );

  const handleSave = () => {
    amend.mutate({
      id,
      eventStart: form.eventStart ? new Date(form.eventStart).toISOString() : undefined,
      eventEnd: form.eventEnd ? new Date(form.eventEnd).toISOString() : undefined,
      creatorFeeCents: form.creatorFeeDollars === '' ? null : Math.round(Number(form.creatorFeeDollars) * 100),
      ticketSplitBp: form.ticketSplitPct === '' ? null : Math.round(Number(form.ticketSplitPct) * 100),
      concessionSplitBp: form.concessionSplitPct === '' ? null : Math.round(Number(form.concessionSplitPct) * 100),
      paymentTerms: form.paymentTerms,
      setLengthMinutes: form.setLengthMinutes === '' ? null : Number(form.setLengthMinutes),
      soundcheckAt: form.soundcheckAt ? new Date(form.soundcheckAt).toISOString() : null,
      riderText: form.riderText || null,
      cancellationPolicy: form.cancellationPolicy || null,
    });
  };

  const youSigned = (isVenueOwner && c.venueSignedAt) || (isCreator && c.creatorSignedAt);
  const otherSigned = (isVenueOwner && c.creatorSignedAt) || (isCreator && c.venueSignedAt);

  return (
    <div className="min-h-screen bg-brand-950 text-white py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/booking" className="text-sm text-gray-400 hover:text-white transition mb-4 inline-block">← Bookings</Link>

        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Booking Contract</p>
            <h1 className="text-3xl font-bold mt-1">{data.venue?.name ?? 'Venue'}</h1>
            <p className="text-gray-400 mt-1">{data.venue?.city}{data.venue?.state ? `, ${data.venue.state}` : ''}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${c.status === 'draft' ? 'bg-blue-600/20 text-blue-400' : c.status === 'signed' ? 'bg-green-600/20 text-green-400' : c.status === 'completed' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
            {c.status}
          </span>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl border border-white/10 bg-[#15151f] p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Venue</p>
            <p className="mt-1 font-semibold">{data.venueOwner?.name ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-1">{c.venueSignedAt ? `Signed ${new Date(c.venueSignedAt).toLocaleDateString()}` : 'Not signed'}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#15151f] p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Creator</p>
            <p className="mt-1 font-semibold">{data.creator?.name ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-1">{c.creatorSignedAt ? `Signed ${new Date(c.creatorSignedAt).toLocaleDateString()}` : 'Not signed'}</p>
          </div>
        </div>

        {/* Terms */}
        <div className="rounded-xl border border-white/10 bg-[#15151f] p-6 mb-6 space-y-5">
          <h2 className="text-lg font-bold">Terms</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Event Start</label>
              <input
                type="datetime-local"
                disabled={!canEdit}
                value={form.eventStart}
                onChange={(e) => setForm({ ...form, eventStart: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-brand-950 px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Event End</label>
              <input
                type="datetime-local"
                disabled={!canEdit}
                value={form.eventEnd}
                onChange={(e) => setForm({ ...form, eventEnd: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-brand-950 px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Creator Fee ($)</label>
              <input
                type="number"
                step="0.01"
                disabled={!canEdit}
                value={form.creatorFeeDollars}
                onChange={(e) => setForm({ ...form, creatorFeeDollars: e.target.value })}
                placeholder="(none)"
                className="w-full rounded-lg border border-white/10 bg-brand-950 px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Payment Terms</label>
              <select
                disabled={!canEdit}
                value={form.paymentTerms}
                onChange={(e) => setForm({ ...form, paymentTerms: e.target.value as PaymentTerms })}
                className="w-full rounded-lg border border-white/10 bg-brand-950 px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none disabled:opacity-60"
              >
                {(Object.keys(PAYMENT_LABELS) as PaymentTerms[]).map((k) => (
                  <option key={k} value={k}>{PAYMENT_LABELS[k]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Ticket Revenue to Creator (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                disabled={!canEdit}
                value={form.ticketSplitPct}
                onChange={(e) => setForm({ ...form, ticketSplitPct: e.target.value })}
                placeholder="0"
                className="w-full rounded-lg border border-white/10 bg-brand-950 px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none disabled:opacity-60"
              />
              <p className="text-[10px] text-gray-500 mt-1">Creator&apos;s share of ticket sales. Venue gets the rest.</p>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Concession Revenue to Creator (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                disabled={!canEdit}
                value={form.concessionSplitPct}
                onChange={(e) => setForm({ ...form, concessionSplitPct: e.target.value })}
                placeholder="0"
                className="w-full rounded-lg border border-white/10 bg-brand-950 px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none disabled:opacity-60"
              />
              <p className="text-[10px] text-gray-500 mt-1">Creator&apos;s share of F&B during the event.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Set Length (minutes)</label>
              <input
                type="number"
                min="0"
                disabled={!canEdit}
                value={form.setLengthMinutes}
                onChange={(e) => setForm({ ...form, setLengthMinutes: e.target.value })}
                placeholder="(optional)"
                className="w-full rounded-lg border border-white/10 bg-brand-950 px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Soundcheck</label>
              <input
                type="datetime-local"
                disabled={!canEdit}
                value={form.soundcheckAt}
                onChange={(e) => setForm({ ...form, soundcheckAt: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-brand-950 px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Rider / Production Notes</label>
            <textarea
              rows={3}
              disabled={!canEdit}
              value={form.riderText}
              onChange={(e) => setForm({ ...form, riderText: e.target.value })}
              placeholder="Equipment, hospitality, anything the venue is providing or that the creator needs."
              className="w-full rounded-lg border border-white/10 bg-brand-950 px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Cancellation Policy</label>
            <textarea
              rows={2}
              disabled={!canEdit}
              value={form.cancellationPolicy}
              onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })}
              placeholder="e.g. Free cancellation up to 14 days before. 50% of fee owed if cancelled within 14 days."
              className="w-full rounded-lg border border-white/10 bg-brand-950 px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none disabled:opacity-60"
            />
          </div>

          {canEdit && (
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={amend.isPending}
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500 transition disabled:opacity-50"
              >
                {amend.isPending ? 'Saving…' : 'Save changes (resets signatures)'}
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="rounded-xl border border-white/10 bg-[#15151f] p-6 space-y-3">
          {c.status === 'draft' && (
            <>
              <p className="text-sm text-gray-400">
                {!youSigned && !otherSigned && 'Neither party has signed yet.'}
                {!youSigned && otherSigned && 'The other party has signed. Sign to activate the contract.'}
                {youSigned && !otherSigned && 'You\'ve signed. Waiting on the other party.'}
              </p>
              <div className="flex gap-2 flex-wrap">
                {!youSigned && (
                  <button
                    onClick={() => sign.mutate({ id })}
                    disabled={sign.isPending}
                    className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-500 transition disabled:opacity-50"
                  >
                    {sign.isPending ? 'Signing…' : 'Sign Contract'}
                  </button>
                )}
                <button
                  onClick={() => {
                    const reason = prompt('Cancellation reason (optional)') ?? undefined;
                    cancel.mutate({ id, reason: reason || undefined });
                  }}
                  disabled={cancel.isPending}
                  className="rounded-full border border-red-600/40 px-5 py-2 text-sm font-semibold text-red-400 hover:bg-red-600/10 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {c.status === 'signed' && (
            <>
              <p className="text-sm text-gray-400">Both parties signed. Event is on the books.</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => complete.mutate({ id })}
                  disabled={complete.isPending}
                  className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-500 transition disabled:opacity-50"
                >
                  {complete.isPending ? 'Marking…' : 'Mark Event Complete'}
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Cancellation reason') ?? undefined;
                    cancel.mutate({ id, reason: reason || undefined });
                  }}
                  disabled={cancel.isPending}
                  className="rounded-full border border-red-600/40 px-5 py-2 text-sm font-semibold text-red-400 hover:bg-red-600/10 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {c.status === 'completed' && (
            <p className="text-sm text-green-400">Event complete{c.completedAt ? ` (${new Date(c.completedAt).toLocaleDateString()})` : ''}.</p>
          )}

          {c.status === 'cancelled' && (
            <p className="text-sm text-red-400">Cancelled{c.cancellationReason ? `: ${c.cancellationReason}` : '.'}</p>
          )}
        </div>

        <div className="h-16" />
      </div>
    </div>
  );
}
