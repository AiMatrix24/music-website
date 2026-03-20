'use client';

import { useState } from 'react';

/**
 * QR Scanner Page — P0 Priority
 * Accesses rear camera, decodes QR, requests GPS, records attribution.
 * Falls back to TOTP if GPS fails.
 */
export default function ScanPage() {
  const [step, setStep] = useState<'ready' | 'scanning' | 'verifying' | 'success' | 'totp'>('ready');
  const [totpCode, setTotpCode] = useState('');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-bold mb-2">Scan QR Code</h1>
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
            className="w-full rounded-full bg-brand-600 py-4 font-semibold text-white"
          >
            Start Scanning
          </button>
        </div>
      )}

      {step === 'scanning' && (
        <div className="w-full max-w-sm">
          <div className="aspect-square rounded-2xl bg-black border-2 border-brand-500 flex items-center justify-center mb-6 relative overflow-hidden">
            {/* Camera feed will be rendered here via navigator.mediaDevices.getUserMedia */}
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
            GPS verification unavailable. Enter the 6-digit code from the Facilitator&apos;s badge.
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
          <a
            href="/subscribe"
            className="inline-block rounded-full bg-brand-600 px-8 py-4 font-semibold text-white"
          >
            Subscribe — $8.73/mo
          </a>
        </div>
      )}
    </div>
  );
}
