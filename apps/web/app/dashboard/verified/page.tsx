'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useUploadThing } from '@/lib/uploadthing-client';
import { useToast } from '@/app/components/Toast';

export default function VerifiedPage() {
  const { status } = useSession();
  const enabled = status === 'authenticated';

  const meQuery = trpc.users.getProfile.useQuery(undefined, { enabled });
  const appQuery = trpc.verification.getMine.useQuery(undefined, { enabled });

  if (!enabled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-gray-400">Sign in to apply for verification.</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Sign In</Link>
      </div>
    );
  }

  if (meQuery.isLoading || appQuery.isLoading) {
    return <div className="min-h-screen py-16 px-6 text-center text-gray-500">Loading…</div>;
  }

  const isVerified = !!meQuery.data?.verifiedAt;
  const app = appQuery.data;

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          Verification
          {isVerified && (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white text-sm" title="Verified">
              ✓
            </span>
          )}
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          A blue ✓ next to your name shows fans that you're who you say you are.
        </p>

        {isVerified ? (
          <VerifiedPanel verifiedAt={meQuery.data!.verifiedAt!} />
        ) : app && app.status === 'pending' ? (
          <PendingPanel app={app} />
        ) : app && app.status === 'rejected' ? (
          <RejectedPanel app={app} />
        ) : (
          <ApplicationForm />
        )}
      </div>
    </div>
  );
}

// ───────── State panels ─────────

