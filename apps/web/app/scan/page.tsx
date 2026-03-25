'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';

type Mode = 'select' | 'attribution' | 'ticket';
type ScanStep = 'ready' | 'scanning' | 'verifying' | 'success' | 'totp' | 'invalid';

export default function ScanPage() {
  const [mode, setMode] = useState<Mode>('select');
  const [step, setStep] = useState<ScanStep>('ready');
  const [totpCode, setTotpCode] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [ticketResult, setTicketResult] = useState<{
    valid: boolean;
    eventTitle?: string;
    attendeeName?: string;
    ticketType?: string;
  } | null>(null);

  const handleValidateTicket = async () => {
    if (!qrToken.trim()) return;
    setStep('verifying');
    try {
      // Use fetch directly since validate is a query
      const res = await fetch(`/api/trpc/tickets.validate?input=${encodeURIComponent(JSON.stringify({ qrToken: qrToken.trim() }))}`);
      const json = await res.json();
      const data = json?.result?.data;
      if (data?.valid) {
        setTicketResult({
          valid: true,
          eventTitle: 'Event',
          attendeeName: 'Attendee',
          ticketType: 'General',
        });
        setStep('success');
      } else {
        setTicketResult({ valid: false });
        setStep('invalid');
      }
    } catch {
      setTicketResult({ valid: false });
      setStep('invalid');
    }
  };

  // ─── Mode Selection ───
  if (mode === 'select') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Scan</h1>
        <p className="text-gray-400 mb-10 max-w-sm">
          Choose what you want to scan.
        </p>

        <div className="w-full max-w-md space-y-4">
          <button
            onClick={() => setMode('ticket')}
            className="w-full rounded-2xl bg-[#15151f] border-2 border-transparent hover:border-brand-600/30 p-6 text-left transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-2xl shrink-0">
                🎟️
              </div>
              <div>
                <h3 className="font-bold text-lg">Validate Ticket</h3>
                <p className="text-sm text-gray-400">
                  Scan QR code at event entry for check-in
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setMode('attribution')}
            className="w-full rounded-2xl bg-[#15151f] border-2 border-transparent hover:border-brand-600/30 p-6 text-left transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-600 to-purple-800 flex items-center justify-center text-2xl shrink-0">
                📷
              </div>
              <div>
                <h3 className="font-bold text-lg">Attribution Scan</h3>
                <p className="text-sm text-gray-400">
                  Scan facilitator badge to attribute fan connection
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ─── Ticket Validation Mode ───
  if (mode === 'ticket') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <button
          onClick={() => { setMode('select'); setStep('ready'); setQrToken(''); setTicketResult(null); }}
          className="text-sm text-gray-400 hover:text-white transition mb-8"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold mb-2">Validate Ticket</h1>
        <p className="text-gray-400 mb-8 max-w-sm">
          Scan or enter the QR code to verify ticket at the door.
        </p>

        {step === 'ready' && (
          <div className="w-full max-w-sm">
            {/* Camera placeholder */}
            <div className="aspect-square rounded-2xl bg-[#15151f] border-2 border-dashed border-brand-700/30 flex items-center justify-center mb-6">
              <div className="text-center">
                <div className="text-4xl mb-4">🎟️</div>
                <p className="text-gray-400 text-sm">Camera viewfinder</p>
                <p className="text-gray-500 text-xs mt-1">Point at attendee&apos;s QR ticket</p>
              </div>
            </div>

            <button
              onClick={() => setStep('scanning')}
              className="w-full rounded-full bg-brand-600 py-4 font-semibold text-white mb-4"
            >
              Start Camera Scan
            </button>

            <div className="text-gray-500 text-xs mb-4">— or enter code manually —</div>

            <div className="flex gap-2">
              <input
                type="text"
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                placeholder="Enter QR token..."
                className="flex-1 bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition text-sm"
              />
              <button
                onClick={handleValidateTicket}
                disabled={!qrToken.trim()}
                className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white disabled:opacity-50 transition"
              >
                Check
              </button>
            </div>
          </div>
        )}

        {step === 'scanning' && (
          <div className="w-full max-w-sm">
            <div className="aspect-square rounded-2xl bg-black border-2 border-brand-500 flex items-center justify-center mb-6 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-brand-400 rounded-lg animate-pulse" />
              </div>
              <p className="text-gray-400 text-sm">Scanning ticket QR...</p>
            </div>
            <button
              onClick={() => setStep('ready')}
              className="w-full rounded-full border border-white/20 py-4 font-semibold text-white"
            >
              Cancel
            </button>
          </div>
        )}

        {step === 'verifying' && (
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Validating ticket...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="w-full max-w-sm">
            <div className="rounded-2xl bg-green-600/10 border-2 border-green-500/30 p-8 text-center mb-6">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-black text-green-400 mb-2">VALID TICKET</h2>
              <p className="text-gray-300 font-semibold">{ticketResult?.eventTitle}</p>
              <p className="text-sm text-gray-400 mt-1">{ticketResult?.attendeeName}</p>
              <div className="mt-3 inline-block bg-green-600/20 text-green-400 text-xs px-3 py-1 rounded-full font-semibold">
                {ticketResult?.ticketType} · Checked In
              </div>
            </div>
            <button
              onClick={() => { setStep('ready'); setQrToken(''); setTicketResult(null); }}
              className="w-full rounded-full bg-brand-600 py-4 font-semibold text-white"
            >
              Scan Next Ticket
            </button>
          </div>
        )}

        {step === 'invalid' && (
          <div className="w-full max-w-sm">
            <div className="rounded-2xl bg-red-600/10 border-2 border-red-500/30 p-8 text-center mb-6">
              <div className="text-5xl mb-4">❌</div>
              <h2 className="text-2xl font-black text-red-400 mb-2">INVALID TICKET</h2>
              <p className="text-sm text-gray-400">
                This ticket is not valid. It may be expired, already used, or forged.
              </p>
            </div>
            <button
              onClick={() => { setStep('ready'); setQrToken(''); setTicketResult(null); }}
              className="w-full rounded-full bg-brand-600 py-4 font-semibold text-white"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Attribution Mode (original) ───
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <button
        onClick={() => { setMode('select'); setStep('ready'); }}
        className="text-sm text-gray-400 hover:text-white transition mb-8"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-2">Attribution Scan</h1>
      <p className="text-gray-400 mb-8 max-w-sm">
        Point your camera at the QR code on the Facilitator&apos;s badge or display.
      </p>

      {step === 'ready' && (
        <div className="w-full max-w-sm">
          <div className="aspect-square rounded-2xl bg-[#15151f] border-2 border-dashed border-brand-700/30 flex items-center justify-center mb-6">
            <div className="text-center">
              <div className="text-4xl mb-4">📷</div>
              <p className="text-gray-400 text-sm">Camera viewfinder will appear here</p>
            </div>
          </div>
          <button
            onClick={() => setStep('scanning')}
            className="w-full rounded-full bg-brand-600 py-4 font-semibold text-white mb-3"
          >
            Start Scanning
          </button>
          <button
            onClick={() => setStep('totp')}
            className="w-full rounded-full border border-white/20 py-3 font-semibold text-white text-sm"
          >
            Enter Code Manually
          </button>
        </div>
      )}

      {step === 'scanning' && (
        <div className="w-full max-w-sm">
          <div className="aspect-square rounded-2xl bg-black border-2 border-brand-500 flex items-center justify-center mb-6 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-brand-400 rounded-lg animate-pulse" />
            </div>
            <p className="text-gray-400 text-sm">Scanning...</p>
          </div>
          <button
            onClick={() => setStep('ready')}
            className="w-full rounded-full border border-white/20 py-4 font-semibold text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {step === 'totp' && (
        <div className="w-full max-w-sm">
          <p className="text-gray-400 mb-4">
            Enter the 6-digit code from the Facilitator&apos;s badge.
          </p>
          <input
            type="text"
            maxLength={6}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full text-center text-3xl tracking-[0.5em] font-mono bg-[#15151f] border border-brand-700/30 rounded-xl py-4 px-6 text-white mb-6 outline-none focus:border-brand-500"
          />
          <button
            onClick={() => setStep('verifying')}
            disabled={totpCode.length !== 6}
            className="w-full rounded-full bg-brand-600 py-4 font-semibold text-white disabled:opacity-50"
          >
            Verify Code
          </button>
        </div>
      )}

      {step === 'verifying' && (
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verifying attribution...</p>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-xl font-bold mb-2">Attributed!</h2>
          <p className="text-gray-400 mb-6">You&apos;re all set. Subscribe to support this artist.</p>
          <Link
            href="/subscribe"
            className="inline-block rounded-full bg-brand-600 px-8 py-4 font-semibold text-white"
          >
            Subscribe — $8.73/mo
          </Link>
        </div>
      )}
    </div>
  );
}
