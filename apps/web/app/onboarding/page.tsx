'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { Welcome } from './_steps/Welcome';
import { ProfileStep } from './_steps/Profile';
import { CatalogStep } from './_steps/Catalog';
import { DoneStep } from './_steps/Done';

/**
 * Onboarding flow for new creators. Four guided steps:
 *   1. Welcome — what OPYNX is, why they're here
 *   2. Profile — name + bio + avatar (pre-filled from current user data)
 *   3. Catalog — bulk-upload up to 10 tracks at once (or skip)
 *   4. Done — show their QR code + share link, CTA to dashboard
 *
 * "Skip everything" link in the header dismisses the flow without losing
 * anything they've already saved (each step's mutation persists immediately).
 *
 * Step state lives in the URL hash so refresh / back-button preserves
 * progress without needing a backend "current step" column.
 */
type Step = 1 | 2 | 3 | 4;
const STEPS: { n: Step; title: string }[] = [
  { n: 1, title: 'Welcome' },
  { n: 2, title: 'Profile' },
  { n: 3, title: 'Catalog' },
  { n: 4, title: 'Share' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { status } = useSession();

  const [step, setStep] = useState<Step>(1);

  // Preserve step across refresh via URL hash (#step=2)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = window.location.hash.match(/step=(\d)/);
    if (m) {
      const parsed = Number(m[1]) as Step;
      if (parsed >= 1 && parsed <= 4) setStep(parsed);
    }
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    history.replaceState(null, '', `#step=${step}`);
  }, [step]);

  const utils = trpc.useUtils();
  const completeMutation = trpc.users.completeOnboarding.useMutation({
    onSuccess: () => {
      utils.users.getProfile.invalidate();
    },
  });

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  }
  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-gray-400">Sign in to set up your creator profile.</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Sign In</Link>
      </div>
    );
  }

  const goNext = () => setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
  const goBack = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const handleSkipAll = async () => {
    if (!confirm('Skip onboarding? You can always finish setup later from your dashboard.')) return;
    await completeMutation.mutateAsync();
    router.push('/dashboard');
  };

  const handleFinish = async () => {
    await completeMutation.mutateAsync();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen py-12 px-5">
      <div className="max-w-2xl mx-auto">
        {/* Header strip */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold">Set up your creator profile</h1>
          <button
            onClick={handleSkipAll}
            className="text-xs text-gray-500 hover:text-gray-300 transition"
          >
            Skip for now
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => {
            const done = step > s.n;
            const active = step === s.n;
            return (
              <div key={s.n} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                      done
                        ? 'bg-green-600 text-white'
                        : active
                        ? 'bg-red-600 text-white'
                        : 'bg-[#15151f] text-gray-500 border border-brand-800/30'
                    }`}
                  >
                    {done ? '✓' : s.n}
                  </div>
                  <span
                    className={`text-[10px] mt-1.5 uppercase tracking-wide ${
                      active ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 mb-4 transition ${
                      done ? 'bg-green-600' : 'bg-brand-800/30'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step body */}
        <div>
          {step === 1 && <Welcome onNext={goNext} />}
          {step === 2 && <ProfileStep onNext={goNext} onBack={goBack} />}
          {step === 3 && <CatalogStep onNext={goNext} onBack={goBack} />}
          {step === 4 && <DoneStep onFinish={handleFinish} onBack={goBack} finishing={completeMutation.isPending} />}
        </div>
      </div>
    </div>
  );
}
