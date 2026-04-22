'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

type LabelType = 'major' | 'independent' | 'distributor' | 'diy' | '';

interface LabelVerifyData {
  // Section 1
  labelName: string;
  dba: string;
  yearFounded: string;
  countryIncorp: string;
  registrationNumber: string;
  website: string;
  type: LabelType;
  // Section 2
  businessRegFile: string;
  contractFile: string;
  catalogProofUrl: string;
  ceoLinkedIn: string;
  // Section 3
  rosterCount: string;
  releasesCount: string;
  sampleArtists: string;
  partners: string[];
  genres: string[];
}

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Japan',
  'Brazil',
  'Mexico',
  'Other',
];

const LABEL_TYPES: { value: LabelType; label: string; desc: string }[] = [
  { value: 'major', label: 'Major Label', desc: 'Universal, Sony, Warner family' },
  { value: 'independent', label: 'Independent', desc: 'Established indie label' },
  { value: 'distributor', label: 'Distributor', desc: 'Distrokid, Tunecore, etc.' },
  { value: 'diy', label: 'DIY Imprint', desc: 'Self-run label' },
];

const PARTNERS = ['Universal', 'Warner', 'Sony', 'Distrokid', 'Believe', 'Other'];

const GENRES = [
  'Hip-Hop',
  'R&B',
  'Pop',
  'Rock',
  'Electronic',
  'Indie',
  'Country',
  'Latin',
  'Jazz',
  'Classical',
  'Metal',
  'Folk',
  'Reggae',
  'Afrobeats',
  'K-pop',
];

const TRUST_BENEFITS = [
  { icon: '🔒', label: 'Claim and protect your masters' },
  { icon: '💰', label: 'Receive automatic royalty splits' },
  { icon: '🚫', label: 'Request takedowns of unauthorized releases' },
  { icon: '✓', label: 'Display verified badge' },
  { icon: '👥', label: 'Access roster management tools' },
];

