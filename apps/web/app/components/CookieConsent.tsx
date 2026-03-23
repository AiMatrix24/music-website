'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('opynx-cookie-consent');
    if (!consent) {
      // Small delay so it doesn't flash on load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('opynx-cookie-consent', 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem('opynx-cookie-consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[70] p-4 sm:p-6">
      <div className="max-w-xl mx-auto bg-[#15151f] border border-brand-800/30 rounded-2xl p-5 shadow-2xl shadow-black/40">
        <p className="text-sm text-gray-300 mb-4">
          We use cookies to improve your experience and analyze site traffic.
          See our{' '}
          <Link href="/privacy" className="text-brand-400 hover:text-brand-300 underline">
            Privacy Policy
          </Link>{' '}
          for details.
        </p>
        <div className="flex gap-3">
          <button
            onClick={accept}
            className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500 transition"
          >
            Accept
          </button>
          <button
            onClick={decline}
            className="rounded-full border border-brand-800/30 px-5 py-2 text-sm font-semibold text-gray-400 hover:text-white hover:border-brand-600 transition"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
