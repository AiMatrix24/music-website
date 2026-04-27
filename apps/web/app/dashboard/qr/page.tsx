'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { QRCode } from '@/app/components/QRCode';
import { trpc } from '@/lib/trpc/client';
import QRCodeLib from 'qrcode';

/**
 * Creator's promo QR code — encodes a URL pointing at /sub/[creatorId].
 * Fans scan with their phone camera at events, land on the creator's
 * subscription page, tap Subscribe.
 *
 * The creator can optionally attribute scans to a specific event by
 * appending ?ev={eventId}, useful for measuring per-event signup conversion
 * (the QR PNG itself stays the same per-creator unless the host generates
 * an event-tagged variant for their poster).
 */
export default function PromoQRPage() {
  const { status, data: session } = useSession();
  const enabled = status === 'authenticated';

  const meQuery = trpc.users.getProfile.useQuery(undefined, { enabled });
  const myEventsQuery = trpc.events.list.useQuery(
    { hostId: session?.user?.id ?? '', limit: 100 },
    { enabled: enabled && !!session?.user?.id }
  );

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [downloading, setDownloading] = useState(false);

  if (!enabled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-gray-400">Sign in to get your promo QR code.</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Sign In</Link>
      </div>
    );
  }

  if (meQuery.isLoading || !meQuery.data) {
    return <div className="min-h-screen py-16 px-6 text-center text-gray-500">Loading…</div>;
  }

  const me = meQuery.data;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://opynx.com';
  const subUrl = `${baseUrl}/sub/${me.id}${selectedEventId ? `?ev=${selectedEventId}` : ''}`;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Generate a high-res PNG (1024px) for printing — too small at 256.
      const dataUrl = await QRCodeLib.toDataURL(subUrl, {
        errorCorrectionLevel: 'H', // 30% recovery — survives print scuffs
        margin: 4,
        width: 1024,
        color: { dark: '#0a0a0f', light: '#ffffff' },
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `opynx-qr-${me.name?.replace(/[^a-z0-9]+/gi, '-').toLowerCase() ?? me.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(subUrl);
    } catch {}
  };

  const events = myEventsQuery.data ?? [];

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Your Promo QR Code</h1>
        <p className="text-sm text-gray-400 mb-8">
          Print or display this anywhere — venues, posters, business cards. Fans scan with their phone camera and land on your subscription page.
        </p>

        {/* QR preview */}
        <div className="rounded-3xl bg-white p-8 flex flex-col items-center mb-6">
          <QRCode value={subUrl} size={320} errorCorrectionLevel="H" />
          <p className="text-[#0a0a0f] font-bold mt-4 text-lg">Subscribe to {me.name ?? 'this creator'}</p>
          <p className="text-[#0a0a0f] text-sm">opynx.com/sub/{me.id.slice(0, 8)}…</p>
        </div>

        {/* URL row */}
        <div className="flex items-center gap-2 mb-6 bg-[#15151f] border border-brand-800/20 rounded-lg px-3 py-2">
          <code className="flex-1 text-xs text-gray-300 truncate">{subUrl}</code>
          <button
            onClick={handleCopy}
            className="text-xs text-red-400 hover:text-red-300 px-2 shrink-0"
          >
            Copy
          </button>
        </div>

        <div className="flex gap-3 mb-8">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 rounded-full bg-red-600 hover:bg-red-500 px-5 py-3 text-sm font-bold text-white transition disabled:opacity-50"
          >
            {downloading ? 'Generating…' : 'Download high-res PNG'}
          </button>
          <Link
            href={`/sub/${me.id}`}
            target="_blank"
            className="rounded-full bg-brand-950 hover:bg-brand-900 border border-brand-800/40 px-5 py-3 text-sm font-bold transition flex items-center"
          >
            Preview →
          </Link>
        </div>

        {/* Optional event attribution */}
        {events.length > 0 && (
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5">
            <h2 className="font-bold mb-1">Tag with an event (optional)</h2>
            <p className="text-xs text-gray-500 mb-4">
              Generate a separate QR variant tied to a specific event so you can see which signups came from there.
            </p>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-[#0f0f17] border border-brand-800/30 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none"
            >
              <option value="">No event tag (evergreen QR)</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} — {new Date(ev.startDate).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500 space-y-2">
          <p>
            <strong className="text-gray-400">Tips for print:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>Minimum size 1×1 inch when printed — anything smaller may not scan reliably.</li>
            <li>High contrast (black on white) — don't recolor.</li>
            <li>Quiet zone — leave white space around the QR (already built in).</li>
            <li>Test with your phone after printing to confirm scannability.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
