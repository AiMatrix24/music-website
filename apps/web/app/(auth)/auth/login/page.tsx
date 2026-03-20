'use client';

/**
 * Login Page — P0 Priority
 * Discord, Twitter/X, Twitch OAuth + SIWE wallet auth.
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Sign In</h1>
          <p className="text-gray-400">Connect to start listening and earning.</p>
        </div>

        <div className="space-y-3">
          {/* OAuth Providers */}
          <OAuthButton provider="Discord" color="bg-[#5865F2]" />
          <OAuthButton provider="Twitter / X" color="bg-[#1DA1F2]" />
          <OAuthButton provider="Twitch" color="bg-[#9146FF]" />

          <div className="flex items-center gap-4 py-4">
            <div className="flex-1 h-px bg-brand-800/30" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              or
            </span>
            <div className="flex-1 h-px bg-brand-800/30" />
          </div>

          {/* SIWE Wallet Auth */}
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

function OAuthButton({ provider, color }: { provider: string; color: string }) {
  return (
    <button
      className={`w-full rounded-xl ${color} py-4 font-semibold text-white transition hover:opacity-90`}
    >
      Continue with {provider}
    </button>
  );
}
