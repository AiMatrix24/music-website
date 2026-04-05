'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';

type QRContext = 'pre_show' | 'during_show' | 'post_show';

const contextOptions: { key: QRContext; label: string; description: string }[] = [
  { key: 'pre_show', label: 'Pre-Show', description: 'Fans pre-save + follow before the event' },
  { key: 'during_show', label: 'During Show', description: 'Fans subscribe with attribution during the event' },
  { key: 'post_show', label: 'Post-Show', description: 'Exclusive content unlock after the event' },
];

const mockRecentQRs = [
  { id: '1', context: 'during_show' as QRContext, event: 'Summer Fest 2026', createdAt: '2 hours ago', scans: 47 },
  { id: '2', context: 'pre_show' as QRContext, event: 'Club Night @ Venue', createdAt: '1 day ago', scans: 123 },
  { id: '3', context: 'post_show' as QRContext, event: 'Album Release Party', createdAt: '3 days ago', scans: 89 },
];

export default function QRGeneratorPage() {
  const { status } = useSession();
  const { toast } = useToast();

  const [context, setContext] = useState<QRContext>('during_show');
  const [eventName, setEventName] = useState('');
  const [facilitatorId, setFacilitatorId] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Sign in to generate QR codes</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">
          Sign In
        </Link>
      </div>
    );
  }

  const handleGenerate = () => {
    // Build a mock QR URL that matches the qr-generator service format
    const timestamp = Math.floor(Date.now() / 1000);
    const baseUrl = 'https://opynx.com/scan/attr';
    const params = new URLSearchParams();
    params.set('c', 'creator_self');
    if (facilitatorId.trim()) params.set('f', facilitatorId.trim());
    if (eventName.trim()) params.set('e', eventName.trim().replace(/\s+/g, '-').toLowerCase());
    params.set('t', String(timestamp));
    params.set('ctx', context);
    params.set('sig', 'hmac_' + Math.random().toString(36).slice(2, 10));

    const url = `${baseUrl}?${params.toString()}`;
    setGeneratedUrl(url);
    toast('QR code generated!', 'success');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl);
    toast('URL copied to clipboard!', 'success');
  };

  // Mock stats
  const totalScans = 259;
  const conversions = 78;
  const conversionRate = ((conversions / totalScans) * 100).toFixed(1);

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-bold">📱 Generate QR Codes</h1>
          <p className="text-gray-400 mt-2">
            Create scannable QR codes for events, shows, and promotions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5 text-center">
            <p className="text-2xl font-bold text-white">{totalScans}</p>
            <p className="text-sm text-gray-400 mt-1">Total Scans</p>
          </div>
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5 text-center">
            <p className="text-2xl font-bold text-green-400">{conversions}</p>
            <p className="text-sm text-gray-400 mt-1">Conversions</p>
          </div>
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5 text-center">
            <p className="text-2xl font-bold text-red-400">{conversionRate}%</p>
            <p className="text-sm text-gray-400 mt-1">Conversion Rate</p>
          </div>
        </div>

        {/* Generator Form */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Create New QR Code</h2>

          {/* Context Selector */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Context</label>
            <div className="grid grid-cols-3 gap-3">
              {contextOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setContext(opt.key)}
                  className={`rounded-xl p-3 text-left text-sm transition border ${
                    context === opt.key
                      ? 'bg-red-600/20 border-red-600 text-white'
                      : 'bg-brand-900/40 border-brand-800/20 text-gray-400 hover:text-white hover:border-brand-700/40'
                  }`}
                >
                  <span className="font-semibold block">{opt.label}</span>
                  <span className="text-xs opacity-70">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Event Name */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Event Name (optional)</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. Summer Fest 2026"
              className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
            />
          </div>

          {/* Facilitator ID */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Facilitator ID (optional)</label>
            <input
              type="text"
              value={facilitatorId}
              onChange={(e) => setFacilitatorId(e.target.value)}
              placeholder="e.g. facilitator_abc123"
              className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
            />
          </div>

          <button
            onClick={handleGenerate}
            className="w-full rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 transition"
          >
            Generate QR Code
          </button>
        </div>

        {/* Generated QR Display */}
        {generatedUrl && (
          <div className="rounded-2xl bg-[#15151f] border border-red-600/30 p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Generated QR URL</h2>
            {/* QR Code Image */}
            <div className="flex justify-center mb-6">
              <div className="bg-white rounded-2xl p-4 inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(generatedUrl)}`}
                  alt="QR Code"
                  width={250}
                  height={250}
                  className="block"
                />
              </div>
            </div>

            <div className="rounded-xl bg-brand-950 border border-brand-800/30 p-4 mb-4 break-all">
              <code className="text-sm text-green-400">{generatedUrl}</code>
            </div>
            <button
              onClick={handleCopy}
              className="rounded-full bg-red-600/20 border border-red-600/40 px-5 py-2 text-sm font-semibold text-red-400 hover:bg-red-600/30 transition"
            >
              Copy URL
            </button>

            {/* Print Format */}
            <div className="mt-6 pt-6 border-t border-brand-800/20">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Print Format (for facilitator badges)</h3>
              <div className="rounded-xl bg-white p-6 text-center">
                <p className="text-xs text-gray-500 mb-2">Scan to subscribe</p>
                <div className="flex justify-center my-4">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generatedUrl)}`}
                    alt="QR Code"
                    width={200}
                    height={200}
                    className="block"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Powered by OPYNX</p>
              </div>
            </div>
          </div>
        )}

        {/* Context Info */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">How QR Contexts Work</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="text-xl">🎤</span>
              <div>
                <h3 className="font-semibold text-white">Pre-Show</h3>
                <p className="text-sm text-gray-400">
                  Distribute before the event starts. Fans who scan can pre-save your upcoming release
                  and follow your profile, building anticipation before you hit the stage.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-xl">🔥</span>
              <div>
                <h3 className="font-semibold text-white">During Show</h3>
                <p className="text-sm text-gray-400">
                  The primary attribution scan. Fans subscribe in the moment with full
                  creator/facilitator/event attribution. This drives commission waterfall payouts.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-xl">🎁</span>
              <div>
                <h3 className="font-semibold text-white">Post-Show</h3>
                <p className="text-sm text-gray-400">
                  Unlock exclusive content after the event. Live recordings, behind-the-scenes footage,
                  or limited merch drops for fans who were there.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-red-600/10 border border-red-600/20 p-3">
            <p className="text-xs text-red-400">
              ⏱ QR codes rotate every 15 minutes for security. Each code includes an HMAC signature
              to prevent tampering and expires after 30 minutes.
            </p>
          </div>
        </div>

        {/* Recent QR Codes */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
          <h2 className="text-lg font-bold mb-4">Recent QR Codes</h2>
          <div className="space-y-3">
            {mockRecentQRs.map((qr) => (
              <div
                key={qr.id}
                className="flex items-center justify-between rounded-xl bg-brand-950/60 border border-brand-800/20 p-4"
              >
                <div>
                  <p className="font-semibold text-white text-sm">{qr.event}</p>
                  <p className="text-xs text-gray-500">
                    {contextOptions.find((c) => c.key === qr.context)?.label} — {qr.createdAt}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-400">{qr.scans} scans</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
