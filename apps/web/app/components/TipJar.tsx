'use client';

import { useState, useCallback } from 'react';

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
  isOpen?: boolean;
  onClose?: () => void;
  /** If true, renders just the floating button + modal (standalone mode) */
  standalone?: boolean;
}

const QUICK_AMOUNTS = [1, 3, 5, 10];

export function TipJar({ artistName, artistId, isOpen: controlledOpen, onClose, standalone = true }: TipJarProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(3);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const isOpen = controlledOpen ?? internalOpen;
  const handleClose = onClose ?? (() => setInternalOpen(false));
  const handleOpen = () => setInternalOpen(true);

  const tipAmount = isCustom ? parseFloat(customAmount) || 0 : selectedAmount ?? 0;

  const handleSend = async () => {
    if (tipAmount <= 0) return;
    setSending(true);
    // Simulate sending
    await new Promise((r) => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
    setTimeout(() => {
      setSent(false);
      handleClose();
      setSelectedAmount(3);
      setIsCustom(false);
      setCustomAmount('');
    }, 2500);
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
            {/* Success state */}
            {sent ? (
              <div className="p-10 text-center">
                <p className="text-5xl mb-3">&#10003;&#127881;</p>
                <h3 className="text-xl font-bold mb-2">Tip Sent!</h3>
                <p className="text-sm text-gray-400">
                  ${tipAmount.toFixed(2)} sent to {artistName}
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-6 pb-4 text-center border-b border-white/5">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center text-xl font-black mx-auto mb-3">
                    {artistName.charAt(0)}
                  </div>
                  <h3 className="text-lg font-bold">Tip {artistName}</h3>
                  <p className="text-xs text-gray-500 mt-1">Show your support directly</p>
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

                  {/* Payment info */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    Payment via USDC (Polygon)
                  </div>

                  {/* Send button */}
                  <button
                    onClick={handleSend}
                    disabled={tipAmount <= 0 || sending}
                    className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 text-sm font-bold transition flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <span className="animate-pulse">Sending...</span>
                    ) : (
                      <>Send ${tipAmount > 0 ? tipAmount.toFixed(2) : '0.00'} Tip</>
                    )}
                  </button>

                  {/* Badge */}
                  <div className="text-center">
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-green-400 font-semibold bg-green-600/10 px-3 py-1 rounded-full border border-green-600/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      100% goes to the artist
                    </span>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-gray-500 hover:text-white transition text-lg"
                >
                  &times;
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
