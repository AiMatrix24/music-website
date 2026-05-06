'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

/**
 * DMCA §512(c)(3) takedown submission form. Public — rights holders
 * aren't necessarily OPYNX users. Rate-limited at the procedure level.
 *
 * Counter-notice flow is deferred to v1.1; a "contact us" path is the
 * fallback for now (alleged infringers email support).
 */
export default function DmcaPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const [targetUrl, setTargetUrl] = useState('');
  const [claimantName, setClaimantName] = useState('');
  const [claimantEmail, setClaimantEmail] = useState('');
  const [claimantOrganization, setClaimantOrganization] = useState('');
  const [claimantAddress, setClaimantAddress] = useState('');
  const [claimantPhone, setClaimantPhone] = useState('');
  const [infringedWorkTitle, setInfringedWorkTitle] = useState('');
  const [infringedWorkOwner, setInfringedWorkOwner] = useState('');
  const [description, setDescription] = useState('');
  const [goodFaithStatement, setGoodFaithStatement] = useState(false);
  const [accuracyStatement, setAccuracyStatement] = useState(false);
  const [signature, setSignature] = useState('');

  const submit = trpc.dmca.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast('Notice submitted — we\'ll review within 48 hours', 'success');
    },
    onError: (err) => toast(err.message || 'Submission failed', 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goodFaithStatement || !accuracyStatement) {
      toast('Both sworn statements are required', 'error');
      return;
    }
    if (!signature.trim()) {
      toast('Electronic signature is required', 'error');
      return;
    }

    let trackId: string | undefined;
    const match = targetUrl.match(/\/track\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (match) trackId = match[1];

    submit.mutate({
      targetUrl,
      trackId,
      claimantName: claimantName.trim(),
      claimantEmail: claimantEmail.trim(),
      claimantOrganization: claimantOrganization.trim() || undefined,
      claimantAddress: claimantAddress.trim(),
      claimantPhone: claimantPhone.trim() || undefined,
      infringedWorkTitle: infringedWorkTitle.trim(),
      infringedWorkOwner: infringedWorkOwner.trim(),
      description: description.trim(),
      goodFaithStatement,
      accuracyStatement,
      signature: signature.trim(),
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="text-3xl font-black mb-3">Notice received</h1>
          <p className="text-gray-400 mb-6">
            Your DMCA takedown notice has been submitted to OPYNX. Our team will review it within 48 hours and email you with the decision at the address you provided. If you need to follow up sooner, write to <a href="mailto:dmca@opynx.com" className="text-red-400 hover:underline">dmca@opynx.com</a> with the work title in the subject.
          </p>
          <Link href="/" className="text-red-400 hover:text-red-300 transition">← Back to OPYNX</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-6 inline-block">← Back to OPYNX</Link>

        <h1 className="text-3xl font-black mb-2">DMCA Takedown Notice</h1>
        <p className="text-sm text-gray-500 mb-6">
          File a takedown notice under 17 U.S.C. § 512(c)(3) against allegedly infringing content on OPYNX. False statements made under penalty of perjury can result in liability — please review the requirements before submitting.
        </p>

        <div className="rounded-2xl bg-yellow-950/20 border border-yellow-700/30 p-4 mb-6 text-sm">
          <p className="font-bold text-yellow-400 mb-1">Before you file</p>
          <ul className="text-yellow-200/80 text-xs space-y-1 list-disc pl-5">
            <li>You must own the rights to the work, or be authorized to act on the owner's behalf.</li>
            <li>Your contact information must be real — we'll use it to reach you about the notice and may forward it to the alleged infringer if they file a counter-notice.</li>
            <li>Knowingly false statements are subject to civil and criminal liability under § 512(f).</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-2xl bg-[#15151f] p-5 space-y-4">
            <h2 className="text-lg font-bold">What's being infringed</h2>
            <Field label="URL of the allegedly infringing content on OPYNX" hint="Paste the full /track/[id] link.">
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                required
                placeholder="https://opynx.com/track/abc-123-..."
                className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-red-600 outline-none"
              />
            </Field>
            <Field label="Title of the work you own">
              <input
                type="text"
                value={infringedWorkTitle}
                onChange={(e) => setInfringedWorkTitle(e.target.value)}
                required
                maxLength={500}
                className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white focus:border-red-600 outline-none"
              />
            </Field>
            <Field label="Rights holder (you or the entity you represent)">
              <input
                type="text"
                value={infringedWorkOwner}
                onChange={(e) => setInfringedWorkOwner(e.target.value)}
                required
                maxLength={500}
                className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white focus:border-red-600 outline-none"
              />
            </Field>
            <Field label="Describe the infringement" hint="What part is yours? Where can the original be found? Any other context.">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={20}
                maxLength={5000}
                rows={5}
                className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white focus:border-red-600 outline-none resize-none"
              />
            </Field>
          </div>

          <div className="rounded-2xl bg-[#15151f] p-5 space-y-4">
            <h2 className="text-lg font-bold">Your contact information</h2>
            <p className="text-xs text-gray-500">Required by § 512(c)(3)(A). False or fake contact info invalidates the notice.</p>
            <Field label="Full legal name">
              <input
                type="text"
                value={claimantName}
                onChange={(e) => setClaimantName(e.target.value)}
                required
                maxLength={200}
                className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white focus:border-red-600 outline-none"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={claimantEmail}
                onChange={(e) => setClaimantEmail(e.target.value)}
                required
                maxLength={200}
                className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white focus:border-red-600 outline-none"
              />
            </Field>
            <Field label="Organization (optional, e.g., 'Acme Records')">
              <input
                type="text"
                value={claimantOrganization}
                onChange={(e) => setClaimantOrganization(e.target.value)}
                maxLength={200}
                className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white focus:border-red-600 outline-none"
              />
            </Field>
            <Field label="Mailing address">
              <textarea
                value={claimantAddress}
                onChange={(e) => setClaimantAddress(e.target.value)}
                required
                minLength={5}
                maxLength={1000}
                rows={3}
                className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white focus:border-red-600 outline-none resize-none"
              />
            </Field>
            <Field label="Phone (optional)">
              <input
                type="tel"
                value={claimantPhone}
                onChange={(e) => setClaimantPhone(e.target.value)}
                maxLength={50}
                className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white focus:border-red-600 outline-none"
              />
            </Field>
          </div>

          <div className="rounded-2xl bg-[#15151f] p-5 space-y-3 border border-red-800/30">
            <h2 className="text-lg font-bold">Sworn statements</h2>
            <p className="text-xs text-gray-500">Both required by 17 U.S.C. § 512(c)(3)(A)(v) and (vi).</p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={goodFaithStatement}
                onChange={(e) => setGoodFaithStatement(e.target.checked)}
                className="mt-1 accent-red-600"
              />
              <span className="text-sm text-gray-300">
                I have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accuracyStatement}
                onChange={(e) => setAccuracyStatement(e.target.checked)}
                className="mt-1 accent-red-600"
              />
              <span className="text-sm text-gray-300">
                The information in this notification is accurate, and under penalty of perjury, I am the owner of an exclusive right that is allegedly infringed, or am authorized to act on the owner's behalf.
              </span>
            </label>
            <Field label="Electronic signature (type your full name)">
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                required
                minLength={2}
                maxLength={200}
                className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white focus:border-red-600 outline-none font-serif italic"
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={submit.isPending}
            className="w-full rounded-full bg-red-600 hover:bg-red-500 px-5 py-3 text-sm font-bold text-white transition disabled:opacity-50"
          >
            {submit.isPending ? 'Submitting…' : 'Submit takedown notice'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-600 mb-1">{hint}</p>}
      {children}
    </div>
  );
}
