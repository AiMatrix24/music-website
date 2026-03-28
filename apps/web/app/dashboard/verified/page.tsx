'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';

const BENEFITS = [
  { icon: '&#x2713;', title: 'Verified Badge', description: 'Gold checkmark displayed on your profile and tracks' },
  { icon: '&#x1F50D;', title: 'Priority Search', description: 'Appear higher in search results and recommendations' },
  { icon: '&#x1F4B0;', title: 'Higher Payouts', description: 'Earn an additional 5% on all streaming revenue' },
  { icon: '&#x1F527;', title: 'API Access', description: 'Access to the OPYNX developer API for integrations' },
  { icon: '&#x2B50;', title: 'Featured Placement', description: 'Priority for homepage and playlist features' },
  { icon: '&#x1F6E1;', title: 'Trust Score', description: 'Enhanced trust indicators for fan engagement' },
];

const REQUIREMENTS = [
  { id: 'profile', label: 'Profile complete (name, bio, avatar)', met: true, current: 'Complete', target: 'Complete' },
  { id: 'tracks', label: 'At least 5 published tracks', met: true, current: '8 tracks', target: '5 tracks' },
  { id: 'followers', label: 'At least 100 followers', met: false, current: '67 followers', target: '100 followers' },
  { id: 'kyc', label: 'Identity verification (KYC)', met: false, current: 'Not submitted', target: 'Verified' },
  { id: 'active', label: 'Active for 30+ days', met: true, current: '94 days', target: '30 days' },
  { id: 'violations', label: 'No community violations', met: true, current: '0 violations', target: '0 violations' },
];

export default function VerifiedPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Sign in to view verification status</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const metCount = REQUIREMENTS.filter((r) => r.met).length;
  const totalCount = REQUIREMENTS.length;
  const progressPercent = Math.round((metCount / totalCount) * 100);
  const allMet = metCount === totalCount;

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-black mb-8">Verification Badge</h1>

        {/* Current status + badge preview */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10">
          {/* Badge preview */}
          <div className="w-24 h-24 shrink-0 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold">Current Status</h2>
              <span className="text-xs px-3 py-1 rounded-full font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                Not Verified
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Complete all requirements below to apply for your verified badge.
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-[#15151f] rounded-2xl border border-brand-800/30 p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Verification Progress</h3>
            <span className="text-sm text-gray-400">{metCount}/{totalCount} requirements met</span>
          </div>
          <div className="w-full h-3 bg-brand-950 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">{progressPercent}% complete</p>
        </div>

        {/* Requirements checklist */}
        <div className="bg-[#15151f] rounded-2xl border border-brand-800/30 p-6 mb-8">
          <h2 className="text-lg font-bold mb-6">Requirements</h2>
          <div className="space-y-4">
            {REQUIREMENTS.map((req) => (
              <div
                key={req.id}
                className={`flex items-center justify-between p-4 rounded-xl ${
                  req.met ? 'bg-green-500/5 border border-green-500/10' : 'bg-brand-950 border border-brand-800/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      req.met
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {req.met ? '\u2713' : '\u2717'}
                  </span>
                  <span className={`text-sm ${req.met ? 'text-gray-200' : 'text-gray-400'}`}>
                    {req.label}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium ${req.met ? 'text-green-400' : 'text-gray-500'}`}>
                    {req.current}
                  </span>
                  {!req.met && (
                    <p className="text-xs text-gray-600">Required: {req.target}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-[#15151f] rounded-2xl border border-brand-800/30 p-6 mb-8">
          <h2 className="text-lg font-bold mb-6">Benefits of Verification</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className="bg-brand-950 rounded-xl p-4">
                <span
                  className="text-2xl mb-2 block"
                  dangerouslySetInnerHTML={{ __html: benefit.icon }}
                />
                <h3 className="text-sm font-semibold text-white mb-1">{benefit.title}</h3>
                <p className="text-xs text-gray-500">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Apply button */}
        <div className="text-center">
          <button
            onClick={() => {
              if (allMet) {
                toast('Verification application submitted!', 'success');
              } else {
                toast('Please complete all requirements first', 'error');
              }
            }}
            disabled={!allMet}
            className={`px-8 py-3 rounded-full font-semibold text-lg transition ${
              allMet
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-brand-800/40 text-gray-600 cursor-not-allowed'
            }`}
          >
            Apply for Verification
          </button>
          {!allMet && (
            <p className="text-sm text-gray-500 mt-3">
              Complete all {totalCount} requirements to unlock the application.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
