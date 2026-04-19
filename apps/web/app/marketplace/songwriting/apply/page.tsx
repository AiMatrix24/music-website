'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/app/components/Toast';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { id: 'topline', label: 'Topline / Lyrics', icon: '✍️', desc: 'Write lyrics and topline melodies' },
  { id: 'beats', label: 'Beats / Production', icon: '🎹', desc: 'Sell beats with license tiers' },
  { id: 'mixing', label: 'Mixing & Mastering', icon: '🎛️', desc: 'Engineer mixes and mastering' },
  { id: 'cowriting', label: 'Co-writing Sessions', icon: '🎤', desc: 'Live collab booking' },
];

const GENRES = ['Pop', 'Hip Hop', 'R&B', 'Rock', 'Electronic', 'Country', 'Lo-fi', 'Jazz', 'Latin', 'Indie'];

export default function ApplyToListPage() {
  const { status } = useSession();
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<string>('');
  const [serviceTitle, setServiceTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [priceModel, setPriceModel] = useState<'flat' | 'hourly' | 'split' | 'tiered'>('flat');
  const [price, setPrice] = useState('');
  const [splitPercent, setSplitPercent] = useState('');
  const [turnaround, setTurnaround] = useState('7');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl mb-2">✍️</p>
        <p className="text-gray-400 text-lg">Sign in to list your services</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Sign In</Link>
      </div>
    );
  }

  const toggleGenre = (g: string) => {
    setGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  };

  const handleSubmit = () => {
    if (!category || !serviceTitle || !price) {
      toast('Please fill in all required fields', 'error');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast('Application submitted! We\'ll review within 48 hours.', 'success');
      router.push('/marketplace/songwriting');
    }, 1500);
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/marketplace/songwriting" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          ← Back to Marketplace
        </Link>

        <h1 className="text-3xl font-bold mb-2">Apply to List Your Services</h1>
        <p className="text-gray-400 mb-8">Become a verified service provider on OPYNX</p>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1 rounded ${s <= step ? 'bg-red-600' : 'bg-[#15151f]'}`} />
          ))}
        </div>

        {/* Step 1: Category */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">What service do you offer?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`p-5 rounded-xl text-left transition border-2 ${
                      category === c.id ? 'border-red-600 bg-red-900/10' : 'border-brand-800/30 bg-[#15151f] hover:border-red-600/50'
                    }`}
                  >
                    <p className="text-2xl mb-2">{c.icon}</p>
                    <p className="font-bold mb-1">{c.label}</p>
                    <p className="text-xs text-gray-500">{c.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Years of Experience *</label>
              <input
                type="number"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                placeholder="e.g. 5"
                className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none"
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!category || !yearsExperience}
              className="w-full rounded-full bg-red-600 py-3 font-semibold text-white hover:bg-red-500 transition disabled:opacity-50"
            >
              Next: Service Details →
            </button>
          </div>
        )}

        {/* Step 2: Service Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Service Title *</label>
              <input
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
                placeholder="e.g. Pro Topline Writer for Pop & R&B"
                className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your service, experience, and what makes you unique..."
                rows={5}
                className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Genres You Specialize In</label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                      genres.includes(g) ? 'bg-red-600 text-white' : 'bg-[#15151f] text-gray-400 hover:text-white border border-brand-800/30'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Portfolio URL (Spotify, SoundCloud, website)</label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://soundcloud.com/yourprofile"
                className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none"
              />
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 rounded-full border border-brand-800/30 py-3 font-semibold hover:border-red-600 transition">
                ← Back
              </button>
              <button onClick={() => setStep(3)} disabled={!serviceTitle || !description} className="flex-1 rounded-full bg-red-600 py-3 font-semibold text-white hover:bg-red-500 transition disabled:opacity-50">
                Next: Pricing →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Pricing */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">How do you want to charge?</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'flat', label: 'Flat Fee', desc: 'One price per project' },
                  { id: 'hourly', label: 'Hourly Rate', desc: 'Per hour billing' },
                  { id: 'split', label: 'Revenue Share', desc: 'Take a % of song revenue' },
                  { id: 'tiered', label: 'License Tiers', desc: 'Lease vs Exclusive (for beats)' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPriceModel(p.id as any)}
                    className={`p-4 rounded-xl text-left transition border-2 ${
                      priceModel === p.id ? 'border-red-600 bg-red-900/10' : 'border-brand-800/30 bg-[#15151f] hover:border-red-600/50'
                    }`}
                  >
                    <p className="font-bold text-sm">{p.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {priceModel === 'hourly' ? 'Hourly Rate ($)' : 'Starting Price ($)'} *
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="500"
                  className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-red-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Turnaround (days)</label>
                <input
                  type="number"
                  value={turnaround}
                  onChange={(e) => setTurnaround(e.target.value)}
                  placeholder="7"
                  className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-red-600 outline-none"
                />
              </div>
            </div>

            {priceModel === 'split' && (
              <div>
                <label className="block text-sm font-semibold mb-2">Songwriter Share (%)</label>
                <input
                  type="number"
                  value={splitPercent}
                  onChange={(e) => setSplitPercent(e.target.value)}
                  placeholder="25"
                  max="50"
                  className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-red-600 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Industry standard: 25-50% writer share</p>
              </div>
            )}

            <div className="rounded-xl bg-brand-950/50 p-4 text-xs text-gray-400">
              <p className="font-semibold text-white mb-2">OPYNX Service Fee</p>
              <p>OPYNX takes 10% of all transactions. You keep 90% of every booking.</p>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="flex-1 rounded-full border border-brand-800/30 py-3 font-semibold hover:border-red-600 transition">
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !price}
                className="flex-1 rounded-full bg-red-600 py-4 font-semibold text-white text-lg hover:bg-red-500 transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center mt-6">
          Applications reviewed within 48 hours. Approved providers get a verified badge.
        </p>
      </div>
    </div>
  );
}
