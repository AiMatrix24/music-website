'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';
import { trpc } from '@/lib/trpc/client';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-600/20 text-amber-400 border-amber-600/30' },
  processing: { label: 'Processing', className: 'bg-blue-600/20 text-blue-400 border-blue-600/30' },
  paid: { label: 'Paid', className: 'bg-green-600/20 text-green-400 border-green-600/30' },
  rejected: { label: 'Rejected', className: 'bg-red-600/20 text-red-400 border-red-600/30' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-600/20 text-gray-400 border-gray-600/30' },
};

const MIN_PAYOUT_USD = 10;

export default function WithdrawPage() {
  const { status: sessionStatus } = useSession();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: summary, isLoading: summaryLoading } = trpc.payouts.summary.useQuery(
    undefined,
    { enabled: sessionStatus === 'authenticated' }
  );
  const { data: history, isLoading: historyLoading } = trpc.payouts.history.useQuery(
    undefined,
    { enabled: sessionStatus === 'authenticated' }
  );

  const [amount, setAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const requestMutation = trpc.payouts.request.useMutation({
    onSuccess: () => {
      toast('Payout requested — admin notified', 'success');
      setAmount('');
      setShowConfirm(false);
      utils.payouts.summary.invalidate();
      utils.payouts.history.invalidate();
    },
    onError: (err) => {
      toast(err.message || 'Request failed', 'error');
      setShowConfirm(false);
    },
  });

  const cancelMutation = trpc.payouts.cancel.useMutation({
    onSuccess: () => {
      toast('Payout request cancelled', 'success');
      utils.payouts.summary.invalidate();
      utils.payouts.history.invalidate();
    },
    onError: (err) => toast(err.message || 'Cancel failed', 'error'),
  });

  if (sessionStatus !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl mb-2">💰</p>
        <p className="text-gray-400 text-lg">Sign in to access withdrawals</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const lifetimeEarned = summary?.lifetimeEarned ?? 0;
  const totalPaid = summary?.totalPaid ?? 0;
  const inFlight = summary?.inFlight ?? 0;
  const available = summary?.available ?? 0;
  const walletAddress = summary?.walletAddress ?? '';
  const hasWallet = walletAddress.length > 0 && /^0x[a-fA-F0-9]{40}$/.test(walletAddress);

  const requestedAmountCents = Math.round((parseFloat(amount) || 0) * 100);
  const isValidAmount = requestedAmountCents >= MIN_PAYOUT_USD * 100 && requestedAmountCents <= available;

  const handleRequest = () => {
    if (!isValidAmount) return;
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    requestMutation.mutate({ amountCents: requestedAmountCents });
  };

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">← Dashboard</Link>
        <h1 className="text-3xl font-bold mt-2">
          Withdraw <span className="text-red-500">Earnings</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Request payout in USDC on Polygon. Admin processes manually within 3 business days.
        </p>
      </div>

      {summaryLoading ? (
        <div className="rounded-2xl bg-[#15151f] p-12 text-center">
          <div className="animate-pulse text-gray-400">Loading…</div>
        </div>
      ) : (
        <>
          {/* Balance cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <BalanceCard
              label="Available"
              value={`$${(available / 100).toFixed(2)}`}
              accent
            />
            <BalanceCard label="In flight" value={`$${(inFlight / 100).toFixed(2)}`} sub={inFlight > 0 ? 'Awaiting admin' : '—'} />
            <BalanceCard label="Lifetime paid" value={`$${(totalPaid / 100).toFixed(2)}`} />
            <BalanceCard label="Lifetime earned" value={`$${(lifetimeEarned / 100).toFixed(2)}`} />
          </div>

          {/* Wallet warning */}
          {!hasWallet && (
            <div className="rounded-2xl bg-red-950/20 border border-red-800/30 p-5 mb-8">
              <p className="text-sm font-bold text-red-400 mb-1">⚠ No payout wallet set</p>
              <p className="text-xs text-red-200/60 mb-3">
                You need to set a Polygon wallet address before requesting a payout.
                That&apos;s where USDC will be sent.
              </p>
              <Link
                href="/settings"
                className="inline-block rounded-full bg-red-600 hover:bg-red-500 px-5 py-2 text-sm font-semibold text-white transition"
              >
                Set wallet in settings →
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Request form */}
            <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <h2 className="font-bold text-lg mb-4">Request payout</h2>

              {hasWallet && (
                <div className="rounded-xl bg-brand-950/50 border border-brand-800/20 px-4 py-3 mb-4">
                  <p className="text-xs text-gray-500 mb-1">Sending to</p>
                  <p className="text-xs font-mono text-gray-300 break-all">{walletAddress}</p>
                  <Link href="/settings" className="text-xs text-brand-400 hover:text-brand-300 mt-1 inline-block">
                    Change in settings →
                  </Link>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min={MIN_PAYOUT_USD}
                    max={available / 100}
                    step="0.01"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setShowConfirm(false); }}
                    placeholder={`Min $${MIN_PAYOUT_USD.toFixed(2)}`}
                    disabled={!hasWallet || available < MIN_PAYOUT_USD * 100}
                    className="w-full bg-brand-950 border border-brand-800/30 rounded-xl pl-7 pr-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition disabled:opacity-50"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Min ${MIN_PAYOUT_USD.toFixed(2)} · Max ${(available / 100).toFixed(2)} (your available balance)
                </p>
              </div>

              {showConfirm ? (
                <div className="rounded-xl bg-amber-950/20 border border-amber-800/30 p-3 mb-3">
                  <p className="text-xs text-amber-300 font-semibold mb-2">Confirm payout request</p>
                  <p className="text-xs text-amber-200/70 mb-3">
                    Send <span className="font-bold">${(requestedAmountCents / 100).toFixed(2)}</span>{' '}
                    USDC to your wallet. Admin processes manually — typically 1-3 business days.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRequest}
                      disabled={requestMutation.isPending}
                      className="flex-1 rounded-full bg-green-600 hover:bg-green-500 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
                    >
                      {requestMutation.isPending ? 'Submitting…' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 rounded-full border border-brand-800/30 py-2 text-xs font-semibold text-gray-300 hover:text-white transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleRequest}
                  disabled={!isValidAmount || !hasWallet || available < MIN_PAYOUT_USD * 100}
                  className="w-full rounded-full bg-gradient-to-r from-red-600 to-red-500 py-3 font-semibold text-white transition hover:shadow-lg hover:shadow-red-600/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {!hasWallet
                    ? 'Set wallet first'
                    : available < MIN_PAYOUT_USD * 100
                      ? `Need ≥ $${MIN_PAYOUT_USD.toFixed(2)} to request`
                      : 'Request Payout'}
                </button>
              )}
            </div>

            {/* How it works */}
            <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <h2 className="font-bold text-lg mb-4">How payouts work</h2>
              <ol className="space-y-3 text-sm text-gray-400">
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold">1.</span>
                  <span>You set your Polygon wallet address in <Link href="/settings" className="text-brand-400 hover:text-brand-300 underline">settings</Link>.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold">2.</span>
                  <span>Request a payout for any amount up to your available balance (min $10).</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold">3.</span>
                  <span>Admin reviews + sends USDC manually from the OPYNX wallet on Polygon.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold">4.</span>
                  <span>Once paid, the on-chain transaction hash appears below — verifiable on Polygonscan.</span>
                </li>
              </ol>
              <div className="mt-5 pt-4 border-t border-brand-800/20">
                <p className="text-xs text-gray-500">
                  <strong className="text-gray-400">Why manual?</strong> We&apos;re intentionally not auto-disbursing
                  while we&apos;re a small operation — every payout gets a human eyeball. Automated
                  payouts via Stripe Connect or on-chain multisig are on the roadmap.
                </p>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
            <h2 className="font-bold text-lg mb-4">Payout history</h2>
            {historyLoading ? (
              <p className="text-sm text-gray-500 py-6 text-center">Loading…</p>
            ) : (history?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">No payout requests yet.</p>
            ) : (
              <div className="divide-y divide-brand-800/20">
                {history!.map((req) => {
                  const status = STATUS_LABELS[req.status] ?? STATUS_LABELS.pending;
                  return (
                    <div key={req.id} className="py-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div>
                          <p className="font-bold text-lg">${(req.amountCents / 100).toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            Requested {new Date(req.requestedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p className="font-mono break-all">→ {req.walletAddress}</p>
                        {req.txHash && (
                          <p>
                            <a
                              href={`https://polygonscan.com/tx/${req.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-400 hover:text-brand-300 font-mono break-all"
                            >
                              tx: {req.txHash.slice(0, 10)}…{req.txHash.slice(-8)} ↗
                            </a>
                          </p>
                        )}
                        {req.notes && (
                          <p className="text-gray-400 italic">Note: {req.notes}</p>
                        )}
                      </div>
                      {req.status === 'pending' && (
                        <button
                          onClick={() => {
                            if (confirm('Cancel this payout request?')) {
                              cancelMutation.mutate({ id: req.id });
                            }
                          }}
                          className="text-xs text-red-400 hover:text-red-300 mt-2"
                        >
                          Cancel request
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function BalanceCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 ${
        accent
          ? 'bg-gradient-to-br from-red-600/20 to-red-900/10 border border-red-800/30'
          : 'bg-[#15151f] border border-brand-800/20'
      }`}
    >
      <p className={`text-xs uppercase tracking-wider mb-1 ${accent ? 'text-red-400' : 'text-gray-400'}`}>
        {label}
      </p>
      <p className="text-2xl font-black">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
