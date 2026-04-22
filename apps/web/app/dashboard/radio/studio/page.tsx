'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/app/components/Toast';

type Track = { id: string; title: string; creator: string; duration: string };
type Caller = { id: string; name: string; avatar: string; status: 'screening' | 'on-air' | 'approved' };
type ChatMsg = { id: string; user: string; msg: string; color: string };

const UPCOMING: Track[] = [
  { id: 't1', title: 'Neon Drift', creator: 'Cipher', duration: '3:42' },
  { id: 't2', title: 'Midnight Run', creator: 'Kairo', duration: '4:18' },
  { id: 't3', title: 'Electric Dreams', creator: 'VHS Glow', duration: '3:56' },
  { id: 't4', title: 'After Hours', creator: 'Nova Line', duration: '5:02' },
  { id: 't5', title: 'Static Pulse', creator: 'Cipher', duration: '4:31' },
];

const CALLERS: Caller[] = [
  { id: 'c0', name: 'Marcus W.', avatar: 'M', status: 'on-air' },
  { id: 'c1', name: 'Jenna K.', avatar: 'J', status: 'screening' },
  { id: 'c2', name: 'Diego R.', avatar: 'D', status: 'screening' },
  { id: 'c3', name: 'Sam T.', avatar: 'S', status: 'screening' },
  { id: 'c4', name: 'Priya L.', avatar: 'P', status: 'screening' },
];

const INITIAL_CHAT: ChatMsg[] = [
  { id: '1', user: 'beatfan99', msg: 'This track slaps 🔥', color: 'text-red-400' },
  { id: '2', user: 'synthqueen', msg: 'love the vibe tonight', color: 'text-purple-400' },
  { id: '3', user: 'drippy_mike', msg: 'shoutout from LA!', color: 'text-blue-400' },
  { id: '4', user: 'nightowl', msg: 'first time tuning in, im hooked', color: 'text-green-400' },
  { id: '5', user: 'djvibes', msg: 'whos the next guest?', color: 'text-yellow-400' },
];

