'use client';

import { useState } from 'react';

/**
 * Checkout Page — P0 Priority
 * Tier selector + dual checkout (Helio USDC primary, Samiteon fiat fallback).
 * Attribution IDs pre-populated from URL params after QR scan.
 */
export default function SubscribePage() {
  const [selectedTier, setSelectedTier] = useState<'premium' | 'bundle' | 'studio'>('premium');

  const tiers = [
    {
      id: 'premium' as const,
      name: 'Premium',
      price: '$8.73',
      period: '/mo',
      features: [
        '320kbps streaming',
        'No ads, unlimited skips',
        'Offline listening (PWA)',
        'Pre-sale tickets',
        '10% merch discount',
        'Digital backstage access',
      ],
    },
    {
      id: 'bundle' as const,
      name: 'Superfan Bundle',
      price: '$12.73',
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
    },
    {
      id: 'studio' as const,
      name: 'Studio',
      price: '$16.00',
      period: '/mo',
      features: [
        'Lossless FLAC streaming',
        '48h early access',
        'Studio session access',
        'Platinum badge',
        '15% merch discount',
        'All Premium features',
      ],
    },
  ];

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

        {/* Checkout Buttons */}
        <div className="max-w-md mx-auto space-y-4">
          <button className="w-full rounded-full bg-gradient-to-r from-brand-600 to-brand-500 py-4 font-semibold text-white text-lg transition hover:shadow-lg hover:shadow-brand-600/30">
            Pay with USDC (Helio)
          </button>
          <button className="w-full rounded-full border-2 border-white/20 py-4 font-semibold text-white transition hover:border-brand-500">
            Pay with Card (Samiteon)
          </button>
          <p className="text-center text-xs text-gray-500">
            Payments settled on Polygon. Verifiable on-chain.
            <br />
            Cancel anytime. 5-day grace period on renewal.
          </p>
        </div>

        {/* Revenue Transparency */}
        <div className="mt-16 max-w-md mx-auto rounded-2xl bg-[#15151f] p-6">
          <h3 className="font-bold mb-4 text-center">
            Where Your Money Goes
          </h3>
          <div className="space-y-3">
            <WaterfallRow label="Artist" amount="$1.00" pct="11.5%" />
            <WaterfallRow label="Facilitator" amount="$0.25–$0.50" pct="2.9–5.7%" />
            <WaterfallRow label="Platform" amount="$7.20" pct="82%" />
            <div className="border-t border-brand-800/30 pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-brand-400">$8.73</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WaterfallRow({
  label,
  amount,
  pct,
}: {
  label: string;
  amount: string;
  pct: string;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span>
        {amount}{' '}
        <span className="text-gray-500 text-xs">({pct})</span>
      </span>
    </div>
  );
}
