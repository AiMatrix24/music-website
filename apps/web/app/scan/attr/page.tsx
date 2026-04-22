'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';
import { EmailCapture } from '@/app/components/EmailCapture';

// ─── Types ───

type ScanContext = 'pre_show' | 'during_show' | 'post_show';

interface AttrParams {
  creatorId: string | null;
  facilitatorId: string | null;
  eventId: string | null;
  timestamp: string | null;
  ctx: ScanContext | null;
  sig: string | null;
}

// ─── Mock Data (replace with API calls in production) ───

function getMockArtistName(creatorId: string | null): string {
  if (!creatorId) return 'Creator';
  // Mock lookup — in production, fetch from API
  const mockNames: Record<string, string> = {
    artist_001: 'Luna Wave',
    artist_002: 'DJ Cryptex',
    artist_003: 'The Velvet Keys',
  };
  return mockNames[creatorId] ?? 'Creator';
}

function getMockEventName(eventId: string | null): string {
  if (!eventId) return 'Live Event';
  const mockEvents: Record<string, string> = {
    evt_001: 'Summer Soundwave Festival',
    evt_002: 'Underground Sessions Vol. 3',
    evt_003: 'OPYNX Launch Party',
  };
  return mockEvents[eventId] ?? 'Live Event';
}

function getMockFacilitatorName(facilitatorId: string | null): string {
  if (!facilitatorId) return '';
  const mockFacilitators: Record<string, string> = {
    fac_001: 'Alex Rivera',
    fac_002: 'Jordan Blue',
  };
  return mockFacilitators[facilitatorId] ?? 'Street Team Member';
}

// ─── Subscribe URL Builder ───

function buildSubscribeUrl(params: AttrParams): string {
  const query = new URLSearchParams();
  if (params.creatorId) query.set('creator', params.creatorId);
  if (params.facilitatorId) query.set('ref', params.facilitatorId);
  if (params.eventId) query.set('event', params.eventId);
  if (params.ctx) query.set('ctx', params.ctx);
  if (params.sig) query.set('sig', params.sig);
  const qs = query.toString();
  return qs ? `/subscribe?${qs}` : '/subscribe';
}

// ─── Inner Component (needs Suspense boundary for useSearchParams) ───

