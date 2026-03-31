'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const ACTIVE_ROOMS = [
  {
    id: 'r1',
    name: 'Late Night Vibes',
    host: 'DJ_Aurora',
    hostInitial: 'D',
    track: 'Neon Highway',
    artist: 'ZVRA',
    listeners: 12,
    genre: 'Synthwave',
    visibility: 'public' as const,
  },
  {
    id: 'r2',
    name: 'Chill Lofi Study',
    host: 'LofiKing',
    hostInitial: 'L',
    track: 'Rainy Afternoons',
    artist: 'Mira Solis',
    listeners: 34,
    genre: 'Lo-Fi',
    visibility: 'public' as const,
  },
  {
    id: 'r3',
    name: 'Rock Classics',
    host: 'GuitarHero42',
    hostInitial: 'G',
    track: 'Thunder Road',
    artist: 'Electric Tide',
    listeners: 8,
    genre: 'Rock',
    visibility: 'friends' as const,
  },
  {
    id: 'r4',
    name: 'Hip Hop Heads',
    host: 'BeatDropper',
    hostInitial: 'B',
    track: 'Gold Chains',
    artist: 'K-Nova',
    listeners: 21,
    genre: 'Hip-Hop',
    visibility: 'public' as const,
  },
  {
    id: 'r5',
    name: 'Ambient Escape',
    host: 'Dreamweaver',
    hostInitial: 'D',
    track: 'Ocean Floor',
    artist: 'Aether',
    listeners: 6,
    genre: 'Ambient',
    visibility: 'private' as const,
  },
  {
    id: 'r6',
    name: 'Indie Discoveries',
    host: 'VinylHead',
    hostInitial: 'V',
    track: 'Paper Cranes',
    artist: 'The Drift',
    listeners: 15,
    genre: 'Indie',
    visibility: 'public' as const,
  },
];

const ROOM_QUEUE = [
  { title: 'Crystal Waves', artist: 'ZVRA' },
  { title: 'Phantom Signal', artist: 'KVLT' },
  { title: 'Solar Drift', artist: 'Aether' },
];

const ROOM_CHAT = [
  { user: 'NeonWave', initial: 'N', message: 'This track is fire!', time: '2m ago' },
  { user: 'SynthLover', initial: 'S', message: 'Can we get some KVLT next?', time: '3m ago' },
  { user: 'ChillVibes', initial: 'C', message: 'Perfect vibes right now', time: '5m ago' },
  { user: 'AudioPhile', initial: 'A', message: 'The bass on this one is insane', time: '7m ago' },
  { user: 'MusicFan99', initial: 'M', message: 'Just joined, what did I miss?', time: '8m ago' },
];

const ROOM_LISTENERS = [
  { name: 'NeonWave', initial: 'N' },
  { name: 'SynthLover', initial: 'S' },
  { name: 'ChillVibes', initial: 'C' },
  { name: 'AudioPhile', initial: 'A' },
  { name: 'MusicFan99', initial: 'M' },
  { name: 'BeatDropper', initial: 'B' },
  { name: 'RaveMaster', initial: 'R' },
  { name: 'GigGoer', initial: 'G' },
];

