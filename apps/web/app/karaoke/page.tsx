'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';

/* ------------------------------------------------------------------ */
/*  Mock data                                                         */
/* ------------------------------------------------------------------ */

const POPULAR_TRACKS = [
  { id: 'k1', title: 'Neon Skyline', artist: 'ZVRA', bpm: 128 },
  { id: 'k2', title: 'Ocean Protocol', artist: 'Mira Solis', bpm: 110 },
  { id: 'k3', title: 'Concrete Waves', artist: 'The Drift', bpm: 95 },
  { id: 'k4', title: 'Phantom Signal', artist: 'KVLT', bpm: 140 },
  { id: 'k5', title: 'Solar Drift', artist: 'Aether', bpm: 100 },
  { id: 'k6', title: 'Deep Currents', artist: 'Undertow', bpm: 120 },
];

const MOCK_LYRICS = [
  'Under the neon skyline, we fade away',
  'Lost in the frequency, nothing to say',
  'Signals dissolve in the static night',
  'We were the echoes, burning bright',
  'The city hums a broken tune',
  'Dancing shadows under a fractured moon',
  'Hold my breath, the bass drops low',
  'In the silence, we let go',
];

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function KaraokePage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<(typeof POPULAR_TRACKS)[0] | null>(null);

  // Karaoke state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const [vocalGuide, setVocalGuide] = useState(false);
  const [keyAdjust, setKeyAdjust] = useState(0);
  const [score] = useState(78);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  // Auto-advance lyrics when playing
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentLine((prev) => {
          if (prev >= MOCK_LYRICS.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  const filteredTracks = POPULAR_TRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectTrack = (track: (typeof POPULAR_TRACKS)[0]) => {
    setSelectedTrack(track);
    setCurrentLine(0);
    setIsPlaying(false);
  };

  const handleRestart = () => {
    setCurrentLine(0);
    setIsPlaying(false);
  };

  const starRating = Math.round(score / 20);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading karaoke...</div>
      </div>
    );
  }

  // Auth gate
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-lg mx-auto text-center">
          <Link href="/explore" className="text-gray-400 hover:text-white text-sm transition mb-6 inline-block">
            &larr; Back to Explore
          </Link>
          <div className="rounded-2xl bg-[#15151f] p-10 border border-white/5">
            <p className="text-4xl mb-4">&#127908;</p>
            <h1 className="text-3xl font-black mb-3">Karaoke Mode</h1>
            <p className="text-gray-400 mb-6">Sign in to access karaoke mode and start singing along.</p>
            <Link href="/auth/login" className="inline-block px-8 py-3 rounded-lg bg-red-600 hover:bg-red-700 font-bold transition">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back nav */}
        <Link href="/explore" className="text-gray-400 hover:text-white text-sm transition mb-6 inline-block">
          &larr; Back to Explore
        </Link>

        {/* Hero */}
        {!selectedTrack && (
          <section className="text-center mb-12">
            <p className="text-5xl mb-3">&#127908;</p>
            <h1 className="text-4xl sm:text-5xl font-black mb-3">
              <span className="bg-gradient-to-r from-red-500 to-pink-400 bg-clip-text text-transparent">
                Karaoke Mode
              </span>
            </h1>
            <p className="text-gray-400">Pick a track and sing your heart out.</p>
          </section>
        )}

        {/* Track selection (shown when no track selected) */}
        {!selectedTrack && (
          <>
            {/* Search */}
            <div className="mb-8">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for a track..."
                className="w-full bg-[#15151f] border border-white/10 rounded-xl px-5 py-3 text-sm text-white placeholder-gray-600 focus:border-red-600 focus:outline-none transition"
              />
            </div>

            {/* Popular for Karaoke */}
            <h2 className="text-xl font-bold mb-5">Popular for Karaoke</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {filteredTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => handleSelectTrack(track)}
                  className="rounded-2xl bg-[#15151f] p-5 border border-white/5 text-left hover:border-red-600/30 transition group"
                >
                  <div className="w-full h-24 rounded-xl bg-gradient-to-br from-red-700/60 to-pink-700/40 flex items-center justify-center mb-3 group-hover:from-red-600 group-hover:to-pink-600 transition-all">
                    <span className="text-3xl opacity-50 group-hover:opacity-100 transition">&#127908;</span>
                  </div>
                  <h3 className="font-bold">{track.title}</h3>
                  <p className="text-sm text-gray-400">{track.artist}</p>
                  <p className="text-xs text-gray-600 mt-1">{track.bpm} BPM</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Active karaoke view */}
        {selectedTrack && (
          <div className="space-y-6">
            {/* Track info bar */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedTrack.title}</h2>
                <p className="text-sm text-gray-400">{selectedTrack.artist}</p>
              </div>
              <button
                onClick={() => { setSelectedTrack(null); setIsPlaying(false); setCurrentLine(0); }}
                className="text-sm text-gray-400 hover:text-white transition"
              >
                Change Track
              </button>
            </div>

            {/* Lyrics display */}
            <div className="rounded-2xl bg-gradient-to-b from-[#15151f] to-[#0d0d14] p-6 sm:p-10 border border-white/5 min-h-[320px] flex flex-col items-center justify-center relative overflow-hidden">
              {/* Subtle animated particles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-1 h-1 bg-red-500/20 rounded-full top-[20%] left-[15%] animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute w-1 h-1 bg-red-500/20 rounded-full top-[60%] left-[75%] animate-ping" style={{ animationDuration: '4s' }} />
                <div className="absolute w-1 h-1 bg-red-500/20 rounded-full top-[40%] left-[45%] animate-ping" style={{ animationDuration: '5s' }} />
                <div className="absolute w-0.5 h-0.5 bg-pink-500/15 rounded-full top-[80%] left-[25%] animate-ping" style={{ animationDuration: '3.5s' }} />
                <div className="absolute w-0.5 h-0.5 bg-pink-500/15 rounded-full top-[10%] left-[85%] animate-ping" style={{ animationDuration: '4.5s' }} />
              </div>

              <div className="relative z-10 space-y-3 text-center w-full max-w-lg">
                {MOCK_LYRICS.map((line, i) => (
                  <p
                    key={i}
                    className={`transition-all duration-500 text-lg sm:text-xl font-bold leading-relaxed ${
                      i === currentLine
                        ? 'text-red-400 scale-105'
                        : i < currentLine
                        ? 'text-gray-600 text-base'
                        : 'text-white/80 text-base'
                    }`}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="rounded-2xl bg-[#15151f] p-5 border border-white/5">
              <div className="flex items-center justify-center gap-4 mb-5">
                <button
                  onClick={() => setCurrentLine((prev) => Math.max(0, prev - 1))}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition text-sm"
                  title="Previous Line"
                >
                  &#9664;&#9664;
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition text-xl font-bold"
                >
                  {isPlaying ? '&#10074;&#10074;' : '&#9654;'}
                </button>
                <button
                  onClick={() => setCurrentLine((prev) => Math.min(MOCK_LYRICS.length - 1, prev + 1))}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition text-sm"
                  title="Next Line"
                >
                  &#9654;&#9654;
                </button>
                <button
                  onClick={handleRestart}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition text-sm"
                  title="Restart"
                >
                  &#8634;
                </button>
              </div>

              {/* Toggles and slider row */}
              <div className="grid sm:grid-cols-3 gap-4">
                {/* Auto-scroll */}
                <div className="flex items-center justify-between bg-brand-950/50 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-300">Auto-scroll</span>
                  <button
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={`w-10 h-5 rounded-full transition relative ${autoScroll ? 'bg-red-600' : 'bg-white/10'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${autoScroll ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Vocal Guide */}
                <div className="flex items-center justify-between bg-brand-950/50 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-300">Vocal Guide</span>
                  <button
                    onClick={() => setVocalGuide(!vocalGuide)}
                    className={`w-10 h-5 rounded-full transition relative ${vocalGuide ? 'bg-red-600' : 'bg-white/10'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${vocalGuide ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Key adjust */}
                <div className="bg-brand-950/50 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">Key</span>
                    <span className="text-sm font-bold text-red-400">
                      {keyAdjust > 0 ? `+${keyAdjust}` : keyAdjust}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-3}
                    max={3}
                    value={keyAdjust}
                    onChange={(e) => setKeyAdjust(Number(e.target.value))}
                    className="w-full accent-red-600"
                  />
                </div>
              </div>
            </div>

            {/* Score */}
            <div className="rounded-2xl bg-[#15151f] p-6 border border-white/5 text-center">
              <p className="text-sm text-gray-500 mb-1">Your Score</p>
              <p className="text-5xl font-black text-red-400 mb-2">{score}/100</p>
              <div className="flex justify-center gap-1 mb-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={`text-xl ${i < starRating ? 'text-yellow-400' : 'text-gray-700'}`}>
                    &#9733;
                  </span>
                ))}
              </div>
              <button
                onClick={() => toast('Performance shared!')}
                className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-bold transition"
              >
                Share Performance
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
