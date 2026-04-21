'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useToast } from '@/app/components/Toast';

type ScreenCaller = {
  id: string;
  name: string;
  number: string;
  location: string;
  reason: string;
  notes: string;
};

type WaitCaller = {
  id: string;
  name: string;
  waitMin: number;
  topic: string;
};

type HistoryCaller = {
  id: string;
  name: string;
  duration: string;
  rating: number;
  notes: string;
};

const INITIAL_SCREENING: ScreenCaller[] = [
  {
    id: 's1',
    name: 'Jenna K.',
    number: '+1 (415) ***-4821',
    location: 'San Francisco, CA',
    reason: 'Wants to request a track dedication',
    notes: '',
  },
  {
    id: 's2',
    name: 'Diego R.',
    number: '+1 (305) ***-0917',
    location: 'Miami, FL',
    reason: 'Question about upcoming tour',
    notes: '',
  },
  {
    id: 's3',
    name: 'Sam T.',
    number: '+1 (212) ***-6651',
    location: 'Brooklyn, NY',
    reason: 'Story about last weeks show',
    notes: 'longtime listener',
  },
  {
    id: 's4',
    name: 'Priya L.',
    number: '+44 (20) ***-3380',
    location: 'London, UK',
    reason: 'International listener shoutout',
    notes: '',
  },
];

const INITIAL_WAITING: WaitCaller[] = [
  { id: 'w1', name: 'Marcus B.', waitMin: 2, topic: 'Song request' },
  { id: 'w2', name: 'Ana F.', waitMin: 3, topic: 'Fan question' },
  { id: 'w3', name: 'Trey S.', waitMin: 4, topic: 'Event opinion' },
  { id: 'w4', name: 'Kim W.', waitMin: 5, topic: 'Shoutout' },
  { id: 'w5', name: 'Leo M.', waitMin: 6, topic: 'Trivia' },
  { id: 'w6', name: 'Riya P.', waitMin: 8, topic: 'Song request' },
  { id: 'w7', name: 'Jordan K.', waitMin: 9, topic: 'Discussion' },
  { id: 'w8', name: 'Maya J.', waitMin: 11, topic: 'Birthday shoutout' },
  { id: 'w9', name: 'Ben H.', waitMin: 13, topic: 'Show feedback' },
  { id: 'w10', name: 'Sasha V.', waitMin: 15, topic: 'Upcoming album' },
];

const RECENT_CALLS: HistoryCaller[] = [
  { id: 'h1', name: 'Robert G.', duration: '4:32', rating: 5, notes: 'Great energy' },
  { id: 'h2', name: 'Ella N.', duration: '2:18', rating: 4, notes: 'Album question' },
  { id: 'h3', name: 'Kyle D.', duration: '5:00', rating: 5, notes: 'Funny story' },
  { id: 'h4', name: 'Tanya M.', duration: '3:45', rating: 3, notes: 'Long-winded' },
  { id: 'h5', name: 'Omar F.', duration: '1:52', rating: 4, notes: 'Quick request' },
];

