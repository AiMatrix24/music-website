'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

// ─── Types ───

type SubscriptionTier = 'free' | 'premium' | 'bundle';
type BillingCycle = 'monthly' | 'yearly';

interface TierInfo {
  id: SubscriptionTier;
  name: string;
  price: number;
  features: string[];
}

interface SubscriptionEvent {
  id: string;
  type: 'subscribed' | 'renewed' | 'upgraded' | 'downgraded' | 'cancelled';
  date: string;
  description: string;
}

// ─── Tier Definitions ───

const TIERS: TierInfo[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      '128kbps streaming',
      'Ad-supported',
      'Follow up to 5 artists',
      '6 skips per hour',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 8.73,
    features: [
      '320kbps streaming',
      'Ad-free listening',
      'Unlimited follows',
      'Unlimited skips',
      'Pre-sale ticket access',
      '10% merch discount',
      '24h early access to new releases',
    ],
  },
  {
    id: 'bundle',
    name: 'Superfan Bundle',
    price: 12.73,
    features: [
      'Everything in Premium',
      '15% merch discount',
      'Direct messaging to artists',
      'Exclusive content access',
      'Priority customer support',
    ],
  },
];

// ─── Mock Data ───

const MOCK_SUBSCRIPTION = {
  tier: 'premium' as SubscriptionTier,
  status: 'active' as const,
  billingCycle: 'monthly' as BillingCycle,
  nextRenewal: '2026-05-05',
  paymentMethod: 'USDC on Polygon',
  startedAt: '2025-11-05',
};

const MOCK_HISTORY: SubscriptionEvent[] = [
  {
    id: '1',
    type: 'upgraded',
    date: '2026-02-15',
    description: 'Upgraded from Free to Premium',
  },
  {
    id: '2',
    type: 'renewed',
    date: '2026-03-05',
    description: 'Monthly renewal - Premium ($8.73)',
  },
  {
    id: '3',
    type: 'subscribed',
    date: '2025-11-05',
    description: 'Subscribed to Free tier',
  },
];

// ─── Page Component ───

