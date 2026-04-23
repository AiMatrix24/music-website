'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from './Toast';

/* ------------------------------------------------------------------ */
/*  useTipJar hook                                                    */
/* ------------------------------------------------------------------ */

export function useTipJar() {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  return { isOpen, open, close };
}

/* ------------------------------------------------------------------ */
/*  TipJar component                                                  */
/* ------------------------------------------------------------------ */

interface TipJarProps {
  artistName: string;
  artistId: string;
  /** Optional track context — sent with the tip so the creator can see which
   *  track the tipper was viewing when they tipped. */
  trackId?: string;
  isOpen?: boolean;
  onClose?: () => void;
  /** If true, renders just the floating button + modal (standalone mode) */
  standalone?: boolean;
}

const QUICK_AMOUNTS = [1, 3, 5, 10];

export function TipJar({ artistName, artistId, trackId, isOpen: controlledOpen, onClose, standalone = true }: TipJarProps) {
  const { status: sessionStatus } = useSession();
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(3);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const isOpen = controlledOpen ?? internalOpen;
  const handleClose = onClose ?? (() => setInternalOpen(false));
  const handleOpen = () => setInternalOpen(true);

  const tipAmount = isCustom ? parseFloat(customAmount) || 0 : selectedAmount ?? 0;

  const sendMutation = trpc.tips.send.useMutation({
    onSuccess: (result) => {
      // Redirect to NOWPayments — tip flips to 'completed' via webhook
      window.location.href = result.paymentUrl;
    },
    onError: (err) => {
      toast(err.message || 'Tip failed', 'error');
      setSending(false);
    },
  });

  const handleSend = async () => {
    if (tipAmount < 0.5) {
      toast('Minimum tip is $0.50', 'error');
      return;
    }
    if (sessionStatus !== 'authenticated') {
      toast('Please sign in to send a tip', 'error');
      return;
    }
    setSending(true);
    sendMutation.mutate({
      recipientUserId: artistId,
      amount: Math.round(tipAmount * 100), // cents
      trackId,
      message: message.trim() || undefined,
    });
  };

  return (
    <>
      {/* Floating button (only in standalone mode) */}
      {standalone && (
        <button
          onClick={handleOpen}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-sm font-bold transition shadow-lg shadow-red-600/20"
        >
          <span>&#128176;</span> Tip
        </button>
      )}

      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

          {/* Modal */}
          <div className="relative w-full max-w-sm rounded-2xl bg-[#15151f] border border-white/10 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 pb-4 text-center border-b border-white/5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center text-xl font-black mx-auto mb-3">
                {artistName.charAt(0)}
              </div>
              <h3 className="text-lg font-bold">Tip {artistName}</h3>
              <p className="text-xs text-gray-500 mt-1">Direct support, settled on-chain</p>
            </div>

            {/* Amount selection */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => { setSelectedAmount(amt); setIsCustom(false); }}
                    className={`py-2.5 rounded-xl text-sm font-bold transition border ${
                      !isCustom && selectedAmount === amt
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {/* Custom */}
              <div>
                <button
                  onClick={() => { setIsCustom(true); setSelectedAmount(null); }}
                  className={`w-full py-2 rounded-xl text-sm font-semibold transition border mb-2 ${
                    isCustom
                      ? 'bg-red-600/20 border-red-600/40 text-red-400'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Custom Amount
                </button>
                {isCustom && (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      min="0.50"
                      step="0.50"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-brand-950 border border-white/10 rounded-xl pl-7 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-red-600 focus:outline-none transition"
                    />
                  </div>
                )}
              </div>

              {/* Optional note */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Add a note (optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Loved your last track..."
                  rows={2}
                  maxLength={500}
                  className="w-full bg-brand-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-red-600 focus:outline-none transition resize-none"
                />
              </div>

              {/* Payment info */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                USDC on Polygon · via NOWPayments
              </div>

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={tipAmount < 0.5 || sending || sendMutation.isPending}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 text-sm font-bold transition flex items-center justify-center gap-2"
              >
                {sending || sendMutation.isPending ? (
                  <span className="animate-pulse">Redirecting to payment...</span>
                ) : (
                  <>Send ${tipAmount >= 0.5 ? tipAmount.toFixed(2) : '0.00'} tip</>
                )}
              </button>

              {sessionStatus === 'unauthenticated' && (
                <p className="text-center text-xs text-gray-500">
                  Sign in to send a tip
                </p>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition text-lg"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </>
  );
}
