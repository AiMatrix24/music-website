'use client';

import { signIn } from 'next-auth/react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Sign In</h1>
          <p className="text-gray-400">Connect to start listening and earning.</p>
        </div>

        <div className="space-y-3">
          <OAuthButton
            provider="discord"
            label="Continue with Discord"
            color="bg-[#5865F2]"
          />
          <OAuthButton
            provider="twitter"
            label="Continue with Twitter / X"
            color="bg-[#1DA1F2]"
          />
          <OAuthButton
            provider="twitch"
            label="Continue with Twitch"
            color="bg-[#9146FF]"
          />

          <div className="flex items-center gap-4 py-4">
            <div className="flex-1 h-px bg-brand-800/30" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              or
            </span>
            <div className="flex-1 h-px bg-brand-800/30" />
          </div>

          <button className="w-full rounded-xl bg-[#15151f] border border-brand-700/30 py-4 font-semibold text-white transition hover:border-brand-500 flex items-center justify-center gap-3">
            <span className="text-xl">🦊</span>
            Connect Wallet (SIWE)
          </button>

          <p className="text-center text-xs text-gray-500 mt-6">
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-brand-400 hover:underline">Terms</a>
            {' '}and{' '}
            <a href="/privacy" className="text-brand-400 hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

function OAuthButton({
  provider,
  label,
  color,
}: {
  provider: string;
  label: string;
  color: string;
}) {
  return (
    <button
      onClick={() => signIn(provider, { callbackUrl: '/dashboard' })}
      className={`w-full rounded-xl ${color} py-4 font-semibold text-white transition hover:opacity-90`}
    >
      {label}
    </button>
  );
}
