'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';

interface CreatorChannel {
  id: string;
  name: string;
  host: string;
  avatar: string;
  genre: string;
  isLive: boolean;
  nowPlaying: { track: string; artist: string };
  privacy: 'public' | 'subscribers' | 'invite';
  listeners: number;
  gradient: string;
}

interface UpcomingShow {
  id: string;
  time: string;
  show: string;
  host: string;
  channel: string;
}

interface DaySchedule {
  shows: { time: string; title: string; host: string }[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SCHEDULE: Record<string, DaySchedule> = {
  Mon: { shows: [
    { time: '6-10am', title: 'Morning Drive', host: 'DJ Kora' },
    { time: '12-2pm', title: 'Lunch Mix', host: 'Mia Rivers' },
    { time: '5-7pm', title: 'Rush Hour', host: 'The Weekdayer' },
    { time: '11pm-2am', title: 'Late Night Underground', host: 'Nocturne' },
  ]},
  Tue: { shows: [
    { time: '6-10am', title: 'Morning Drive', host: 'DJ Kora' },
    { time: '2-4pm', title: 'New Music Tuesday', host: 'Scout' },
    { time: '8-10pm', title: 'Indie Spotlight', host: 'Ivy Blake' },
    { time: '11pm-2am', title: 'Late Night Underground', host: 'Nocturne' },
  ]},
  Wed: { shows: [
    { time: '6-10am', title: 'Morning Drive', host: 'DJ Kora' },
    { time: '12-2pm', title: 'Lunch Mix', host: 'Mia Rivers' },
    { time: '7-9pm', title: 'Wax Wednesday', host: 'Vinyl Vic' },
    { time: '11pm-2am', title: 'Late Night Underground', host: 'Nocturne' },
  ]},
  Thu: { shows: [
    { time: '6-10am', title: 'Morning Drive', host: 'DJ Kora' },
    { time: '12-2pm', title: 'Lunch Mix', host: 'Mia Rivers' },
    { time: '6-8pm', title: 'Throwback Thursday', host: 'Classic Cal' },
    { time: '11pm-2am', title: 'Late Night Underground', host: 'Nocturne' },
  ]},
  Fri: { shows: [
    { time: '6-10am', title: 'Morning Drive', host: 'DJ Kora' },
    { time: '3-5pm', title: 'Friday Kickoff', host: 'Mia Rivers' },
    { time: '9pm-12am', title: 'Weekend Warmup', host: 'The Weekender' },
    { time: '12-3am', title: 'After Hours', host: 'Nocturne' },
  ]},
  Sat: { shows: [
    { time: '10am-12pm', title: 'Saturday Coffee', host: 'Ivy Blake' },
    { time: '2-5pm', title: 'Superfan Saturday', host: 'Mia Rivers' },
    { time: '8-11pm', title: 'Club Circuit', host: 'Nova Synth' },
    { time: '12-4am', title: 'Afterparty', host: 'Nocturne' },
  ]},
  Sun: { shows: [
    { time: '9am-12pm', title: 'Sunday Sessions', host: 'Ivy Blake' },
    { time: '2-4pm', title: 'Jazz Hour', host: 'Miles Avery' },
    { time: '7-9pm', title: 'Weekly Rewind', host: 'Scout' },
    { time: '10pm-1am', title: 'Sunday Downtempo', host: 'Mellow Mars' },
  ]},
};

const CHANNELS: CreatorChannel[] = [
  {
    id: 'nova-synthwave',
    name: 'Nova Synthwave Radio',
    host: 'Nova Synth',
    avatar: 'NS',
    genre: 'Synthwave',
    isLive: true,
    nowPlaying: { track: 'Neon Cascade', artist: 'Nova Synth' },
    privacy: 'public',
    listeners: 3482,
    gradient: 'from-purple-600 to-pink-600',
  },
  {
    id: 'boom-bap-basement',
    name: 'Boom Bap Basement',
    host: 'DJ Kora',
    avatar: 'BB',
    genre: 'Hip Hop',
    isLive: true,
    nowPlaying: { track: 'Analog Heart', artist: 'Maya K' },
    privacy: 'public',
    listeners: 2194,
    gradient: 'from-amber-600 to-red-600',
  },
  {
    id: 'lofi-attic',
    name: 'The Lo-fi Attic',
    host: 'Mellow Mars',
    avatar: 'LA',
    genre: 'Lo-fi',
    isLive: false,
    nowPlaying: { track: 'Sunday Window', artist: 'Otter Moon' },
    privacy: 'public',
    listeners: 841,
    gradient: 'from-amber-500 to-orange-400',
  },
  {
    id: 'garage-glory',
    name: 'Garage Glory',
    host: 'Ivy Blake',
    avatar: 'GG',
    genre: 'Rock',
    isLive: true,
    nowPlaying: { track: 'Static Bloom', artist: 'The Breaklines' },
    privacy: 'subscribers',
    listeners: 612,
    gradient: 'from-red-600 to-rose-500',
  },
  {
    id: 'blue-room',
    name: 'The Blue Room',
    host: 'Miles Avery',
    avatar: 'BR',
    genre: 'Jazz',
    isLive: false,
    nowPlaying: { track: 'Midnight Passage', artist: 'Avery Quartet' },
    privacy: 'public',
    listeners: 403,
    gradient: 'from-indigo-700 to-blue-500',
  },
  {
    id: 'vault-selectors',
    name: 'Vault Selectors',
    host: 'Vinyl Vic',
    avatar: 'VS',
    genre: 'Electronic',
    isLive: true,
    nowPlaying: { track: 'Subharmonic', artist: 'Kraze' },
    privacy: 'invite',
    listeners: 289,
    gradient: 'from-cyan-500 to-teal-600',
  },
  {
    id: 'underground-overground',
    name: 'Underground / Overground',
    host: 'Nocturne',
    avatar: 'UG',
    genre: 'Electronic',
    isLive: true,
    nowPlaying: { track: 'Foghorn 4AM', artist: 'Nocturne' },
    privacy: 'subscribers',
    listeners: 1108,
    gradient: 'from-gray-700 to-zinc-500',
  },
  {
    id: 'signal-search',
    name: 'Signal Search',
    host: 'Scout',
    avatar: 'SS',
    genre: 'Indie',
    isLive: false,
    nowPlaying: { track: 'Driftwood', artist: 'Cedar Lane' },
    privacy: 'public',
    listeners: 527,
    gradient: 'from-emerald-500 to-teal-600',
  },
];

const GENRES = ['Synthwave', 'Hip Hop', 'Lo-fi', 'Rock', 'Jazz', 'Electronic'];

const UPCOMING: UpcomingShow[] = [
  { id: 'u1', time: 'Tonight 9pm', show: 'Debut Listening Party: "VELVET"', host: 'Maya K', channel: 'Boom Bap Basement' },
  { id: 'u2', time: 'Tomorrow 7pm', show: 'Throwback Thursday Live', host: 'Classic Cal', channel: 'OPYNX Network' },
  { id: 'u3', time: 'Fri 8pm', show: 'Weekend Warmup Takeover', host: 'Nova Synth', channel: 'Nova Synthwave Radio' },
  { id: 'u4', time: 'Sat 3pm', show: 'Superfan Saturday: Behind The Album', host: 'Mia Rivers', channel: 'OPYNX Network' },
  { id: 'u5', time: 'Sun 10pm', show: 'Sunday Downtempo', host: 'Mellow Mars', channel: 'The Lo-fi Attic' },
];

const privacyBadge = (p: CreatorChannel['privacy']) => {
  if (p === 'public') return { label: 'Public', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  if (p === 'subscribers') return { label: 'Subscribers Only', cls: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
  return { label: 'Invite Only', cls: 'bg-red-500/20 text-red-300 border-red-500/30' };
};

export default function RadioNetworkHomePage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState<string>('Mon');
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [listeners, setListeners] = useState(18342);
  const [reminders, setReminders] = useState<Set<string>>(new Set());

  // Today's day
  useEffect(() => {
    const today = new Date().getDay(); // 0=Sun, 1=Mon...
    const map = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    setSelectedDay(map[today]);
  }, []);

  // Live-feeling listener count
  useEffect(() => {
    const id = setInterval(() => {
      setListeners((l) => l + Math.floor(Math.random() * 21) - 10);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const filteredChannels = activeGenre
    ? CHANNELS.filter((c) => c.genre === activeGenre)
    : CHANNELS;

  const toggleReminder = (id: string, show: string) => {
    setReminders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast(`Reminder removed: ${show}`, 'info');
      } else {
        next.add(id);
        toast(`Reminder set for "${show}"`, 'success');
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-brand-950 text-white">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-brand-950 to-brand-950" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,rgba(239,68,68,0.25),transparent_45%),radial-gradient(circle_at_80%_60%,rgba(168,85,247,0.25),transparent_45%)]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-12 pb-16">
          <Link href="/explore" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition text-sm mb-10">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Explore
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
            </span>
            <span className="text-xs font-bold tracking-[0.3em] text-red-400 uppercase">On Air</span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-4">
            OPYNX <span className="text-red-500">Radio Network</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl">
            The first direct-to-fan radio network. 24/7 curated music, live shows, and exclusive artist channels.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-14">
        {/* Now Playing Network Feed */}
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-red-900/40 via-[#15151f] to-[#15151f] border border-white/10 p-8 sm:p-10">
          <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1 rounded-full bg-red-600 text-xs font-bold tracking-widest">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
            <div className="flex-1">
              <p className="text-xs tracking-[0.3em] text-red-400 uppercase mb-2">Now Playing</p>
              <h2 className="text-3xl sm:text-4xl font-black mb-2">Morning Drive</h2>
              <p className="text-gray-300 mb-4">with DJ Kora &middot; OPYNX Network</p>
              <div className="rounded-xl bg-black/30 border border-white/5 p-4 mb-6 max-w-md">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Track</p>
                <p className="text-lg font-semibold">Analog Heart</p>
                <p className="text-sm text-gray-400">by Maya K</p>
              </div>
              <div className="flex items-center gap-6 mb-6">
                <div>
                  <p className="text-3xl font-black tabular-nums">{listeners.toLocaleString()}</p>
                  <p className="text-xs tracking-wider text-gray-500 uppercase">listeners</p>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div className="flex items-end gap-1 h-10" aria-hidden>
                  {[0.6, 0.9, 0.4, 1, 0.7, 0.85, 0.5, 0.95].map((h, i) => (
                    <span
                      key={i}
                      className="w-1.5 rounded-sm bg-red-500"
                      style={{
                        height: `${h * 100}%`,
                        animation: `opynx-wave 1.1s ${i * 0.12}s ease-in-out infinite alternate`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={() => toast('Connecting to the OPYNX Network feed', 'info')}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-red-600 hover:bg-red-500 transition font-bold text-lg shadow-lg shadow-red-900/40"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                TUNE IN
              </button>
            </div>
            <div className="w-full lg:w-80 aspect-square rounded-2xl bg-gradient-to-br from-red-600 via-purple-700 to-indigo-800 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-black/30" />
              <span className="relative text-6xl font-black tracking-tighter text-white/90">OPYNX</span>
            </div>
          </div>
          <style jsx>{`
            @keyframes opynx-wave {
              0% { transform: scaleY(0.3); }
              100% { transform: scaleY(1); }
            }
          `}</style>
        </section>

        {/* Network Schedule Strip */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Network Schedule</h2>
            <Link href="/radio/network" className="text-sm text-red-400 hover:text-red-300">Full schedule &rarr;</Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
            {DAYS.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition border ${
                  selectedDay === d
                    ? 'bg-red-600 text-white border-red-500'
                    : 'bg-[#15151f] text-gray-400 border-white/5 hover:text-white hover:border-white/20'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SCHEDULE[selectedDay]?.shows.map((s) => (
              <div key={s.time} className="rounded-xl bg-[#15151f] border border-white/5 p-4">
                <p className="text-xs tracking-wider text-red-400 uppercase mb-1">{s.time}</p>
                <p className="font-semibold mb-0.5">{s.title}</p>
                <p className="text-sm text-gray-400">{s.host}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Creator Channels */}
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold">Featured Creator Channels</h2>
              <p className="text-sm text-gray-400 mt-1">Independent artists broadcasting their own radio stations</p>
            </div>
          </div>

          {/* Genre filter pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveGenre(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                activeGenre === null ? 'bg-white text-black' : 'bg-[#15151f] text-gray-400 border border-white/5 hover:text-white'
              }`}
            >
              All
            </button>
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setActiveGenre(activeGenre === g ? null : g)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  activeGenre === g ? 'bg-red-600 text-white' : 'bg-[#15151f] text-gray-400 border border-white/5 hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredChannels.map((c) => {
              const badge = privacyBadge(c.privacy);
              const accessible = c.privacy === 'public' || (c.privacy === 'subscribers' && session);
              return (
                <div key={c.id} className="group rounded-2xl bg-[#15151f] border border-white/5 overflow-hidden hover:border-white/20 transition flex flex-col">
                  <div className={`h-28 bg-gradient-to-br ${c.gradient} relative`}>
                    {c.isLive && (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600 text-[10px] font-bold tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                      </span>
                    )}
                    <div className="absolute -bottom-7 left-4 w-14 h-14 rounded-full bg-[#15151f] border-2 border-[#15151f] flex items-center justify-center">
                      <div className={`w-full h-full rounded-full bg-gradient-to-br ${c.gradient} flex items-center justify-center text-sm font-black`}>
                        {c.avatar}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 pt-9 flex-1 flex flex-col">
                    <h3 className="font-bold leading-tight mb-1 truncate">{c.name}</h3>
                    <p className="text-xs text-gray-400 mb-2">{c.host} &middot; {c.genre}</p>
                    <div className="rounded-lg bg-black/30 p-2 mb-3">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500">Now Playing</p>
                      <p className="text-sm font-medium truncate">{c.nowPlaying.track}</p>
                      <p className="text-xs text-gray-400 truncate">{c.nowPlaying.artist}</p>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${badge.cls}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-gray-400">{c.listeners.toLocaleString()} listening</span>
                    </div>
                    <div className="mt-auto flex gap-2">
                      <Link
                        href={`/radio/channel/${c.id}`}
                        className={`flex-1 text-center px-3 py-2 rounded-full text-xs font-semibold transition ${
                          accessible
                            ? 'bg-red-600 hover:bg-red-500'
                            : 'bg-purple-600 hover:bg-purple-500'
                        }`}
                      >
                        {accessible ? 'Tune In' : 'Subscribe to Access'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Upcoming Live Shows */}
        <section>
          <h2 className="text-2xl font-bold mb-5">Upcoming Live Shows</h2>
          <div className="rounded-2xl bg-[#15151f] border border-white/5 overflow-hidden divide-y divide-white/5">
            {UPCOMING.map((u) => {
              const set = reminders.has(u.id);
              return (
                <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-white/[0.02]">
                  <div className="sm:w-32 text-sm font-semibold text-red-400">{u.time}</div>
                  <div className="flex-1">
                    <p className="font-semibold">{u.show}</p>
                    <p className="text-sm text-gray-400">{u.host} &middot; {u.channel}</p>
                  </div>
                  <button
                    onClick={() => toggleReminder(u.id, u.show)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                      set ? 'bg-red-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {set ? 'Reminder Set' : 'Set Reminder'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Start Your Own Station CTA */}
        <section className="rounded-3xl bg-gradient-to-r from-red-900/50 via-[#15151f] to-purple-900/40 border border-white/10 p-8 sm:p-10">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.3em] text-red-400 mb-3">For Creators</p>
              <h2 className="text-3xl font-black mb-2">Start Your Own Station</h2>
              <p className="text-gray-300 max-w-xl">
                Broadcast live to your fans, build scheduled programming, and earn from subscriptions, tips, and network ad revenue shares.
              </p>
            </div>
            <Link
              href="/dashboard/radio/channel"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-red-600 hover:bg-red-500 font-bold shadow-lg shadow-red-900/40 transition"
            >
              Launch Your Channel &rarr;
            </Link>
          </div>
        </section>

        {/* Listen on Any Device */}
        <section>
          <h2 className="text-2xl font-bold mb-5">Listen on Any Device</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: 'M3 5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-5l1 3h2v2H8v-2h2l1-3H5a2 2 0 01-2-2V5z', title: 'Web Player', desc: 'Full station streaming in your browser — no app required.' },
              { icon: 'M7 2a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2H7zm5 18a1 1 0 100-2 1 1 0 000 2z', title: 'Mobile App', desc: 'iOS & Android apps with offline replays and CarPlay support.' },
              { icon: 'M12 2a7 7 0 00-7 7c0 3.5 2 5 2 7v3a2 2 0 002 2h6a2 2 0 002-2v-3c0-2 2-3.5 2-7a7 7 0 00-7-7zm-1 20h2v1h-2z', title: 'Smart Speaker', desc: 'Say "Play OPYNX Radio" on Alexa, Google Home, or Sonos.' },
            ].map((d) => (
              <div key={d.title} className="rounded-2xl bg-[#15151f] border border-white/5 p-6 hover:border-white/20 transition">
                <div className="w-12 h-12 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d={d.icon} /></svg>
                </div>
                <h3 className="font-bold mb-1">{d.title}</h3>
                <p className="text-sm text-gray-400">{d.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
