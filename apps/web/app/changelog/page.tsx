'use client';

import Link from 'next/link';
import { useState } from 'react';

type BadgeType = 'feature' | 'improvement' | 'fix' | 'security';

const badgeStyles: Record<BadgeType, string> = {
  feature: 'bg-green-500/20 text-green-400',
  improvement: 'bg-blue-500/20 text-blue-400',
  fix: 'bg-yellow-500/20 text-yellow-400',
  security: 'bg-red-500/20 text-red-400',
};

function Badge({ type }: { type: BadgeType }) {
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded capitalize ${badgeStyles[type]}`}>
      {type}
    </span>
  );
}

interface Change {
  type: BadgeType;
  text: string;
}

interface VersionEntry {
  version: string;
  date: string;
  changes: Change[];
}

const versions: VersionEntry[] = [
  {
    version: 'v2.5.0',
    date: 'March 27, 2026',
    changes: [
      { type: 'feature', text: 'Live streaming support for artists with real-time chat and tipping' },
      { type: 'feature', text: 'Merchandise designer tool for creating and selling custom merch directly from artist profiles' },
      { type: 'feature', text: 'Global and genre-specific charts with daily, weekly, and monthly rankings' },
      { type: 'improvement', text: 'Upgraded audio player with crossfade and gapless playback support' },
      { type: 'fix', text: 'Fixed playback interruption when switching between Wi-Fi and cellular networks' },
      { type: 'security', text: 'Added rate limiting to API endpoints to prevent abuse' },
    ],
  },
  {
    version: 'v2.4.0',
    date: 'February 20, 2026',
    changes: [
      { type: 'feature', text: 'Ticket transfer functionality allowing fans to send tickets to friends' },
      { type: 'feature', text: 'Waitlist system for sold-out events with automatic notification when spots open' },
      { type: 'feature', text: 'Promotional code support for events and subscriptions' },
      { type: 'improvement', text: 'Event page redesign with larger artwork and improved seat selection' },
      { type: 'fix', text: 'Resolved issue where duplicate charge emails were sent for single purchases' },
      { type: 'fix', text: 'Fixed timezone display inconsistency on event pages for international users' },
    ],
  },
  {
    version: 'v2.3.0',
    date: 'January 15, 2026',
    changes: [
      { type: 'feature', text: 'Push notifications for new releases, event announcements, and follower activity' },
      { type: 'feature', text: 'Direct messaging between fans and artists with media attachment support' },
      { type: 'feature', text: 'Marketplace checkout flow with cart, saved payment methods, and order history' },
      { type: 'improvement', text: 'Reduced initial page load time by 40% with optimized bundling' },
      { type: 'improvement', text: 'Added loading skeletons across all major views for better perceived performance' },
      { type: 'security', text: 'Implemented content security policy headers across all pages' },
    ],
  },
  {
    version: 'v2.2.0',
    date: 'December 8, 2025',
    changes: [
      { type: 'feature', text: 'Artist analytics dashboard with stream counts, revenue breakdowns, and audience demographics' },
      { type: 'feature', text: 'Tour management tools for scheduling dates, venues, and ticket tiers' },
      { type: 'feature', text: 'Collaboration invites allowing multiple artists to be credited on releases' },
      { type: 'improvement', text: 'On-chain payout confirmations now display within the dashboard in real-time' },
      { type: 'fix', text: 'Fixed incorrect revenue split calculations for albums with more than 10 collaborators' },
      { type: 'fix', text: 'Resolved issue where album artwork was not displaying on shared social links' },
    ],
  },
  {
    version: 'v2.1.0',
    date: 'November 1, 2025',
    changes: [
      { type: 'feature', text: 'Explore page with personalized recommendations based on listening history' },
      { type: 'feature', text: 'Full-text search across tracks, albums, artists, events, and playlists' },
      { type: 'feature', text: 'Public artist profiles with bio, discography, upcoming events, and social links' },
      { type: 'improvement', text: 'Migrated authentication flow to support Discord, Twitter/X, and Twitch OAuth' },
      { type: 'improvement', text: 'Improved mobile responsiveness across all pages' },
      { type: 'fix', text: 'Fixed audio playback failing on Safari when using private browsing mode' },
    ],
  },
];

export default function ChangelogPage() {
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          &larr; Back to Home
        </Link>

        <h1 className="text-3xl font-black mb-2">What&apos;s New</h1>
        <p className="text-sm text-gray-500 mb-10">
          A log of all notable changes, features, and fixes to the OPYNX platform.
        </p>

        {/* Version entries */}
        <div className="space-y-10">
          {versions.map((v) => (
            <div key={v.version} className="relative">
              {/* Version header */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                <h2 className="text-xl font-black text-white">{v.version}</h2>
                <span className="text-sm text-gray-500">&mdash; {v.date}</span>
              </div>

              {/* Changes */}
              <div className="bg-[#15151f] border border-brand-800/30 rounded-lg p-5">
                <ul className="space-y-3">
                  {v.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Badge type={change.type} />
                      <span className="text-sm text-gray-300 leading-relaxed">{change.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Subscribe */}
        <div className="bg-[#15151f] border border-brand-800/30 rounded-lg p-6 mt-12">
          <h2 className="text-lg font-bold text-white mb-2">Subscribe to Updates</h2>
          <p className="text-sm text-gray-400 mb-4">
            Get notified when we ship new features and improvements.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-brand-950 border border-brand-800/50 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition"
            />
            <button className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-6 py-2 rounded-lg transition">
              Subscribe
            </button>
          </div>
        </div>

        {/* API changelog link */}
        <p className="text-sm text-gray-500 mt-6 text-center">
          Looking for API changes?{' '}
          <Link href="/developers" className="text-red-400 hover:text-red-300 transition">
            View the API Changelog &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
}
