'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '../components/Toast';

type TierId = 'premium' | 'bundle' | 'studio';

const tiers = [
  {
    id: 'premium' as TierId,
    name: 'Premium',
    price: '$8.73',
    priceNum: 8.73,
    period: '/mo',
    features: [
      '320kbps streaming',
      'No ads, unlimited skips',
      'Offline listening (PWA)',
      'Pre-sale tickets',
      '10% merch discount',
      'Digital backstage access',
    ],
    breakdown: {
      artist: '$1.00',
      artistPct: '11.5%',
      facilitator: '$0.25–$0.50',
      facilitatorPct: '2.9–5.7%',
      platform: '$7.20',
      platformPct: '82.5%',
    },
  },
  {
    id: 'bundle' as TierId,
    name: 'Superfan Bundle',
    price: '$12.73',
    priceNum: 12.73,
    period: '/mo',
    badge: 'Best Value',
    features: [
      'Support 4 creators',
      '320kbps streaming',
      'All Premium features',
      'Exclusive bundle perks',
      'Priority event access',
      'Verified Superfan badge',
    ],
    breakdown: {
      artist: '$4.00',
      artistPct: '31.4%',
      facilitator: '$0.50–$1.00',
      facilitatorPct: '3.9–7.9%',
      platform: '$7.73',
      platformPct: '60.7%',
    },
  },
  {
    id: 'studio' as TierId,
    name: 'Studio',
    price: '$16.00',
    priceNum: 16.0,
    period: '/mo',
    features: [
      'Lossless FLAC streaming',
      '48h early access',
      'Studio session access',
      'Platinum badge',
      '15% merch discount',
      'All Premium features',
    ],
    breakdown: {
      artist: '$3.00',
      artistPct: '18.8%',
      facilitator: '$0.50–$1.00',
      facilitatorPct: '3.1–6.3%',
      platform: '$12.00',
      platformPct: '75.0%',
    },
  },
];

export default function SubscribePage() {
  const [selectedTier, setSelectedTier] = useState<TierId>('premium');
  const [step, setStep] = useState<'select' | 'checkout'>('select');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const selected = tiers.find((t) => t.id === selectedTier)!;

  // Show success message if redirected back from payment
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast('Subscription activated! Welcome aboard.', 'success');
    }
  }, [searchParams, toast]);

  const handleContinue = () => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    setStep('checkout');
  };

  const handleCheckout = async (method: 'usdc' | 'card') => {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          userId: session?.user?.id,
          paymentMethod: method,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Subscription failed');
      }
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast('Subscription created, but no payment URL was returned.', 'error');
      }
    } catch (err: any) {
      toast(err.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (step === 'checkout') {
    return (
      <div className="min-h-screen py-16 px-6">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setStep('select')}
            className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block"
          >
            ← Change plan
          </button>

          <div className="rounded-2xl bg-[#15151f] p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{selected.name}</h2>
                <p className="text-gray-400 text-sm">Monthly subscription</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-brand-400">{selected.price}</p>
                <p className="text-xs text-gray-500">{selected.period}</p>
              </div>
            </div>

            <div className="border-t border-brand-800/20 pt-4 mb-6">
              <p className="text-sm text-gray-400 mb-3">What you get:</p>
              <ul className="space-y-2">
                {selected.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-300">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {session?.user && (
              <div className="bg-brand-950/50 rounded-xl p-4 mb-6">
                <p className="text-xs text-gray-500 mb-1">Subscribing as</p>
                <p className="font-semibold">{session.user.name ?? session.user.email}</p>
              </div>
            )}

            <div className="border-t border-brand-800/20 pt-4">
              <div className="flex justify-between mb-1">
                <span className="text-gray-400 text-sm">Subtotal</span>
                <span className="text-sm">{selected.price}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-gray-400 text-sm">Platform fee</span>
                <span className="text-sm text-gray-500">$0.00</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-brand-800/20 pt-3">
                <span>Total</span>
                <span className="text-brand-400">{selected.price}/mo</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleCheckout('usdc')}
              disabled={checkoutLoading}
              className="w-full rounded-full bg-gradient-to-r from-brand-600 to-brand-500 py-4 font-semibold text-white text-lg transition hover:shadow-lg hover:shadow-brand-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkoutLoading ? 'Processing...' : 'Pay with USDC (Helio)'}
            </button>
            <button
              onClick={() => handleCheckout('card')}
              disabled={checkoutLoading}
              className="w-full rounded-full border-2 border-white/20 py-4 font-semibold text-white transition hover:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkoutLoading ? 'Processing...' : 'Pay with Card (Samiteon)'}
            </button>
            <p className="text-center text-xs text-gray-500">
              Payments settled on Polygon. Verifiable on-chain.
              <br />
              Cancel anytime. 5-day grace period on renewal.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Choose Your <span className="text-brand-500">Plan</span>
        </h1>
        <p className="text-center text-gray-400 mb-12 max-w-lg mx-auto">
          Every dollar is transparent. Your subscription directly supports artists
          with verifiable on-chain payouts.
        </p>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`relative rounded-2xl p-6 cursor-pointer transition-all ${
                selectedTier === tier.id
                  ? 'bg-brand-600/10 border-2 border-brand-500 shadow-lg shadow-brand-900/20'
                  : 'bg-[#15151f] border-2 border-transparent hover:border-brand-700/30'
              }`}
            >
              {tier.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  {tier.badge}
                </span>
              )}
              <h3 className="text-lg font-bold mb-1">{tier.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-black text-brand-400">
                  {tier.price}
                </span>
                <span className="text-gray-500">{tier.period}</span>
              </div>
              <ul className="space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-brand-500">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <div className="max-w-md mx-auto space-y-4">
          <button
            onClick={handleContinue}
            className="w-full rounded-full bg-gradient-to-r from-brand-600 to-brand-500 py-4 font-semibold text-white text-lg transition hover:shadow-lg hover:shadow-brand-600/30"
          >
            Continue with {selected.name} — {selected.price}/mo
          </button>
          <p className="text-center text-xs text-gray-500">
            {status === 'unauthenticated'
              ? 'You\'ll be asked to sign in first.'
              : 'You\'ll review your plan before payment.'}
          </p>
        </div>

        {/* Revenue Transparency — dynamic per plan */}
        <div className="mt-16 max-w-md mx-auto rounded-2xl bg-[#15151f] p-6 transition-all">
          <h3 className="font-bold mb-1 text-center">
            Where Your {selected.price} Goes
          </h3>
          <p className="text-center text-xs text-gray-500 mb-4">{selected.name} plan</p>
          <div className="space-y-3">
            <WaterfallRow label="Artist" amount={selected.breakdown.artist} pct={selected.breakdown.artistPct} color="text-brand-400" />
            <WaterfallRow label="Facilitator" amount={selected.breakdown.facilitator} pct={selected.breakdown.facilitatorPct} color="text-pink-400" />
            <WaterfallRow label="Platform" amount={selected.breakdown.platform} pct={selected.breakdown.platformPct} color="text-cyan-400" />
            <div className="border-t border-brand-800/30 pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-brand-400">{selected.price}</span>
            </div>
          </div>
          {selected.id === 'bundle' && (
            <p className="text-xs text-brand-400 text-center mt-3">
              Bundle splits $4.00 across 4 artists — $1.00 each
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function WaterfallRow({
  label,
  amount,
  pct,
  color,
}: {
  label: string;
  amount: string;
  pct: string;
  color?: string;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span>
        <span className={color ?? ''}>{amount}</span>{' '}
        <span className="text-gray-500 text-xs">({pct})</span>
      </span>
    </div>
  );
}
