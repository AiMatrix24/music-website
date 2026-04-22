'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

/* ── Constants ── */
const TOTAL_STEPS = 5;

const GENRE_OPTIONS = [
  'Hip-Hop', 'R&B', 'Pop', 'Rock', 'Electronic', 'Latin', 'Jazz',
  'Classical', 'Country', 'Reggaeton', 'Afrobeats', 'Indie', 'Lo-fi', 'Metal',
];

const QR_CONTEXTS = [
  { id: 'merch', label: 'Merchandise' },
  { id: 'event', label: 'Live Event' },
  { id: 'album', label: 'Album / EP' },
  { id: 'profile', label: 'Creator Profile' },
];

const STEP_TITLES = [
  'Set Up Your Profile',
  'Upload Your First Track',
  'Set Up Your First QR Code',
  'Generate Your Embed Widget',
  'Share Your First Link',
];

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const [step, setStep] = useState(1);

  // Step 1 state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Step 2 state
  const [trackTitle, setTrackTitle] = useState('');
  const [trackGenre, setTrackGenre] = useState('');

  // Step 3 state
  const [qrContext, setQrContext] = useState('profile');
  const [qrGenerated, setQrGenerated] = useState(false);

  // Step 4 state
  const [embedCopied, setEmbedCopied] = useState(false);

  // Step 5 state
  const [profileCopied, setProfileCopied] = useState(false);

  /* ── Auth gate ── */
  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Sign in to begin onboarding</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Sign In</Link>
      </div>
    );
  }

  const username = session?.user?.name ?? 'creator';
  const profileUrl = `https://opynx.com/${username}`;
  const embedCode = `<iframe src="${profileUrl}/embed" width="350" height="160" frameborder="0" allow="autoplay; encrypted-media" loading="lazy"></iframe>`;
  const qrUrl = `https://opynx.com/qr/${username}/${qrContext}`;

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : prev.length < 5 ? [...prev, g] : prev
    );
  };

  const nextStep = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleComplete = () => {
    toast("You're all set! Welcome to OPYNX Creator Studio.", 'success');
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-6 inline-block">
          &larr; Dashboard
        </Link>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <button
                onClick={() => setStep(i + 1)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                  i + 1 === step
                    ? 'bg-red-600 text-white'
                    : i + 1 < step
                      ? 'bg-red-600/30 text-red-400'
                      : 'bg-gray-700 text-gray-500'
                }`}
              >
                {i + 1 < step ? '&#10003;' : i + 1}
              </button>
              {i < TOTAL_STEPS - 1 && (
                <div className={`w-8 h-0.5 ${i + 1 < step ? 'bg-red-600/40' : 'bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Title */}
        <h1 className="text-2xl md:text-3xl font-black text-center mb-2">
          Step {step}: {STEP_TITLES[step - 1]}
        </h1>
        <p className="text-center text-gray-400 text-sm mb-8">
          {step} of {TOTAL_STEPS}
        </p>

        {/* Step Content */}
        <div className="bg-[#15151f] rounded-2xl p-6 md:p-8 mb-6">
          {/* ── Step 1: Profile ── */}
          {step === 1 && (
            <div className="space-y-6">
              <p className="text-sm text-gray-400">
                Let fans know who you are. Fill in the essentials to make your profile stand out.
              </p>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Display Name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your creator name"
                  className="w-full bg-brand-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Tell your fans about yourself..."
                  className="w-full bg-brand-950 border border-gray-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Avatar</label>
                <div className="w-24 h-24 rounded-full bg-brand-950 border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-gray-400 transition">
                  <span className="text-gray-500 text-sm text-center">Upload<br />photo</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Genre Tags (up to 5)</label>
                <div className="flex flex-wrap gap-2">
                  {GENRE_OPTIONS.map((g) => (
                    <button
                      key={g}
                      onClick={() => toggleGenre(g)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                        selectedGenres.includes(g)
                          ? 'bg-red-600 text-white'
                          : 'bg-brand-950 border border-gray-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Tip: A complete profile gets 3x more followers on average.
              </p>
            </div>
          )}

          {/* ── Step 2: Upload First Track ── */}
          {step === 2 && (
            <div className="space-y-6">
              <p className="text-sm text-gray-400">
                Get your music live on OPYNX. You can always add more tracks later from the Upload page.
              </p>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Track Title</label>
                <input
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                  placeholder="e.g. Midnight Drive"
                  className="w-full bg-brand-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Genre</label>
                <select
                  value={trackGenre}
                  onChange={(e) => setTrackGenre(e.target.value)}
                  className="w-full bg-brand-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="">Select a genre</option>
                  {GENRE_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Audio File</label>
                <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-gray-400 transition cursor-pointer">
                  <span className="text-3xl block mb-2">&#127925;</span>
                  <p className="text-sm text-gray-400">Drag &amp; drop or click to upload</p>
                  <p className="text-xs text-gray-500 mt-1">WAV, FLAC, or MP3 (max 200 MB)</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Tip: Lossless formats (WAV/FLAC) deliver the best listening experience on OPYNX.
              </p>
            </div>
          )}

          {/* ── Step 3: QR Code ── */}
          {step === 3 && (
            <div className="space-y-6">
              <p className="text-sm text-gray-400">
                QR codes bridge your physical and digital presence. Put them on merch, flyers, or album art.
              </p>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">QR Context</label>
                <select
                  value={qrContext}
                  onChange={(e) => { setQrContext(e.target.value); setQrGenerated(false); }}
                  className="w-full bg-brand-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  {QR_CONTEXTS.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => { setQrGenerated(true); toast('QR code generated!', 'success'); }}
                className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold py-3 transition"
              >
                Generate QR Code
              </button>
              {qrGenerated && (
                <div className="flex flex-col items-center gap-3">
                  {/* Mock QR placeholder */}
                  <div className="w-40 h-40 bg-white rounded-xl flex items-center justify-center">
                    <div className="grid grid-cols-5 gap-1">
                      {Array.from({ length: 25 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-5 h-5 ${Math.random() > 0.4 ? 'bg-black' : 'bg-white'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 font-mono">{qrUrl}</p>
                </div>
              )}
              <p className="text-xs text-gray-500">
                Tip: Every QR scan is tracked in your analytics dashboard.
              </p>
            </div>
          )}

          {/* ── Step 4: Embed Widget ── */}
          {step === 4 && (
            <div className="space-y-6">
              <p className="text-sm text-gray-400">
                Drop this embed widget on your website or blog to let visitors stream your music directly.
              </p>
              {/* Widget preview */}
              <div className="bg-brand-950 rounded-xl border border-gray-700 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-red-600/20 flex items-center justify-center">
                    <span className="text-xl">&#127925;</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{displayName || username}</p>
                    <p className="text-xs text-gray-500">OPYNX Player Widget</p>
                  </div>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-red-600 rounded-full" />
                </div>
              </div>
              {/* Embed code */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Embed Code</label>
                <div className="relative">
                  <pre className="bg-brand-950 border border-gray-700 rounded-xl p-4 text-xs text-gray-400 overflow-x-auto">
                    {embedCode}
                  </pre>
                  <button
                    onClick={() => { navigator.clipboard?.writeText(embedCode); setEmbedCopied(true); toast('Embed code copied!', 'success'); }}
                    className="absolute top-2 right-2 text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition"
                  >
                    {embedCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Tip: The embed widget auto-updates when you release new music.
              </p>
            </div>
          )}

          {/* ── Step 5: Share Link ── */}
          {step === 5 && (
            <div className="space-y-6">
              <p className="text-sm text-gray-400">
                Share your OPYNX profile everywhere. This is your home base for fans to discover your music.
              </p>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Your Profile Link</label>
                <div className="flex items-center gap-3">
                  <input
                    readOnly
                    value={profileUrl}
                    className="flex-1 bg-brand-950 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm font-mono"
                  />
                  <button
                    onClick={() => { navigator.clipboard?.writeText(profileUrl); setProfileCopied(true); toast('Profile link copied!', 'success'); }}
                    className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-3 transition text-sm"
                  >
                    {profileCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              {/* Social share buttons */}
              <div>
                <p className="text-sm font-semibold text-gray-300 mb-2">Share on Social</p>
                <div className="flex gap-3">
                  <a
                    href={`https://twitter.com/intent/tweet?text=Check+out+my+music+on+OPYNX!&url=${encodeURIComponent(profileUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-xl bg-[#1DA1F2]/10 border border-[#1DA1F2]/30 text-[#1DA1F2] text-sm py-3 text-center hover:bg-[#1DA1F2]/20 transition font-semibold"
                  >
                    Twitter
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/30 text-[#1877F2] text-sm py-3 text-center hover:bg-[#1877F2]/20 transition font-semibold"
                  >
                    Facebook
                  </a>
                  <button
                    onClick={() => toast('Link ready to paste in Instagram bio!', 'info')}
                    className="flex-1 rounded-xl bg-[#E1306C]/10 border border-[#E1306C]/30 text-[#E1306C] text-sm py-3 hover:bg-[#E1306C]/20 transition font-semibold"
                  >
                    Instagram
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Tip: Add your OPYNX link to your Instagram bio and TikTok profile for maximum reach.
              </p>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => nextStep()}
            className="text-sm text-gray-500 hover:text-gray-300 transition"
          >
            Skip
          </button>
          {step < TOTAL_STEPS ? (
            <button
              onClick={nextStep}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 transition"
            >
              Continue
            </button>
          ) : (
            <Link
              href="/dashboard"
              onClick={handleComplete}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 transition"
            >
              Complete Setup
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
