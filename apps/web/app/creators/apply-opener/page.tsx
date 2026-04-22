'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

/* ── Mock Data ── */
const OPPORTUNITIES = [
  {
    id: 1,
    headliner: 'Cipher',
    avatar: 'C',
    eventTitle: 'System Override Tour',
    venue: 'Digital Arena',
    city: 'Austin, TX',
    date: '2026-05-22',
    genre: 'Electronic',
    compensation: '$500 flat',
    compensationType: 'flat' as const,
    minFollowers: 500,
    slots: 1,
  },
  {
    id: 2,
    headliner: 'Nova Synthwave',
    avatar: 'N',
    eventTitle: 'Neon Nights',
    venue: 'The Warehouse',
    city: 'Los Angeles, CA',
    date: '2026-06-14',
    genre: 'Synthwave',
    compensation: 'Revenue Share 20%',
    compensationType: 'revenue' as const,
    minFollowers: 1000,
    slots: 2,
  },
  {
    id: 3,
    headliner: 'Atlas & The Wanderers',
    avatar: 'A',
    eventTitle: 'Wanderlust Festival',
    venue: 'Neon Garden',
    city: 'Nashville, TN',
    date: '2026-07-04',
    genre: 'Indie Rock',
    compensation: '$300 + merch table',
    compensationType: 'flat' as const,
    minFollowers: 250,
    slots: 1,
  },
  {
    id: 4,
    headliner: 'Luna Beats',
    avatar: 'L',
    eventTitle: 'Listening Party',
    venue: 'Online (Livestream)',
    city: 'Virtual',
    date: '2026-05-10',
    genre: 'Lo-fi',
    compensation: 'Exposure + feature on playlist',
    compensationType: 'exposure' as const,
    minFollowers: 100,
    slots: 3,
  },
  {
    id: 5,
    headliner: 'Various Creators',
    avatar: 'V',
    eventTitle: 'Showcase Night — 5 Openers Needed',
    venue: 'The Basement',
    city: 'New York, NY',
    date: '2026-06-28',
    genre: 'All Genres',
    compensation: 'Door split 50/50',
    compensationType: 'revenue' as const,
    minFollowers: 0,
    slots: 5,
  },
  {
    id: 6,
    headliner: 'Echo Chamber',
    avatar: 'E',
    eventTitle: 'Post-Punk Underground',
    venue: 'Blue Note',
    city: 'Chicago, IL',
    date: '2026-06-05',
    genre: 'Post-Punk',
    compensation: '$200 flat',
    compensationType: 'flat' as const,
    minFollowers: 300,
    slots: 1,
  },
];

const PAST_APPLICATIONS = [
  {
    id: 101,
    headliner: 'DJ Koda',
    eventTitle: 'Bass Drop Sessions',
    status: 'Pending' as const,
    appliedDate: '2026-03-28',
    venue: 'Club Velvet, Miami',
  },
  {
    id: 102,
    headliner: 'Solstice',
    eventTitle: 'Sunset Series',
    status: 'Accepted' as const,
    appliedDate: '2026-03-15',
    venue: 'Rooftop Lounge, Denver',
  },
  {
    id: 103,
    headliner: 'Nadia Rose',
    eventTitle: 'Pop Takeover',
    status: 'Declined' as const,
    appliedDate: '2026-03-01',
    venue: 'The Roxy, LA',
  },
];

const SET_LENGTHS = ['15 min', '20 min', '30 min', '45 min'];
const EQUIPMENT_OPTIONS = [
  'I bring everything',
  'I need a PA system',
  'I need full backline',
];

