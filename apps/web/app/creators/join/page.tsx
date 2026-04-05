'use client';

import { useState } from 'react';
import Link from 'next/link';

const benefits = [
  {
    icon: '\uD83C\uDFB5',
    title: 'Upload Music',
    desc: 'Distribute tracks and albums directly to your fans with lossless quality support.',
  },
  {
    icon: '\uD83C\uDFAB',
    title: 'Create Events',
    desc: 'Sell tickets for live shows and virtual events with built-in QR scanning.',
  },
  {
    icon: '\uD83D\uDCB0',
    title: 'Earnings Dashboard',
    desc: 'Track your revenue in real-time with transparent, on-chain verified payouts.',
  },
  {
    icon: '\uD83D\uDCCA',
    title: 'Analytics',
    desc: 'Deep insights into your audience demographics, play counts, and engagement.',
  },
  {
    icon: '\uD83D\uDD17',
    title: 'QR Code Generation',
    desc: 'Generate scannable codes for merch, events, and exclusive content drops.',
  },
  {
    icon: '\uD83D\uDCAC',
    title: 'Direct Messaging',
    desc: 'Connect with your subscribers through built-in fan messaging.',
  },
];

const features = [
  'Unlimited music uploads',
  'Event creation and ticket sales',
  'Real-time earnings dashboard',
  'Advanced fan analytics',
  'QR code generation tools',
  'Direct fan messaging',
  'Verified creator badge',
  'Priority support',
];

const faqs = [
  {
    question: 'What do I get with Creator Studio?',
    answer:
      'Creator Studio gives you the full toolkit to build your career on OPYNX: unlimited music uploads, event and ticket management, a real-time earnings dashboard, advanced analytics, QR code tools, direct fan messaging, and a verified creator badge. Everything you need to distribute, monetize, and grow.',
  },
  {
    question: 'How do payouts work?',
    answer:
      'When a fan subscribes to OPYNX and listens to your music, you receive $1.00 per subscriber per month. Payouts are processed monthly and settled on the Polygon blockchain in USDC, giving you full transparency with verifiable on-chain records. There are no hidden fees or deductions from your $1.00 creator share.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes. Creator Studio is a month-to-month subscription with no long-term commitment. You can cancel at any time from your dashboard. If you cancel, you retain access through the end of your current billing period. Your uploaded content remains available to fans.',
  },
];

export default function CreatorJoinPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-brand-950">
      {/* Hero */}
      <section className="relative px-6 pt-20 pb-16 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-5xl mb-6 block" role="img" aria-label="guitar">
            {'\uD83C\uDFB8'}
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Start Creating on{' '}
            <span className="text-red-500">OPYNX</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            The platform built for independent artists. Upload music, sell
            tickets, track earnings, and connect directly with your fans.
          </p>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl bg-[#15151f] border border-white/5 p-6 transition hover:border-red-600/30"
            >
              <span className="text-3xl mb-3 block">{b.icon}</span>
              <h3 className="text-lg font-bold mb-2">{b.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {b.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Card */}
      <section className="px-6 pb-16">
        <div className="max-w-md mx-auto">
          <div className="rounded-2xl bg-[#15151f] border-2 border-red-600/40 p-8 text-center shadow-lg shadow-red-900/10">
            <p className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-2">
              Creator Studio
            </p>
            <div className="mb-6">
              <span className="text-5xl font-black text-white">$16</span>
              <span className="text-gray-500 text-lg">.00/mo</span>
            </div>

            <ul className="text-left space-y-3 mb-8">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <svg
                    className="w-4 h-4 text-red-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-300">{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/auth/login"
              className="block w-full rounded-full bg-gradient-to-r from-red-600 to-red-500 py-4 font-semibold text-white text-lg transition hover:shadow-lg hover:shadow-red-600/30"
            >
              Get Started
            </Link>

            <p className="text-xs text-gray-500 mt-4">
              No long-term commitment. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Revenue Breakdown */}
      <section className="px-6 pb-16">
        <div className="max-w-2xl mx-auto rounded-2xl bg-[#15151f] border border-white/5 p-8">
          <h2 className="text-xl font-bold text-center mb-2">
            How You Earn
          </h2>
          <p className="text-center text-gray-400 text-sm mb-6">
            Transparent, verifiable creator payouts
          </p>

          {/* Fan subscription revenue */}
          <div className="bg-brand-950 rounded-xl p-6 mb-6">
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-4">
              Fan Subscription Revenue
            </p>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400">Your fans pay</span>
              <span className="text-xl font-bold text-white">$8.73/mo</span>
            </div>
            <div className="w-full h-3 rounded-full bg-gray-800 overflow-hidden mb-4">
              <div
                className="h-full bg-red-500 rounded-full"
                style={{ width: '11.5%' }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">You receive</span>
              <span className="text-xl font-bold text-red-500">
                $1.00
                <span className="text-sm text-gray-500 font-normal ml-1">
                  per subscriber
                </span>
              </span>
            </div>
          </div>

          {/* Creator Studio cost clarification */}
          <div className="bg-brand-950 rounded-xl p-6 mb-6 border border-white/5">
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3">
              Your Tooling Subscription
            </p>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Creator Studio</span>
              <span className="text-xl font-bold text-white">$16.00/mo</span>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              This is what you pay for creator tools (uploads, analytics,
              events, messaging). It is separate from fan revenue — your
              $1.00 per subscriber earnings are not affected.
            </p>
          </div>

          <p className="text-center text-sm text-gray-500">
            Your fans pay $8.73/mo and you receive $1.00 per subscriber,
            settled monthly in USDC on Polygon. Creator Studio ($16/mo) is
            your tooling subscription — separate from fan revenue.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl bg-[#15151f] border border-white/5 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-semibold pr-4">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
