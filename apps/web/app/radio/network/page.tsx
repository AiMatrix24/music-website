'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/app/components/Toast';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Slot { time: string; title: string; host: string; genre: string; }

const WEEKLY: Record<string, Slot[]> = {
  Mon: [
    { time: '6-10am', title: 'Morning Drive', host: 'DJ Kora', genre: 'Pop / Indie' },
    { time: '10-12pm', title: 'New Music Monday', host: 'Scout', genre: 'New Releases' },
    { time: '12-2pm', title: 'Lunch Mix', host: 'Mia Rivers', genre: 'Mixed' },
    { time: '2-5pm', title: 'Afternoon Selector', host: 'Ivy Blake', genre: 'Indie' },
    { time: '5-7pm', title: 'Rush Hour', host: 'The Weekdayer', genre: 'Upbeat' },
    { time: '11pm-2am', title: 'Late Night Underground', host: 'Nocturne', genre: 'Electronic' },
  ],
  Tue: [
    { time: '6-10am', title: 'Morning Drive', host: 'DJ Kora', genre: 'Pop / Indie' },
    { time: '12-2pm', title: 'Lunch Mix', host: 'Mia Rivers', genre: 'Mixed' },
    { time: '2-4pm', title: 'New Music Tuesday', host: 'Scout', genre: 'New Releases' },
    { time: '4-6pm', title: 'Afternoon Selector', host: 'Ivy Blake', genre: 'Indie' },
    { time: '8-10pm', title: 'Indie Spotlight', host: 'Ivy Blake', genre: 'Indie' },
    { time: '11pm-2am', title: 'Late Night Underground', host: 'Nocturne', genre: 'Electronic' },
  ],
  Wed: [
    { time: '6-10am', title: 'Morning Drive', host: 'DJ Kora', genre: 'Pop / Indie' },
    { time: '12-2pm', title: 'Lunch Mix', host: 'Mia Rivers', genre: 'Mixed' },
    { time: '3-5pm', title: 'Sync Sessions', host: 'Mellow Mars', genre: 'Lo-fi' },
    { time: '7-9pm', title: 'Wax Wednesday', host: 'Vinyl Vic', genre: 'Classic Vinyl' },
    { time: '9-11pm', title: 'Global Beats', host: 'Nova Synth', genre: 'World / Electronic' },
    { time: '11pm-2am', title: 'Late Night Underground', host: 'Nocturne', genre: 'Electronic' },
  ],
  Thu: [
    { time: '6-10am', title: 'Morning Drive', host: 'DJ Kora', genre: 'Pop / Indie' },
    { time: '12-2pm', title: 'Lunch Mix', host: 'Mia Rivers', genre: 'Mixed' },
    { time: '3-5pm', title: 'Afternoon Selector', host: 'Ivy Blake', genre: 'Indie' },
    { time: '6-8pm', title: 'Throwback Thursday', host: 'Classic Cal', genre: 'Classics' },
    { time: '9-11pm', title: 'R&B Lounge', host: 'Mia Rivers', genre: 'R&B / Soul' },
    { time: '11pm-2am', title: 'Late Night Underground', host: 'Nocturne', genre: 'Electronic' },
  ],
  Fri: [
    { time: '6-10am', title: 'Morning Drive', host: 'DJ Kora', genre: 'Pop / Indie' },
    { time: '12-3pm', title: 'Lunch Mix', host: 'Mia Rivers', genre: 'Mixed' },
    { time: '3-5pm', title: 'Friday Kickoff', host: 'Mia Rivers', genre: 'Upbeat' },
    { time: '6-9pm', title: 'Fresh Fridays', host: 'Scout', genre: 'New Releases' },
    { time: '9pm-12am', title: 'Weekend Warmup', host: 'The Weekender', genre: 'Dance' },
    { time: '12-3am', title: 'After Hours', host: 'Nocturne', genre: 'Deep Electronic' },
  ],
  Sat: [
    { time: '10am-12pm', title: 'Saturday Coffee', host: 'Ivy Blake', genre: 'Acoustic' },
    { time: '12-2pm', title: 'Jam Band Hour', host: 'Cedar Lane', genre: 'Jam / Indie' },
    { time: '2-5pm', title: 'Superfan Saturday', host: 'Mia Rivers', genre: 'Exclusives' },
    { time: '5-8pm', title: 'Block Party', host: 'DJ Kora', genre: 'Hip Hop' },
    { time: '8-11pm', title: 'Club Circuit', host: 'Nova Synth', genre: 'Dance' },
    { time: '12-4am', title: 'Afterparty', host: 'Nocturne', genre: 'Deep Electronic' },
  ],
  Sun: [
    { time: '9am-12pm', title: 'Sunday Sessions', host: 'Ivy Blake', genre: 'Acoustic' },
    { time: '12-2pm', title: 'Brunch Beats', host: 'Mellow Mars', genre: 'Chill' },
    { time: '2-4pm', title: 'Jazz Hour', host: 'Miles Avery', genre: 'Jazz' },
    { time: '4-7pm', title: 'Indie Spotlight', host: 'Ivy Blake', genre: 'Indie' },
    { time: '7-9pm', title: 'Weekly Rewind', host: 'Scout', genre: 'Best of the Week' },
    { time: '10pm-1am', title: 'Sunday Downtempo', host: 'Mellow Mars', genre: 'Downtempo' },
  ],
};

