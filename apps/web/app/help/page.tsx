'use client';

import Link from 'next/link';
import { useState } from 'react';

const FAQ_SECTIONS = [
  {
    title: 'Getting Started',
    items: [
      { q: 'What is OPYNX?', a: 'OPYNX is the FanEngage Protocol — a direct-to-fan music platform where creators sell music, tickets, and merch with transparent on-chain revenue sharing. Every dollar is tracked and verifiable on Polygon.' },
      { q: 'How do I sign up?', a: 'Click "Sign In" in the top right and connect with Discord, Twitter, or Twitch. Your account is created instantly. No email/password needed.' },
      { q: 'Is OPYNX free to use?', a: 'Browsing is free. The Free tier lets you explore tracks and follow up to 5 creators. Premium ($8.73/mo) unlocks 320kbps streaming, exclusive content, and pre-sale tickets.' },
    ],
  },
  {
    title: 'For Creators',
    items: [
      { q: 'How do I upload music?', a: 'Go to Dashboard → Upload Track. Fill in the title, genre, BPM, and upload your audio file. Tracks are published instantly to all subscribers.' },
      { q: 'How much do I earn per subscriber?', a: '$1.00 per active Premium subscriber per month, verifiable on-chain via Polygon. Facilitators (venue staff) earn $0.25-$0.50, and the rest goes to platform infrastructure. Actual payouts depend on active subscriber count and payment status.' },
      { q: 'How do payouts work?', a: 'Payouts are processed in USDC on Polygon. You can set your payout threshold in Settings. All transactions are transparent and verifiable on the blockchain.' },
      { q: 'Can I sell event tickets?', a: 'Yes! Go to Dashboard → Create Event. Set up ticket tiers (Free, Early Bird, General, VIP) with pricing. We handle anti-scalper protection, waitlists, and QR code verification.' },
    ],
  },
  {
    title: 'Tickets & Events',
    items: [
      { q: 'How do anti-scalper protections work?', a: 'Tickets are non-transferable and tied to the buyer\'s identity. Each ticket has a unique QR code. Transfers require creator approval and the original ticket is voided.' },
      { q: 'Can I transfer my ticket?', a: 'Yes, but only through our controlled transfer system. Go to My Tickets → Transfer. The event host must approve the transfer, and the recipient gets a new QR code.' },
      { q: 'What if an event sells out?', a: 'Join the waitlist! You\'ll be notified when tickets become available (from refunds or cancellations). Waitlisted tickets are sold at face value only — no markups.' },
      { q: 'Do you offer ticket insurance?', a: 'Coming soon! We\'re working on refund protection that lets you get a full refund up to 24 hours before the event.' },
    ],
  },
  {
    title: 'Payments & Subscriptions',
    items: [
      { q: 'What payment methods do you accept?', a: 'USDC on Polygon (crypto) and traditional credit/debit cards (Visa, Mastercard). Crypto payments have zero processing fees.' },
      { q: 'Can I cancel my subscription?', a: 'Yes, anytime. Go to Settings → Subscription → Cancel. You\'ll have a 5-day grace period and your access continues until the end of the billing cycle.' },
      { q: 'Where can I see the revenue breakdown?', a: 'On the Subscribe page, the "Where Your Money Goes" section shows the exact split per plan. All payouts are verifiable on the Polygon blockchain.' },
    ],
  },
];

export default function HelpPage() {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = FAQ_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        !searchQuery ||
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((section) => section.items.length > 0);

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black mb-3">Help Center</h1>
          <p className="text-gray-400 mb-8">Find answers to common questions about OPYNX.</p>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search help articles..."
            className="w-full max-w-md mx-auto bg-[#15151f] border border-brand-800/30 rounded-full px-6 py-3 text-white placeholder:text-gray-500 focus:border-red-600 outline-none transition"
          />
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <QuickLink icon="🎵" label="Upload Music" href="/dashboard/upload" />
          <QuickLink icon="🎫" label="My Tickets" href="/my-tickets" />
          <QuickLink icon="⚙️" label="Settings" href="/settings" />
          <QuickLink icon="📧" label="Contact Us" href="/contact" />
        </div>

        {/* FAQ sections */}
        <div className="space-y-8">
          {filteredSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-bold mb-4">{section.title}</h2>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const key = `${section.title}-${item.q}`;
                  const isOpen = openItem === key;
                  return (
                    <div key={key} className="rounded-xl bg-[#15151f] border border-brand-800/20 overflow-hidden">
                      <button
                        onClick={() => setOpenItem(isOpen ? null : key)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left transition hover:bg-[#1a1a2e]"
                      >
                        <span className="font-semibold text-sm pr-4">{item.q}</span>
                        <svg
                          className={`w-5 h-5 text-gray-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 text-sm text-gray-400 leading-relaxed border-t border-brand-800/10 pt-3">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still need help? */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-red-900/20 to-brand-900/20 border border-red-800/20 p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
          <p className="text-gray-400 mb-6">Our team is here for you.</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/contact" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
              Contact Support
            </Link>
            <Link href="/messages" className="rounded-full border border-brand-800/30 px-6 py-3 font-semibold hover:border-red-600 transition">
              Send a Message
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <Link href={href} className="rounded-xl bg-[#15151f] border border-brand-800/20 p-4 text-center transition hover:bg-[#1a1a2e] hover:border-red-600/30">
      <p className="text-2xl mb-2">{icon}</p>
      <p className="text-xs font-semibold">{label}</p>
    </Link>
  );
}