function AttrPageContent() {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { toast } = useToast();
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  // Parse URL params
  const params: AttrParams = {
    creatorId: searchParams.get('c'),
    facilitatorId: searchParams.get('f'),
    eventId: searchParams.get('e'),
    timestamp: searchParams.get('t'),
    ctx: (searchParams.get('ctx') as ScanContext) || null,
    sig: searchParams.get('sig'),
  };

  const artistName = getMockArtistName(params.creatorId);
  const eventName = getMockEventName(params.eventId);
  const facilitatorName = getMockFacilitatorName(params.facilitatorId);
  const subscribeUrl = buildSubscribeUrl(params);

  // ─── Context-specific content ───

  const contextConfig: Record<
    ScanContext,
    { heading: string; subtext: string; ctaText: string; showEmailCapture: boolean }
  > = {
    pre_show: {
      heading: `Pre-Save ${artistName}'s Music`,
      subtext: `Follow ${artistName} and be the first to hear new releases. Save their upcoming tracks before anyone else.`,
      ctaText: 'Follow & Pre-Save',
      showEmailCapture: true,
    },
    during_show: {
      heading: 'Subscribe Now',
      subtext: `You're at ${eventName}! Subscribe to ${artistName} for exclusive content, high-quality audio, and merch discounts.`,
      ctaText: 'Subscribe Now — $8.73/mo',
      showEmailCapture: false,
    },
    post_show: {
      heading: 'Unlock Exclusive Content',
      subtext: `Thanks for attending ${eventName}! Subscribe to ${artistName} to unlock exclusive behind-the-scenes content and live recordings.`,
      ctaText: 'Unlock Exclusive Access',
      showEmailCapture: true,
    },
  };

  const ctx = params.ctx ?? 'during_show';
  const config = contextConfig[ctx];

  const handleFollowClick = () => {
    if (status !== 'authenticated') {
      setShowEmailCapture(true);
      return;
    }
    toast(`Following ${artistName}!`, 'success');
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 pt-12 pb-24">
      {/* Back to home */}
      <Link
        href="/"
        className="text-sm text-gray-400 hover:text-white transition mb-8 self-start"
      >
        &larr; OPYNX Home
      </Link>

      {/* Creator Avatar (mock) */}
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-pink-700 flex items-center justify-center text-4xl mb-6 ring-4 ring-red-600/20">
        🎤
      </div>

      {/* Creator Name */}
      <h1 className="text-3xl font-black text-white mb-1 text-center">{artistName}</h1>

      {/* Verified at Event badge */}
      {params.eventId && (
        <div className="flex items-center gap-2 mt-2 mb-4">
          <span className="inline-flex items-center gap-1.5 bg-green-600/10 border border-green-600/20 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5"
            >
              <path
                fillRule="evenodd"
                d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
            Verified at {eventName}
          </span>
        </div>
      )}

      {/* Facilitator attribution */}
      {facilitatorName && (
        <p className="text-xs text-gray-500 mb-6">
          Connected by <span className="text-gray-400 font-medium">{facilitatorName}</span>
        </p>
      )}

      {/* Context badge */}
      <div className="mb-6">
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${
            ctx === 'pre_show'
              ? 'bg-blue-600/15 text-blue-400 border border-blue-600/20'
              : ctx === 'during_show'
              ? 'bg-red-600/15 text-red-400 border border-red-600/20'
              : 'bg-purple-600/15 text-purple-400 border border-purple-600/20'
          }`}
        >
          {ctx === 'pre_show' ? 'Pre-Show' : ctx === 'during_show' ? 'Live Now' : 'Post-Show'}
        </span>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md rounded-2xl bg-[#15151f] border border-brand-800/30 p-8 text-center">
        <h2 className="text-xl font-bold text-white mb-3">{config.heading}</h2>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">{config.subtext}</p>

        {/* Primary CTA */}
        <Link
          href={subscribeUrl}
          className="block w-full rounded-full bg-red-600 py-4 font-semibold text-white text-center hover:bg-red-700 transition mb-3"
        >
          {config.ctaText}
        </Link>

        {/* Secondary action based on context */}
        {ctx === 'pre_show' && (
          <button
            onClick={handleFollowClick}
            className="w-full rounded-full border border-brand-800/30 py-3.5 text-sm font-semibold text-gray-300 hover:border-red-600/30 hover:text-white transition"
          >
            Just Follow for Now
          </button>
        )}

        {ctx === 'post_show' && config.showEmailCapture && (
          <button
            onClick={() => setShowEmailCapture(true)}
            className="w-full rounded-full border border-brand-800/30 py-3.5 text-sm font-semibold text-gray-300 hover:border-red-600/30 hover:text-white transition"
          >
            Get a Free Exclusive Instead
          </button>
        )}

        {ctx === 'during_show' && (
          <p className="text-xs text-gray-500 mt-4">
            Cancel anytime. Ad-free, high-quality audio, exclusive content.
          </p>
        )}
      </div>

      {/* Additional info */}
      <div className="w-full max-w-md mt-6 space-y-3">
        {/* What you get */}
        <div className="rounded-xl bg-[#15151f] border border-brand-800/20 p-5">
          <h3 className="text-sm font-semibold text-white mb-3">What you get with OPYNX</h3>
          <ul className="space-y-2">
            {[
              'Ad-free listening experience',
              'High-quality 320kbps audio',
              'Exclusive creator content & drops',
              'Direct messaging with creators',
              'Merch discounts up to 15%',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-400">
                <span className="text-red-500 shrink-0">&#10003;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing note */}
        <p className="text-center text-xs text-gray-600">
          Plans start at $8.73/mo &middot; Cancel anytime &middot;{' '}
          <Link href="/subscribe" className="text-red-400 hover:text-red-300 underline underline-offset-2">
            View all plans
          </Link>
        </p>
      </div>

      {/* Email Capture Modal */}
      <EmailCapture
        creatorName={artistName}
        isOpen={showEmailCapture}
        onClose={() => setShowEmailCapture(false)}
      />
    </div>
  );
}

// ─── Page Export (with Suspense for useSearchParams) ───

export default function AttrPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AttrPageContent />
    </Suspense>
  );
}
