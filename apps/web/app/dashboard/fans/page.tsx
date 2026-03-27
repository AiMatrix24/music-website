'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

// --- Mock Data ---
const TOP_FANS = [
  { name: 'Sarah K.', avatar: 'S', plays: 1240, tier: 'Gold', joined: '2025-01-15' },
  { name: 'Marcus T.', avatar: 'M', plays: 980, tier: 'Gold', joined: '2024-11-03' },
  { name: 'Jade W.', avatar: 'J', plays: 870, tier: 'Silver', joined: '2025-03-22' },
  { name: 'Deon R.', avatar: 'D', plays: 720, tier: 'Silver', joined: '2025-05-10' },
  { name: 'Priya M.', avatar: 'P', plays: 650, tier: 'Bronze', joined: '2025-07-18' },
  { name: 'Alex C.', avatar: 'A', plays: 580, tier: 'Bronze', joined: '2025-08-02' },
  { name: 'Kim L.', avatar: 'K', plays: 510, tier: 'Bronze', joined: '2025-09-14' },
  { name: 'Tyler N.', avatar: 'T', plays: 440, tier: 'Free', joined: '2025-10-30' },
];

const COUNTRIES = [
  { name: 'United States', fans: 4200, code: 'US' },
  { name: 'United Kingdom', fans: 1850, code: 'GB' },
  { name: 'Germany', fans: 1120, code: 'DE' },
  { name: 'Canada', fans: 890, code: 'CA' },
  { name: 'Australia', fans: 640, code: 'AU' },
];

const ENGAGEMENT_TYPES = [
  { type: 'Tracks', engagement: 68, plays: 82400 },
  { type: 'Events', engagement: 22, plays: 26600 },
  { type: 'Marketplace', engagement: 10, plays: 12100 },
];

const FAN_GROWTH = [
  { month: 'Apr', count: 320 },
  { month: 'May', count: 410 },
  { month: 'Jun', count: 480 },
  { month: 'Jul', count: 570 },
  { month: 'Aug', count: 620 },
  { month: 'Sep', count: 710 },
  { month: 'Oct', count: 830 },
  { month: 'Nov', count: 920 },
  { month: 'Dec', count: 1050 },
  { month: 'Jan', count: 1180 },
  { month: 'Feb', count: 1320 },
  { month: 'Mar', count: 1480 },
];

export default function FansPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [fanTab, setFanTab] = useState<'top' | 'geo' | 'engagement'>('top');

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading fan data...</div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Sign in to view fan insights</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const totalFollowers = 12480;
  const newThisMonth = 310;
  const engagementRate = 8.4;
  const superfans = TOP_FANS.filter((f) => f.tier === 'Gold').length;
  const maxCountry = Math.max(...COUNTRIES.map((c) => c.fans));
  const maxGrowth = Math.max(...FAN_GROWTH.map((g) => g.count));

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">
              ← Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Fan Engagement</h1>
            <p className="text-gray-400 mt-1">Understand and grow your audience</p>
          </div>
          <button
            onClick={() => toast('Fan data export started. Check your email shortly.', 'info')}
            className="rounded-full bg-[#15151f] border border-brand-800/30 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:border-red-600/50 transition"
          >
            Export Fan Data
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Followers" value={totalFollowers.toLocaleString()} icon="👥" />
          <StatCard label="New This Month" value={`+${newThisMonth}`} icon="📈" accent />
          <StatCard label="Engagement Rate" value={`${engagementRate}%`} icon="🔥" />
          <StatCard label="Superfans" value={String(superfans)} icon="⭐" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'top' as const, label: 'Top Fans' },
            { key: 'geo' as const, label: 'Geography' },
            { key: 'engagement' as const, label: 'Engagement' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFanTab(tab.key)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                fanTab === tab.key ? 'bg-red-600 text-white' : 'bg-[#15151f] text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Top Fans */}
        {fanTab === 'top' && (
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Top Fans</h2>
            <div className="space-y-3">
              {TOP_FANS.map((fan, i) => (
                <div key={fan.name} className="flex items-center justify-between rounded-xl bg-brand-950/50 p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-6">{i + 1}</span>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-sm font-bold">
                      {fan.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-white">{fan.name}</p>
                      <p className="text-xs text-gray-500">Joined {new Date(fan.joined).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">{fan.plays.toLocaleString()} plays</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      fan.tier === 'Gold' ? 'bg-yellow-600/20 text-yellow-400' :
                      fan.tier === 'Silver' ? 'bg-gray-500/20 text-gray-300' :
                      fan.tier === 'Bronze' ? 'bg-orange-600/20 text-orange-400' :
                      'bg-brand-800/20 text-gray-400'
                    }`}>
                      {fan.tier}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Geographic Breakdown */}
        {fanTab === 'geo' && (
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
            <h2 className="text-lg font-bold mb-6">Top Countries</h2>
            <div className="space-y-4">
              {COUNTRIES.map((country) => (
                <div key={country.code}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-300">{country.name}</span>
                    <span className="text-sm text-gray-400">{country.fans.toLocaleString()} fans</span>
                  </div>
                  <div className="h-3 rounded-full bg-brand-900/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-500"
                      style={{ width: `${(country.fans / maxCountry) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Engagement by Content Type */}
        {fanTab === 'engagement' && (
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
            <h2 className="text-lg font-bold mb-6">Engagement by Content Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {ENGAGEMENT_TYPES.map((item) => (
                <div key={item.type} className="rounded-xl bg-brand-950/50 p-5 text-center">
                  <p className="text-3xl font-bold text-white mb-1">{item.engagement}%</p>
                  <p className="text-sm font-medium text-gray-300 mb-2">{item.type}</p>
                  <p className="text-xs text-gray-500">{item.plays.toLocaleString()} interactions</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fan Growth Chart */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-lg font-bold mb-6">Fan Growth (Last 12 Months)</h2>
          <div className="h-48 flex items-end gap-2">
            {FAN_GROWTH.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-400">{m.count}</span>
                <div
                  className="w-full rounded-t bg-gradient-to-t from-red-700 to-red-500 transition-all duration-500 hover:from-red-600 hover:to-red-400"
                  style={{ height: `${(m.count / maxGrowth) * 100}%` }}
                />
                <span className="text-xs text-gray-500 mt-1">{m.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-400">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${accent ? 'text-red-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
