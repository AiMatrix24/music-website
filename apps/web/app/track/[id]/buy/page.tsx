'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

// ─── Types ───

type PaymentMethod = 'crypto' | 'usdc';
type PricingModel = 'free' | 'pay-what-you-want' | 'fixed';
type SubscriptionTier = 'free' | 'standard' | 'superfan';

interface TrackPurchaseInfo {
  id: string;
  title: string;
  creator: string;
  coverArt: string | null;
  pricingModel: PricingModel;
  fixedPrice: number;       // in dollars
  minimumPrice: number;     // PWYW minimum in dollars
}

const COMMISSION_RATES: Record<SubscriptionTier, { rate: number; label: string }> = {
  free: { rate: 10, label: 'Free User' },
  standard: { rate: 7, label: 'Standard Subscriber' },
  superfan: { rate: 5, label: 'Superfan Bundle' },
};

// ─── Mock Data ───

function getMockTrack(id: string): TrackPurchaseInfo {
  return {
    id,
    title: 'Voltage Drop',
    creator: 'Cipher',
    coverArt: null,
    pricingModel: 'pay-what-you-want',
    fixedPrice: 2.99,
    minimumPrice: 1.00,
  };
}

// ─── Component ───

export default function TrackBuyPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const track = getMockTrack(id);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('crypto');
  const [customAmount, setCustomAmount] = useState<string>(
    track.pricingModel === 'pay-what-you-want' ? String(track.minimumPrice) : String(track.fixedPrice)
  );
  const [userTier] = useState<SubscriptionTier>('free');
  const [processing, setProcessing] = useState(false);
  const [purchased, setPurchased] = useState(false);

  const price =
    track.pricingModel === 'fixed'
      ? track.fixedPrice
      : Math.max(track.minimumPrice, parseFloat(customAmount) || 0);

  const commission = COMMISSION_RATES[userTier];
  const creatorReceives = price * ((100 - commission.rate) / 100);

  function handleBuy() {
    if (track.pricingModel === 'pay-what-you-want' && price < track.minimumPrice) {
      toast(`Minimum price is $${track.minimumPrice.toFixed(2)}`, 'error');
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setPurchased(true);
      toast('Purchase complete!', 'success');
    }, 1500);
  }

  // ─── Purchase Confirmation ───
  if (purchased) {
    return (
      <div className="min-h-screen py-16 px-6">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl text-green-400">&#10003;</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Purchase Confirmed</h1>
          <p className="text-gray-400 mb-6">
            You now own &ldquo;{track.title}&rdquo; by {track.creator}.
          </p>

          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Amount Paid</span>
              <span className="font-semibold">${price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Payment Method</span>
              <span className="font-semibold">{paymentMethod === 'crypto' ? 'NOWPayments (Crypto)' : 'Helio (USDC)'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Download Access</span>
              <span className="font-semibold text-green-400">Permanent</span>
            </div>
          </div>

          <div className="rounded-lg bg-blue-600/10 border border-blue-500/20 px-4 py-3 text-sm text-blue-300 mb-6">
            30-day refund guarantee &mdash; contact support if you need a refund.
          </div>

          <div className="flex gap-3 justify-center">
            <Link href={`/track/${id}`} className="rounded-full bg-[#15151f] border border-brand-800/20 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800/20 transition">
              Back to Track
            </Link>
            <button className="rounded-full bg-red-600 hover:bg-red-700 px-6 py-2.5 text-sm font-semibold text-white transition">
              Download Track
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Buy Page ───
  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-lg mx-auto">
        <Link href={`/track/${id}`} className="text-sm text-gray-400 hover:text-white transition mb-4 inline-block">
          &larr; Back to track
        </Link>

        {/* Track Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-24 h-24 rounded-xl bg-brand-800/30 flex items-center justify-center text-gray-500 text-3xl shrink-0">
            &#9835;
          </div>
          <div>
            <h1 className="text-2xl font-bold">{track.title}</h1>
            <p className="text-gray-400">{track.creator}</p>
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">
            {track.pricingModel === 'pay-what-you-want' ? 'Name Your Price' : 'Price'}
          </h2>

          {track.pricingModel === 'pay-what-you-want' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                Minimum: ${track.minimumPrice.toFixed(2)}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">$</span>
                <input
                  type="number"
                  min={track.minimumPrice}
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-32 bg-brand-950 border border-brand-800/30 rounded-lg px-4 py-3 text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>
          ) : (
            <p className="text-3xl font-bold">${track.fixedPrice.toFixed(2)}</p>
          )}

          {/* Permanent download badge */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-600/10 border border-green-500/20 px-3 py-1.5 text-xs text-green-400 font-semibold">
            <span>&#8681;</span> Includes permanent download access
          </div>
        </div>

        {/* Payment Method */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Payment Method</h2>
          <div className="space-y-3">
            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${paymentMethod === 'crypto' ? 'border-red-600 bg-red-600/5' : 'border-brand-800/20 hover:border-brand-800/40'}`}>
              <input
                type="radio"
                name="payment"
                value="crypto"
                checked={paymentMethod === 'crypto'}
                onChange={() => setPaymentMethod('crypto')}
                className="accent-red-600"
              />
              <div>
                <p className="font-semibold text-sm">Pay with Crypto</p>
                <p className="text-xs text-gray-500">via NOWPayments &mdash; BTC, ETH, SOL, and 200+ tokens</p>
              </div>
            </label>
            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${paymentMethod === 'usdc' ? 'border-red-600 bg-red-600/5' : 'border-brand-800/20 hover:border-brand-800/40'}`}>
              <input
                type="radio"
                name="payment"
                value="usdc"
                checked={paymentMethod === 'usdc'}
                onChange={() => setPaymentMethod('usdc')}
                className="accent-red-600"
              />
              <div>
                <p className="font-semibold text-sm">Pay with USDC</p>
                <p className="text-xs text-gray-500">via Helio &mdash; Solana USDC stablecoin</p>
              </div>
            </label>
          </div>
        </div>

        {/* Commission Info */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-lg font-bold mb-3">Creator Earnings</h2>
          <p className="text-sm text-gray-400 mb-4">
            Creator receives 90-95% depending on your subscription tier.
          </p>
          <div className="space-y-2 text-sm">
            {Object.entries(COMMISSION_RATES).map(([tier, info]) => (
              <div key={tier} className={`flex justify-between ${tier === userTier ? 'text-white' : 'text-gray-500'}`}>
                <span>{info.label}{tier === userTier ? ' (You)' : ''}</span>
                <span>{info.rate}% platform commission</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-brand-800/20 flex justify-between text-sm">
            <span className="text-gray-400">Creator receives</span>
            <span className="font-bold text-green-400">${creatorReceives.toFixed(2)}</span>
          </div>
        </div>

        {/* Refund Notice */}
        <div className="rounded-lg bg-blue-600/10 border border-blue-500/20 px-4 py-3 text-sm text-blue-300 mb-6">
          30-day refund guarantee &mdash; full refund, no questions asked.
        </div>

        {/* Buy Button */}
        <button
          onClick={handleBuy}
          disabled={processing}
          className="w-full rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-50 py-3.5 font-bold text-white text-lg transition"
        >
          {processing ? 'Processing...' : `Buy Now — $${price.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