const SHOWS = [
  { id: 'nmm', title: 'New Music Monday', host: 'Scout', time: 'Mon 10am-12pm', desc: 'First listens and deep dives on the week\'s most important new releases from the OPYNX roster.', color: 'from-red-600 to-orange-500' },
  { id: 'tbt', title: 'Throwback Thursday', host: 'Classic Cal', time: 'Thu 6-8pm', desc: 'Classic tracks from 70s funk to 2000s indie — the songs that shaped the artists we love.', color: 'from-amber-600 to-yellow-500' },
  { id: 'sfs', title: 'Superfan Saturday', host: 'Mia Rivers', time: 'Sat 2-5pm', desc: 'Exclusive content for OPYNX supporters: unreleased tracks, demos, and artist Q&As.', color: 'from-purple-600 to-pink-500' },
  { id: 'isp', title: 'Indie Spotlight', host: 'Ivy Blake', time: 'Tue 8-10pm', desc: 'Two hours dedicated to emerging creators breaking out on the network this week.', color: 'from-emerald-500 to-teal-500' },
  { id: 'lnu', title: 'Late Night Underground', host: 'Nocturne', time: 'Nightly 11pm-2am', desc: 'Deep electronic, ambient, and the sounds of the after-hours scene from around the world.', color: 'from-slate-600 to-zinc-500' },
  { id: 'md', title: 'Morning Drive', host: 'DJ Kora', time: 'Weekdays 6-10am', desc: 'Your commute companion — energetic picks, artist news, and the day\'s top charted tracks.', color: 'from-sky-500 to-indigo-500' },
  { id: 'ww', title: 'Wax Wednesday', host: 'Vinyl Vic', time: 'Wed 7-9pm', desc: 'All-vinyl sets from classic LPs, rare pressings, and crate-dug gems.', color: 'from-rose-600 to-red-700' },
  { id: 'wr', title: 'Weekly Rewind', host: 'Scout', time: 'Sun 7-9pm', desc: 'Everything you missed — the best segments, drops, and listener moments from the week.', color: 'from-cyan-500 to-blue-600' },
];

