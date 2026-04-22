'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

/* ── Mock Data ── */
const FEATURED_CREATOR = {
  name: 'Kira Nakamura',
  avatar: 'K',
  genre: 'Synthwave / Electronic',
  city: 'Portland, OR',
  bio: 'Blending 80s synth nostalgia with modern production, Kira creates immersive soundscapes that transport listeners to neon-lit cityscapes. Self-produced and fiercely independent.',
  whyPicked: 'Kira released three tracks in her first month on OPYNX, each one climbing the Synthwave charts. Her production quality rivals major-label releases, and her engagement with fans through listening rooms has built a loyal community from scratch.',
  plays: 48200,
  followers: 3100,
  tracks: 9,
};

const RISING_STARS = [
  { id: 1, name: 'Sable Moon', avatar: 'S', genre: 'Lo-fi', city: 'Seattle, WA', joinedDaysAgo: 12, topTrack: 'Midnight Rain', trackPlays: 4200, growth: '+340%', tags: ['lo-fi', 'chill', 'beats'] },
  { id: 2, name: 'VXTR', avatar: 'V', genre: 'Electronic', city: 'Berlin, DE', joinedDaysAgo: 18, topTrack: 'Circuit Break', trackPlays: 6800, growth: '+210%', tags: ['electronic', 'bass', 'experimental'] },
  { id: 3, name: 'Alma Verde', avatar: 'A', genre: 'Indie', city: 'Austin, TX', joinedDaysAgo: 8, topTrack: 'Desert Bloom', trackPlays: 3100, growth: '+520%', tags: ['indie', 'folk', 'acoustic'] },
  { id: 4, name: 'Phantom Freq', avatar: 'P', genre: 'Synthwave', city: 'Tokyo, JP', joinedDaysAgo: 22, topTrack: 'Neon Drift', trackPlays: 5500, growth: '+180%', tags: ['synthwave', 'retro', '80s'] },
  { id: 5, name: 'Daze Theory', avatar: 'D', genre: 'Lo-fi', city: 'Toronto, CA', joinedDaysAgo: 15, topTrack: 'Sunday Haze', trackPlays: 2900, growth: '+290%', tags: ['lo-fi', 'hip-hop', 'ambient'] },
  { id: 6, name: 'Nyx Orbital', avatar: 'N', genre: 'Electronic', city: 'London, UK', joinedDaysAgo: 5, topTrack: 'Gravity Well', trackPlays: 7200, growth: '+610%', tags: ['electronic', 'dnb', 'dark'] },
  { id: 7, name: 'Rio Sunsets', avatar: 'R', genre: 'Indie', city: 'Miami, FL', joinedDaysAgo: 20, topTrack: 'Golden Hour', trackPlays: 3800, growth: '+150%', tags: ['indie', 'pop', 'dreamy'] },
  { id: 8, name: 'Cipher Ghost', avatar: 'C', genre: 'Synthwave', city: 'Chicago, IL', joinedDaysAgo: 10, topTrack: 'Binary Sunset', trackPlays: 4600, growth: '+380%', tags: ['synthwave', 'cinematic', 'dark'] },
];

const GENRE_SPOTLIGHTS: { genre: string; creators: { name: string; plays: number; id: number }[] }[] = [
  {
    genre: 'Synthwave',
    creators: [
      { name: 'Phantom Freq', plays: 5500, id: 4 },
      { name: 'Cipher Ghost', plays: 4600, id: 8 },
      { name: 'Retro Pulse', plays: 3200, id: 20 },
    ],
  },
  {
    genre: 'Lo-fi',
    creators: [
      { name: 'Sable Moon', plays: 4200, id: 1 },
      { name: 'Daze Theory', plays: 2900, id: 5 },
      { name: 'Mellow Craft', plays: 2100, id: 21 },
    ],
  },
  {
    genre: 'Electronic',
    creators: [
      { name: 'Nyx Orbital', plays: 7200, id: 6 },
      { name: 'VXTR', plays: 6800, id: 2 },
      { name: 'Static Bloom', plays: 3900, id: 22 },
    ],
  },
  {
    genre: 'Indie',
    creators: [
      { name: 'Alma Verde', plays: 3100, id: 3 },
      { name: 'Rio Sunsets', plays: 3800, id: 7 },
      { name: 'Fern & Ivy', plays: 1800, id: 23 },
    ],
  },
];