export default function LabelVerifyPage() {
  const { status } = useSession();
  const { toast } = useToast();

  const [data, setData] = useState<LabelVerifyData>({
    labelName: '',
    dba: '',
    yearFounded: '',
    countryIncorp: '',
    registrationNumber: '',
    website: '',
    type: '',
    businessRegFile: '',
    contractFile: '',
    catalogProofUrl: '',
    ceoLinkedIn: '',
    rosterCount: '',
    releasesCount: '',
    sampleArtists: '',
    partners: [],
    genres: [],
  });

  const update = <K extends keyof LabelVerifyData>(key: K, value: LabelVerifyData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const togglePartner = (p: string) => {
    setData((prev) => ({
      ...prev,
      partners: prev.partners.includes(p)
        ? prev.partners.filter((x) => x !== p)
        : [...prev.partners, p],
    }));
  };

  const toggleGenre = (g: string) => {
    setData((prev) => ({
      ...prev,
      genres: prev.genres.includes(g)
        ? prev.genres.filter((x) => x !== g)
        : [...prev.genres, g],
    }));
  };

  const handleSubmit = () => {
    if (status !== 'authenticated') {
      toast('Please sign in to submit verification', 'error');
      return;
    }
    if (!data.labelName) {
      toast('Label name is required', 'error');
      return;
    }
    toast('Verification submitted. Review takes 7-14 business days.', 'success');
  };

  return (
    <div className="min-h-screen bg-brand-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Back nav */}
        <Link
          href="/labels/claim"
          className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-6"
        >
          ← Back to Label Portal
        </Link>

        {/* Hero */}
        <div className="text-center mb-10">
          <p className="text-5xl mb-3">🏷️</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Verify Your Record Label</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Get verified to claim master recordings and manage your roster
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-6">
            {/* Section 1: Label Info */}
            <section className="bg-[#15151f] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-1">Section 1 — Label Information</h2>
              <p className="text-sm text-gray-400 mb-5">Tell us about your label</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Label Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={data.labelName}
                    onChange={(e) => update('labelName', e.target.value)}
                    className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">DBA / Trading Name</label>
                  <input
                    type="text"
                    value={data.dba}
                    onChange={(e) => update('dba', e.target.value)}
                    placeholder="If different from legal name"
                    className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Year Founded</label>
                  <input
                    type="number"
                    min={1900}
                    max={2026}
                    value={data.yearFounded}
                    onChange={(e) => update('yearFounded', e.target.value)}
                    placeholder="2018"
                    className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Country of Incorporation</label>
                  <select
                    value={data.countryIncorp}
                    onChange={(e) => update('countryIncorp', e.target.value)}
                    className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Business Registration / EIN
                  </label>
                  <input
                    type="text"
                    value={data.registrationNumber}
                    onChange={(e) => update('registrationNumber', e.target.value)}
                    className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Website URL</label>
                  <input
                    type="url"
                    value={data.website}
                    onChange={(e) => update('website', e.target.value)}
                    placeholder="https://yourlabel.com"
                    className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="block text-sm font-semibold mb-2">Label Type</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {LABEL_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => update('type', t.value)}
                      className={`text-left rounded-lg p-3 transition ${
                        data.type === t.value
                          ? 'bg-red-600 text-white'
                          : 'bg-brand-950 border border-gray-700 hover:border-red-500'
                      }`}
                    >
                      <p className="font-semibold text-sm">{t.label}</p>
                      <p className="text-xs opacity-75 mt-1">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Section 2: Documents */}
            <section className="bg-[#15151f] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-1">Section 2 — Verification Documents</h2>
              <p className="text-sm text-gray-400 mb-5">Upload proof of operations</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Business Registration Certificate
                  </label>
                  <div className="border-2 border-dashed border-gray-700 hover:border-red-500 transition rounded-lg p-6 text-center cursor-pointer">
                    <p className="text-2xl mb-1">📄</p>
                    <p className="text-sm font-semibold">Drop your registration certificate</p>
                    <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG • Max 10MB</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Sample Creator Contract (redacted)
                  </label>
                  <div className="border-2 border-dashed border-gray-700 hover:border-red-500 transition rounded-lg p-6 text-center cursor-pointer">
                    <p className="text-2xl mb-1">📑</p>
                    <p className="text-sm font-semibold">Drop a redacted contract sample</p>
                    <p className="text-xs text-gray-500 mt-1">Redact PII • PDF, DOCX • Max 10MB</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Catalog Distribution Proof
                  </label>
                  <input
                    type="url"
                    value={data.catalogProofUrl}
                    onChange={(e) => update('catalogProofUrl', e.target.value)}
                    placeholder="https://open.spotify.com/artist/... or Apple Music page URL"
                    className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    LinkedIn URL of Label CEO/Owner
                  </label>
                  <input
                    type="url"
                    value={data.ceoLinkedIn}
                    onChange={(e) => update('ceoLinkedIn', e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
            </section>

            {/* Section 3: Roster */}
            <section className="bg-[#15151f] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-1">Section 3 — Roster & Catalog</h2>
              <p className="text-sm text-gray-400 mb-5">Help us understand your scope</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Number of Creators</label>
                  <input
                    type="number"
                    min={0}
                    value={data.rosterCount}
                    onChange={(e) => update('rosterCount', e.target.value)}
                    placeholder="12"
                    className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Number of Releases</label>
                  <input
                    type="number"
                    min={0}
                    value={data.releasesCount}
                    onChange={(e) => update('releasesCount', e.target.value)}
                    placeholder="48"
                    className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Sample Creator Names</label>
                <textarea
                  value={data.sampleArtists}
                  onChange={(e) => update('sampleArtists', e.target.value)}
                  rows={3}
                  placeholder="One per line, or comma-separated"
                  className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">
                  Major Distribution Partners
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {PARTNERS.map((p) => (
                    <label
                      key={p}
                      className="flex items-center gap-2 bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 cursor-pointer hover:border-red-500 transition"
                    >
                      <input
                        type="checkbox"
                        checked={data.partners.includes(p)}
                        onChange={() => togglePartner(p)}
                        className="w-4 h-4 accent-red-600"
                      />
                      <span className="text-sm">{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Genre Focus</label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((g) => {
                    const active = data.genres.includes(g);
                    return (
                      <button
                        key={g}
                        onClick={() => toggleGenre(g)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          active
                            ? 'bg-red-600 text-white'
                            : 'bg-brand-950 border border-gray-700 hover:border-red-500'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Submit */}
            <div className="bg-[#15151f] rounded-xl p-6">
              <button
                onClick={handleSubmit}
                className="w-full rounded-full bg-red-600 hover:bg-red-500 transition px-6 py-4 text-lg font-bold"
              >
                Submit for Verification
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">
                Review takes 7-14 business days. We may request additional documentation.
              </p>
            </div>
          </div>

          {/* Trust sidebar */}
          <aside className="space-y-5">
            <div className="bg-[#15151f] rounded-xl p-5 sticky top-6">
              <h3 className="text-lg font-bold mb-4">Why get verified?</h3>
              <ul className="space-y-3">
                {TRUST_BENEFITS.map((b) => (
                  <li key={b.label} className="flex items-start gap-3">
                    <span className="text-xl">{b.icon}</span>
                    <span className="text-sm text-gray-300">{b.label}</span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-gray-800 mt-5 pt-5">
                <p className="text-xs text-gray-400 mb-2">Verified labels get</p>
                <div className="inline-flex items-center gap-2 bg-emerald-600/20 text-emerald-300 border border-emerald-600/30 px-3 py-1.5 rounded-full text-xs">
                  <span>✓</span>
                  <span className="font-semibold">Verified Label badge</span>
                </div>
              </div>

              {status !== 'authenticated' && (
                <div className="border-t border-gray-800 mt-5 pt-5">
                  <p className="text-xs text-gray-400 mb-2">
                    Sign in to submit your application
                  </p>
                  <Link
                    href="/auth/login"
                    className="block text-center w-full rounded-full bg-red-600 hover:bg-red-500 transition px-4 py-2 text-sm font-semibold"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