function VerifiedPanel({ verifiedAt }: { verifiedAt: Date | string }) {
  return (
    <div className="rounded-2xl bg-[#15151f] border border-blue-600/30 p-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 text-3xl mb-4">✓</div>
      <h2 className="text-xl font-bold mb-2">You're verified</h2>
      <p className="text-sm text-gray-400">
        Verified since {new Date(verifiedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
      </p>
    </div>
  );
}

function PendingPanel({ app }: { app: { id: string; submittedAt: Date | string; legalName: string } }) {
  const utils = trpc.useUtils();
  const cancelMutation = trpc.verification.cancelMine.useMutation({
    onSuccess: () => utils.verification.getMine.invalidate(),
  });
  return (
    <div className="rounded-2xl bg-[#15151f] border border-amber-600/30 p-8">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 text-xl mb-3">⏳</div>
      <h2 className="text-lg font-bold mb-2">Application pending review</h2>
      <p className="text-sm text-gray-400 mb-1">Submitted {new Date(app.submittedAt).toLocaleDateString()}</p>
      <p className="text-sm text-gray-400 mb-5">Name on application: {app.legalName}</p>
      <p className="text-xs text-gray-500 mb-5">
        Reviews typically take 1–3 business days. You'll get a notification when there's a decision.
      </p>
      <button
        onClick={() => {
          if (confirm('Cancel your application? You can resubmit any time.')) cancelMutation.mutate();
        }}
        disabled={cancelMutation.isPending}
        className="text-xs text-gray-500 hover:text-red-400 transition disabled:opacity-50"
      >
        Cancel application
      </button>
    </div>
  );
}

function RejectedPanel({ app }: { app: { decisionReason: string | null; decidedAt: Date | string | null } }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#15151f] border border-red-600/30 p-6">
        <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-sm">×</span>
          Previous application not approved
        </h2>
        {app.decisionReason && (
          <p className="text-sm text-gray-300 mt-3 p-3 bg-brand-950/50 rounded-lg">
            <strong>Reason:</strong> {app.decisionReason}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-3">
          You can submit a new application below addressing the feedback.
        </p>
      </div>
      <ApplicationForm />
    </div>
  );
}

// ───────── The form itself ─────────

function ApplicationForm() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const [legalName, setLegalName] = useState('');
  const [stageName, setStageName] = useState('');
  const [country, setCountry] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [pitch, setPitch] = useState('');
  const [idImageUrl, setIdImageUrl] = useState('');

  const { startUpload, isUploading } = useUploadThing('imageUpload', {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl ?? (res?.[0] as { url?: string })?.url;
      if (url) setIdImageUrl(url);
    },
    onUploadError: (e) => toast(`Upload failed: ${e.message}`),
  });

  const applyMutation = trpc.verification.submit.useMutation({
    onSuccess: () => {
      toast('Application submitted! We\'ll review within 1–3 days.');
      utils.verification.getMine.invalidate();
    },
    onError: (e) => toast(e.message),
  });

  const canSubmit =
    legalName.trim().length >= 2 &&
    country.length === 2 &&
    portfolioUrl.trim().length > 0 &&
    pitch.trim().length >= 20 &&
    idImageUrl.length > 0 &&
    !applyMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await applyMutation.mutateAsync({
      legalName: legalName.trim(),
      stageName: stageName.trim() || undefined,
      country: country.toUpperCase(),
      portfolioUrl: portfolioUrl.trim(),
      pitch: pitch.trim(),
      idImageKey: idImageUrl,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl bg-[#15151f] p-6">
        <h2 className="text-lg font-bold mb-4">Apply for the verified badge</h2>

        <div className="space-y-5">
          <Field label="Legal name" hint="Must match the name on your government ID.">
            <input
              type="text" value={legalName} onChange={(e) => setLegalName(e.target.value)}
              maxLength={200} required
              className="w-full bg-[#0f0f17] border border-brand-800/30 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none"
            />
          </Field>

          <Field label="Stage / brand name" hint="If different from your legal name. Optional.">
            <input
              type="text" value={stageName} onChange={(e) => setStageName(e.target.value)}
              maxLength={200}
              className="w-full bg-[#0f0f17] border border-brand-800/30 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none"
            />
          </Field>

          <Field label="Country" hint="ISO code, e.g. US, GB, BR, CL.">
            <input
              type="text" value={country} onChange={(e) => setCountry(e.target.value.slice(0, 2).toUpperCase())}
              maxLength={2} required placeholder="US"
              className="w-full bg-[#0f0f17] border border-brand-800/30 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none uppercase"
            />
          </Field>

          <Field label="Portfolio link" hint="Your existing presence — Bandcamp, SoundCloud, your website, etc.">
            <input
              type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)}
              required placeholder="https://"
              className="w-full bg-[#0f0f17] border border-brand-800/30 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none"
            />
          </Field>

          <Field label="Why should you be verified?" hint="20–2000 characters. Be specific about your work.">
            <textarea
              value={pitch} onChange={(e) => setPitch(e.target.value)}
              rows={5} maxLength={2000} minLength={20} required
              className="w-full bg-[#0f0f17] border border-brand-800/30 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none resize-none"
            />
            <p className="text-xs text-gray-600 mt-1">{pitch.length}/2000</p>
          </Field>

          <Field
            label="Government ID photo"
            hint="Driver's license, passport, or national ID. Auto-deleted 30 days after the decision."
          >
            {idImageUrl ? (
              <div className="flex items-center gap-3 p-3 bg-[#0f0f17] border border-brand-800/30 rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={idImageUrl} alt="" className="w-16 h-16 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-green-400 font-semibold">✓ Uploaded</p>
                  <p className="text-xs text-gray-500 truncate">Stored on UploadThing.</p>
                </div>
                <button
                  type="button" onClick={() => setIdImageUrl('')}
                  className="text-xs text-gray-500 hover:text-red-400"
                >
                  Replace
                </button>
              </div>
            ) : (
              <input
                type="file" accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) startUpload([file]);
                }}
                disabled={isUploading}
                className="block w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-brand-950 file:text-gray-300 file:font-semibold hover:file:bg-brand-900 disabled:opacity-50"
              />
            )}
          </Field>
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-full bg-red-600 hover:bg-red-500 px-5 py-3 text-sm font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {applyMutation.isPending ? 'Submitting…' : 'Submit Application'}
      </button>

      <p className="text-xs text-gray-500 text-center">
        By submitting, you confirm the information is accurate. False information will result in account suspension.
      </p>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-600 mb-2">{hint}</p>}
      {children}
    </div>
  );
}