const PAST_SHOWCASES = [
  { date: 'Mar 29, 2026', creator: 'DJ Koda', genre: 'Hip-Hop' },
  { date: 'Mar 22, 2026', creator: 'Luna Vega', genre: 'Electronic' },
  { date: 'Mar 15, 2026', creator: 'Solstice', genre: 'R&B / Soul' },
  { date: 'Mar 8, 2026', creator: 'The Drift', genre: 'Indie Rock' },
];

const HOW_TO_STEPS = [
  { icon: '🎵', text: 'Upload at least 3 tracks to your profile' },
  { icon: '📈', text: 'Get 100+ total plays on your music' },
  { icon: '✅', text: 'Complete your profile and add social links' },
  { icon: '👀', text: 'The OPYNX team reviews new creators weekly' },
];

export default function ShowcasePage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const [submitReason, setSubmitReason] = useState('');
  const [submitTrack, setSubmitTrack] = useState('');
  const [expandedShowcase, setExpandedShowcase] = useState<number | null>(null);

  const handleSubmitShowcase = () => {
    if (!submitReason.trim()) {
      toast('Please tell us why we should feature you', 'error');
      return;
    }
    if (!submitTrack.trim()) {
      toast('Please add a link to your best track', 'error');
      return;
    }
    toast('Showcase submission received! We will review it this week.', 'success');
    setSubmitReason('');
    setSubmitTrack('');
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Back nav */}
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">
          &larr; Home
        </Link>

        {/* Hero */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold">
            <span className="mr-2" role="img" aria-label="spotlight">🔦</span>
            OPYNX Creator Showcase
          </h1>
          <p className="text-gray-400 mt-2 max-w-lg mx-auto">
            Discover the next wave of independent music talent
          </p>
          <p className="text-xs text-gray-600 mt-1">Updated weekly by the OPYNX team</p>
        </div>

        {/* ── Featured Creator of the Week ── */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-5">Featured Creator of the Week</h2>
          <div className="rounded-2xl bg-[#15151f] border border-red-600/30 p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar + basic info */}
              <div className="flex flex-col items-center md:items-start shrink-0">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-3xl font-bold mb-3">
                  {FEATURED_CREATOR.avatar}
                </div>
                <h3 className="text-xl font-bold">{FEATURED_CREATOR.name}</h3>
                <p className="text-sm text-red-400">{FEATURED_CREATOR.genre}</p>
                <p className="text-xs text-gray-500">{FEATURED_CREATOR.city}</p>

                {/* Stats */}
                <div className="flex gap-4 mt-4 text-center">
                  <div>
                    <p className="text-lg font-bold">{(FEATURED_CREATOR.plays / 1000).toFixed(1)}k</p>
                    <p className="text-xs text-gray-500">Plays</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{(FEATURED_CREATOR.followers / 1000).toFixed(1)}k</p>
                    <p className="text-xs text-gray-500">Followers</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{FEATURED_CREATOR.tracks}</p>
                    <p className="text-xs text-gray-500">Tracks</p>
                  </div>
                </div>
              </div>

              {/* Bio + why picked */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 leading-relaxed mb-4">{FEATURED_CREATOR.bio}</p>
                <div className="rounded-xl bg-brand-950/50 border border-brand-800/10 p-4 mb-4">
                  <p className="text-xs text-red-400 font-semibold mb-1">Why We Picked Them</p>
                  <p className="text-sm text-gray-400 leading-relaxed">{FEATURED_CREATOR.whyPicked}</p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/artist/1"
                    className="rounded-xl bg-red-600 hover:bg-red-700 px-6 py-2.5 text-sm font-semibold transition"
                  >
                    Listen Now
                  </Link>
                  <button
                    onClick={() => toast('Following Kira Nakamura!', 'success')}
                    className="rounded-xl bg-brand-800/20 hover:bg-brand-800/30 px-6 py-2.5 text-sm font-medium transition"
                  >
                    Follow
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Rising Stars ── */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-5">Rising Stars</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RISING_STARS.map((star) => (
              <Link
                key={star.id}
                href={`/artist/${star.id}`}
                className="rounded-2xl bg-[#15151f] border border-brand-800/20 hover:border-red-600/30 p-5 transition block"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-bold text-sm shrink-0">
                    {star.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{star.name}</p>
                    <p className="text-xs text-gray-500">{star.genre} &middot; {star.city}</p>
                  </div>
                </div>

                <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-blue-600/15 text-blue-400 mb-3">
                  Joined {star.joinedDaysAgo} days ago
                </span>

                <div className="text-sm mb-2">
                  <span className="text-gray-500">Top track:</span>{' '}
                  <span className="font-medium">{star.topTrack}</span>
                  <span className="text-gray-600 ml-1">({star.trackPlays.toLocaleString()} plays)</span>
                </div>

                <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-green-600/15 text-green-400 font-medium mb-3">
                  {star.growth} plays this month
                </span>

                <div className="flex flex-wrap gap-1.5">
                  {star.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-brand-800/20 text-gray-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Genre Spotlights ── */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-5">Genre Spotlights</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {GENRE_SPOTLIGHTS.map((section) => (
              <div key={section.genre} className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5">
                <h3 className="font-bold text-sm mb-3 text-red-400">{section.genre}</h3>
                <div className="space-y-2.5">
                  {section.creators.map((creator) => (
                    <div key={creator.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600/60 to-red-800/60 flex items-center justify-center text-xs font-bold shrink-0">
                          {creator.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{creator.name}</p>
                          <p className="text-xs text-gray-500">{creator.plays.toLocaleString()} plays</p>
                        </div>
                      </div>
                      <Link
                        href={`/artist/${creator.id}`}
                        className="text-xs text-red-400 hover:text-red-300 transition font-medium shrink-0"
                      >
                        Listen
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How to Get Featured ── */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-5">How to Get Featured</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HOW_TO_STEPS.map((step, i) => (
              <div key={i} className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5 text-center">
                <p className="text-2xl mb-2">{step.icon}</p>
                <p className="text-sm text-gray-300">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Submit for Showcase ── */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-5">Submit for Showcase</h2>
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 max-w-xl">
            {status !== 'authenticated' ? (
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-3">Sign in to submit your profile for the showcase</p>
                <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold hover:bg-red-700 transition inline-block">
                  Sign In
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Why should we feature you?</label>
                  <textarea
                    value={submitReason}
                    onChange={(e) => setSubmitReason(e.target.value)}
                    rows={3}
                    placeholder="Tell us about your music, your journey, and what makes you stand out..."
                    className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600/50 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Link to Your Best Track</label>
                  <input
                    type="url"
                    value={submitTrack}
                    onChange={(e) => setSubmitTrack(e.target.value)}
                    placeholder="https://opynx.com/track/..."
                    className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600/50"
                  />
                </div>
                <button
                  onClick={handleSubmitShowcase}
                  className="w-full rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-sm font-semibold transition"
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Past Showcases ── */}
        <section>
          <h2 className="text-xl font-bold mb-5">Past Showcases</h2>
          <div className="space-y-2 max-w-xl">
            {PAST_SHOWCASES.map((showcase, i) => (
              <div key={i} className="rounded-2xl bg-[#15151f] border border-brand-800/20 overflow-hidden">
                <button
                  onClick={() => setExpandedShowcase(expandedShowcase === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-brand-800/5 transition"
                >
                  <div>
                    <p className="text-sm font-semibold">{showcase.creator}</p>
                    <p className="text-xs text-gray-500">{showcase.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-600/10 text-red-400">{showcase.genre}</span>
                    <span className="text-gray-500 text-sm">{expandedShowcase === i ? '−' : '+'}</span>
                  </div>
                </button>
                {expandedShowcase === i && (
                  <div className="px-4 pb-4 pt-0 border-t border-brand-800/10">
                    <p className="text-sm text-gray-400 mt-3">
                      {showcase.creator} was featured for their exceptional growth and unique sound in the {showcase.genre} space.
                    </p>
                    <Link
                      href={`/artist/${i + 10}`}
                      className="text-xs text-red-400 hover:text-red-300 transition mt-2 inline-block"
                    >
                      View Profile &rarr;
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
