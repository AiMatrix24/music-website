'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';

const tiers = [
  { name: 'Bronze', refs: 5, rate: '5%', color: 'from-amber-700 to-amber-900' },
  { name: 'Silver', refs: 15, rate: '10%', color: 'from-gray-300 to-gray-500' },
  { name: 'Gold', refs: 50, rate: '15%', color: 'from-yellow-400 to-yellow-600' },
];

const recentReferrals = [
  { id: 1, name: 'Alex Rivera', date: 'Mar 24, 2026', status: 'active', earnings: '$4.50' },
  { id: 2, name: 'Jordan K.', date: 'Mar 22, 2026', status: 'active', earnings: '$4.50' },
  { id: 3, name: 'Sam Okafor', date: 'Mar 20, 2026', status: 'pending', earnings: '$0.00' },
  { id: 4, name: 'Taylor M.', date: 'Mar 18, 2026', status: 'active', earnings: '$4.50' },
  { id: 5, name: 'Casey Wu', date: 'Mar 15, 2026', status: 'expired', earnings: '$0.00' },
  { id: 6, name: 'Morgan D.', date: 'Mar 12, 2026', status: 'active', earnings: '$4.50' },
  { id: 7, name: 'Riley Patel', date: 'Mar 10, 2026', status: 'active', earnings: '$4.50' },
];

const statusColors: Record<string, string> = {
  active: 'bg-green-600/20 text-green-400',
  pending: 'bg-yellow-600/20 text-yellow-400',
  expired: 'bg-gray-600/20 text-gray-500',
};

export default function ReferralsPage() {
  const { status } = useSession();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralLink = 'https://opynx.com/ref/USERNAME';
  const currentRefs = 8;
  const activeRefs = 6;
  const totalEarnings = 27.0;
  const conversionRate = 68;

  const currentTierIndex = tiers.findIndex((t) => currentRefs < t.refs);
  const currentTier = currentTierIndex > 0 ? tiers[currentTierIndex - 1] : null;
  const nextTier = currentTierIndex >= 0 ? tiers[currentTierIndex] : null;
  const progressPercent = nextTier
    ? Math.min(100, (currentRefs / nextTier.refs) * 100)
    : 100;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast('Referral link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl mb-2">🔗</p>
        <p className="text-gray-400 text-lg">Sign in to access your referral dashboard</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">Earn by Sharing Music</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Refer friends to OPYNX and earn a percentage of their subscription. The more you share, the more you earn.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl bg-[#15151f] p-5">
          <p className="text-sm text-gray-400 mb-1">Total Referrals</p>
          <p className="text-2xl font-bold">{currentRefs}</p>
        </div>
        <div className="rounded-xl bg-[#15151f] p-5">
          <p className="text-sm text-gray-400 mb-1">Active Referrals</p>
          <p className="text-2xl font-bold text-green-400">{activeRefs}</p>
        </div>
        <div className="rounded-xl bg-[#15151f] p-5">
          <p className="text-sm text-gray-400 mb-1">Total Earnings</p>
          <p className="text-2xl font-bold text-red-400">${totalEarnings.toFixed(2)}</p>
        </div>
        <div className="rounded-xl bg-[#15151f] p-5">
          <p className="text-sm text-gray-400 mb-1">Conversion Rate</p>
          <p className="text-2xl font-bold">{conversionRate}%</p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="rounded-xl bg-[#15151f] p-6 mb-8">
        <h2 className="font-bold mb-3">Your Referral Link</h2>
        <div className="flex gap-3">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white text-sm font-mono"
          />
          <button
            onClick={handleCopy}
            className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-500 transition text-sm whitespace-nowrap"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* Share Buttons */}
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition"
          >
            📋 Copy Link
          </button>
          <a
            href={`https://twitter.com/intent/tweet?text=Join%20me%20on%20OPYNX!%20${encodeURIComponent(referralLink)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition"
          >
            🐦 Twitter
          </a>
          <a
            href={`https://discord.com`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition"
          >
            💬 Discord
          </a>
          <a
            href={`mailto:?subject=Join OPYNX&body=Check out OPYNX! ${referralLink}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition"
          >
            ✉️ Email
          </a>
        </div>

        <div className="mt-4 inline-flex items-center gap-2 bg-purple-600/10 text-purple-400 px-3 py-1.5 rounded-full text-xs font-medium">
          <span>💎</span> Earnings are paid in USDC on Polygon
        </div>
      </div>

      {/* Referral Tiers */}
      <div className="rounded-xl bg-[#15151f] p-6 mb-8">
        <h2 className="font-bold mb-4">Referral Tiers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl p-5 border ${
                currentTier?.name === tier.name
                  ? 'border-red-600 bg-red-600/5'
                  : 'border-white/5 bg-white/[0.02]'
              }`}
            >
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center text-sm font-bold mb-3`}>
                {tier.name.charAt(0)}
              </div>
              <h3 className="font-bold text-lg">{tier.name}</h3>
              <p className="text-sm text-gray-400">{tier.refs} referrals</p>
              <p className="text-2xl font-bold text-red-400 mt-2">{tier.rate}</p>
              <p className="text-xs text-gray-500">commission per subscription</p>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">
              {currentTier ? `${currentTier.name} tier` : 'Getting started'}
            </span>
            <span className="text-gray-400">
              {nextTier ? `${currentRefs} / ${nextTier.refs} to ${nextTier.name}` : 'Max tier reached!'}
            </span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-red-600 to-red-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="rounded-xl bg-[#15151f] p-6 mb-8">
        <h2 className="font-bold mb-6">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-red-600/10 flex items-center justify-center text-2xl mx-auto mb-3">
              📤
            </div>
            <h3 className="font-semibold mb-1">1. Share</h3>
            <p className="text-sm text-gray-400">Share your unique referral link with friends, fans, and on social media.</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-red-600/10 flex items-center justify-center text-2xl mx-auto mb-3">
              🎧
            </div>
            <h3 className="font-semibold mb-1">2. They Subscribe</h3>
            <p className="text-sm text-gray-400">When someone signs up through your link and subscribes to OPYNX.</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-red-600/10 flex items-center justify-center text-2xl mx-auto mb-3">
              💰
            </div>
            <h3 className="font-semibold mb-1">3. You Earn</h3>
            <p className="text-sm text-gray-400">Earn a percentage of their subscription fee every month they stay active.</p>
          </div>
        </div>
      </div>

      {/* Recent Referrals */}
      <div className="rounded-xl bg-[#15151f] p-6">
        <h2 className="font-bold mb-4">Recent Referrals</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-white/5">
                <th className="text-left py-3 font-medium">Name</th>
                <th className="text-left py-3 font-medium">Date</th>
                <th className="text-left py-3 font-medium">Status</th>
                <th className="text-right py-3 font-medium">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {recentReferrals.map((ref) => (
                <tr key={ref.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 font-medium">{ref.name}</td>
                  <td className="py-3 text-gray-400">{ref.date}</td>
                  <td className="py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[ref.status]}`}>
                      {ref.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-medium">{ref.earnings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
