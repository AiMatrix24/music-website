'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type Tab = 'email' | 'phone' | 'social';

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'fan' | 'creator' | 'venue'>('fan');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const callbackUrl = role === 'creator' ? '/dashboard' : role === 'venue' ? '/booking' : '/explore';
      await signIn('email-login', {
        email: email.trim(),
        callbackUrl,
      });
    } catch {
      setError('Sign in failed. Please try again.');
      setLoading(false);
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const callbackUrl = role === 'creator' ? '/dashboard' : role === 'venue' ? '/booking' : '/explore';
      await signIn('phone-login', {
        phone: phone.trim(),
        callbackUrl,
      });
    } catch {
      setError('Sign in failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Image src="/logo.jpeg" alt="OPYNX" width={48} height={48} className="rounded-xl" />
          </Link>
          <h1 className="text-3xl font-bold mb-2">Welcome to OPYNX</h1>
          <p className="text-gray-400">
            {role === 'fan' && 'Sign in to start listening and discovering.'}
            {role === 'creator' && 'Sign in to upload music and grow your fanbase.'}
            {role === 'venue' && 'Sign in to book artists and manage events.'}
          </p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <RoleCard icon="🎧" label="Fan" desc="Listen & discover" active={role === 'fan'} onClick={() => setRole('fan')} />
          <RoleCard icon="🎤" label="Creator" desc="Upload & sell" active={role === 'creator'} onClick={() => setRole('creator')} />
          <RoleCard icon="🏟️" label="Venue" desc="Host & book" active={role === 'venue'} onClick={() => setRole('venue')} />
        </div>

        {/* Tab selector */}
        <div className="flex bg-[#15151f] rounded-xl p-1 mb-6">
          <button
            onClick={() => { setTab('email'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
              tab === 'email' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            📧 Email
          </button>
          <button
            onClick={() => { setTab('phone'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
              tab === 'phone' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            📱 Phone
          </button>
          <button
            onClick={() => { setTab('social'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
              tab === 'social' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            🔗 Social
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-800/30 rounded-xl px-4 py-3 mb-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Email sign in */}
        {tab === 'email' && (
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:border-red-600 focus:outline-none transition text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-red-600 py-4 font-semibold text-white text-lg transition hover:bg-red-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Continue with Email'}
            </button>
            <p className="text-xs text-gray-500 text-center">
              No password needed. We&apos;ll create your account automatically.
            </p>
          </form>
        )}

        {/* Phone sign in */}
        {tab === 'phone' && (
          <form onSubmit={handlePhoneSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                autoFocus
                className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:border-red-600 focus:outline-none transition text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-red-600 py-4 font-semibold text-white text-lg transition hover:bg-red-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Continue with Phone'}
            </button>
            <p className="text-xs text-gray-500 text-center">
              No password needed. We&apos;ll create your account automatically.
            </p>
          </form>
        )}

        {/* Social sign in */}
        {tab === 'social' && (
          <div className="space-y-3">
            <OAuthButton
              provider="discord"
              label="Continue with Discord"
              color="bg-[#5865F2]"
              icon="🎮"
            />
            <OAuthButton
              provider="twitter"
              label="Continue with Twitter / X"
              color="bg-[#1DA1F2]"
              icon="𝕏"
            />
            <OAuthButton
              provider="twitch"
              label="Continue with Twitch"
              color="bg-[#9146FF]"
              icon="📺"
            />

            <div className="flex items-center gap-4 py-3">
              <div className="flex-1 h-px bg-brand-800/30" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-brand-800/30" />
            </div>

            <button className="w-full rounded-xl bg-[#15151f] border border-brand-700/30 py-4 font-semibold text-white transition hover:border-red-600 flex items-center justify-center gap-3">
              <span className="text-xl">🦊</span>
              Connect Wallet (SIWE)
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-500 mt-8">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="text-red-400 hover:underline">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-red-400 hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

function RoleCard({ icon, label, desc, active, onClick }: { icon: string; label: string; desc: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-xl p-3 text-center transition border-2 ${
      active ? 'border-red-600 bg-red-900/10' : 'border-brand-800/20 bg-[#15151f] hover:border-red-600/50'
    }`}>
      <p className="text-xl mb-1">{icon}</p>
      <p className="text-xs font-bold">{label}</p>
      <p className="text-[10px] text-gray-500">{desc}</p>
    </button>
  );
}

function OAuthButton({
  provider,
  label,
  color,
  icon,
}: {
  provider: string;
  label: string;
  color: string;
  icon: string;
}) {
  return (
    <button
      onClick={() => {
        const cb = provider === 'discord' ? '/dashboard' : '/dashboard';
        signIn(provider, { callbackUrl: cb });
      }}
      className={`w-full rounded-xl ${color} py-4 font-semibold text-white transition hover:opacity-90 flex items-center justify-center gap-3`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
}
