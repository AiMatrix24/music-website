'use client';

import Link from 'next/link';
import { useState } from 'react';

const ROLES = [
  { id: 'fan', label: 'Fan', icon: '\u266B', description: 'Discover music, attend events, and support your favorite creators directly.' },
  { id: 'creator', label: 'Creator', icon: '\u266A', description: 'Upload tracks, sell tickets, monetize your art with transparent revenue sharing.' },
  { id: 'facilitator', label: 'Facilitator', icon: '\u2606', description: 'Host events, manage venues, and earn commissions by connecting fans and creators.' },
];

const GENRES = [
  'Synthwave', 'Lo-fi', 'Electronic', 'Indie Rock', 'Hip Hop',
  'R&B', 'Pop', 'Jazz', 'Classical', 'Metal',
];

const RECOMMENDATIONS: Record<string, string[]> = {
  fan: ['Browse trending tracks on Explore', 'Follow your first 5 creators', 'Check out upcoming events near you'],
  creator: ['Upload your first track', 'Set up your creator profile', 'Create your first event'],
  facilitator: ['Complete venue verification', 'Browse available events to host', 'Set up your payout preferences'],
};

export default function WelcomePage() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Step {step + 1} of 4</span>
            <Link href="/" className="text-gray-500 hover:text-white transition">
              Skip
            </Link>
          </div>
          <div className="h-1.5 bg-brand-800/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="transition-all duration-300">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-red-600/20 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl font-black">
                  <span className="text-red-500">O</span><span className="text-white">X</span>
                </span>
              </div>
              <h1 className="text-3xl font-black mb-3">Welcome to OPYNX</h1>
              <p className="text-gray-400 mb-2 max-w-md mx-auto">
                The FanEngage Protocol. Direct-to-fan music, live events, and transparent on-chain revenue sharing.
              </p>
              <p className="text-gray-500 text-sm mb-10 max-w-md mx-auto">
                Let&apos;s set up your experience in a few quick steps. This helps us personalize your feed and recommendations.
              </p>
              <button
                onClick={nextStep}
                className="px-8 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Step 1: Choose Role */}
          {step === 1 && (
            <div>
              <h1 className="text-3xl font-black mb-2 text-center">Choose Your Role</h1>
              <p className="text-gray-400 text-center mb-8">How will you use OPYNX? You can change this later.</p>
              <div className="space-y-3">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`w-full text-left rounded-2xl p-5 transition border ${
                      role === r.id
                        ? 'bg-red-600/10 border-red-600'
                        : 'bg-[#15151f] border-brand-800/10 hover:border-brand-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        role === r.id ? 'bg-red-600/20 text-red-400' : 'bg-brand-800/20 text-gray-500'
                      }`}>
                        {r.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{r.label}</h3>
                        <p className="text-sm text-gray-400">{r.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-8">
                <button onClick={prevStep} className="px-5 py-2.5 rounded-xl bg-brand-950 text-gray-400 hover:text-white border border-brand-800/20 transition">
                  Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={!role}
                  className="px-8 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Select Genres */}
          {step === 2 && (
            <div>
              <h1 className="text-3xl font-black mb-2 text-center">Pick Your Genres</h1>
              <p className="text-gray-400 text-center mb-8">Select the genres you love. We&apos;ll tailor your feed accordingly.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {GENRES.map((genre) => {
                  const selected = selectedGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={`py-3 px-4 rounded-xl text-sm font-semibold transition border ${
                        selected
                          ? 'bg-red-600/10 border-red-600 text-red-400'
                          : 'bg-[#15151f] border-brand-800/10 text-gray-400 hover:border-brand-800/40 hover:text-white'
                      }`}
                    >
                      {selected ? '\u2713 ' : ''}{genre}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">{selectedGenres.length} selected</p>
              <div className="flex justify-between mt-8">
                <button onClick={prevStep} className="px-5 py-2.5 rounded-xl bg-brand-950 text-gray-400 hover:text-white border border-brand-800/20 transition">
                  Back
                </button>
                <button
                  onClick={nextStep}
                  className="px-8 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl text-green-400">{'\u2713'}</span>
              </div>
              <h1 className="text-3xl font-black mb-3">You&apos;re All Set!</h1>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Welcome aboard{role ? ` as a ${ROLES.find((r) => r.id === role)?.label}` : ''}. Here are some things to get you started:
              </p>

              <div className="rounded-2xl bg-[#15151f] p-6 text-left mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Recommended for You</h3>
                <ul className="space-y-3">
                  {(RECOMMENDATIONS[role || 'fan'] || RECOMMENDATIONS.fan).map((rec, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                      <span className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {selectedGenres.length > 0 && (
                <div className="rounded-2xl bg-[#15151f] p-6 text-left mb-8">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Your Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedGenres.map((g) => (
                      <span key={g} className="px-3 py-1 rounded-full bg-red-600/10 text-red-400 text-xs font-semibold">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Link
                href="/explore"
                className="inline-block px-8 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition"
              >
                Start Exploring
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
