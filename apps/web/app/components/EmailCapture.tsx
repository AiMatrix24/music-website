'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/app/components/Toast';

interface EmailCaptureProps {
  creatorName?: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Freemium Funnel Email Capture Modal.
 * Shows when a free user scans QR but doesn't subscribe.
 * Captures email for nurture sequence.
 */
export function EmailCapture({ creatorName, isOpen, onClose }: EmailCaptureProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const validateEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: POST to /api/email-capture endpoint
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast('Check your inbox!', 'success');
      setEmail('');
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-[#15151f] border border-brand-800/30 p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center text-3xl">
            🎁
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-center text-white mb-2">
          Get a Free Exclusive{creatorName ? ` from ${creatorName}` : ''}!
        </h2>
        <p className="text-sm text-gray-400 text-center mb-6">
          Enter your email for a free wallpaper + behind-the-scenes content
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              placeholder="your@email.com"
              className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-3.5 text-white placeholder:text-gray-600 focus:border-red-500 outline-none transition text-sm"
              autoFocus
            />
            {error && (
              <p className="mt-1.5 text-xs text-red-400">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-red-600 py-3.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              'Get My Free Gift'
            )}
          </button>
        </form>

        {/* Privacy note */}
        <p className="text-[11px] text-gray-600 text-center mt-4">
          We&apos;ll never spam you. Unsubscribe anytime.
        </p>

        {/* Subscribe upsell */}
        <div className="mt-5 pt-4 border-t border-brand-800/20 text-center">
          <p className="text-xs text-gray-500">
            Or{' '}
            <Link
              href="/subscribe"
              className="text-red-400 hover:text-red-300 font-medium underline underline-offset-2 transition"
            >
              subscribe now for full access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
