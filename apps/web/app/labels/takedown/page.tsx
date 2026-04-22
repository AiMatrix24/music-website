'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

type TakedownReason =
  | 'master'
  | 'composition'
  | 'unauthorized'
  | 'trademark'
  | 'counterfeit'
  | 'other'
  | '';

type RecentStatus = 'Approved' | 'Investigating' | 'Denied' | 'Pending';

interface RecentTakedown {
  id: number;
  track: string;
  status: RecentStatus;
  date: string;
}

interface TakedownData {
  contentUrl: string;
  artistName: string;
  trackTitle: string;
  releaseDate: string;
  reason: TakedownReason;
  reasonDetail: string;
  proofText: string;
  supportingFile: string;
  catalogNumber: string;
  isrc: string;
  originalReleaseDate: string;
  affirmGoodFaith: boolean;
  affirmAuthorized: boolean;
  affirmAccurate: boolean;
  affirmDmca: boolean;
  signature: string;
}

const LABEL_NAME = 'Skyline Records';
const LABEL_EMAIL = 'rights@skylinerecords.com';
const IS_VERIFIED = true;

const REASONS: { value: TakedownReason; label: string }[] = [
  { value: 'master', label: 'Copyright infringement (master recording)' },
  { value: 'composition', label: 'Copyright infringement (composition)' },
  { value: 'unauthorized', label: 'Unauthorized release of label-owned content' },
  { value: 'trademark', label: 'Trademark infringement' },
  { value: 'counterfeit', label: 'Counterfeit / Fake release' },
  { value: 'other', label: 'Other (specify)' },
];

const RECENT_TAKEDOWNS: RecentTakedown[] = [
  { id: 1, track: 'Neon Highway (cover)', status: 'Approved', date: '2026-04-10' },
  { id: 2, track: 'Velvet Touch (rip)', status: 'Investigating', date: '2026-04-05' },
  { id: 3, track: 'Midnight Rain (sample)', status: 'Denied', date: '2026-03-28' },
  { id: 4, track: 'Shadow Protocol (leak)', status: 'Approved', date: '2026-03-22' },
  { id: 5, track: 'Sunset Drift (counterfeit)', status: 'Pending', date: '2026-03-15' },
];

const STATUS_BADGE: Record<RecentStatus, string> = {
  Approved: 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/30',
  Investigating: 'bg-yellow-600/20 text-yellow-300 border border-yellow-600/30',
  Denied: 'bg-red-600/20 text-red-300 border border-red-600/30',
  Pending: 'bg-gray-600/20 text-gray-300 border border-gray-600/30',
};

const TODAY = new Date().toISOString().slice(0, 10);
const PROOF_LIMIT = 5000;

