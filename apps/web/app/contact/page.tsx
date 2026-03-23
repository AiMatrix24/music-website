'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-3xl font-black mb-2">Contact Us</h1>
        <p className="text-gray-400 mb-10">
          Have questions, feedback, or need support? We&apos;d love to hear from you.
        </p>

        {submitted ? (
          <div className="rounded-2xl bg-[#15151f] p-8 text-center">
            <div className="text-4xl mb-4">✓</div>
            <h2 className="text-xl font-bold mb-2">Message Sent!</h2>
            <p className="text-gray-400 mb-6">
              Thanks for reaching out. We&apos;ll get back to you within 24 hours.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-brand-400 hover:text-brand-300 transition text-sm font-semibold"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl bg-[#15151f] border border-brand-800/20 px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-brand-600 transition"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  required
                  className="w-full rounded-xl bg-[#15151f] border border-brand-800/20 px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-brand-600 transition"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Subject</label>
              <select
                required
                className="w-full rounded-xl bg-[#15151f] border border-brand-800/20 px-4 py-3 text-white outline-none focus:border-brand-600 transition"
              >
                <option value="">Select a topic</option>
                <option value="general">General Inquiry</option>
                <option value="support">Technical Support</option>
                <option value="billing">Billing & Payments</option>
                <option value="creator">Creator Onboarding</option>
                <option value="partnership">Partnership</option>
                <option value="bug">Report a Bug</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Message</label>
              <textarea
                required
                rows={5}
                className="w-full rounded-xl bg-[#15151f] border border-brand-800/20 px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-brand-600 transition resize-none"
                placeholder="Tell us what's on your mind..."
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-500"
            >
              Send Message
            </button>
          </form>
        )}

        {/* Quick links */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-[#15151f] p-6 text-center">
            <p className="text-2xl mb-2">✉</p>
            <h3 className="font-bold mb-1">Email</h3>
            <a href="mailto:hello@opynx.dev" className="text-sm text-brand-400 hover:text-brand-300">
              hello@opynx.dev
            </a>
          </div>
          <div className="rounded-2xl bg-[#15151f] p-6 text-center">
            <p className="text-2xl mb-2">💬</p>
            <h3 className="font-bold mb-1">Discord</h3>
            <p className="text-sm text-brand-400">Join our community</p>
          </div>
          <div className="rounded-2xl bg-[#15151f] p-6 text-center">
            <p className="text-2xl mb-2">𝕏</p>
            <h3 className="font-bold mb-1">Twitter/X</h3>
            <p className="text-sm text-brand-400">@opynx</p>
          </div>
        </div>
      </div>
    </div>
  );
}
