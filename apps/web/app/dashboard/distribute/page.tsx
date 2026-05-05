'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

// Generic descriptors per project rule (no branded platform names in user-facing copy).
const TIERS = [
  { value: 'major-streaming', label: 'Major streaming services' },
  { value: 'video-audio-hybrid', label: 'Video-audio hybrid platforms' },
  { value: 'social-platforms', label: 'Social platforms' },
  { value: 'high-fidelity', label: 'High-fidelity / lossless services' },
  { value: 'regional', label: 'Regional services' },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending review',
  in_review: 'In review',
  submitted: 'Forwarded to aggregator',
  live: 'Live on platforms',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
  in_review: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  submitted: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
  live: 'bg-green-600/20 text-green-400 border-green-600/30',
  rejected: 'bg-red-600/20 text-red-400 border-red-600/30',
  cancelled: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
};

export default function DistributePage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const [showForm, setShowForm] = useState(false);
  const [subjectType, setSubjectType] = useState<'track' | 'album'>('track');
  const [subjectId, setSubjectId] = useState('');
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [releaseDate, setReleaseDate] = useState('');
  const [copyrightCertified, setCopyrightCertified] = useState(false);
  const [splitsConfirmed, setSplitsConfirmed] = useState(false);
  const [creatorNotes, setCreatorNotes] = useState('');

  const myTracks = trpc.tracks.list.useQuery(
    { limit: 100, userId: session?.user?.id ?? '' },
    { enabled: status === 'authenticated' && !!session?.user?.id }
  );
  const myAlbums = trpc.albums.list.useQuery(
    { limit: 50, userId: session?.user?.id ?? '' },
    { enabled: status === 'authenticated' && !!session?.user?.id }
  );
  const submissions = trpc.distribution.listMine.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  const submitMutation = trpc.distribution.submit.useMutation({
    onSuccess: () => {
      toast('Submission received — we\'ll review and forward to our distributor', 'success');
      utils.distribution.listMine.invalidate();
      setShowForm(false);
      setSubjectId('');
      setSelectedTiers([]);
      setReleaseDate('');
      setCopyrightCertified(false);
      setSplitsConfirmed(false);
      setCreatorNotes('');
    },
    onError: (err) => toast(err.message || 'Submission failed', 'error'),
  });

  const cancelMutation = trpc.distribution.cancel.useMutation({
    onSuccess: () => {
      toast('Submission cancelled', 'success');
      utils.distribution.listMine.invalidate();
    },
    onError: (err) => toast(err.message || 'Cancel failed', 'error'),
  });

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Sign in to manage distribution</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const toggleTier = (tier: string) => {
    setSelectedTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  const handleSubmit = () => {
    if (!subjectId) {
      toast(`Pick a ${subjectType}`, 'error');
      return;
    }
    if (selectedTiers.length === 0) {
      toast('Pick at least one platform tier', 'error');
      return;
    }
    if (!copyrightCertified || !splitsConfirmed) {
      toast('You must certify copyright + confirm splits', 'error');
      return;
    }
    submitMutation.mutate({
      subjectType,
      subjectId,
      targetTiers: selectedTiers,
      releaseDate: releaseDate ? new Date(releaseDate).toISOString() : undefined,
      copyrightCertified,
      splitsConfirmed,
      creatorNotes: creatorNotes.trim() || undefined,
    });
  };

  const subjectOptions = subjectType === 'track' ? myTracks.data ?? [] : myAlbums.data ?? [];

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Distribution</h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-full bg-red-600 hover:bg-red-500 px-5 py-2 text-sm font-bold text-white transition"
          >
            {showForm ? 'Cancel' : '+ New Submission'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-8">
          Request to push a track or album out to streaming services. We review and forward each
          submission to our distribution partner manually — turnaround is usually a few days.
        </p>

        {showForm && (
          <div className="rounded-2xl bg-[#15151f] p-6 mb-8 space-y-5 border border-brand-800/30">
            <h2 className="text-lg font-bold">Submit for distribution</h2>

            {/* What */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">What are you distributing?</label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => { setSubjectType('track'); setSubjectId(''); }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${subjectType === 'track' ? 'bg-red-600 text-white' : 'bg-brand-950 text-gray-400 hover:text-white'}`}
                >
                  Track
                </button>
                <button
                  type="button"
                  onClick={() => { setSubjectType('album'); setSubjectId(''); }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${subjectType === 'album' ? 'bg-red-600 text-white' : 'bg-brand-950 text-gray-400 hover:text-white'}`}
                >
                  Album
                </button>
              </div>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-red-600 outline-none transition"
              >
                <option value="">Select a {subjectType}…</option>
                {subjectOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
              {subjectOptions.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  No {subjectType}s yet. {subjectType === 'track' ? <Link href="/dashboard/upload" className="text-red-400 hover:underline">Upload one</Link> : <Link href="/dashboard/albums" className="text-red-400 hover:underline">Create one</Link>} first.
                </p>
              )}
            </div>

            {/* Tiers */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Target platform tiers</label>
              <div className="flex flex-wrap gap-2">
                {TIERS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => toggleTier(t.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${selectedTiers.includes(t.value) ? 'bg-red-600 text-white' : 'bg-brand-950 text-gray-400 hover:text-white border border-brand-800/40'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">Pick all that apply. Admin maps these to our distributor's selections.</p>
            </div>

            {/* Release date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Preferred release date (optional)</label>
              <input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-red-600 outline-none transition"
              />
              <p className="text-xs text-gray-600 mt-1">Leave blank to release as soon as the distributor approves.</p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Notes for review (optional)</label>
              <textarea
                value={creatorNotes}
                onChange={(e) => setCreatorNotes(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Anything we should know? (existing ISRC, prior releases under another name, sample clearances, etc.)"
                className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition resize-none"
              />
            </div>

            {/* Certifications */}
            <div className="space-y-2 rounded-xl bg-brand-950/50 p-4 border border-brand-800/40">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyrightCertified}
                  onChange={(e) => setCopyrightCertified(e.target.checked)}
                  className="mt-1 accent-red-600"
                />
                <span className="text-sm text-gray-300">
                  I certify that I own or control all the rights to the recording, composition, lyrics, and any samples in this submission, and that I'm authorized to distribute it.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={splitsConfirmed}
                  onChange={(e) => setSplitsConfirmed(e.target.checked)}
                  className="mt-1 accent-red-600"
                />
                <span className="text-sm text-gray-300">
                  I will configure royalty splits for this {subjectType} (collaborators, publishers, etc.) before any earnings post. The splits config UI is coming soon — for now, any earnings sit in pending until splits are finalized.
                </span>
              </label>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="w-full rounded-full bg-red-600 hover:bg-red-500 px-5 py-3 text-sm font-bold text-white transition disabled:opacity-50"
            >
              {submitMutation.isPending ? 'Submitting…' : 'Submit for distribution'}
            </button>
          </div>
        )}

        {/* History */}
        <h2 className="text-lg font-bold mb-4">Your submissions</h2>
        {submissions.isLoading ? (
          <div className="rounded-2xl bg-[#15151f] p-12 text-center text-gray-500">Loading…</div>
        ) : submissions.data && submissions.data.length > 0 ? (
          <div className="space-y-3">
            {submissions.data.map((s) => (
              <div key={s.id} className="rounded-xl bg-[#15151f] p-5 border border-brand-800/20">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold capitalize">{s.subjectType}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Submitted {new Date(s.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_COLORS[s.status] ?? STATUS_COLORS.pending}`}>
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 my-2">
                  {s.targetTiers.map((tier) => {
                    const t = TIERS.find((x) => x.value === tier);
                    return (
                      <span key={tier} className="text-[10px] uppercase tracking-wide bg-brand-950 text-gray-400 px-2 py-0.5 rounded-full">
                        {t?.label ?? tier}
                      </span>
                    );
                  })}
                </div>
                {s.adminNotes && (
                  <div className="mt-3 rounded-lg bg-brand-950/60 p-3 text-xs text-gray-300">
                    <p className="font-semibold text-gray-500 mb-1">Note from review:</p>
                    {s.adminNotes}
                  </div>
                )}
                {(s.status === 'pending' || s.status === 'in_review') && (
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        if (confirm('Cancel this submission?')) cancelMutation.mutate({ id: s.id });
                      }}
                      disabled={cancelMutation.isPending}
                      className="text-xs text-gray-500 hover:text-red-400 transition disabled:opacity-50"
                    >
                      Cancel submission
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#15151f] p-12 text-center">
            <p className="text-4xl mb-3">📡</p>
            <p className="text-gray-400 mb-4">No submissions yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-full bg-red-600 hover:bg-red-500 px-5 py-2 text-sm font-bold text-white transition"
            >
              + New Submission
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
