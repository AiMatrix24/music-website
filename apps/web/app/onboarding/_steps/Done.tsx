'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { QRCode } from '@/app/components/QRCode';
import Link from 'next/link';

/**
 * Step 4 — celebration + share-out. Shows the creator their personal QR
 * code (encodes /sub/{their-id}) and a copyable subscribe URL. CTA to
 * dashboard. Hitting the CTA stamps onboardingCompletedAt and bounces.
 */
export function DoneStep({
  onFinish,
  onBack,
  finishing,
}: {
  onFinish: () => void;
  onBack: () => void;
  finishing: boolean;
}) {
  const meQuery = trpc.users.getProfile.useQuery();
  const [copied, setCopied] = useState(false);

  if (meQuery.isLoading || !meQuery.data) {
    return <div className="rounded-2xl bg-[#15151f] p-8 text-center text-gray-500">Loading…</div>;
  }

  const me = meQuery.data;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://opynx.com';
  const subUrl = `${baseUrl}/sub/${me.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(subUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-8 space-y-6">
      <div className="text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">You're set, {me.name?.split(' ')[0] ?? 'creator'}.</h2>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">
          This QR code is yours. Print it, post it, share it. Anyone who scans it lands on your subscribe page.
        </p>
      </div>

      {/* QR */}
      <div className="rounded-2xl bg-white p-6 flex flex-col items-center">
        <QRCode value={subUrl} size={220} errorCorrectionLevel="H" />
        <p className="text-[#0a0a0f] font-bold mt-3 text-sm">Subscribe to {me.name ?? 'me'}</p>
      </div>

      {/* URL row */}
      <div className="flex items-center gap-2 bg-brand-950/40 border border-brand-800/20 rounded-lg px-3 py-2">
        <code className="flex-1 text-xs text-gray-300 truncate">{subUrl}</code>
        <button
          onClick={handleCopy}
          className="text-xs text-red-400 hover:text-red-300 font-semibold px-2 shrink-0"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      <div className="rounded-lg bg-brand-950/40 p-3 text-xs text-gray-400">
        <p className="font-semibold text-gray-300 mb-1">What's next?</p>
        <ul className="space-y-0.5 list-disc list-inside">
          <li>Download a high-res QR PNG from <Link href="/dashboard/qr" className="text-red-400 hover:text-red-300">Dashboard → QR Codes</Link></li>
          <li>Upload more tracks anytime from <Link href="/dashboard/upload" className="text-red-400 hover:text-red-300">Dashboard → Upload</Link></li>
          <li>Apply for the verified ✓ badge from <Link href="/dashboard/verified" className="text-red-400 hover:text-red-300">Dashboard → Verified</Link></li>
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={finishing}
          className="rounded-full bg-brand-950 hover:bg-brand-900 border border-brand-800/40 px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          onClick={onFinish}
          disabled={finishing}
          className="flex-1 rounded-full bg-red-600 hover:bg-red-500 px-5 py-3 text-sm font-bold text-white transition disabled:opacity-50"
        >
          {finishing ? 'Saving…' : 'Go to Dashboard →'}
        </button>
      </div>
    </div>
  );
}