export default function ApplyOpenerPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [fitReason, setFitReason] = useState('');
  const [trackLink, setTrackLink] = useState('');
  const [setLength, setSetLength] = useState(SET_LENGTHS[0]);
  const [equipment, setEquipment] = useState(EQUIPMENT_OPTIONS[0]);

  /* ── Auth gate ── */
  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Sign in to apply for opener slots</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold hover:bg-red-700 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const handleApplyClick = (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      setFitReason('');
      setTrackLink('');
      setSetLength(SET_LENGTHS[0]);
      setEquipment(EQUIPMENT_OPTIONS[0]);
    }
  };

  const handleSubmit = (opportunity: typeof OPPORTUNITIES[0]) => {
    if (!fitReason.trim()) {
      toast('Please explain why you are a good fit', 'error');
      return;
    }
    if (!trackLink.trim()) {
      toast('Please add a link to your best track', 'error');
      return;
    }
    toast(`Application submitted to open for ${opportunity.headliner}!`, 'success');
    setExpandedId(null);
    setFitReason('');
    setTrackLink('');
  };

  const statusColor = (s: string) => {
    if (s === 'Accepted') return 'text-green-400 bg-green-400/10';
    if (s === 'Declined') return 'text-red-400 bg-red-400/10';
    return 'text-yellow-400 bg-yellow-400/10';
  };

  const compBadgeColor = (type: string) => {
    if (type === 'flat') return 'bg-green-600/20 text-green-400';
    if (type === 'revenue') return 'bg-blue-600/20 text-blue-400';
    return 'bg-purple-600/20 text-purple-400';
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Back nav */}
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">
          &larr; Home
        </Link>

        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold">
            <span className="mr-2" role="img" aria-label="microphone">🎤</span>
            Open for a Headliner
          </h1>
          <p className="text-gray-400 mt-2 max-w-xl">
            Get discovered by performing alongside established creators. Browse available opener
            slots, apply with your best work, and land your next big stage.
          </p>
        </div>

        {/* ── Available Opportunities ── */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-5">Available Opportunities</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {OPPORTUNITIES.map((opp) => (
              <div
                key={opp.id}
                className={`rounded-2xl bg-[#15151f] border transition ${
                  expandedId === opp.id ? 'border-red-600/50' : 'border-brand-800/20 hover:border-red-600/30'
                }`}
              >
                <div className="p-5">
                  {/* Headliner row */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-bold text-sm">
                      {opp.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{opp.headliner}</p>
                      <p className="text-xs text-gray-500 truncate">{opp.eventTitle}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Venue</span>
                      <span className="text-right">{opp.venue}, {opp.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date</span>
                      <span>{new Date(opp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Genre</span>
                      <span>{opp.genre}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Compensation</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${compBadgeColor(opp.compensationType)}`}>
                        {opp.compensation}
                      </span>
                    </div>
                    {opp.minFollowers > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Min. Followers</span>
                        <span>{opp.minFollowers.toLocaleString()}+</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleApplyClick(opp.id)}
                    className={`w-full rounded-xl py-2.5 text-sm font-semibold transition ${
                      expandedId === opp.id
                        ? 'bg-brand-800/30 text-gray-300 hover:bg-brand-800/40'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {expandedId === opp.id ? 'Cancel' : 'Apply'}
                  </button>
                </div>

                {/* Expanded application form */}
                {expandedId === opp.id && (
                  <div className="border-t border-brand-800/20 p-5 space-y-4">
                    {/* Auto-filled profile summary */}
                    <div className="rounded-xl bg-brand-950/50 border border-brand-800/10 p-3">
                      <p className="text-xs text-gray-500 mb-1">Your Creator Profile</p>
                      <p className="text-sm font-medium">{session?.user?.name || 'Your Name'}</p>
                      <p className="text-xs text-gray-500">{session?.user?.email}</p>
                    </div>

                    {/* Why you're a good fit */}
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">
                        Why are you a good fit? ({fitReason.length}/500)
                      </label>
                      <textarea
                        value={fitReason}
                        onChange={(e) => setFitReason(e.target.value.slice(0, 500))}
                        rows={3}
                        placeholder="Describe your style, experience, and why you'd complement this headliner..."
                        className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600/50 resize-none"
                      />
                    </div>

                    {/* Best track link */}
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Link to Your Best Track</label>
                      <input
                        type="url"
                        value={trackLink}
                        onChange={(e) => setTrackLink(e.target.value)}
                        placeholder="https://opynx.com/track/..."
                        className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600/50"
                      />
                    </div>

                    {/* Set length */}
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Expected Set Length</label>
                      <select
                        value={setLength}
                        onChange={(e) => setSetLength(e.target.value)}
                        className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/50"
                      >
                        {SET_LENGTHS.map((sl) => (
                          <option key={sl} value={sl}>{sl}</option>
                        ))}
                      </select>
                    </div>

                    {/* Equipment needs */}
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Equipment Needs</label>
                      <select
                        value={equipment}
                        onChange={(e) => setEquipment(e.target.value)}
                        className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/50"
                      >
                        {EQUIPMENT_OPTIONS.map((eq) => (
                          <option key={eq} value={eq}>{eq}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => handleSubmit(opp)}
                      className="w-full rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-sm font-semibold transition"
                    >
                      Submit Application
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Your Applications ── */}
        <section>
          <h2 className="text-xl font-bold mb-5">Your Applications</h2>
          <div className="space-y-3">
            {PAST_APPLICATIONS.map((app) => (
              <div key={app.id} className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Open for {app.headliner} &mdash; {app.eventTitle}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{app.venue}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor(app.status)}`}>
                    {app.status}
                  </span>
                  <span className="text-xs text-gray-600">
                    Applied {new Date(app.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