export default function RadioCallersPage() {
  const { status } = useSession();
  const { toast } = useToast();

  const [screening, setScreening] = useState<ScreenCaller[]>(INITIAL_SCREENING);
  const [waiting, setWaiting] = useState<WaitCaller[]>(INITIAL_WAITING);
  const [activeCall, setActiveCall] = useState<{ name: string; duration: number } | null>({
    name: 'Marcus W.',
    duration: 0,
  });
  const [maxDuration, setMaxDuration] = useState(5);
  const [aiScreen, setAiScreen] = useState(false);
  const [profanityFilter, setProfanityFilter] = useState(true);
  const [blockList, setBlockList] = useState(['+1 (555) ***-9999', '+1 (555) ***-1234']);
  const [waveformBars, setWaveformBars] = useState<number[]>(
    Array.from({ length: 40 }, () => Math.random() * 100)
  );

  useEffect(() => {
    if (!activeCall) return;
    const t = setInterval(() => {
      setActiveCall((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : prev));
      setWaveformBars(Array.from({ length: 40 }, () => Math.random() * 100));
    }, 300);
    return () => clearInterval(t);
  }, [activeCall]);

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-brand-950">
        <p className="text-gray-400">Sign in to manage your caller queue</p>
        <Link href="/auth/login" className="text-red-400 hover:text-red-300 transition">
          Sign In →
        </Link>
      </div>
    );
  }

  const formatCallTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const approveScreening = (id: string) => {
    const c = screening.find((x) => x.id === id);
    setScreening((prev) => prev.filter((x) => x.id !== id));
    if (c) toast(`${c.name} approved for air`, 'success');
  };

  const rejectScreening = (id: string) => {
    const c = screening.find((x) => x.id === id);
    setScreening((prev) => prev.filter((x) => x.id !== id));
    if (c) toast(`${c.name} rejected`, 'info');
  };

  const updateNotes = (id: string, notes: string) => {
    setScreening((prev) => prev.map((x) => (x.id === id ? { ...x, notes } : x)));
  };

  const moveUp = (id: string) => {
    setWaiting((prev) => {
      const i = prev.findIndex((x) => x.id === id);
      if (i <= 0) return prev;
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  };

  const moveDown = (id: string) => {
    setWaiting((prev) => {
      const i = prev.findIndex((x) => x.id === id);
      if (i < 0 || i >= prev.length - 1) return prev;
      const next = [...prev];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  };

  const removeWaiting = (id: string) => {
    setWaiting((prev) => prev.filter((x) => x.id !== id));
  };

  const copyCallLink = () => {
    toast('Call link copied', 'success');
  };

  const totalWaiting = waiting.length + screening.length + (activeCall ? 1 : 0);

  return (
    <div className="min-h-screen py-12 px-6 bg-brand-950 text-white">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/dashboard/radio/studio"
          className="text-sm text-gray-400 hover:text-white transition mb-6 inline-block"
        >
          ← Back to Studio
        </Link>

        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">📞</span>
            <h1 className="text-4xl md:text-5xl font-bold">Live Caller Queue</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Manage callers waiting to join your broadcast
          </p>
        </div>

        {/* Queue Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Waiting', val: totalWaiting, color: 'text-white' },
            { label: 'On Air Now', val: activeCall ? 1 : 0, color: 'text-red-400' },
            { label: 'Screening', val: screening.length, color: 'text-yellow-400' },
            { label: 'Avg Wait', val: '4 min', color: 'text-gray-300' },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[#15151f] rounded-xl p-5 border border-white/5"
            >
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {s.label}
              </div>
              <div className={`text-3xl font-bold tabular-nums ${s.color}`}>{s.val}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Active Call */}
            {activeCall && (
              <section className="bg-gradient-to-br from-red-600/20 to-[#15151f] rounded-xl p-6 border border-red-600/40">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Active Call
                  </h2>
                  <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-bold">
                    ON AIR
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
                    M
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg">{activeCall.name}</div>
                    <div className="text-sm text-gray-400">
                      On air · <span className="font-mono tabular-nums">{formatCallTime(activeCall.duration)}</span>
                    </div>
                  </div>
                </div>

                {/* Waveform */}
                <div className="flex items-center gap-0.5 h-14 bg-brand-950 rounded-lg px-3 mb-4">
                  {waveformBars.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-red-500/70 rounded-sm transition-all duration-150"
                      style={{ height: `${Math.max(10, h)}%` }}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => toast(`${activeCall.name} muted`, 'info')}
                    className="px-3 py-2 rounded-lg bg-brand-950 border border-white/10 hover:border-red-600/40 transition text-sm"
                  >
                    🔇 Mute
                  </button>
                  <button
                    onClick={() => toast('Volume lowered', 'info')}
                    className="px-3 py-2 rounded-lg bg-brand-950 border border-white/10 hover:border-red-600/40 transition text-sm"
                  >
                    ▼ Lower Vol
                  </button>
                  <button
                    onClick={() => toast('Caller kicked', 'info')}
                    className="px-3 py-2 rounded-lg bg-yellow-600/20 text-yellow-400 border border-yellow-600/40 hover:bg-yellow-600/30 transition text-sm"
                  >
                    ✕ Kick
                  </button>
                  <button
                    onClick={() => {
                      toast(`Call with ${activeCall.name} ended`, 'success');
                      setActiveCall(null);
                    }}
                    className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition text-sm font-semibold"
                  >
                    End Call
                  </button>
                </div>
              </section>
            )}

            {/* Screening Queue */}
            <section className="bg-[#15151f] rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold">Screening Queue</h2>
                <span className="text-xs text-gray-400">{screening.length} being vetted</span>
              </div>
              <div className="space-y-3">
                {screening.map((c) => (
                  <div
                    key={c.id}
                    className="bg-brand-950 rounded-lg p-4 border border-white/5 hover:border-yellow-600/30 transition"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                      <div>
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-xs text-gray-500">
                          {c.number} · {c.location}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">{c.reason}</div>
                      </div>
                      <button
                        onClick={() => toast(`Previewing ${c.name}`, 'info')}
                        className="text-xs px-3 py-1.5 rounded-md bg-[#15151f] border border-white/10 hover:border-red-600/40 transition flex-shrink-0"
                      >
                        🎧 Preview Audio
                      </button>
                    </div>
                    <textarea
                      value={c.notes}
                      onChange={(e) => updateNotes(c.id, e.target.value)}
                      placeholder="Host notes..."
                      rows={1}
                      className="w-full bg-[#15151f] border border-white/10 rounded-md px-3 py-2 text-sm focus:border-red-600 focus:outline-none transition mb-3 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveScreening(c.id)}
                        className="flex-1 px-3 py-2 rounded-md bg-green-600/20 text-green-400 border border-green-600/40 hover:bg-green-600/30 transition text-sm font-semibold"
                      >
                        ✓ Approve for Air
                      </button>
                      <button
                        onClick={() => rejectScreening(c.id)}
                        className="flex-1 px-3 py-2 rounded-md bg-red-600/20 text-red-400 border border-red-600/40 hover:bg-red-600/30 transition text-sm font-semibold"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Waiting Queue */}
            <section className="bg-[#15151f] rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold">Waiting Queue</h2>
                <span className="text-xs text-gray-400">{waiting.length} in line</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase tracking-wide">
                      <th className="text-left font-semibold py-2 px-2">#</th>
                      <th className="text-left font-semibold py-2 px-2">Name</th>
                      <th className="text-left font-semibold py-2 px-2">Wait</th>
                      <th className="text-left font-semibold py-2 px-2">Topic</th>
                      <th className="text-right font-semibold py-2 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waiting.map((c, i) => (
                      <tr
                        key={c.id}
                        className="border-t border-white/5 hover:bg-white/[0.02] transition"
                      >
                        <td className="py-3 px-2 text-gray-400 tabular-nums">{i + 1}</td>
                        <td className="py-3 px-2 font-medium">{c.name}</td>
                        <td className="py-3 px-2 text-gray-400 tabular-nums">{c.waitMin}m</td>
                        <td className="py-3 px-2 text-gray-400">{c.topic}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => toast(`Screening ${c.name}`, 'info')}
                              className="text-xs px-2 py-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600/30 transition"
                            >
                              Screen Now
                            </button>
                            <button
                              onClick={() => moveUp(c.id)}
                              className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 text-xs transition"
                              title="Move up"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => moveDown(c.id)}
                              className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 text-xs transition"
                              title="Move down"
                            >
                              ▼
                            </button>
                            <button
                              onClick={() => removeWaiting(c.id)}
                              className="w-7 h-7 rounded bg-white/5 hover:bg-red-600/30 text-xs transition"
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Recent Calls */}
            <section className="bg-[#15151f] rounded-xl p-6 border border-white/5">
              <h2 className="text-xl font-semibold mb-5">Recent Calls</h2>
              <div className="space-y-2">
                {RECENT_CALLS.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 p-3 bg-brand-950 rounded-lg border border-white/5"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                      {c.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-gray-500 truncate">{c.notes}</div>
                    </div>
                    <div className="text-xs text-gray-400 tabular-nums">{c.duration}</div>
                    <div className="text-xs text-yellow-400">
                      {'★'.repeat(c.rating)}
                      <span className="text-gray-600">{'★'.repeat(5 - c.rating)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Call-in Number */}
            <section className="bg-[#15151f] rounded-xl p-6 border border-white/5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-4">
                Call-In Info
              </h2>

              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Web link</div>
                <div className="flex gap-2">
                  <code className="flex-1 bg-brand-950 border border-white/10 rounded-md px-3 py-2 text-xs font-mono truncate">
                    opynx.com/call/cipher-radio
                  </code>
                  <button
                    onClick={copyCallLink}
                    className="px-3 py-2 rounded-md bg-red-600/20 text-red-400 hover:bg-red-600/30 transition text-xs font-semibold"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Dial-in</div>
                <div className="bg-brand-950 border border-white/10 rounded-md px-3 py-2 font-mono text-sm">
                  +1-555-OPYNX-RADIO
                </div>
              </div>

              <div className="bg-brand-950 border border-white/10 rounded-lg p-4 flex flex-col items-center">
                <div className="w-32 h-32 bg-white p-2 rounded grid grid-cols-10 grid-rows-10 gap-0.5">
                  {Array.from({ length: 100 }).map((_, i) => (
                    <div
                      key={i}
                      className={`${
                        (i * 7 + i * i) % 3 === 0 ? 'bg-black' : 'bg-white'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-2">Scan to call in</div>
              </div>
            </section>

            {/* Settings */}
            <section className="bg-[#15151f] rounded-xl p-6 border border-white/5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-4">
                Caller Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Max Call Duration</span>
                    <span className="tabular-nums">{maxDuration} min</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={maxDuration}
                    onChange={(e) => setMaxDuration(Number(e.target.value))}
                    className="w-full accent-red-600"
                  />
                </div>

                <label className="flex items-start justify-between gap-3 cursor-pointer">
                  <div>
                    <div className="text-sm font-medium">Auto-screen with AI</div>
                    <div className="text-xs text-gray-500">Premium feature</div>
                  </div>
                  <button
                    onClick={() => {
                      setAiScreen(!aiScreen);
                      if (!aiScreen) toast('AI screening enabled', 'success');
                    }}
                    className={`relative w-10 h-5 rounded-full transition flex-shrink-0 ${
                      aiScreen ? 'bg-red-600' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition ${
                        aiScreen ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </label>

                <label className="flex items-start justify-between gap-3 cursor-pointer">
                  <div>
                    <div className="text-sm font-medium">Profanity Filter</div>
                    <div className="text-xs text-gray-500">Auto-mute flagged words</div>
                  </div>
                  <button
                    onClick={() => setProfanityFilter(!profanityFilter)}
                    className={`relative w-10 h-5 rounded-full transition flex-shrink-0 ${
                      profanityFilter ? 'bg-red-600' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition ${
                        profanityFilter ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </label>

                <div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span>Block List</span>
                    <span>{blockList.length} blocked</span>
                  </div>
                  <div className="space-y-1">
                    {blockList.map((n) => (
                      <div
                        key={n}
                        className="flex items-center justify-between bg-brand-950 border border-white/10 rounded px-3 py-1.5 text-xs font-mono"
                      >
                        <span>{n}</span>
                        <button
                          onClick={() => setBlockList((prev) => prev.filter((x) => x !== n))}
                          className="text-gray-500 hover:text-red-400 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
