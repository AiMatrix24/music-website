'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

type PlaylistStatus = 'approved' | 'pending' | 'private';

type Playlist = {
  id: string;
  name: string;
  tracks: number;
  duration: string;
  plays: number;
  status: PlaylistStatus;
};

type Privacy = 'public' | 'subscribers' | 'invite';

const GENRES = [
  'Synthwave',
  'Hip Hop',
  'R&B',
  'Electronic',
  'Lo-Fi',
  'House',
  'Techno',
  'Indie',
  'Rock',
  'Jazz',
  'Soul',
  'Ambient',
];

const TIME_SLOTS = ['6am', '9am', '12pm', '3pm', '6pm', '9pm', '12am', '3am'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MOCK_PLAYLISTS: Playlist[] = [
  { id: '1', name: 'Morning Coffee Mix', tracks: 24, duration: '1h 42m', plays: 12847, status: 'approved' },
  { id: '2', name: 'Late Night Cruise', tracks: 31, duration: '2h 18m', plays: 9204, status: 'approved' },
  { id: '3', name: 'Workout Energy', tracks: 18, duration: '1h 12m', plays: 6530, status: 'pending' },
  { id: '4', name: 'Focus Mode', tracks: 42, duration: '3h 05m', plays: 21409, status: 'approved' },
  { id: '5', name: 'Party Starter', tracks: 28, duration: '1h 58m', plays: 4821, status: 'pending' },
  { id: '6', name: 'Chill Vibes', tracks: 35, duration: '2h 34m', plays: 15302, status: 'private' },
];

const STATUS_STYLES: Record<PlaylistStatus, { label: string; className: string }> = {
  approved: { label: 'Network Approved', className: 'bg-green-600/20 text-green-400 border border-green-600/40' },
  pending: { label: 'Pending Review', className: 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/40' },
  private: { label: 'Private', className: 'bg-gray-600/20 text-gray-400 border border-gray-600/40' },
};

export default function RadioChannelPage() {
  const { status } = useSession();
  const { toast } = useToast();

  const [channelName, setChannelName] = useState('Cipher Radio');
  const [tagline, setTagline] = useState('24/7 Electronic Vibes');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Synthwave', 'Electronic']);
  const [privacy, setPrivacy] = useState<Privacy>('public');
  const [pushToNetwork, setPushToNetwork] = useState(true);
  const [autoDj, setAutoDj] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [schedule, setSchedule] = useState<Record<string, string>>({});

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-brand-950">
        <p className="text-gray-400">Sign in to manage your radio channel</p>
        <Link href="/auth/login" className="text-red-400 hover:text-red-300 transition">
          Sign In →
        </Link>
      </div>
    );
  }

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const toggleSlot = (day: string, slot: string) => {
    const key = `${day}-${slot}`;
    setSchedule((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = 'Scheduled Show';
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen py-12 px-6 bg-brand-950 text-white">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-white transition mb-6 inline-block"
        >
          ← Back to Dashboard
        </Link>

        {/* Hero */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">📻</span>
            <h1 className="text-4xl md:text-5xl font-bold">Your Radio Channel</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Curate your own station on the OPYNX Radio Network
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Channel Status */}
            <section className="bg-[#15151f] rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold">Channel Status</h2>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    isLive
                      ? 'bg-red-600/20 text-red-400 border border-red-600/40'
                      : 'bg-gray-600/20 text-gray-400 border border-gray-600/40'
                  }`}
                >
                  {isLive ? '● LIVE' : '○ OFFLINE'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5">
                {/* Cover image upload */}
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                    Cover Image
                  </label>
                  <button
                    onClick={() => toast('Image picker coming soon', 'info')}
                    className="w-full aspect-square rounded-lg border-2 border-dashed border-white/10 bg-brand-950 hover:border-red-600/50 transition flex flex-col items-center justify-center gap-2 text-gray-500"
                  >
                    <span className="text-3xl">📷</span>
                    <span className="text-xs">Upload cover</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                      Channel Name
                    </label>
                    <input
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      className="w-full bg-brand-950 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-red-600 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                      Tagline
                    </label>
                    <input
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="24/7 Electronic Vibes"
                      className="w-full bg-brand-950 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-red-600 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                      Genre Focus
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {GENRES.map((g) => (
                        <button
                          key={g}
                          onClick={() => toggleGenre(g)}
                          className={`text-xs px-3 py-1.5 rounded-full transition ${
                            selectedGenres.includes(g)
                              ? 'bg-red-600 text-white'
                              : 'bg-brand-950 text-gray-400 border border-white/10 hover:border-red-600/50'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsLive(!isLive);
                      toast(isLive ? 'Channel is now in Live Edit mode' : 'Channel launched!', 'success');
                    }}
                    className={`w-full py-3 rounded-lg font-semibold transition ${
                      isLive
                        ? 'bg-[#15151f] border border-red-600 text-red-400 hover:bg-red-600/10'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {isLive ? '✎ Live Edit' : '▶ Launch Channel'}
                  </button>
                </div>
              </div>
            </section>

            {/* Privacy Settings */}
            <section className="bg-[#15151f] rounded-xl p-6 border border-white/5">
              <h2 className="text-xl font-semibold mb-5">Privacy Settings</h2>

              <div className="space-y-3">
                {([
                  { v: 'public', label: 'Public', desc: 'Anyone can tune in' },
                  { v: 'subscribers', label: 'Subscribers Only', desc: 'Only your $8.73 subscribers can access' },
                  { v: 'invite', label: 'Invite Only', desc: 'Private broadcast for select fans' },
                ] as const).map((opt) => (
                  <label
                    key={opt.v}
                    className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition ${
                      privacy === opt.v
                        ? 'bg-red-600/10 border border-red-600/40'
                        : 'bg-brand-950 border border-white/10 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="privacy"
                      checked={privacy === opt.v}
                      onChange={() => setPrivacy(opt.v)}
                      className="mt-1 accent-red-600"
                    />
                    <div>
                      <div className="font-semibold">{opt.label}</div>
                      <div className="text-sm text-gray-400">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-white/5 flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">Push to Network?</div>
                  <div className="text-sm text-gray-400">
                    Include this channel in OPYNX Radio Network rotation (earn ad revenue)
                  </div>
                </div>
                <button
                  onClick={() => setPushToNetwork(!pushToNetwork)}
                  className={`relative w-12 h-6 rounded-full transition flex-shrink-0 ${
                    pushToNetwork ? 'bg-red-600' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition ${
                      pushToNetwork ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>
            </section>

            {/* Programming Schedule */}
            <section className="bg-[#15151f] rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-semibold">Programming Schedule</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Click a slot to schedule · drag to rearrange
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">Auto-DJ</span>
                  <button
                    onClick={() => setAutoDj(!autoDj)}
                    className={`relative w-10 h-5 rounded-full transition ${
                      autoDj ? 'bg-red-600' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition ${
                        autoDj ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </label>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-1">
                    <div />
                    {DAYS.map((d) => (
                      <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">
                        {d}
                      </div>
                    ))}
                  </div>

                  {TIME_SLOTS.map((slot) => (
                    <div key={slot} className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-1">
                      <div className="text-xs text-gray-500 flex items-center">{slot}</div>
                      {DAYS.map((d) => {
                        const key = `${d}-${slot}`;
                        const scheduled = schedule[key];
                        return (
                          <button
                            key={key}
                            draggable
                            onClick={() => toggleSlot(d, slot)}
                            className={`h-10 rounded text-[10px] font-medium transition ${
                              scheduled
                                ? 'bg-red-600/30 border border-red-600/50 text-red-200'
                                : autoDj
                                ? 'bg-brand-950 border border-white/5 text-gray-600 hover:border-red-600/30'
                                : 'bg-brand-950 border border-white/5 text-gray-600 hover:border-white/20'
                            }`}
                          >
                            {scheduled ? 'Show' : autoDj ? 'Auto' : '+'}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Playlists on Network */}
            <section className="bg-[#15151f] rounded-xl p-6 border border-white/5">
              <h2 className="text-xl font-semibold mb-5">Your Playlists on the Network</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MOCK_PLAYLISTS.map((p) => {
                  const s = STATUS_STYLES[p.status];
                  return (
                    <div
                      key={p.id}
                      className="bg-brand-950 border border-white/10 rounded-lg p-4 hover:border-red-600/30 transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold">{p.name}</div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.className}`}>
                          {s.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mb-3">
                        {p.tracks} tracks · {p.duration} · {p.plays.toLocaleString()} plays
                      </div>
                      <button
                        onClick={() => toast(`Submitted "${p.name}" to the network`, 'success')}
                        disabled={p.status === 'approved'}
                        className="w-full text-xs py-2 rounded-md bg-red-600/10 text-red-400 border border-red-600/30 hover:bg-red-600/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {p.status === 'approved' ? 'On the Network' : 'Submit to Network'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Channel Stats */}
            <section className="bg-[#15151f] rounded-xl p-6 border border-white/5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-4">
                Channel Stats
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Total Listeners</div>
                  <div className="text-2xl font-bold">48,302</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Unique Listeners</div>
                  <div className="text-2xl font-bold">12,847</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Hours Aired</div>
                  <div className="text-2xl font-bold">342.5</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Avg Listen Time</div>
                  <div className="text-2xl font-bold">
                    28m <span className="text-sm text-gray-400">per session</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Subscribers Gained</div>
                  <div className="text-2xl font-bold text-green-400">+247</div>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="bg-[#15151f] rounded-xl p-6 border border-white/5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-2">
                <Link
                  href="/dashboard/radio/studio"
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
                >
                  <span>🔴 Go Live Now</span>
                  <span>→</span>
                </Link>
                <Link
                  href="/dashboard/radio/ads"
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-brand-950 border border-white/10 hover:border-red-600/40 transition"
                >
                  <span>💰 Manage Ads</span>
                  <span className="text-gray-500">→</span>
                </Link>
                <Link
                  href="/dashboard/radio/callers"
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-brand-950 border border-white/10 hover:border-red-600/40 transition"
                >
                  <span>📞 Call Queue</span>
                  <span className="text-gray-500">→</span>
                </Link>
                <button
                  onClick={() => toast('Channel Analytics coming soon', 'info')}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-brand-950 border border-white/10 hover:border-red-600/40 transition text-left"
                >
                  <span>📊 Channel Analytics</span>
                  <span className="text-gray-500">→</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
