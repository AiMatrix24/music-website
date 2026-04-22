'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';

type Privacy = 'public' | 'subscribers' | 'invite';

interface ChannelData {
  id: string;
  name: string;
  creator: string;
  creatorHandle: string;
  genre: string;
  listeners: number;
  totalFollowers: number;
  privacy: Privacy;
  bio: string;
  gradient: string;
  callHandle: string;
}

const CHANNELS: Record<string, ChannelData> = {
  'nova-synthwave': {
    id: 'nova-synthwave',
    name: 'Nova Synthwave Radio',
    creator: 'Nova Synth',
    creatorHandle: 'novasynth',
    genre: 'Synthwave / Retrowave',
    listeners: 3482,
    totalFollowers: 41200,
    privacy: 'public',
    bio: 'Nova Synth is a Los Angeles producer making neon-tinted instrumental music and curating a weekly broadcast of retro-future sounds from around the world.',
    gradient: 'from-purple-700 via-fuchsia-600 to-pink-500',
    callHandle: 'nova-radio',
  },
  'boom-bap-basement': {
    id: 'boom-bap-basement',
    name: 'Boom Bap Basement',
    creator: 'DJ Kora',
    creatorHandle: 'djkora',
    genre: 'Hip Hop / Boom Bap',
    listeners: 2194,
    totalFollowers: 28700,
    privacy: 'public',
    bio: 'DJ Kora spins classic boom bap and new underground cuts from his basement studio in Brooklyn. Four nights a week of rhythm and rhyme.',
    gradient: 'from-amber-600 via-orange-600 to-red-600',
    callHandle: 'boom-bap',
  },
  'garage-glory': {
    id: 'garage-glory',
    name: 'Garage Glory',
    creator: 'Ivy Blake',
    creatorHandle: 'ivyblake',
    genre: 'Garage Rock / Indie',
    listeners: 612,
    totalFollowers: 9800,
    privacy: 'subscribers',
    bio: 'Guitar-first radio for listeners who like their amps cranked. Ivy Blake plays new indie rock, garage, and post-punk every weeknight.',
    gradient: 'from-red-700 via-rose-600 to-red-900',
    callHandle: 'garage-glory',
  },
  'vault-selectors': {
    id: 'vault-selectors',
    name: 'Vault Selectors',
    creator: 'Vinyl Vic',
    creatorHandle: 'vinylvic',
    genre: 'Electronic / Rare Groove',
    listeners: 289,
    totalFollowers: 4100,
    privacy: 'invite',
    bio: 'An invite-only crate-diggers club. Vic shares hard-to-find electronic and rare groove records from a private 40,000-LP archive.',
    gradient: 'from-cyan-500 via-teal-600 to-emerald-600',
    callHandle: 'vault',
  },
};

const DEFAULT_CHANNEL: ChannelData = {
  id: 'unknown',
  name: 'OPYNX Creator Channel',
  creator: 'Independent Creator',
  creatorHandle: 'creator',
  genre: 'Mixed',
  listeners: 420,
  totalFollowers: 5500,
  privacy: 'public',
  bio: 'An independent OPYNX creator channel broadcasting curated music to their fans.',
  gradient: 'from-red-700 via-purple-700 to-indigo-700',
  callHandle: 'creator',
};

const SCHEDULE_TODAY = [
  { time: '6-9am', title: 'Wake Up Broadcast', host: 'Guest: Sun Ray' },
  { time: '12-2pm', title: 'Lunch Mix', host: 'Host Selection' },
  { time: '4-6pm', title: 'Afternoon Drive', host: 'Live' },
  { time: '8-10pm', title: 'Feature Broadcast', host: 'Live with Q&A' },
  { time: '11pm-1am', title: 'Late Night Flow', host: 'DJ Set' },
];

const PLAYLISTS = [
  { id: 'p1', title: 'Neon Drive', count: 28, gradient: 'from-purple-600 to-pink-500' },
  { id: 'p2', title: 'After Sunset', count: 42, gradient: 'from-amber-500 to-red-600' },
  { id: 'p3', title: 'Late Work Hours', count: 35, gradient: 'from-cyan-500 to-blue-600' },
  { id: 'p4', title: 'Long Drives Home', count: 51, gradient: 'from-indigo-600 to-purple-600' },
  { id: 'p5', title: 'Dawn Chorus', count: 22, gradient: 'from-orange-500 to-pink-500' },
  { id: 'p6', title: 'Underground Picks', count: 36, gradient: 'from-emerald-600 to-teal-600' },
];

