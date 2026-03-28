'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

const TIERS = [
  {
    name: 'Free',
    price: 0,
    color: 'border-gray-700',
    members: 1243,
    perks: ['Access public posts', 'Join community chat', 'View artist updates'],
  },
  {
    name: 'Silver',
    price: 4.99,
    color: 'border-gray-400',
    members: 456,
    perks: ['All Free perks', 'Behind-the-scenes photos', 'Early access to singles', 'Monthly Q&A sessions', 'Exclusive playlists'],
  },
  {
    name: 'Gold',
    price: 9.99,
    color: 'border-yellow-500',
    members: 189,
    popular: true,
    perks: ['All Silver perks', 'Unreleased demos access', 'Voice memos & updates', 'Private Discord channel', 'Merch discounts (15%)', 'Name in album credits'],
  },
  {
    name: 'Platinum',
    price: 19.99,
    color: 'border-red-600',
    members: 47,
    perks: ['All Gold perks', 'Monthly 1-on-1 video call', 'Co-writing session invite', 'Free signed merch quarterly', 'Private show invitations', 'Production credit on tracks'],
  },
];

const MOCK_CONTENT = [
  { id: 1, type: 'photo', title: 'Studio session vibes', tier: 'Silver', timestamp: '2 hours ago', likes: 234, comments: 18, locked: false },
  { id: 2, type: 'voice_memo', title: 'Quick update on the new album', tier: 'Silver', timestamp: '1 day ago', likes: 189, comments: 42, locked: false },
  { id: 3, type: 'demo', title: 'Unreleased track - "Fading Light" (rough mix)', tier: 'Gold', timestamp: '3 days ago', likes: 312, comments: 56, locked: true },
  { id: 4, type: 'qa', title: 'Fan Q&A: Your questions answered (March)', tier: 'Silver', timestamp: '5 days ago', likes: 145, comments: 89, locked: false },
  { id: 5, type: 'photo', title: 'Tour rehearsal day 1', tier: 'Free', timestamp: '1 week ago', likes: 567, comments: 34, locked: false },
  { id: 6, type: 'demo', title: 'Acoustic version - "Midnight Hour"', tier: 'Platinum', timestamp: '1 week ago', likes: 98, comments: 23, locked: true },
  { id: 7, type: 'voice_memo', title: 'The story behind my latest single', tier: 'Gold', timestamp: '2 weeks ago', likes: 276, comments: 41, locked: true },
];

const RECENT_MEMBERS = [
  'Alex M.', 'Sarah K.', 'DJ Frost', 'MusicLover99', 'Nina R.',
  'BeatHead', 'Carmen L.', 'Jake T.', 'Yuki S.', 'RhythmKing',
];

const LEADERBOARD = [
  { name: 'MusicLover99', points: 12450, tier: 'Platinum' },
  { name: 'BeatHead', points: 9820, tier: 'Gold' },
  { name: 'Sarah K.', points: 8340, tier: 'Gold' },
  { name: 'DJ Frost', points: 7210, tier: 'Silver' },
  { name: 'Carmen L.', points: 6890, tier: 'Platinum' },
];

