'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

const genres = [
  'Hip-Hop', 'R&B', 'Electronic', 'Pop', 'Rock', 'Indie', 'Jazz',
  'Classical', 'Country', 'Latin', 'Afrobeats', 'Reggae', 'Metal',
  'Lo-Fi', 'Synthwave', 'Soul', 'Punk', 'Other',
];

const benefits = [
  { icon: '💰', title: 'Direct-to-Fan Revenue', desc: 'Sell music, merch, and tickets directly to your audience.' },
  { icon: '📊', title: '85% Payout', desc: 'Industry-leading payout rate on all sales and streams.' },
  { icon: '🎫', title: 'Ticket Sales', desc: 'Create and sell tickets for live events and virtual shows.' },
  { icon: '📋', title: 'Electronic Press Kit', desc: 'Professional EPK that updates automatically with your data.' },
  { icon: '📈', title: 'Advanced Analytics', desc: 'Deep insights into your audience, streams, and revenue.' },
  { icon: '✅', title: 'Verified Badge', desc: 'Stand out with a verified creator badge on your profile.' },
];

export default function ApplyPage() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    artistName: '',
    genre: '',
    yearsActive: '',
    instagram: '',
    twitter: '',
    spotify: '',
    soundcloud: '',
    monthlyListeners: '',
    totalPlays: '',
    whyJoin: '',
    termsAgreed: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, termsAgreed: e.target.checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.artistName || !form.genre || !form.termsAgreed) {
      toast('Please fill in required fields and agree to terms.', 'error');
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitting(false);
    setSubmitted(true);
    toast('Application submitted successfully!', 'success');
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl font-bold">Application Received!</h1>
        <p className="text-gray-400 text-center max-w-md">
          Thank you for applying to become a verified creator on OPYNX. Our team will review your application and get back to you within 48 hours.
        </p>
        <Link href="/" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-red-600/10 text-red-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <span>✅</span> Creator Verification Program
        </div>
        <h1 className="text-4xl font-bold mb-4">Become a Verified Creator</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Join the OPYNX creator program and unlock powerful tools to grow your music career, connect with fans, and earn more from your art.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Application Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="rounded-xl bg-[#15151f] p-6">
              <h2 className="text-xl font-bold mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Creator / Band Name *</label>
                  <input
                    type="text"
                    name="artistName"
                    value={form.artistName}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition"
                    placeholder="Your creator name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Genre *</label>
                  <select
                    name="genre"
                    value={form.genre}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-red-600 transition"
                  >
                    <option value="">Select genre</option>
                    {genres.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Years Active</label>
                  <input
                    type="number"
                    name="yearsActive"
                    value={form.yearsActive}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition"
                    placeholder="e.g. 3"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="rounded-xl bg-[#15151f] p-6">
              <h2 className="text-xl font-bold mb-4">Social Media Links</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Instagram</label>
                  <input
                    type="url"
                    name="instagram"
                    value={form.instagram}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition"
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Twitter / X</label>
                  <input
                    type="url"
                    name="twitter"
                    value={form.twitter}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition"
                    placeholder="https://x.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Spotify</label>
                  <input
                    type="url"
                    name="spotify"
                    value={form.spotify}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition"
                    placeholder="https://open.spotify.com/artist/..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">SoundCloud</label>
                  <input
                    type="url"
                    name="soundcloud"
                    value={form.soundcloud}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition"
                    placeholder="https://soundcloud.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Streaming Stats */}
            <div className="rounded-xl bg-[#15151f] p-6">
              <h2 className="text-xl font-bold mb-4">Streaming Stats</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Monthly Listeners (approx.)</label>
                  <input
                    type="number"
                    name="monthlyListeners"
                    value={form.monthlyListeners}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition"
                    placeholder="e.g. 5000"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Total Plays (all platforms)</label>
                  <input
                    type="number"
                    name="totalPlays"
                    value={form.totalPlays}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition"
                    placeholder="e.g. 100000"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Why Join */}
            <div className="rounded-xl bg-[#15151f] p-6">
              <h2 className="text-xl font-bold mb-4">Why Join OPYNX?</h2>
              <textarea
                name="whyJoin"
                value={form.whyJoin}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition resize-none"
                placeholder="Tell us about your music, your goals, and why OPYNX is the right platform for you..."
              />
            </div>

            {/* Upload Samples */}
            <div className="rounded-xl bg-[#15151f] p-6">
              <h2 className="text-xl font-bold mb-4">Music Samples</h2>
              <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center">
                <div className="text-4xl mb-3">🎵</div>
                <p className="text-gray-400 mb-2">Drag & drop your music files here, or click to browse</p>
                <p className="text-xs text-gray-500">MP3, WAV, FLAC up to 50MB each (max 3 files)</p>
                <button
                  type="button"
                  className="mt-4 px-4 py-2 rounded-lg bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition"
                >
                  Browse Files
                </button>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={form.termsAgreed}
                onChange={handleCheckbox}
                className="mt-1 w-4 h-4 accent-red-600"
              />
              <label htmlFor="terms" className="text-sm text-gray-400">
                I agree to the OPYNX{' '}
                <Link href="/terms" className="text-red-400 hover:underline">Terms of Service</Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-red-400 hover:underline">Privacy Policy</Link>.
                I confirm that all information provided is accurate. *
              </label>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto rounded-full bg-red-600 px-8 py-3 font-semibold text-white hover:bg-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
              <p className="text-xs text-gray-500 mt-3">Applications are reviewed within 48 hours. You&#39;ll receive an email notification with the result.</p>
            </div>
          </form>
        </div>

        {/* Benefits Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-xl bg-[#15151f] p-6 sticky top-8">
            <h3 className="text-lg font-bold mb-4">Creator Benefits</h3>
            <div className="space-y-4">
              {benefits.map((b) => (
                <div key={b.title} className="flex gap-3">
                  <span className="text-2xl">{b.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{b.title}</p>
                    <p className="text-xs text-gray-400">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-lg bg-red-600/10 border border-red-600/20">
              <p className="text-sm text-red-400 font-semibold mb-1">Already verified?</p>
              <p className="text-xs text-gray-400">
                Access your creator dashboard for analytics, uploads, and more.
              </p>
              <Link href="/dashboard" className="text-xs text-red-400 hover:underline mt-2 inline-block">
                Go to Dashboard &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