const VOD = [
  { id: 'v1', title: 'Album Debut Listening Party with Maya K', duration: '1h 28m', date: '3 days ago' },
  { id: 'v2', title: 'Synthwave Special: Vangelis Tribute', duration: '2h 04m', date: '1 week ago' },
  { id: 'v3', title: 'Live from the Studio: Remix Session', duration: '58m', date: '2 weeks ago' },
  { id: 'v4', title: 'Fan Call-In Night', duration: '1h 45m', date: '3 weeks ago' },
  { id: 'v5', title: 'Year in Review Broadcast', duration: '3h 12m', date: 'Last month' },
];

const INITIAL_CHAT = [
  { id: 'c1', user: 'kiernan', text: 'This mix is insane' },
  { id: 'c2', user: 'violet_77', text: 'Been listening since 9pm :)' },
  { id: 'c3', user: 'bassline', text: 'What\'s the track at 14:20?' },
  { id: 'c4', user: 'Nova Synth', text: 'That\'s my new one — out next Friday!', isHost: true },
  { id: 'c5', user: 'kiernan', text: 'Pre-saved already' },
];

const privacyStyle = (p: Privacy) => {
  if (p === 'public') return { label: 'Open Access', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', note: 'Free to listen for anyone' };
  if (p === 'subscribers') return { label: 'Premium Access', cls: 'bg-purple-500/20 text-purple-300 border-purple-500/30', note: 'Subscribers Only' };
  return { label: 'Invite Required', cls: 'bg-red-500/20 text-red-300 border-red-500/30', note: 'Invite Only' };
};

export default function RadioChannelPage() {
  const params = useParams();
  const id = (Array.isArray(params?.id) ? params?.id[0] : params?.id) as string | undefined;
  const { data: session } = useSession();
  const { toast } = useToast();

  const channel = useMemo<ChannelData>(() => {
    if (!id) return DEFAULT_CHANNEL;
    return CHANNELS[id] ?? {
      ...DEFAULT_CHANNEL,
      id,
      name: id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) + ' Radio',
    };
  }, [id]);

  const [subscribed, setSubscribed] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteReason, setInviteReason] = useState('');
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(72);
  const [progress, setProgress] = useState(34);
  const [chat, setChat] = useState(INITIAL_CHAT);
  const [chatInput, setChatInput] = useState('');
  const [queueSize] = useState(4);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 0.4)), 500);
    return () => clearInterval(id);
  }, [playing]);

  const pStyle = privacyStyle(channel.privacy);
  const hasAccess =
    channel.privacy === 'public' ||
    (channel.privacy === 'subscribers' && (subscribed || !!session));

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChat((c) => [...c, { id: `m${Date.now()}`, user: 'you', text: chatInput.trim() }]);
    setChatInput('');
  };

  const copyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      toast('Link copied to clipboard', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-brand-950 text-white">
      {/* Hero */}
      <div className="relative">
        <div className={`h-64 md:h-80 bg-gradient-to-br ${channel.gradient} relative`}>
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/40 to-transparent" />
          <div className="absolute top-6 left-6">
            <Link href="/radio" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back to Radio Network
            </Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 -mt-28 md:-mt-36 relative">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-[10px] font-bold tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> ON AIR
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${pStyle.cls}`}>
              {pStyle.label}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase mb-3">{channel.name}</h1>
          <p className="text-gray-300">
            Hosted by <Link href={`/artist/${channel.creatorHandle}`} className="text-red-400 hover:text-red-300 font-semibold">{channel.creator}</Link>
            <span className="text-gray-500"> &middot; </span>
            {channel.listeners.toLocaleString()} listening now
            <span className="text-gray-500"> &middot; </span>
            {channel.genre}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Access gate */}
        {!hasAccess && channel.privacy === 'subscribers' && (
          <div className="rounded-2xl bg-purple-900/30 border border-purple-500/30 p-6 sm:p-8 mb-10">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-purple-300 mb-2">Premium Channel</p>
                <h2 className="text-2xl font-black mb-1">Subscribers Only</h2>
                <p className="text-gray-300">Unlock live broadcasts, replays, and the private chat for {channel.creator}'s channel.</p>
              </div>
              <button
                onClick={() => { setSubscribed(true); toast(`Subscribed to ${channel.name}`, 'success'); }}
                className="px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 font-bold transition"
              >
                Subscribe &middot; $4.99/mo
              </button>
            </div>
          </div>
        )}

        {!hasAccess && channel.privacy === 'invite' && (
          <div className="rounded-2xl bg-red-900/30 border border-red-500/30 p-6 sm:p-8 mb-10">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-widest text-red-300 mb-2">Invite Only Channel</p>
              <h2 className="text-2xl font-black mb-1">Request an Invite</h2>
              <p className="text-gray-300">This channel is members-only. Tell {channel.creator} why you'd like to join.</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                toast('Invite requested — the host will review your request shortly', 'success');
                setInviteName('');
                setInviteReason('');
              }}
              className="grid sm:grid-cols-2 gap-3"
            >
              <input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
                placeholder="Your name or handle"
                className="px-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-red-500 outline-none"
              />
              <input
                value={inviteReason}
                onChange={(e) => setInviteReason(e.target.value)}
                required
                placeholder="Why you'd like to join"
                className="px-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-red-500 outline-none"
              />
              <button className="sm:col-span-2 px-6 py-3 rounded-full bg-red-600 hover:bg-red-500 font-bold transition">
                Request Invite
              </button>
            </form>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* MAIN COLUMN */}
          <div className="space-y-10">
            {/* Now Playing with audio player */}
            <section className="rounded-3xl bg-[#15151f] border border-white/5 overflow-hidden">
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
                <div className={`w-full sm:w-44 aspect-square rounded-2xl bg-gradient-to-br ${channel.gradient} relative overflow-hidden flex items-center justify-center`}>
                  <div className="absolute inset-0 bg-black/25" />
                  <span className="relative text-3xl font-black text-white/90 tracking-tighter">{channel.name.split(' ').map((w) => w[0]).join('').slice(0, 3)}</span>
                </div>
                <div className="flex-1 flex flex-col">
                  <p className="text-xs uppercase tracking-[0.3em] text-red-400 mb-2">Now Playing</p>
                  <h3 className="text-2xl font-black mb-1">Neon Cascade</h3>
                  <p className="text-gray-400 mb-4">by {channel.creator}</p>
                  <div className="mt-auto">
                    <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                      <div className="absolute inset-y-0 left-0 bg-red-500 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 tabular-nums mb-4">
                      <span>{Math.floor((progress / 100) * 218 / 60)}:{String(Math.floor((progress / 100) * 218) % 60).padStart(2, '0')}</span>
                      <span>3:38</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                      </button>
                      <button
                        onClick={() => setPlaying((p) => !p)}
                        className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 transition flex items-center justify-center"
                      >
                        {playing ? (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z" /></svg>
                        ) : (
                          <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        )}
                      </button>
                      <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6h2v12h-2zm-3.5 6L4 6v12z" /></svg>
                      </button>
                      <div className="flex items-center gap-2 ml-auto">
                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M3 10v4h4l5 5V5L7 10H3z" /></svg>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={volume}
                          onChange={(e) => setVolume(Number(e.target.value))}
                          className="accent-red-500 w-24"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Schedule */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Today's Schedule</h2>
              <div className="rounded-2xl bg-[#15151f] border border-white/5 overflow-hidden divide-y divide-white/5">
                {SCHEDULE_TODAY.map((s) => (
                  <div key={s.time} className="flex flex-col sm:flex-row sm:items-center gap-2 p-4">
                    <div className="sm:w-28 text-sm text-red-400 font-semibold">{s.time}</div>
                    <div className="flex-1">
                      <p className="font-semibold">{s.title}</p>
                      <p className="text-sm text-gray-400">{s.host}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Playlists */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Playlists by {channel.creator}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {PLAYLISTS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => toast(`Playing playlist: ${p.title}`, 'info')}
                    className="group rounded-2xl bg-[#15151f] border border-white/5 overflow-hidden text-left hover:border-white/20 transition"
                  >
                    <div className={`aspect-square bg-gradient-to-br ${p.gradient} relative`}>
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition" />
                      <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-red-600 opacity-0 group-hover:opacity-100 transition flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm truncate">{p.title}</p>
                      <p className="text-xs text-gray-400">{p.count} tracks</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Recent Broadcasts (VOD) */}
            <section>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-2xl font-bold">Recent Broadcasts</h2>
                <span className="text-xs text-gray-500">Replays for subscribers</span>
              </div>
              <div className="rounded-2xl bg-[#15151f] border border-white/5 overflow-hidden divide-y divide-white/5">
                {VOD.map((v) => (
                  <div key={v.id} className="flex items-center gap-4 p-4">
                    <button
                      onClick={() => {
                        if (!subscribed && !session) {
                          toast('Subscribers only — subscribe to watch replays', 'error');
                          return;
                        }
                        toast(`Playing replay: ${v.title}`, 'info');
                      }}
                      className="w-10 h-10 rounded-full bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition flex items-center justify-center flex-shrink-0"
                    >
                      <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{v.title}</p>
                      <p className="text-xs text-gray-400">{v.duration} &middot; {v.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Support the Channel */}
            <section className="rounded-3xl bg-gradient-to-r from-red-900/40 via-[#15151f] to-purple-900/30 border border-white/10 p-6 sm:p-8">
              <h2 className="text-2xl font-black mb-1">Support the Channel</h2>
              <p className="text-sm text-gray-400 mb-5">Help {channel.creator} keep the broadcast running.</p>
              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                {!subscribed && (
                  <button
                    onClick={() => { setSubscribed(true); toast(`You now support ${channel.creator}`, 'success'); }}
                    className="px-5 py-3 rounded-full bg-red-600 hover:bg-red-500 font-bold transition"
                  >
                    Subscribe &middot; $4.99/mo
                  </button>
                )}
                <button
                  onClick={() => toast('Tip Jar opened — send a tip to the host', 'info')}
                  className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 font-bold transition"
                >
                  Open Tip Jar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => toast('Shared to Twitter', 'success')} className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold">Share on Twitter</button>
                <button onClick={() => toast('Shared to Facebook', 'success')} className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold">Share on Facebook</button>
                <button onClick={copyLink} className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold">Copy Link</button>
              </div>
            </section>

            {/* About the Host */}
            <section>
              <h2 className="text-2xl font-bold mb-4">About the Host</h2>
              <div className="rounded-2xl bg-[#15151f] border border-white/5 p-6 flex flex-col sm:flex-row gap-5">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${channel.gradient} flex items-center justify-center text-2xl font-black flex-shrink-0`}>
                  {channel.creator.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{channel.creator}</h3>
                  <p className="text-xs text-gray-400 mb-2">@{channel.creatorHandle} &middot; {channel.totalFollowers.toLocaleString()} followers</p>
                  <p className="text-sm text-gray-300 mb-4">{channel.bio}</p>
                  <Link
                    href={`/artist/${channel.creatorHandle}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold transition"
                  >
                    View Creator Profile
                  </Link>
                </div>
              </div>
            </section>

            {/* Call-In Line */}
            <section className="rounded-2xl bg-[#15151f] border border-white/5 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1v3.5c0 .6-.4 1-1 1C10 21 3 14 3 5.5c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.4.6 3.5.1.3 0 .7-.2 1L6.6 10.8z" /></svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold">Call us live: opynx.com/call/{channel.callHandle}</p>
                  <p className="text-sm text-gray-400">{queueSize} listeners currently in the queue</p>
                </div>
                <button
                  onClick={() => toast(`Joining queue — you are position ${queueSize + 1}`, 'info')}
                  className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-sm font-semibold transition"
                >
                  Join Queue
                </button>
              </div>
            </section>
          </div>

          {/* SIDEBAR: Live Chat */}
          <aside className="rounded-2xl bg-[#15151f] border border-white/5 flex flex-col h-[640px] lg:sticky lg:top-6">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">Live Chat</p>
                <p className="text-xs text-gray-400">{channel.listeners.toLocaleString()} in the room</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chat.map((m) => (
                <div key={m.id} className="text-sm">
                  <span className={`font-semibold ${m.isHost ? 'text-red-400' : 'text-gray-300'}`}>{m.user}</span>
                  {m.isHost && <span className="ml-1 text-[10px] uppercase tracking-widest text-red-400">host</span>}
                  <span className="text-gray-500">: </span>
                  <span className="text-gray-200">{m.text}</span>
                </div>
              ))}
            </div>
            <form onSubmit={sendChat} className="p-3 border-t border-white/5 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Say something..."
                className="flex-1 px-3 py-2 rounded-full bg-black/30 border border-white/10 focus:border-red-500 outline-none text-sm"
              />
              <button className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-sm font-semibold transition">Send</button>
            </form>
          </aside>
        </div>
      </div>
    </div>
  );
}