export default function SubscriptionManagementPage() {
  const { status } = useSession();
  const { toast } = useToast();
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Auth check
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Sign in to manage your subscription</h1>
          <Link
            href="/auth/login"
            className="rounded-full bg-red-600 px-8 py-3 font-semibold text-white"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const sub = MOCK_SUBSCRIPTION;
  const currentTier = TIERS.find((t) => t.id === sub.tier)!;

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/settings"
          className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block"
        >
          &larr; Back to Settings
        </Link>

        <h1 className="text-3xl font-bold mb-8">Subscription</h1>

        {/* ─── Current Plan ─── */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Current Plan</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Plan</p>
              <p className="font-semibold text-lg capitalize">{currentTier.name}</p>
            </div>
            <div>
              <p className="text-gray-400">Status</p>
              <p className="font-semibold">
                <span
                  className={
                    sub.status === 'active'
                      ? 'text-green-400'
                      : 'text-yellow-400'
                  }
                >
                  {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                </span>
              </p>
            </div>
            <div>
              <p className="text-gray-400">Billing Cycle</p>
              <p className="font-semibold capitalize">{sub.billingCycle}</p>
            </div>
            <div>
              <p className="text-gray-400">Next Renewal</p>
              <p className="font-semibold">
                {new Date(sub.nextRenewal).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Change Plan ─── */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Change Plan</h2>
          <div className="space-y-4">
            {TIERS.map((tier) => {
              const isCurrent = tier.id === sub.tier;
              const isDowngrade =
                TIERS.findIndex((t) => t.id === tier.id) <
                TIERS.findIndex((t) => t.id === sub.tier);

              return (
                <div
                  key={tier.id}
                  className={`rounded-xl p-5 border-2 transition ${
                    isCurrent
                      ? 'border-red-600 bg-red-900/10'
                      : 'border-brand-800/20 bg-brand-950'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg">{tier.name}</h3>
                        {isCurrent && (
                          <span className="text-xs bg-red-600/20 text-red-400 px-3 py-1 rounded-full font-semibold">
                            Current Plan
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {tier.price === 0
                          ? 'Free forever'
                          : `$${tier.price.toFixed(2)}/month`}
                      </p>
                    </div>
                    {!isCurrent && (
                      <Link
                        href={`/subscribe?tier=${tier.id}`}
                        className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                          isDowngrade
                            ? 'border border-brand-800/30 text-gray-400 hover:border-red-600 hover:text-white'
                            : 'bg-red-600 text-white hover:bg-red-500'
                        }`}
                      >
                        {isDowngrade ? 'Downgrade' : 'Upgrade'}
                      </Link>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {tier.features.map((f) => (
                      <li key={f} className="text-sm text-gray-400 flex items-center gap-2">
                        <span className="text-green-400 text-xs">&#10003;</span> {f}
                      </li>
                    ))}
                  </ul>
                  {isDowngrade && !isCurrent && (
                    <p className="text-xs text-yellow-400/80 mt-3">
                      Downgrading will take effect at the end of your current billing period
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Cancel Subscription ─── */}
        {sub.tier !== 'free' && (
          <div className="rounded-2xl bg-red-950/20 border border-red-800/20 p-6 mb-6">
            <h2 className="text-lg font-bold text-red-400 mb-2">Cancel Subscription</h2>
            <p className="text-sm text-gray-400 mb-4">
              If you cancel, your plan will remain active until the end of your current billing
              period.
            </p>
            <button
              onClick={() => setShowCancelModal(true)}
              className="rounded-full border border-red-600 text-red-400 px-5 py-2 text-sm font-semibold hover:bg-red-600 hover:text-white transition"
            >
              Cancel Subscription
            </button>
          </div>
        )}

        {/* ─── Subscription History ─── */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Subscription History</h2>
          <div className="space-y-4">
            {MOCK_HISTORY.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between py-3 border-b border-brand-800/10 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      event.type === 'upgraded'
                        ? 'bg-green-600/20 text-green-400'
                        : event.type === 'renewed'
                          ? 'bg-blue-600/20 text-blue-400'
                          : event.type === 'cancelled'
                            ? 'bg-red-600/20 text-red-400'
                            : 'bg-brand-800/20 text-gray-400'
                    }`}
                  >
                    {event.type === 'upgraded'
                      ? '&uarr;'
                      : event.type === 'renewed'
                        ? '&#8635;'
                        : event.type === 'cancelled'
                          ? '&#10005;'
                          : '&#10003;'}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{event.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Payment Method ─── */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Payment Method</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center text-lg">
                {sub.paymentMethod.includes('USDC') ? '💎' : '💳'}
              </span>
              <div>
                <p className="font-semibold text-sm">{sub.paymentMethod}</p>
                <p className="text-xs text-gray-500">
                  {sub.paymentMethod.includes('USDC')
                    ? 'Instant settlement on Polygon'
                    : 'Processed via NOWPayments'}
                </p>
              </div>
            </div>
            <button
              onClick={() => toast('Payment method update coming soon', 'info')}
              className="rounded-full border border-brand-800/30 px-5 py-2 text-sm font-semibold text-gray-400 hover:border-red-600 hover:text-white transition"
            >
              Update Payment Method
            </button>
          </div>
        </div>
      </div>

      {/* ─── Cancel Confirmation Modal ─── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl bg-[#15151f] border border-brand-800/20 p-8">
            <h2 className="text-xl font-bold mb-2">Cancel Your Subscription?</h2>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to cancel? You will lose access to:
            </p>

            <ul className="space-y-2 mb-6">
              {[
                '320kbps high-quality streaming',
                'Ad-free listening experience',
                'Pre-sale ticket access',
                'Merch discount (10-15% off)',
                '24h early access to new releases',
                'Unlimited follows and skips',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-red-400">
                  <span className="text-red-500">&#10005;</span> {item}
                </li>
              ))}
            </ul>

            <div className="rounded-xl bg-brand-950/50 border border-brand-800/20 p-4 mb-6">
              <p className="text-xs text-gray-400">
                You will have a <span className="text-yellow-400 font-semibold">7-day grace period</span> after
                cancellation. During this time you can re-subscribe without losing any data or
                preferences.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  toast('Subscription cancelled. Grace period active for 7 days.', 'info');
                }}
                className="flex-1 rounded-full border border-red-600 text-red-400 py-3 text-sm font-semibold hover:bg-red-600 hover:text-white transition"
              >
                Cancel Subscription
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 rounded-full bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-500 transition"
              >
                Keep My Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
