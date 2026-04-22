'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

// --- Mock Data ---
const USER_STATS = {
  level: 7,
  title: 'Superfan',
  xp: 2340,
  xpToNext: 3000,
  points: 4850,
};

const EARN_ACTIVITIES = [
  { action: 'Listen to a track', xp: 5, icon: '&#9835;' },
  { action: 'Follow an creator', xp: 20, icon: '&#10010;' },
  { action: 'Buy a ticket', xp: 100, icon: '&#127915;' },
  { action: 'Attend an event', xp: 200, icon: '&#127926;' },
  { action: 'Refer a friend', xp: 500, icon: '&#128101;' },
  { action: 'First listen of the day', xp: 10, icon: '&#9728;' },
  { action: 'Complete your profile', xp: 50, icon: '&#128100;' },
  { action: 'Leave a review', xp: 15, icon: '&#9733;' },
];

interface Badge {
  name: string;
  icon: string;
  unlocked: boolean;
  description: string;
}

const BADGES: Badge[] = [
  { name: 'Early Adopter', icon: '&#128640;', unlocked: true, description: 'Joined during beta' },
  { name: 'Superfan', icon: '&#11088;', unlocked: true, description: 'Reached Level 5' },
  { name: 'Event Regular', icon: '&#127915;', unlocked: true, description: 'Attended 5+ events' },
  { name: 'Merch Collector', icon: '&#128085;', unlocked: false, description: 'Purchase 3 merch items' },
  { name: 'Top 1% Listener', icon: '&#127911;', unlocked: true, description: 'Top 1% in listening hours' },
  { name: 'Playlist Curator', icon: '&#127925;', unlocked: true, description: 'Created 10+ playlists' },
  { name: 'Community Leader', icon: '&#128081;', unlocked: false, description: 'Get 100 upvotes on posts' },
  { name: 'Beta Tester', icon: '&#128736;', unlocked: true, description: 'Tested beta features' },
  { name: '100 Tracks', icon: '&#127932;', unlocked: true, description: 'Listened to 100 tracks' },
  { name: 'First Purchase', icon: '&#128176;', unlocked: true, description: 'Made your first purchase' },
  { name: 'Night Owl', icon: '&#127769;', unlocked: false, description: 'Stream after midnight 10 times' },
  { name: 'Genre Explorer', icon: '&#127758;', unlocked: false, description: 'Listen to 10+ genres' },
];

const LEADERBOARD = [
  { rank: 1, name: 'MusicFan99', level: 12, xp: 15200, initial: 'M' },
  { rank: 2, name: 'BeatDropper', level: 11, xp: 13800, initial: 'B' },
  { rank: 3, name: 'NeonWave', level: 10, xp: 12100, initial: 'N' },
  { rank: 4, name: 'SynthLover', level: 9, xp: 10400, initial: 'S' },
  { rank: 5, name: 'GigGoer', level: 9, xp: 9800, initial: 'G' },
  { rank: 6, name: 'VinylHead', level: 8, xp: 8500, initial: 'V' },
  { rank: 7, name: 'You', level: 7, xp: 2340, initial: 'Y' },
  { rank: 8, name: 'ChillVibes', level: 7, xp: 7200, initial: 'C' },
  { rank: 9, name: 'RaveMaster', level: 6, xp: 6100, initial: 'R' },
  { rank: 10, name: 'AudioPhile', level: 6, xp: 5800, initial: 'A' },
];

const REWARDS_STORE = [
  { id: 1, name: 'Exclusive Track', description: 'Download an unreleased bonus track', cost: 2000, icon: '&#127925;' },
  { id: 2, name: 'Meet & Greet Entry', description: 'Priority entry to creator meet & greets', cost: 5000, icon: '&#128075;' },
  { id: 3, name: 'Merch Discount', description: '25% off any merch item', cost: 1500, icon: '&#127873;' },
  { id: 4, name: 'Free Month Premium', description: 'One month of OPYNX Premium free', cost: 3000, icon: '&#128142;' },
];

const ACTIVITY_LOG = [
  { action: 'Listened to "Neon Highway"', xp: 5, time: '10 minutes ago' },
  { action: 'Followed ChromeVox', xp: 20, time: '1 hour ago' },
  { action: 'First listen of the day', xp: 10, time: '2 hours ago' },
  { action: 'Left a review on "Crystal Waves"', xp: 15, time: '5 hours ago' },
  { action: 'Bought ticket to Echo Lounge show', xp: 100, time: '1 day ago' },
];

