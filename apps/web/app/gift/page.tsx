'use client';

import { useState } from 'react';
import Link from 'next/link';

type Duration = '1' | '3' | '6' | '12';

interface GiftPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  features: string[];
  highlight?: boolean;
}

const plans: GiftPlan[] = [
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: 8.73,
    features: ['Unlimited streaming', 'Offline downloads', 'High-quality audio', 'Direct creator support'],
  },
  {
    id: 'bundle',
    name: 'Bundle',
    monthlyPrice: 12.73,
    features: ['Everything in Premium', 'Exclusive creator content', 'Early access to releases', 'Community features', 'Live session access'],
    highlight: true,
  },
  {
    id: 'studio',
    name: 'Studio',
    monthlyPrice: 16.0,
    features: ['Everything in Bundle', 'Studio-quality lossless', 'Creator collaboration tools', 'Priority support', 'Revenue analytics'],
  },
];

const durationLabels: Record<Duration, string> = {
  '1': '1 Month',
  '3': '3 Months',
  '6': '6 Months',
  '12': '12 Months',
};

const durationDiscounts: Record<Duration, number> = {
  '1': 0,
  '3': 0.05,
  '6': 0.1,
  '12': 0.15,
};

export default function GiftPage() {
  const [selectedPlan, setSelectedPlan] = useState('bundle');
  const [duration, setDuration] = useState<Duration>('3');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [deliveryOption, setDeliveryOption] = useState<'now' | 'scheduled'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [showToast, setShowToast] = useState(false);

  const plan = plans.find((p) => p.id === selectedPlan)!;
  const months = parseInt(duration);
  const discount = durationDiscounts[duration];
  const totalPrice = plan.monthlyPrice * months * (1 - discount);

  const handlePurchase = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Back nav */}
        <Link href="/subscribe" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Subscribe
        </Link>

        {/* Hero */}
        <div className="text-center mb-12">
          <p className="text-5xl mb-4">&#127873;</p>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Gift the sound of <span className="text-red-500">independence</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Give someone the gift of direct-to-creator music. Every dollar goes where it matters.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {plans.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlan(p.id)}
              className={`relative rounded-2xl p-6 text-left transition border ${
                selectedPlan === p.id
                  ? 'bg-[#15151f] border-red-600 ring-1 ring-red-600'
                  : 'bg-[#15151f] border-gray-800 hover:border-gray-700'
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-red-600 text-white text-xs font-bold">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold mb-1">{p.name}</h3>
              <p className="text-2xl font-black text-red-500 mb-4">
                ${p.monthlyPrice.toFixed(2)}<span className="text-sm text-gray-400 font-normal">/mo</span>
              </p>
              <ul className="space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {/* Duration selector */}
        <div className="mb-10">
          <h2 className="text-lg font-bold mb-4">Gift Duration</h2>
          <div className="flex flex-wrap gap-3">
            {(Object.entries(durationLabels) as [Duration, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setDuration(key)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition border ${
                  duration === key
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-[#15151f] border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {label}
                {durationDiscounts[key] > 0 && (
                  <span className="ml-1.5 text-xs opacity-80">(-{durationDiscounts[key] * 100}%)</span>
                )}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Total: <span className="text-white font-bold">${totalPrice.toFixed(2)}</span>
            {discount > 0 && <span className="text-red-400 ml-2">Save {(discount * 100).toFixed(0)}%</span>}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Recipient form */}
          <div>
            <h2 className="text-lg font-bold mb-4">Recipient Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Recipient Name</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Their name"
                  className="w-full px-4 py-3 rounded-xl bg-[#15151f] border border-gray-800 text-white placeholder-gray-600 focus:border-red-600 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Recipient Email</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="their@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-[#15151f] border border-gray-800 text-white placeholder-gray-600 focus:border-red-600 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Personal Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a personal message..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-[#15151f] border border-gray-800 text-white placeholder-gray-600 focus:border-red-600 focus:outline-none transition resize-none"
                />
              </div>

              {/* Delivery options */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Delivery</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryOption === 'now'}
                      onChange={() => setDeliveryOption('now')}
                      className="accent-red-600"
                    />
                    <span className="text-sm text-gray-300">Send immediately</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryOption === 'scheduled'}
                      onChange={() => setDeliveryOption('scheduled')}
                      className="accent-red-600"
                    />
                    <span className="text-sm text-gray-300">Schedule delivery</span>
                  </label>
                </div>
                {deliveryOption === 'scheduled' && (
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="mt-3 w-full px-4 py-3 rounded-xl bg-[#15151f] border border-gray-800 text-white focus:border-red-600 focus:outline-none transition"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Gift Preview */}
          <div>
            <h2 className="text-lg font-bold mb-4">Gift Preview</h2>
            <div className="bg-gradient-to-br from-red-600/20 to-purple-600/20 border border-gray-800 rounded-2xl p-6">
              <div className="bg-[#15151f] rounded-xl p-6 text-center">
                <p className="text-4xl mb-3">&#127873;</p>
                <p className="text-xs uppercase tracking-widest text-red-400 font-semibold mb-2">You&apos;ve been gifted</p>
                <h3 className="text-2xl font-bold mb-1">OPYNX {plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{durationLabels[duration]} of direct-to-creator music</p>
                {recipientName && (
                  <p className="text-sm text-gray-300 mb-2">
                    To: <span className="text-white font-semibold">{recipientName}</span>
                  </p>
                )}
                {message && (
                  <div className="bg-black/30 rounded-lg p-3 mt-3">
                    <p className="text-sm text-gray-300 italic">&ldquo;{message}&rdquo;</p>
                  </div>
                )}
                <button className="mt-4 px-6 py-2.5 rounded-full bg-red-600 text-white text-sm font-semibold">
                  Redeem Your Gift
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase button */}
        <div className="text-center mb-10">
          <button
            onClick={handlePurchase}
            className="px-10 py-4 rounded-full bg-red-600 text-white text-lg font-bold hover:bg-red-500 transition hover:scale-105"
          >
            Purchase Gift &mdash; ${totalPrice.toFixed(2)}
          </button>
        </div>

        {/* Revenue transparency */}
        <div className="bg-[#15151f] border border-gray-800 rounded-2xl p-6 text-center">
          <h3 className="font-bold mb-2">Revenue Transparency</h3>
          <p className="text-sm text-gray-400 max-w-lg mx-auto">
            Every gift subscription follows our transparent revenue model. Creators receive the majority of subscription revenue,
            with platform costs clearly broken down on-chain. No hidden fees, no opaque accounting.
          </p>
          <Link href="/calculator" className="inline-block mt-3 text-red-400 text-sm font-semibold hover:text-red-300 transition">
            See how revenue is split &rarr;
          </Link>
        </div>

        {/* Toast */}
        {showToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg animate-fade-in">
            Gift purchase initiated! The recipient will receive an email shortly.
          </div>
        )}
      </div>
    </div>
  );
}