const TYPE_ICONS: Record<string, string> = {
  photo: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  voice_memo: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
  demo: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z',
  qa: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

const TIER_COLORS: Record<string, string> = {
  Free: 'text-gray-400',
  Silver: 'text-gray-300',
  Gold: 'text-yellow-400',
  Platinum: 'text-red-500',
};

export default function FanClubPage() {
  const params = useParams();
  const { toast } = useToast();
  const artistId = params.id as string;
  const [currentTier] = useState<string | null>(null);

  // Mock artist name from ID
  const artistName = artistId
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const tierRank = ['Free', 'Silver', 'Gold', 'Platinum'];
  const hasAccess = (requiredTier: string) => {
    if (!currentTier) return requiredTier === 'Free';
    return tierRank.indexOf(currentTier) >= tierRank.indexOf(requiredTier);
  };

  return (
    <div className="min-h-screen bg-brand-950 p-6 md:p-8 max-w-6xl mx-auto">
      <Link href={`/artist/${artistId}`} className="text-gray-400 hover:text-white text-sm mb-6 inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Artist
      </Link>

      {/* Artist Header */}
      <div className="mt-4 mb-8 flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-[#15151f] flex items-center justify-center text-red-500 font-bold text-2xl shrink-0">
          {artistName.charAt(0)}
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">{artistName}</h1>
          <p className="text-gray-400 mt-1">Fan Club &mdash; {TIERS.reduce((a, t) => a + t.members, 0).toLocaleString()} members</p>
        </div>
      </div>

      {/* Membership Tiers */}
      <h2 className="text-xl font-bold text-white mb-4">Membership Tiers</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {TIERS.map((tier) => (
          <div key={tier.name} className={`bg-[#15151f] rounded-xl p-5 border ${tier.popular ? 'border-red-600' : tier.color} relative`}>
            {tier.popular && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs bg-red-600 text-white px-3 py-0.5 rounded-full font-medium">Most Popular</span>}
            <h3 className={`font-bold text-lg ${TIER_COLORS[tier.name]}`}>{tier.name}</h3>
            <p className="text-white text-2xl font-bold mt-1">
              {tier.price === 0 ? 'Free' : `$${tier.price}`}
              {tier.price > 0 && <span className="text-gray-500 text-sm font-normal">/mo</span>}
            </p>
            <p className="text-gray-500 text-xs mt-1">{tier.members.toLocaleString()} members</p>
            <ul className="mt-4 space-y-2">
              {tier.perks.map((perk, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {perk}
                </li>
              ))}
            </ul>
            <button
              onClick={() => toast(tier.price === 0 ? 'Welcome to the free tier!' : `Joined ${tier.name} tier!`, 'success')}
              className={`w-full mt-4 py-2.5 rounded-lg font-semibold text-sm transition ${
                currentTier === tier.name
                  ? 'bg-gray-700 text-gray-400 cursor-default'
                  : tier.popular
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
              disabled={currentTier === tier.name}
            >
              {currentTier === tier.name ? 'Current Tier' : tier.price === 0 ? 'Join Free' : `Join ${tier.name}`}
            </button>
          </div>
        ))}
      </div>

      {/* Exclusive Content Feed */}
      <h2 className="text-xl font-bold text-white mb-4">Exclusive Content</h2>
      <div className="space-y-4 mb-10">
        {MOCK_CONTENT.map((content) => {
          const locked = !hasAccess(content.tier);
          return (
            <div key={content.id} className="bg-[#15151f] rounded-xl p-5 relative overflow-hidden">
              {locked && (
                <div className="absolute inset-0 bg-brand-950/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <svg className="w-8 h-8 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <p className="text-gray-400 text-sm text-center px-4">This content is exclusive to <span className={`font-semibold ${TIER_COLORS[content.tier]}`}>{content.tier}</span> members</p>
                </div>
              )}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-brand-950 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={TYPE_ICONS[content.type]} /></svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      content.tier === 'Free' ? 'bg-gray-700 text-gray-300' :
                      content.tier === 'Silver' ? 'bg-gray-600 text-gray-200' :
                      content.tier === 'Gold' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-600/20 text-red-400'
                    }`}>{content.tier}</span>
                    <span className="text-xs text-gray-500 capitalize">{content.type.replace('_', ' ')}</span>
                  </div>
                  <h3 className="text-white font-semibold">{content.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                    <span>{content.timestamp}</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      {content.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      {content.comments}
                    </span>
                  </div>
                </div>

                {/* Placeholder content area */}
                {content.type === 'photo' && (
                  <div className="w-24 h-24 bg-brand-950 rounded-lg shrink-0 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={TYPE_ICONS.photo} /></svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Members */}
        <div className="bg-[#15151f] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Recent Members</h2>
          <div className="flex flex-wrap gap-3">
            {RECENT_MEMBERS.map((name) => (
              <div key={name} className="flex items-center gap-2 bg-brand-950 rounded-full px-3 py-1.5">
                <div className="w-6 h-6 rounded-full bg-red-600/30 flex items-center justify-center text-red-400 text-xs font-bold">
                  {name.charAt(0)}
                </div>
                <span className="text-sm text-gray-300">{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-[#15151f] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Top Fans</h2>
          <div className="space-y-3">
            {LEADERBOARD.map((fan, idx) => (
              <div key={fan.name} className="flex items-center gap-3">
                <span className={`w-6 text-center font-bold text-sm ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                  {idx + 1}
                </span>
                <div className="w-8 h-8 rounded-full bg-brand-950 flex items-center justify-center text-red-400 text-xs font-bold">
                  {fan.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{fan.name}</p>
                  <p className={`text-xs ${TIER_COLORS[fan.tier]}`}>{fan.tier}</p>
                </div>
                <span className="text-gray-400 text-sm font-semibold">{fan.points.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
