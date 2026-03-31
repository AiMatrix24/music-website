'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

interface SetlistTrack {
  title: string;
  artist: string;
  status: 'played' | 'current' | 'upcoming';
}

const ACTIVE_EVENTS = [
  {
    id: 'e1',
    title: 'ZVRA — Neon Highway Tour',
    venue: 'Echo Lounge',
    address: '412 Sunset Blvd, Los Angeles, CA 90028',
    capacity: '2,500',
    startTime: 'Now',
    attendees: 1847,
  },
  {
    id: 'e2',
    title: 'The Drift — Concrete Waves Release',
    venue: 'The Basement',
    address: '88 Division St, New York, NY 10002',
    capacity: '800',
    startTime: 'Now',
    attendees: 612,
  },
];

const SETLIST: SetlistTrack[] = [
  { title: 'Crystal Waves', artist: 'ZVRA', status: 'played' },
  { title: 'Phantom Signal', artist: 'ZVRA', status: 'played' },
  { title: 'Static Dreams', artist: 'ZVRA', status: 'played' },
  { title: 'Neon Highway', artist: 'ZVRA', status: 'current' },
  { title: 'Solar Drift', artist: 'ZVRA', status: 'upcoming' },
  { title: 'Deep Currents', artist: 'ZVRA', status: 'upcoming' },
  { title: 'Ocean Protocol', artist: 'ZVRA', status: 'upcoming' },
];

const LIVE_LYRICS = [
  'Under the neon skyline, we fade away',
  'Lost in the frequency, nothing to say',
  'Signals dissolve in the static night',
  'We were the echoes, burning bright',
  'The city hums a broken tune',
  'Dancing shadows under a fractured moon',
  'Hold my breath, the bass drops low',
  'In the silence, we let go',
];

const SOCIAL_FEED = [
  { user: 'NeonWave', initial: 'N', message: 'The energy in here is unreal!', time: '30s ago' },
  { user: 'GigGoer', initial: 'G', message: 'Neon Highway live hits different', time: '1m ago' },
  { user: 'SynthLover', initial: 'S', message: 'Front row vibes! Can feel the bass in my chest', time: '2m ago' },
  { user: 'AudioPhile', initial: 'A', message: 'The light show during Phantom Signal was insane', time: '3m ago' },
  { user: 'VinylHead', initial: 'V', message: 'Best concert of 2026 so far', time: '4m ago' },
  { user: 'ChillVibes', initial: 'C', message: 'Anyone else by the merch booth?', time: '5m ago' },
  { user: 'BeatDropper', initial: 'B', message: 'Crystal Waves opener was the perfect choice', time: '7m ago' },
  { user: 'MusicFan99', initial: 'M', message: 'Checking in from section B!', time: '10m ago' },
];