export default function RewardsPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [points, setPoints] = useState(USER_STATS.points);

  if (status === 'loading') {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="rounded-2xl bg-[#15151f] h-48 animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="rounded-xl bg-[#15151f] h-32 animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-black mb-4">Sign In Required</h1>
          <p className="text-gray-400 mb-6">Sign in to access your rewards and badges.</p>
          <Link href="/auth/login" className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleRedeem = (item: typeof REWARDS_STORE[0]) => {
    if (points >= item.cost) {
      setPoints((p) => p - item.cost);
      toast(`Redeemed "${item.name}" for ${item.cost.toLocaleString()} points!`, 'success');
    } else {
      toast('Not enough points to redeem this reward.', 'error');
    }
  };

  const xpProgress = (USER_STATS.xp / USER_STATS.xpToNext) * 100;

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          &larr; Back to Home
        </Link>

        {/* Hero: Level & XP */}
        <div className="rounded-2xl bg-gradient-to-br from-red-600/20 to-purple-600/20 border border-red-600/30 p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-black">Fan Rewards</h1>
              <p className="text-gray-400">
                Level {USER_STATS.level} {USER_STATS.title} &mdash; {USER_STATS.xp.toLocaleString()} / {USER_STATS.xpToNext.toLocaleString()} XP
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Points Balance</p>
              <p className="text-3xl font-black text-red-500">{points.toLocaleString()}</p>
            </div>
          </div>
          <div className="w-full h-4 rounded-full bg-brand-950 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">{USER_STATS.xpToNext - USER_STATS.xp} XP to Level {USER_STATS.level + 1}</p>
        </div>

        {/* How to Earn */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">How to Earn XP</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {EARN_ACTIVITIES.map((activity) => (
              <div key={activity.action} className="rounded-xl bg-[#15151f] p-5 text-center hover:bg-[#1a1a2e] transition">
                <p className="text-3xl mb-3" dangerouslySetInnerHTML={{ __html: activity.icon }} />
                <p className="font-semibold text-sm mb-1">{activity.action}</p>
                <p className="text-red-500 font-bold">+{activity.xp} XP</p>
              </div>
            ))}
          </div>
        </section>

        {/* Badges */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">Badges</h2>
          <p className="text-gray-400 text-sm mb-6">{BADGES.filter((b) => b.unlocked).length} of {BADGES.length} unlocked</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {BADGES.map((badge) => (
              <div
                key={badge.name}
                className={`rounded-xl p-5 text-center transition ${
                  badge.unlocked
                    ? 'bg-[#15151f] hover:bg-[#1a1a2e]'
                    : 'bg-[#15151f]/50 opacity-40'
                }`}
              >
                <p className="text-3xl mb-2" dangerouslySetInnerHTML={{ __html: badge.icon }} />
                <p className="font-semibold text-sm">{badge.name}</p>
                <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                {badge.unlocked && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-green-600/20 text-green-400 text-xs">Unlocked</span>
                )}
                {!badge.unlocked && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-gray-600/20 text-gray-500 text-xs">Locked</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Leaderboard */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Leaderboard</h2>
          <div className="rounded-2xl bg-[#15151f] overflow-hidden">
            {LEADERBOARD.map((entry) => (
              <div
                key={entry.rank}
                className={`flex items-center gap-4 px-5 py-3.5 border-b border-white/5 last:border-b-0 ${
                  entry.name === 'You' ? 'bg-red-600/10' : ''
                }`}
              >
                <span className={`text-lg font-bold w-8 text-center ${
                  entry.rank === 1 ? 'text-yellow-400' : entry.rank === 2 ? 'text-gray-300' : entry.rank === 3 ? 'text-amber-600' : 'text-gray-500'
                }`}>
                  {entry.rank}
                </span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center font-bold text-sm shrink-0">
                  {entry.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold ${entry.name === 'You' ? 'text-red-500' : ''}`}>{entry.name}</p>
                  <p className="text-xs text-gray-500">Level {entry.level}</p>
                </div>
                <span className="text-sm text-gray-400 font-semibold">{entry.xp.toLocaleString()} XP</span>
              </div>
            ))}
          </div>
        </section>

        {/* Rewards Store */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Rewards Store</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {REWARDS_STORE.map((item) => (
              <div key={item.id} className="rounded-xl bg-[#15151f] p-6 flex items-start gap-4">
                <p className="text-4xl shrink-0" dangerouslySetInnerHTML={{ __html: item.icon }} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg">{item.name}</p>
                  <p className="text-sm text-gray-400 mb-3">{item.description}</p>
                  <button
                    onClick={() => handleRedeem(item)}
                    disabled={points < item.cost}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      points >= item.cost
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {item.cost.toLocaleString()} points
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Activity Log */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
          <div className="rounded-2xl bg-[#15151f] overflow-hidden">
            {ACTIVITY_LOG.map((entry, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 last:border-b-0">
                <div>
                  <p className="text-sm">{entry.action}</p>
                  <p className="text-xs text-gray-500">{entry.time}</p>
                </div>
                <span className="text-green-400 font-bold text-sm">+{entry.xp} XP</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
