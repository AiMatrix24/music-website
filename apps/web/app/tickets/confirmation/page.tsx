'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ConfirmationContent() {
  const params = useSearchParams();
  const eventTitle = params.get('event') ?? 'Your Event';
  const tier = params.get('tier') ?? 'General';
  const qty = params.get('qty') ?? '1';
  const total = params.get('total') ?? '0';
  const token = params.get('token') ?? `opynx_${Date.now()}`;

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-lg mx-auto text-center">
        {/* Success animation */}
        <div className="w-24 h-24 rounded-full bg-green-600/20 flex items-center justify-center text-5xl mx-auto mb-6 animate-bounce">
          ✅
        </div>

        <h1 className="text-3xl font-black mb-2">You&apos;re In!</h1>
        <p className="text-gray-400 mb-8">Your tickets have been confirmed and secured.</p>

        {/* Receipt card */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-8 text-left mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Order Receipt</h2>
            <span className="text-xs bg-green-600/20 text-green-400 px-3 py-1 rounded-full font-semibold">
              Confirmed
            </span>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Event</span>
              <span className="font-semibold text-right max-w-[60%] truncate">{eventTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Tier</span>
              <span className="font-semibold">{tier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Quantity</span>
              <span className="font-semibold">{qty}</span>
            </div>
            <div className="border-t border-brand-800/20 pt-4 flex justify-between font-bold text-lg">
              <span>Total Paid</span>
              <span className="text-red-400">${(parseFloat(total) / 100).toFixed(2)}</span>
            </div>
          </div>

          {/* Revenue split */}
          <div className="mt-6 p-4 bg-brand-950/50 rounded-xl">
            <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Where Your Money Goes</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Creator (85%)</span>
                <span className="text-red-400">${((parseFloat(total) / 100) * 0.85).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Facilitator (5%)</span>
                <span className="text-pink-400">${((parseFloat(total) / 100) * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Platform (10%)</span>
                <span className="text-cyan-400">${((parseFloat(total) / 100) * 0.10).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* QR token */}
          <div className="mt-6 p-4 bg-white rounded-xl text-center">
            <div className="w-32 h-32 bg-gray-100 border-2 border-gray-200 rounded-lg mx-auto flex flex-col items-center justify-center mb-2">
              <span className="text-4xl">📱</span>
              <p className="text-xs text-gray-400 mt-1">QR Code</p>
            </div>
            <p className="text-xs text-gray-500 font-mono break-all">{token}</p>
          </div>
        </div>

        {/* Anti-scalper notice */}
        <div className="rounded-xl bg-red-950/20 border border-red-800/20 p-4 mb-8 text-left">
          <h3 className="text-sm font-bold text-red-400 mb-2">🛡️ Anti-Scalper Protection</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• This ticket is non-transferable and tied to your account</li>
            <li>• Resale is prohibited — scalpers can&apos;t inflate prices</li>
            <li>• Present your QR code at the venue for entry</li>
            <li>• All transactions verified on Polygon blockchain</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href="/my-tickets"
            className="flex-1 rounded-full bg-red-600 py-3 font-semibold text-white hover:bg-red-500 transition text-center"
          >
            View My Tickets
          </Link>
          <Link
            href="/tickets"
            className="flex-1 rounded-full border border-brand-800/30 py-3 font-semibold text-white hover:border-red-600 transition text-center"
          >
            Browse More Events
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading...</div></div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
