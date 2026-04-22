'use client';

import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useToast } from '@/app/components/Toast';

function TransferContent() {
  const { status } = useSession();
  const params = useSearchParams();
  const ticketId = params.get('ticket') ?? '';
  const { toast } = useToast();

  const [recipientEmail, setRecipientEmail] = useState('');
  const [reason, setReason] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Sign in to transfer tickets</p>
        <Link href="/auth/login" className="text-red-400">Sign In →</Link>
      </div>
    );
  }

  const handleTransfer = async () => {
    if (!recipientEmail) {
      toast('Enter the recipient\'s email', 'error');
      return;
    }
    if (!reason) {
      toast('Please provide a reason for the transfer', 'error');
      return;
    }
    if (!agreed) {
      toast('You must agree to the transfer terms', 'error');
      return;
    }

    setProcessing(true);
    // Simulated — in production this would call tRPC mutation
    setTimeout(() => {
      setProcessing(false);
      setSubmitted(true);
      toast('Transfer request submitted for creator approval', 'success');
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen py-16 px-6">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-yellow-600/20 flex items-center justify-center text-4xl mx-auto mb-6">
            📤
          </div>
          <h1 className="text-3xl font-black mb-2">Transfer Pending</h1>
          <p className="text-gray-400 mb-8">
            Your transfer request has been sent to the event host for approval.
            You&apos;ll be notified once it&apos;s reviewed.
          </p>

          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 text-left mb-8">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className="text-yellow-400 font-semibold">⏳ Awaiting Approval</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Recipient</span>
                <span>{recipientEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Reason</span>
                <span className="text-right max-w-[60%]">{reason}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-red-950/20 border border-red-800/20 p-4 mb-8 text-left">
            <p className="text-xs text-gray-400">
              <span className="text-red-400 font-semibold">🛡️ Transfer Protection:</span>{' '}
              The recipient must create an OPYNX account to accept. The ticket will be
              re-issued with a new QR code tied to their identity. Your original ticket
              will be voided.
            </p>
          </div>

          <Link
            href="/my-tickets"
            className="inline-block rounded-full bg-red-600 px-8 py-3 font-semibold text-white hover:bg-red-500 transition"
          >
            Back to My Tickets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-lg mx-auto">
        <Link href="/my-tickets" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          ← Back to My Tickets
        </Link>

        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-red-600/20 flex items-center justify-center text-4xl mx-auto mb-4">
            🔄
          </div>
          <h1 className="text-3xl font-black mb-2">Transfer Ticket</h1>
          <p className="text-gray-400">
            Can&apos;t make it? Transfer to someone you know.
          </p>
        </div>

        <div className="space-y-6">
          {/* How it works */}
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
            <h2 className="font-bold mb-3">How Transfers Work</h2>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex gap-3">
                <span className="text-red-500 shrink-0">1.</span>
                <span>You submit a transfer request with the recipient&apos;s email</span>
              </div>
              <div className="flex gap-3">
                <span className="text-red-500 shrink-0">2.</span>
                <span>The event host reviews and approves the transfer</span>
              </div>
              <div className="flex gap-3">
                <span className="text-red-500 shrink-0">3.</span>
                <span>The recipient gets a new ticket with a fresh QR code</span>
              </div>
              <div className="flex gap-3">
                <span className="text-red-500 shrink-0">4.</span>
                <span>Your original ticket is voided — no duplicates possible</span>
              </div>
            </div>
          </div>

          {/* Transfer form */}
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Recipient Email *</label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="friend@example.com"
                className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 focus:outline-none transition"
              />
              <p className="text-xs text-gray-500 mt-1">They must create an OPYNX account to accept</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Reason for Transfer *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-red-600 focus:outline-none transition"
              >
                <option value="">Select a reason...</option>
                <option value="cant_attend">I can&apos;t attend anymore</option>
                <option value="gift">Gifting to a friend/family</option>
                <option value="wrong_date">Bought wrong date</option>
                <option value="medical">Medical/emergency</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Terms */}
            <div className="p-4 bg-brand-950/50 rounded-xl text-xs text-gray-400 space-y-2">
              <p><strong>Transfer Terms:</strong></p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Transfers are <strong>free</strong> — no fees charged</li>
                <li>No resale at a higher price is allowed</li>
                <li>The event host must approve the transfer</li>
                <li>Once approved, your ticket is permanently voided</li>
                <li>Maximum 1 transfer per ticket</li>
              </ul>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-5 h-5 rounded border-brand-800/30 bg-brand-950 accent-red-600 mt-0.5"
              />
              <span className="text-sm text-gray-300">
                I confirm this is a legitimate transfer, not a resale. I understand my
                ticket will be voided once the transfer is approved.
              </span>
            </label>
          </div>

          <button
            onClick={handleTransfer}
            disabled={processing || !recipientEmail || !reason || !agreed}
            className="w-full rounded-full bg-red-600 py-4 font-semibold text-white text-lg transition hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Submitting...' : 'Request Transfer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TransferPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading...</div></div>}>
      <TransferContent />
    </Suspense>
  );
}
