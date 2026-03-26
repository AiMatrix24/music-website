'use client';

import { trpc } from '@/lib/trpc/client';
import { useState } from 'react';
import Link from 'next/link';

export default function ScanTicketPage() {
  const [qrToken, setQrToken] = useState('');
  const [scanned, setScanned] = useState(false);

  const { data: result, isLoading, error } = trpc.tickets.validate.useQuery(
    { qrToken },
    { enabled: scanned && qrToken.length > 5 }
  );

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (qrToken.trim()) {
      setScanned(true);
    }
  };

  const handleReset = () => {
    setQrToken('');
    setScanned(false);
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-lg mx-auto">
        <Link href="/tickets" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          ← Back to Events
        </Link>

        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-red-600/20 flex items-center justify-center text-4xl mx-auto mb-4">
            📱
          </div>
          <h1 className="text-3xl font-black mb-2">Ticket Scanner</h1>
          <p className="text-gray-400">Scan or enter a ticket QR code to verify entry.</p>
        </div>

        {/* Scan result */}
        {scanned && !isLoading && result && (
          <div className={`rounded-2xl p-8 mb-8 text-center ${
            result.valid
              ? 'bg-green-900/20 border-2 border-green-600'
              : 'bg-red-900/20 border-2 border-red-600'
          }`}>
            <div className="text-6xl mb-4">{result.valid ? '✅' : '❌'}</div>
            <h2 className={`text-2xl font-black mb-2 ${result.valid ? 'text-green-400' : 'text-red-400'}`}>
              {result.valid ? 'VALID TICKET' : 'INVALID TICKET'}
            </h2>
            {result.valid && result.ticket && (
              <div className="text-sm text-gray-400 space-y-1 mt-4">
                <p>Status: <span className="text-green-400 font-semibold">{result.ticket.status}</span></p>
                <p className="text-xs text-gray-500 font-mono mt-2">{result.ticket.qrToken}</p>
              </div>
            )}
            {!result.valid && (
              <p className="text-gray-400 text-sm mt-2">This ticket code was not found or has already been used.</p>
            )}
            <button
              onClick={handleReset}
              className="mt-6 rounded-full bg-white/10 px-6 py-2 text-sm font-semibold text-white hover:bg-white/20 transition"
            >
              Scan Another
            </button>
          </div>
        )}

        {scanned && isLoading && (
          <div className="rounded-2xl bg-[#15151f] p-8 mb-8 text-center">
            <div className="animate-pulse text-4xl mb-4">🔍</div>
            <p className="text-gray-400">Verifying ticket...</p>
          </div>
        )}

        {/* Manual entry */}
        {!scanned && (
          <form onSubmit={handleScan} className="space-y-4">
            <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <label className="block text-sm font-semibold mb-2">Enter Ticket Code</label>
              <input
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                placeholder="opynx_ticket_..."
                className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 focus:outline-none transition font-mono text-sm"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter the ticket code from the attendee&apos;s QR code or paste the token string.
              </p>
            </div>

            <button
              type="submit"
              disabled={!qrToken.trim()}
              className="w-full rounded-full bg-red-600 py-4 font-semibold text-white text-lg transition hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Verify Ticket
            </button>
          </form>
        )}

        {/* Info */}
        <div className="mt-12 rounded-xl bg-[#15151f] border border-brand-800/20 p-6">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <span className="text-red-500">🛡️</span> Anti-Fraud Protection
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• Each ticket has a unique QR code tied to the buyer&apos;s identity</li>
            <li>• Tickets are non-transferable — the buyer must be present</li>
            <li>• Once scanned, the ticket is marked as &quot;used&quot; and cannot be reused</li>
            <li>• All verifications are logged on Polygon for transparency</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