const MERCH_ITEMS = [
  { name: 'Neon Highway Tour Tee', price: '$35', image: '&#128085;' },
  { name: 'ZVRA Holographic Poster', price: '$25', image: '&#127912;' },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ConcertCompanionPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState<(typeof ACTIVE_EVENTS)[0] | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [currentLyricLine, setCurrentLyricLine] = useState(0);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showMerch, setShowMerch] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(SOCIAL_FEED);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  // Auto-advance lyrics
  useEffect(() => {
    if (!activeEvent) return;
    const interval = setInterval(() => {
      setCurrentLyricLine((prev) => (prev + 1) % LIVE_LYRICS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeEvent]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="rounded-2xl bg-[#15151f] h-48 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl bg-[#15151f] h-40 animate-pulse" />
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
          <p className="text-gray-400 mb-6">Sign in to use the Concert Companion during live events.</p>
          <Link href="/auth/login" className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handlePostComment = () => {
    if (!comment.trim()) return;
    setComments((prev) => [
      { user: 'You', initial: 'Y', message: comment, time: 'just now' },
      ...prev,
    ]);
    setComment('');
  };

  /* ---- Companion View ---- */
  if (activeEvent) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => setActiveEvent(null)} className="text-sm text-gray-400 hover:text-white transition mb-6 inline-block">
            &larr; Back to Events
          </button>

          {/* Event Header */}
          <div className="rounded-2xl bg-gradient-to-br from-red-600/20 to-purple-600/20 border border-red-600/30 p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-black">{activeEvent.title}</h1>
                  <span className="relative flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-xs font-bold">
                    <span className="absolute -left-0.5 w-2 h-2 rounded-full bg-white animate-ping opacity-60" />
                    <span className="relative ml-1.5">LIVE</span>
                  </span>
                </div>
                <p className="text-gray-400">{activeEvent.venue} &middot; {activeEvent.attendees.toLocaleString()} fans here</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCheckedIn(!checkedIn);
                    toast(checkedIn ? 'Check-in removed' : "You're checked in!", checkedIn ? 'info' : 'success');
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    checkedIn
                      ? 'bg-green-600/20 border border-green-500/50 text-green-400'
                      : 'bg-white/5 border border-white/10 hover:border-red-600/50'
                  }`}
                >
                  {checkedIn ? "&#10003; I'm Here!" : "I'm Here!"}
                </button>
                <button
                  onClick={() => toast('Sharing current moment!', 'success')}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-red-600/50 text-sm font-semibold transition"
                >
                  Share Moment
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Setlist + Lyrics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Live Setlist */}
              <div className="rounded-2xl bg-[#15151f] border border-white/5 p-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Live Setlist</h2>
                <div className="space-y-2">
                  {SETLIST.map((track, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                        track.status === 'current'
                          ? 'bg-red-600/10 border border-red-600/30'
                          : track.status === 'played'
                          ? 'opacity-60'
                          : 'opacity-40'
                      }`}
                    >
                      <span className="w-6 text-center">
                        {track.status === 'played' && <span className="text-green-400">&#10003;</span>}
                        {track.status === 'current' && (
                          <span className="relative flex items-center justify-center">
                            <span className="absolute w-3 h-3 rounded-full bg-red-500 animate-ping opacity-50" />
                            <span className="relative w-2 h-2 rounded-full bg-red-500" />
                          </span>
                        )}
                        {track.status === 'upcoming' && <span className="text-gray-600">{i + 1}</span>}
                      </span>
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm truncate ${track.status === 'current' ? 'text-red-400' : ''}`}>
                          {track.title}
                        </p>
                        <p className="text-xs text-gray-500">{track.artist}</p>
                      </div>
                      {track.status === 'current' && (
                        <span className="ml-auto text-xs text-red-400 font-medium">Now Playing</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Lyrics */}
              <div className="rounded-2xl bg-[#15151f] border border-white/5 p-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Live Lyrics</h2>
                <div className="space-y-3 py-4">
                  {LIVE_LYRICS.map((line, i) => (
                    <p
                      key={i}
                      className={`text-lg transition-all duration-500 ${
                        i === currentLyricLine
                          ? 'text-white font-bold text-xl scale-105 origin-left'
                          : i < currentLyricLine
                          ? 'text-gray-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>

              {/* Rate This Show */}
              <div className="rounded-2xl bg-[#15151f] border border-white/5 p-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Rate This Show</h2>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => {
                        setRating(star);
                        toast(`Rated ${star} star${star > 1 ? 's' : ''}!`, 'success');
                      }}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className={`text-3xl transition ${
                        star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-600'
                      }`}
                    >
                      &#9733;
                    </button>
                  ))}
                  {rating > 0 && <span className="text-sm text-gray-400 ml-2">{rating}/5</span>}
                </div>
              </div>

              {/* Venue Info */}
              <div className="rounded-2xl bg-[#15151f] border border-white/5 p-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Venue Info</h2>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Venue:</span> <span className="font-medium">{activeEvent.venue}</span></p>
                  <p><span className="text-gray-500">Address:</span> <span className="font-medium">{activeEvent.address}</span></p>
                  <p><span className="text-gray-500">Capacity:</span> <span className="font-medium">{activeEvent.capacity}</span></p>
                </div>
              </div>
            </div>

            {/* Right Column: Social + Merch */}
            <div className="space-y-6">
              {/* Social Feed */}
              <div className="rounded-2xl bg-[#15151f] border border-white/5 p-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Live Feed</h2>
                <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                  {comments.map((msg, i) => (
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
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                    placeholder="Post a comment..."
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-600/50"
                  />
                  <button onClick={handlePostComment} className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition">
                    Post
                  </button>
                </div>
              </div>

              {/* Merch Popup */}
              <div className="rounded-2xl bg-[#15151f] border border-white/5 p-6">
                <button
                  onClick={() => setShowMerch(!showMerch)}
                  className="flex items-center justify-between w-full"
                >
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    &#128085; Available at This Venue
                  </h2>
                  <span className="text-gray-500 text-sm">{showMerch ? '&#9650;' : '&#9660;'}</span>
                </button>
                {showMerch && (
                  <div className="mt-4 space-y-3">
                    {MERCH_ITEMS.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-600/20 to-purple-600/20 flex items-center justify-center text-xl" dangerouslySetInnerHTML={{ __html: item.image }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{item.name}</p>
                          <p className="text-xs text-red-400">{item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Events List ---- */
  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          &larr; Back to Home
        </Link>

        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-red-600/20 to-purple-600/20 border border-red-600/30 p-8 mb-8">
          <h1 className="text-3xl font-black mb-2">&#127926; Concert Companion</h1>
          <p className="text-gray-400">Your live event assistant &mdash; setlists, lyrics, and more</p>
        </div>

        {/* Active Events */}
        <h2 className="text-xl font-bold mb-4">Active Events</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {ACTIVE_EVENTS.map((event) => (
            <div key={event.id} className="rounded-2xl bg-[#15151f] border border-white/5 p-6 hover:border-red-600/30 transition">
              <div className="flex items-center gap-2 mb-3">
                <span className="relative flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-xs font-bold">
                  <span className="absolute -left-0.5 w-2 h-2 rounded-full bg-white animate-ping opacity-60" />
                  <span className="relative ml-1.5">LIVE</span>
                </span>
                <span className="text-xs text-gray-500">{event.attendees.toLocaleString()} fans</span>
              </div>
              <h3 className="font-bold text-lg mb-1">{event.title}</h3>
              <p className="text-sm text-gray-400 mb-4">{event.venue}</p>
              <button
                onClick={() => {
                  setActiveEvent(event);
                  toast(`Joined ${event.title}`, 'success');
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition"
              >
                Join
              </button>
            </div>
          ))}
        </div>

        {/* Upcoming Events */}
        <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
        <div className="rounded-2xl bg-[#15151f] border border-white/5 p-6 text-center">
          <p className="text-gray-400 mb-4">Check out upcoming concerts and festivals near you.</p>
          <Link href="/tickets" className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition inline-block">
            Browse Upcoming Events
          </Link>
        </div>
      </div>
    </div>
  );
}