const YOUR_ROOMS = [
  { id: 'yr1', name: 'My Workout Mix', listeners: 3, lastActive: '2 hours ago' },
  { id: 'yr2', name: 'Friday Night Session', listeners: 0, lastActive: '3 days ago' },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ListeningRoomPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState<(typeof ACTIVE_ROOMS)[0] | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState(ROOM_CHAT);
  const [volume, setVolume] = useState(75);
  const [progress, setProgress] = useState(35);
  const [roomName, setRoomName] = useState('');
  const [roomVisibility, setRoomVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [maxListeners, setMaxListeners] = useState(50);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!activeRoom) return;
    const interval = setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 0.5));
    }, 200);
    return () => clearInterval(interval);
  }, [activeRoom]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="rounded-2xl bg-[#15151f] h-48 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl bg-[#15151f] h-48 animate-pulse" />
            ))}
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
          <p className="text-gray-400 mb-6">Sign in to join listening rooms and listen with friends.</p>
          <Link href="/auth/login" className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleSendChat = () => {
    if (!chatMessage.trim()) return;
    setChatMessages((prev) => [
      { user: 'You', initial: 'Y', message: chatMessage, time: 'just now' },
      ...prev,
    ]);
    setChatMessage('');
  };

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      toast('Please enter a room name.', 'error');
      return;
    }
    toast(`Room "${roomName}" created successfully!`, 'success');
    setShowCreateForm(false);
    setRoomName('');
  };

  /* ---- Inside a Room ---- */
  if (activeRoom) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setActiveRoom(null)}
            className="text-sm text-gray-400 hover:text-white transition mb-6 inline-block"
          >
            &larr; Back to Rooms
          </button>

          {/* Room Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black">{activeRoom.name}</h1>
              <p className="text-gray-400">
                Hosted by {activeRoom.host} &middot; {activeRoom.genre}
              </p>
            </div>
            <button
              onClick={() => {
                toast('You left the room.', 'info');
                setActiveRoom(null);
              }}
              className="px-5 py-2 rounded-xl bg-red-600/20 border border-red-600/50 text-red-400 hover:bg-red-600/30 transition font-semibold text-sm"
            >
              Leave Room
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Now Playing + Queue */}
            <div className="lg:col-span-2 space-y-6">
              {/* Now Playing */}
              <div className="rounded-2xl bg-[#15151f] border border-white/5 p-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Now Playing</h2>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-gradient-to-br from-red-600/30 to-purple-600/30 flex items-center justify-center text-4xl shrink-0">
                    &#9835;
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold truncate">{activeRoom.track}</h3>
                    <p className="text-gray-400 truncate">{activeRoom.artist}</p>
                    <div className="mt-4">
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-600 rounded-full transition-all duration-200"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{Math.floor((progress / 100) * 3)}:{String(Math.floor(((progress / 100) * 180) % 60)).padStart(2, '0')}</span>
                        <span>3:00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Host Controls */}
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/5">
                  <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">&#9198; Skip</button>
                  <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">&#43; Queue</button>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-gray-500">&#128264;</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-24 accent-red-600"
                    />
                    <span className="text-xs text-gray-400">{volume}%</span>
                  </div>
                </div>
              </div>

              {/* Listeners */}
              <div className="rounded-2xl bg-[#15151f] border border-white/5 p-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Listeners ({ROOM_LISTENERS.length})
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {ROOM_LISTENERS.map((l) => (
                    <div
                      key={l.name}
                      title={l.name}
                      className="w-10 h-10 rounded-full bg-red-600/20 border border-red-600/40 flex items-center justify-center text-sm font-bold text-red-400"
                    >
                      {l.initial}
                    </div>
                  ))}
                  <span className="text-xs text-gray-500 ml-2">+{activeRoom.listeners - ROOM_LISTENERS.length} more</span>
                </div>
              </div>

              {/* Queue */}
              <div className="rounded-2xl bg-[#15151f] border border-white/5 p-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Up Next</h2>
                <div className="space-y-3">
                  {ROOM_QUEUE.map((q, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                      <span className="text-gray-500 text-sm w-6 text-center">{i + 1}</span>
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600/20 to-purple-600/20 flex items-center justify-center text-sm">
                        &#9835;
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{q.title}</p>
                        <p className="text-xs text-gray-400 truncate">{q.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat Sidebar */}
            <div className="rounded-2xl bg-[#15151f] border border-white/5 p-6 flex flex-col h-[600px]">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Room Chat</h2>
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {chatMessages.map((msg, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-red-600/20 flex items-center justify-center text-xs font-bold text-red-400 shrink-0 mt-0.5">
                      {msg.initial}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold">{msg.user}</span>
                        <span className="text-[10px] text-gray-600">{msg.time}</span>
                      </div>
                      <p className="text-sm text-gray-300">{msg.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Say something..."
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-600/50"
                />
                <button
                  onClick={handleSendChat}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Room Lobby ---- */
  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          &larr; Back to Home
        </Link>

        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-red-600/20 to-purple-600/20 border border-red-600/30 p-8 mb-8">
          <h1 className="text-3xl font-black mb-2">&#127911; Listening Rooms</h1>
          <p className="text-gray-400 mb-6">Listen together, anywhere</p>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition"
          >
            Create Room
          </button>
        </div>

        {/* Create Room Form */}
        {showCreateForm && (
          <div className="rounded-2xl bg-[#15151f] border border-white/5 p-6 mb-8">
            <h2 className="text-lg font-bold mb-4">Create a New Room</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Friday Night Vibes"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-600/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Visibility</label>
                <select
                  value={roomVisibility}
                  onChange={(e) => setRoomVisibility(e.target.value as 'public' | 'friends' | 'private')}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-600/50"
                >
                  <option value="public">Public</option>
                  <option value="friends">Friends Only</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Max Listeners</label>
                <input
                  type="number"
                  value={maxListeners}
                  onChange={(e) => setMaxListeners(Number(e.target.value))}
                  min={2}
                  max={500}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-600/50"
                />
              </div>
            </div>
            <button onClick={handleCreateRoom} className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition">
              Create Room
            </button>
          </div>
        )}

        {/* Active Rooms */}
        <h2 className="text-xl font-bold mb-4">Active Rooms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {ACTIVE_ROOMS.map((room) => (
            <div key={room.id} className="rounded-2xl bg-[#15151f] border border-white/5 p-5 hover:border-red-600/30 transition group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 font-medium">{room.genre}</span>
                <span className="text-xs text-gray-500 capitalize">{room.visibility === 'friends' ? 'Friends Only' : room.visibility}</span>
              </div>
              <h3 className="font-bold text-lg mb-1">{room.name}</h3>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-red-600/20 flex items-center justify-center text-[10px] font-bold text-red-400">
                  {room.hostInitial}
                </div>
                <span className="text-sm text-gray-400">{room.host}</span>
              </div>
              <div className="text-sm mb-1 truncate">
                <span className="text-white font-medium">{room.track}</span>
                <span className="text-gray-500"> &mdash; {room.artist}</span>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  &#127911;
                  <span className="relative flex items-center gap-1">
                    <span className="absolute -left-1 w-2 h-2 rounded-full bg-red-500 animate-ping opacity-50" />
                    <span className="relative">{room.listeners} listening</span>
                  </span>
                </span>
                <button
                  onClick={() => {
                    setActiveRoom(room);
                    toast(`Joined "${room.name}"!`, 'success');
                  }}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition"
                >
                  Join
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Your Rooms */}
        <h2 className="text-xl font-bold mb-4">Your Rooms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {YOUR_ROOMS.map((room) => (
            <div key={room.id} className="rounded-2xl bg-[#15151f] border border-white/5 p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold">{room.name}</h3>
                <p className="text-sm text-gray-500">
                  {room.listeners > 0 ? `${room.listeners} listening now` : `Last active ${room.lastActive}`}
                </p>
              </div>
              <button
                onClick={() => toast('Rejoining room...', 'info')}
                className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-semibold transition"
              >
                Open
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