export default function RadioNetworkPage() {
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [listeners, setListeners] = useState(18205);

  useEffect(() => {
    const today = new Date().getDay();
    const map = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    setSelectedDay(map[today]);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setListeners((l) => l + Math.floor(Math.random() * 15) - 7), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-brand-950 text-white">
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-brand-950 to-brand-950" />
        <div className="relative max-w-7xl mx-auto px-6 pt-12 pb-14">
          <Link href="/radio" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition text-sm mb-8">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Radio Network
          </Link>
          <div className="flex items-center gap-3 mb-5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
            </span>
            <span className="text-xs font-bold tracking-[0.3em] text-red-400 uppercase">Network &middot; On Air</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-3">
            OPYNX <span className="text-red-500">Network Programming</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl">Curated 24/7 by the OPYNX music team</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-14">
        {/* Current Show */}
        <section className="rounded-3xl overflow-hidden bg-gradient-to-br from-red-900/40 via-[#15151f] to-[#15151f] border border-white/10 p-8 sm:p-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-[10px] font-bold tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE NOW
            </span>
            <span className="text-xs text-gray-400">Until 10:00 AM local</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black mb-2">Morning Drive</h2>
          <p className="text-gray-300 mb-6">Hosted by DJ Kora</p>
          <div className="grid sm:grid-cols-2 gap-4 mb-6 max-w-xl">
            <div className="rounded-xl bg-black/30 border border-white/5 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Now Playing</p>
              <p className="font-semibold">Analog Heart</p>
              <p className="text-sm text-gray-400">Maya K</p>
            </div>
            <div className="rounded-xl bg-black/30 border border-white/5 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Listeners</p>
              <p className="font-semibold text-2xl tabular-nums">{listeners.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Across all regions</p>
            </div>
          </div>
          <button
            onClick={() => toast('Connecting to OPYNX Network', 'info')}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-red-600 hover:bg-red-500 transition font-bold shadow-lg shadow-red-900/40"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            Tune In
          </button>
        </section>

        {/* Weekly Schedule */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Weekly Schedule</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
            {DAYS.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition border ${
                  selectedDay === d
                    ? 'bg-red-600 border-red-500'
                    : 'bg-[#15151f] text-gray-400 border-white/5 hover:text-white hover:border-white/20'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {WEEKLY[selectedDay]?.map((slot) => (
              <div key={slot.time} className="rounded-xl bg-[#15151f] border border-white/5 p-4 hover:border-white/20 transition">
                <p className="text-xs tracking-wider text-red-400 uppercase mb-1">{slot.time}</p>
                <p className="font-semibold mb-0.5">{slot.title}</p>
                <p className="text-sm text-gray-400">{slot.host}</p>
                <p className="text-xs text-gray-500 mt-2">{slot.genre}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Network Shows */}
        <section>
          <h2 className="text-2xl font-bold mb-1">Network Shows</h2>
          <p className="text-sm text-gray-400 mb-6">Regular programming from our editorial team</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SHOWS.map((s) => (
              <div key={s.id} className="rounded-2xl bg-[#15151f] border border-white/5 overflow-hidden hover:border-white/20 transition flex flex-col">
                <div className={`aspect-square bg-gradient-to-br ${s.color} relative flex items-center justify-center`}>
                  <div className="absolute inset-0 bg-black/20" />
                  <span className="relative text-4xl font-black tracking-tighter text-white/90 px-4 text-center">{s.title.split(' ').map((w) => w[0]).join('')}</span>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold leading-tight mb-0.5">{s.title}</h3>
                  <p className="text-xs text-red-400 mb-1">{s.time}</p>
                  <p className="text-xs text-gray-400 mb-2">with {s.host}</p>
                  <p className="text-sm text-gray-400 flex-1">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Submit Your Playlist */}
        <section className="rounded-3xl bg-gradient-to-r from-purple-900/40 via-[#15151f] to-red-900/30 border border-white/10 p-8 sm:p-10">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.3em] text-red-400 mb-3">For Creators</p>
              <h2 className="text-3xl font-black mb-2">Submit Your Playlist</h2>
              <p className="text-gray-300 max-w-xl">
                Creators can submit playlists for network rotation. Approved playlists earn a share of network ad revenue.
              </p>
            </div>
            <Link
              href="/dashboard/radio/channel"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-red-600 hover:bg-red-500 font-bold shadow-lg shadow-red-900/40 transition"
            >
              Submit a Playlist &rarr;
            </Link>
          </div>
        </section>

        {/* Advertise small CTA */}
        <section className="rounded-2xl bg-[#15151f] border border-white/5 p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-bold">Advertise on the Network</h3>
            <p className="text-sm text-gray-400">Reach 2.4M monthly music fans. Pre-roll, channel sponsorships, and show takeovers available.</p>
          </div>
          <Link href="/radio/advertise" className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold transition whitespace-nowrap">
            Advertising info &rarr;
          </Link>
        </section>
      </div>
    </div>
  );
}