export default function LabelTakedownPage() {
  const { status } = useSession();
  const { toast } = useToast();
  const [searched, setSearched] = useState(false);

  const [data, setData] = useState<TakedownData>({
    contentUrl: '',
    artistName: '',
    trackTitle: '',
    releaseDate: '',
    reason: '',
    reasonDetail: '',
    proofText: '',
    supportingFile: '',
    catalogNumber: '',
    isrc: '',
    originalReleaseDate: '',
    affirmGoodFaith: false,
    affirmAuthorized: false,
    affirmAccurate: false,
    affirmDmca: false,
    signature: '',
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-950 text-white">
        <div className="animate-pulse text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-brand-950 text-white">
        <p className="text-5xl mb-2">⚠️</p>
        <p className="text-gray-400 text-lg">Sign in as a verified label to submit takedowns</p>
        <Link
          href="/auth/login"
          className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (!IS_VERIFIED) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-brand-950 text-white px-4 text-center">
        <p className="text-5xl mb-2">🔒</p>
        <h1 className="text-2xl font-bold">Label verification required</h1>
        <p className="text-gray-400 max-w-md">
          Only verified labels can submit takedown requests. Verify your label first.
        </p>
        <Link
          href="/labels/verify"
          className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition"
        >
          Start Verification
        </Link>
      </div>
    );
  }

  const update = <K extends keyof TakedownData>(key: K, value: TakedownData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    if (!data.contentUrl) {
      toast('Enter a content URL to search', 'error');
      return;
    }
    setSearched(true);
    toast('Content found on OPYNX', 'info');
  };

  const allAffirmed =
    data.affirmGoodFaith && data.affirmAuthorized && data.affirmAccurate && data.affirmDmca;

  const handleSubmit = () => {
    if (!data.contentUrl) {
      toast('Content URL is required', 'error');
      return;
    }
    if (!data.reason) {
      toast('Please select a reason for takedown', 'error');
      return;
    }
    if (!data.proofText.trim()) {
      toast('Please provide proof of ownership', 'error');
      return;
    }
    if (!allAffirmed) {
      toast('All legal affirmations are required', 'error');
      return;
    }
    if (!data.signature.trim()) {
      toast('Electronic signature is required', 'error');
      return;
    }
    toast(
      "Takedown submitted. Review within 48 hours. You'll receive email updates.",
      'success'
    );
  };

  return (
    <div className="min-h-screen bg-brand-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Back nav */}
        <Link
          href="/labels/dashboard"
          className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-6"
        >
          ← Back to Label Dashboard
        </Link>

        {/* Hero */}
        <div className="mb-8">
          <p className="text-5xl mb-3">⚠️</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Submit a Takedown Request</h1>
          <p className="text-gray-400 text-lg">
            Request removal of unauthorized content from OPYNX
          </p>
        </div>

        {/* DMCA Warning */}
        <div className="bg-yellow-600/10 border border-yellow-600/40 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">⚠️</span>
          <div>
            <p className="font-semibold text-yellow-300 mb-1">Important Legal Notice</p>
            <p className="text-sm text-yellow-100/80">
              Submitting false takedown notices is illegal and may result in penalties under the DMCA.
              Make sure you are the rights holder or authorized to act on their behalf.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Form */}
          <div className="space-y-6">
            {/* Section 1: Label Info */}
            <section className="bg-[#15151f] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-1">Section 1 — Your Label Information</h2>
              <p className="text-sm text-gray-400 mb-5">Auto-filled from your account</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Label Name</p>
                  <p className="font-semibold">{LABEL_NAME}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-600/30 px-3 py-1 rounded-full text-xs font-semibold">
                    <span>✓</span> Verified Label
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Contact Email</p>
                  <p className="font-semibold">{LABEL_EMAIL}</p>
                </div>
              </div>
            </section>

            {/* Section 2: Content Reported */}
            <section className="bg-[#15151f] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-1">Section 2 — Content Being Reported</h2>
              <p className="text-sm text-gray-400 mb-5">Identify the infringing content</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    URL of Content (track / album / release)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={data.contentUrl}
                      onChange={(e) => update('contentUrl', e.target.value)}
                      placeholder="https://opynx.com/track/..."
                      className="flex-1 bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                    <button
                      onClick={handleSearch}
                      className="rounded-full bg-red-600 hover:bg-red-500 transition px-4 py-2 text-sm font-semibold"
                    >
                      Search
                    </button>
                  </div>
                  {searched && (
                    <div className="mt-2 bg-emerald-600/10 border border-emerald-600/40 rounded-lg px-3 py-2 text-xs text-emerald-300">
                      ✓ Content located on OPYNX. You can proceed.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Creator Name on OPYNX</label>
                    <input
                      type="text"
                      value={data.artistName}
                      onChange={(e) => update('artistName', e.target.value)}
                      className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Track / Album Title</label>
                    <input
                      type="text"
                      value={data.trackTitle}
                      onChange={(e) => update('trackTitle', e.target.value)}
                      className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Release Date</label>
                    <input
                      type="date"
                      value={data.releaseDate}
                      onChange={(e) => update('releaseDate', e.target.value)}
                      className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Reason */}
            <section className="bg-[#15151f] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-1">Section 3 — Reason for Takedown</h2>
              <p className="text-sm text-gray-400 mb-5">Tell us why this content should be removed</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Reason</label>
                  <select
                    value={data.reason}
                    onChange={(e) => update('reason', e.target.value as TakedownReason)}
                    className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="">Select a reason</option>
                    {REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {data.reason === 'other' && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">Please specify</label>
                    <input
                      type="text"
                      value={data.reasonDetail}
                      onChange={(e) => update('reasonDetail', e.target.value)}
                      className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold">
                      Proof of Ownership
                    </label>
                    <p className="text-xs text-gray-500">
                      {data.proofText.length} / {PROOF_LIMIT}
                    </p>
                  </div>
                  <textarea
                    value={data.proofText}
                    onChange={(e) =>
                      update('proofText', e.target.value.slice(0, PROOF_LIMIT))
                    }
                    rows={6}
                    placeholder="Describe your ownership claim, contracts, registration evidence, etc."
                    className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Upload Supporting Documentation
                  </label>
                  <div className="border-2 border-dashed border-gray-700 hover:border-red-500 transition rounded-lg p-6 text-center cursor-pointer">
                    <p className="text-2xl mb-1">📎</p>
                    <p className="text-sm font-semibold">Drop files here</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Contracts, registration certificates, ISRC docs • Max 25MB
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-4">
                  <p className="text-sm font-semibold mb-3">Original Release Info</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Catalog Number</label>
                      <input
                        type="text"
                        value={data.catalogNumber}
                        onChange={(e) => update('catalogNumber', e.target.value)}
                        placeholder="SKY-001"
                        className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">ISRC</label>
                      <input
                        type="text"
                        value={data.isrc}
                        onChange={(e) => update('isrc', e.target.value)}
                        placeholder="USRC17607839"
                        className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Release Date</label>
                      <input
                        type="date"
                        value={data.originalReleaseDate}
                        onChange={(e) => update('originalReleaseDate', e.target.value)}
                        className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Affirmation */}
            <section className="bg-[#15151f] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-1">Section 4 — Legal Affirmation</h2>
              <p className="text-sm text-gray-400 mb-5">
                All checkboxes are required to submit
              </p>

              <div className="space-y-2 mb-5">
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-brand-950">
                  <input
                    type="checkbox"
                    checked={data.affirmGoodFaith}
                    onChange={(e) => update('affirmGoodFaith', e.target.checked)}
                    className="mt-1 w-4 h-4 accent-red-600"
                  />
                  <span className="text-sm">
                    I have a good faith belief that the use described is not authorized
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-brand-950">
                  <input
                    type="checkbox"
                    checked={data.affirmAuthorized}
                    onChange={(e) => update('affirmAuthorized', e.target.checked)}
                    className="mt-1 w-4 h-4 accent-red-600"
                  />
                  <span className="text-sm">
                    I am authorized to act on behalf of the rights holder
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-brand-950">
                  <input
                    type="checkbox"
                    checked={data.affirmAccurate}
                    onChange={(e) => update('affirmAccurate', e.target.checked)}
                    className="mt-1 w-4 h-4 accent-red-600"
                  />
                  <span className="text-sm">The information in this notice is accurate</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-brand-950">
                  <input
                    type="checkbox"
                    checked={data.affirmDmca}
                    onChange={(e) => update('affirmDmca', e.target.checked)}
                    className="mt-1 w-4 h-4 accent-red-600"
                  />
                  <span className="text-sm">
                    I understand DMCA penalties for false claims (17 U.S.C. § 512(f))
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4 border-t border-gray-800 pt-5">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Electronic Signature (type your name)
                  </label>
                  <input
                    type="text"
                    value={data.signature}
                    onChange={(e) => update('signature', e.target.value)}
                    placeholder="Your full legal name"
                    className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-serif italic"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Date</label>
                  <input
                    type="date"
                    value={TODAY}
                    readOnly
                    className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300"
                  />
                </div>
              </div>
            </section>

            {/* Submit */}
            <div className="bg-[#15151f] rounded-xl p-6">
              <button
                onClick={handleSubmit}
                className="w-full rounded-full bg-red-600 hover:bg-red-500 transition px-6 py-4 text-lg font-bold"
              >
                Submit Takedown
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">
                By submitting you agree to OPYNX's takedown policy.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <aside>
            <div className="bg-[#15151f] rounded-xl p-5 sticky top-6">
              <h3 className="text-lg font-bold mb-1">Recent Takedowns</h3>
              <p className="text-xs text-gray-400 mb-4">Last 5 from your label</p>
              <div className="space-y-2">
                {RECENT_TAKEDOWNS.map((t) => (
                  <div
                    key={t.id}
                    className="bg-brand-950 rounded-lg p-3 border border-gray-800"
                  >
                    <p className="font-semibold text-sm truncate">{t.track}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] ${STATUS_BADGE[t.status]}`}>
                        {t.status}
                      </span>
                      <p className="text-xs text-gray-500">{t.date}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-800 mt-5 pt-5 space-y-2 text-xs text-gray-400">
                <p>📨 Average response: 48 hours</p>
                <p>📊 Approval rate: 87%</p>
                <p>📞 Need help? <Link href="/contact" className="text-red-400 hover:text-red-300">Contact rights team</Link></p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
