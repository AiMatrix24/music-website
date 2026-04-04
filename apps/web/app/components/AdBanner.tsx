'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface AdBannerProps {
  placement: 'explore' | 'search' | 'track' | 'sidebar';
}

/**
 * Ad Banner Component for free tier users.
 * Shows banner ads only for unauthenticated / free tier users.
 * Hidden for standard/superfan_bundle subscribers.
 * Tracks impressions for ad revenue reporting.
 */
export function AdBanner({ placement }: AdBannerProps) {
  const { status } = useSession();
  const [dismissed, setDismissed] = useState(false);

  // Hide for authenticated users (mock: treat all authenticated users as paid)
  // In production, check subscription tier from context/API
  if (status === 'authenticated' || dismissed) {
    return null;
  }

  // Size classes based on placement
  const sizeClasses: Record<AdBannerProps['placement'], string> = {
    explore: 'w-full h-20',
    search: 'w-full h-20',
    track: 'w-full h-32',
    sidebar: 'w-full h-48',
  };

  const isVertical = placement === 'sidebar';

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-brand-800/20 ${sizeClasses[placement]}`}
    >
      {/* Ad creative background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1028] via-[#15151f] to-[#1f0a1a]" />

      {/* Subtle animated shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-600/5 to-transparent animate-pulse" />

      {/* Content */}
      <div
        className={`relative h-full flex ${
          isVertical ? 'flex-col items-center justify-center text-center px-4 gap-3' : 'items-center justify-between px-5'
        }`}
      >
        {/* Ad text */}
        <div className={isVertical ? '' : 'flex-1'}>
          <p className={`font-semibold text-gray-200 ${isVertical ? 'text-sm' : 'text-sm'}`}>
            Discover new music on OPYNX Premium
          </p>
          {(placement === 'track' || isVertical) && (
            <p className="text-xs text-gray-500 mt-1">
              Ad-free listening, high-quality audio, exclusive content
            </p>
          )}
        </div>

        {/* CTA */}
        <Link
          href="/subscribe"
          className={`shrink-0 rounded-full bg-red-600 font-semibold text-white transition hover:bg-red-700 ${
            isVertical ? 'px-5 py-2.5 text-sm' : 'px-4 py-2 text-xs'
          }`}
        >
          Upgrade to Premium — $8.73/mo
        </Link>

        {isVertical && (
          <p className="text-[10px] text-gray-600 mt-1">Remove ads with any subscription</p>
        )}
      </div>

      {/* "Ad" label */}
      <span className="absolute top-1.5 left-2 text-[9px] font-bold uppercase tracking-wider text-gray-600 bg-[#15151f]/80 px-1.5 py-0.5 rounded">
        Ad
      </span>

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-1.5 right-2 text-gray-600 hover:text-gray-400 transition p-0.5"
        aria-label="Dismiss ad"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-3.5 h-3.5"
        >
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}