export default function RadioStudioPage() {
  const { status, data: session } = useSession();
  const { toast } = useToast();

  const [isLive, setIsLive] = useState(false);
  const [listenerCount, setListenerCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [pushNetwork, setPushNetwork] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [pushToTalk, setPushToTalk] = useState(false);
  const [autoDuck, setAutoDuck] = useState(true);
  const [masterVol, setMasterVol] = useState(75);
  const [monitorVol, setMonitorVol] = useState(60);
  const [micLevel, setMicLevel] = useState(0);
  const [musicLevel, setMusicLevel] = useState(0);
  const [adCountdown, setAdCountdown] = useState<number | null>(null);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>(INITIAL_CHAT);
  const [chatInput, setChatInput] = useState('');
  const [quality, setQuality] = useState<'standard' | 'high'>('high');
  const [recording, setRecording] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Live tick — listener count, elapsed time, audio meters
  useEffect(() => {
    if (!isLive) {
      setMicLevel(0);
      setMusicLevel(0);
      return;
    }
    const tick = setInterval(() => {
      setElapsed((e) => e + 1);
      setListenerCount((c) => Math.max(0, c + Math.floor(Math.random() * 7) - 2));
      setMicLevel(micOn ? Math.floor(Math.random() * 60) + 20 : 0);
      setMusicLevel(Math.floor(Math.random() * 40) + 50);
    }, 1000);
    return () => clearInterval(tick);
  }, [isLive, micOn]);

  // Ad countdown
  useEffect(() => {
    if (adCountdown === null) return;
    if (adCountdown <= 0) {
      setAdCountdown(null);
      toast('Ad break complete', 'success');
      return;
    }
    const t = setTimeout(() => setAdCountdown((v) => (v ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [adCountdown, toast]);

  // Chat auto-scroll
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatMsgs]);

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-brand-950">
        <p className="text-gray-400">Sign in to access the live studio</p>
        <Link href="/auth/login" className="text-red-400 hover:text-red-300 transition">
          Sign In →
        </Link>
      </div>
    );
  }

  const toggleLive = () => {
    if (isLive) {
      setIsLive(false);
      setElapsed(0);
      setListenerCount(0);
      toast('Broadcast ended', 'info');
    } else {
      setIsLive(true);
      setListenerCount(42);
      toast('You are LIVE!', 'success');
    }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMsgs((prev) => [
      ...prev,
      { id: String(Date.now()), user: session?.user?.name || 'host', msg: chatInput, color: 'text-red-400' },
    ]);
    setChatInput('');
  };

  const channelName = 'Cipher Radio';

  return (
    <div className="min-h-screen py-10 px-6 bg-brand-950 text-white">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/dashboard/radio/channel"
          className="text-sm text-gray-400 hover:text-white transition mb-6 inline-block"
        >
          ← Back to Channel
        </Link>

        {/* Hero */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`w-3 h-3 rounded-full bg-red-600 ${isLive ? 'animate-pulse' : 'opacity-30'}`}
              />
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">LIVE STUDIO</h1>
            </div>
            <p className="text-gray-400 text-lg">
              {channelName} · Broadcasting to your listeners
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>Quality:</span>
            <div className="flex bg-[#15151f] rounded-full p-1 border border-white/5">
              {(['standard', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    quality === q ? 'bg-red-600 text-white' : 'text-gray-400'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* On Air Status */}
            <section
              className={`rounded-xl p-6 border transition ${
                isLive
                  ? 'bg-gradient-to-br from-red-600/20 to-[#15151f] border-red-600/40'
                  : 'bg-[#15151f] border-white/5'
              }`}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <button
                  onClick={toggleLive}
                  className={`relative w-40 h-40 rounded-full font-bold text-xl transition shadow-2xl ${
                    isLive
                      ? 'bg-red-600 text-white animate-pulse shadow-red-600/50'
                      : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-red-600/30'
                  }`}
                >
                  {isLive ? 'ON AIR' : 'GO LIVE'}
                  {isLive && (
                    <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping" />
                  )}
                </button>

                <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                  <div className="bg-brand-950 rounded-lg p-4 border border-white/5">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      Listeners
                    </div>
                    <div
                      className={`text-4xl font-bold tabular-nums transition ${
                        isLive ? 'text-green-400' : 'text-gray-600'
                      }`}
                    >
                      {listenerCount.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-brand-950 rounded-lg p-4 border border-white/5">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      On Air
                    </div>
                    <div className="text-4xl font-bold tabular-nums font-mono">
                      {formatTime(elapsed)}
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-between p-3 bg-brand-950 rounded-lg border border-white/5">
                    <div>
                      <div className="text-sm font-semibold">Push to Network</div>
                      <div className="text-xs text-gray-500">
                        Stream into OPYNX Radio rotation
                      </div>
                    </div>
                    <button
                      onClick={() => setPushNetwork(!pushNetwork)}
                      className={`relative w-12 h-6 rounded-full transition ${
                        pushNetwork ? 'bg-red-600' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition ${
                          pushNetwork ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Broadcast Mixer */}
            <section className="bg-[#15151f] rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold">Broadcast Mixer</h2>
                <button
                  onClick={() => toast('Running audio test...', 'info')}
                  className="text-xs px-3 py-1.5 rounded-full bg-brand-950 border border-white/10 hover:border-red-600/40 transition"
                >
                  Test Audio
                </button>
              </div>

              <div className="space-y-4">
                {/* Meters */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Mic Input', level: micLevel },
                    { label: 'Music', level: musicLevel },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                        <span>{m.label}</span>
                        <span className="tabular-nums">{m.level}dB</span>
                      </div>
                      <div className="flex gap-0.5 h-4">
                        {Array.from({ length: 20 }).map((_, i) => {
                          const active = i < Math.floor(m.level / 5);
                          const color =
                            i >= 16 ? 'bg-red-500' : i >= 12 ? 'bg-yellow-500' : 'bg-green-500';
                          return (
                            <div
                              key={i}
                              className={`flex-1 rounded-sm transition ${
                                active ? color : 'bg-white/5'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sliders */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>Master Volume</span>
                      <span className="tabular-nums">{masterVol}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={masterVol}
                      onChange={(e) => setMasterVol(Number(e.target.value))}
                      className="w-full accent-red-600"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>Monitor Output</span>
                      <span className="tabular-nums">{monitorVol}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={monitorVol}
                      onChange={(e) => setMonitorVol(Number(e.target.value))}
                      className="w-full accent-red-600"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setMicOn(!micOn)}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg transition ${
                      micOn
                        ? 'bg-red-600/20 border border-red-600/50 text-red-300'
                        : 'bg-brand-950 border border-white/10 text-gray-400'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          micOn ? 'bg-red-500 animate-pulse' : 'bg-gray-600'
                        }`}
                      />
                      Mic {micOn ? 'ON' : 'OFF'}
                    </span>
                  </button>
                  <button
                    onClick={() => setPushToTalk(!pushToTalk)}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg transition ${
                      pushToTalk
                        ? 'bg-red-600/20 border border-red-600/50 text-red-300'
                        : 'bg-brand-950 border border-white/10 text-gray-400'
                    }`}
                  >
                    <span>Push-to-Talk</span>
                  </button>
                  <button
                    onClick={() => setAutoDuck(!autoDuck)}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg transition ${
                      autoDuck
                        ? 'bg-red-600/20 border border-red-600/50 text-red-300'
                        : 'bg-brand-950 border border-white/10 text-gray-400'
                    }`}
                  >
                    <span>Auto-Duck</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Now Playing */}
            <section className="bg-[#15151f] rounded-xl p-6 border border-white/5">
              <h2 className="text-xl font-semibold mb-5">Now Playing</h2>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-red-600 to-purple-700 flex items-center justify-center text-2xl flex-shrink-0">
                  🎵
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg truncate">Neon Drift</div>
                  <div className="text-sm text-gray-400">Cipher</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500 tabular-nums">1:24</span>
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-red-600 rounded-full" />
                    </div>
                    <span className="text-xs text-gray-500 tabular-nums">3:42</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toast('Previous track', 'info')}
                    className="w-10 h-10 rounded-full bg-brand-950 border border-white/10 hover:border-red-600/40 transition"
                  >
                    ⏮
                  </button>
                  <button
                    onClick={() => toast('Playback toggled', 'info')}
                    className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 transition text-white"
                  >
                    ⏸
                  </button>
                  <button
                    onClick={() => toast('Skipped to next', 'info')}
                    className="w-10 h-10 rounded-full bg-brand-950 border border-white/10 hover:border-red-600/40 transition"
                  >
                    ⏭
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                    Queue · Up Next
                  </h3>
                  <button
                    onClick={() => toast('Track picker opened', 'info')}
                    className="text-xs text-red-400 hover:text-red-300 transition"
                  >
                    + Add Track
                  </button>
                </div>
                <div className="space-y-1">
                  {UPCOMING.map((t, i) => (
                    <div
                      key={t.id}
                      draggable
                      className="flex items-center gap-3 px-3 py-2 bg-brand-950 rounded-lg border border-white/5 hover:border-white/10 transition cursor-move"
                    >
                      <span className="text-xs text-gray-500 w-5 tabular-nums">{i + 1}</span>
                      <span className="text-gray-500">⋮⋮</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{t.title}</div>
                        <div className="text-xs text-gray-500 truncate">{t.creator}</div>
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums">{t.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Ad Break */}
            <section className="bg-[#15151f] rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Ad Break</h2>
                {adCountdown !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-yellow-400 font-bold tabular-nums">{adCountdown}s</span>
                    <span className="text-gray-400">ad playing</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  onClick={() => setAdCountdown(30)}
                  disabled={adCountdown !== null}
                  className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition"
                >
                  Insert Ad Break (30s)
                </button>
                <button
                  onClick={() => toast('Skipping next ad', 'info')}
                  className="px-4 py-2.5 rounded-lg bg-brand-950 border border-white/10 hover:border-red-600/40 transition"
                >
                  Skip Next Ad
                </button>
              </div>

              <div className="text-xs text-gray-400 mb-2">Upcoming scheduled ads</div>
              <div className="space-y-1">
                {[
                  { t: '00:28:14', name: 'Brand X pre-roll', d: '30s' },
                  { t: '01:02:00', name: 'Spotlight sponsor', d: '15s' },
                  { t: '01:45:00', name: 'House promo', d: '30s' },
                ].map((ad, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 bg-brand-950 rounded-lg border border-white/5 text-sm"
                  >
                    <span className="font-mono text-xs text-gray-400">{ad.t}</span>
                    <span className="flex-1 ml-4 truncate">{ad.name}</span>
                    <span className="text-xs text-gray-500 tabular-nums">{ad.d}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live Callers */}
            <section className="bg-[#15151f] rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Live Callers</h2>
                <Link
                  href="/dashboard/radio/callers"
                  className="text-xs text-red-400 hover:text-red-300 transition"
                >
                  Manage →
                </Link>
              </div>
              <div className="text-xs text-gray-400 mb-4">Call queue: 4 waiting</div>

              <div className="space-y-2">
                {CALLERS.map((c) => {
                  const onAir = c.status === 'on-air';
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition ${
                        onAir
                          ? 'bg-red-600/10 border border-red-600/40'
                          : 'bg-brand-950 border border-white/5 hover:border-white/10 cursor-pointer'
                      }`}
                      onClick={() => !onAir && toast(`Bringing ${c.name} on air`, 'info')}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          onAir ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-300'
                        }`}
                      >
                        {c.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{c.name}</div>
                        <div className="text-xs text-gray-500">
                          {onAir ? 'Live' : 'Screening'}
                        </div>
                      </div>
                      {onAir ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded">
                            ON AIR
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toast(`${c.name} muted`, 'info');
                            }}
                            className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 text-xs transition"
                            title="Mute"
                          >
                            🔇
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toast(`${c.name} removed`, 'info');
                            }}
                            className="w-7 h-7 rounded bg-white/5 hover:bg-red-600/30 text-xs transition"
                            title="Kick"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">→</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Live Chat */}
            <section className="bg-[#15151f] rounded-xl p-4 border border-white/5 flex flex-col h-[400px]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Live Chat</h2>
                <span className="text-xs text-gray-400">{chatMsgs.length} msgs</span>
              </div>
              <div
                ref={chatRef}
                className="flex-1 overflow-y-auto space-y-1.5 mb-3 pr-1"
              >
                {chatMsgs.map((m) => (
                  <div key={m.id} className="text-sm flex items-start gap-2 group">
                    <span className={`font-semibold ${m.color} flex-shrink-0`}>{m.user}:</span>
                    <span className="text-gray-300 flex-1">{m.msg}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => toast(`${m.user} timed out`, 'info')}
                        className="text-[10px] text-yellow-400 hover:text-yellow-300"
                      >
                        timeout
                      </button>
                      <button
                        onClick={() => toast(`${m.user} banned`, 'info')}
                        className="text-[10px] text-red-400 hover:text-red-300"
                      >
                        ban
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                  placeholder="Say something to your listeners..."
                  className="flex-1 bg-brand-950 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-red-600 focus:outline-none transition"
                />
                <button
                  onClick={sendChat}
                  className="px-4 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-semibold transition"
                >
                  Send
                </button>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="bg-[#15151f] rounded-xl p-4 border border-white/5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
                Quick Actions
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setRecording(!recording);
                    toast(recording ? 'Recording stopped' : 'Recording for VOD replay', 'info');
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition text-sm ${
                    recording
                      ? 'bg-red-600/20 border border-red-600/50 text-red-300'
                      : 'bg-brand-950 border border-white/10 hover:border-red-600/40'
                  }`}
                >
                  <span>{recording ? '● Recording' : '○ Record Show'}</span>
                  <span className="text-xs text-gray-500">VOD replay</span>
                </button>
                <button
                  onClick={() => toast('Share URL copied', 'success')}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-brand-950 border border-white/10 hover:border-red-600/40 transition text-sm"
                >
                  <span>↗ Share on Socials</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
