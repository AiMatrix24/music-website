'use client';

import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from 'react';

interface Track {
  id: string;
  title: string;
  creator: string;
  genre: string;
  duration: number;
}

interface PlayerState {
  track: Track | null;
  isPlaying: boolean;
  progress: number;
  play: (track: Track) => void;
  toggle: () => void;
  close: () => void;
}

const PlayerContext = createContext<PlayerState>({
  track: null,
  isPlaying: false,
  progress: 0,
  play: () => {},
  toggle: () => {},
  close: () => {},
});

export const usePlayer = () => useContext(PlayerContext);

// TODO: Enforce audio quality by subscription tier
// Free → 128kbps only (serve audioUrl128)
// Premium/Bundle → 320kbps (serve audioUrl320)
// Creator (own tracks) → FLAC (serve audioUrlFlac)
// Currently all tiers get the same quality — enforcement requires
// signed streaming URLs from a quality-aware API endpoint

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [track, setTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Play count tracking: increment after 30s of continuous play
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedSecondsRef = useRef(0);
  const countedTracksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Clear any existing timer
    if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }

    if (isPlaying && track && !countedTracksRef.current.has(track.id)) {
      playTimerRef.current = setInterval(() => {
        elapsedSecondsRef.current += 1;
        if (elapsedSecondsRef.current >= 30 && track && !countedTracksRef.current.has(track.id)) {
          countedTracksRef.current.add(track.id);
          // Fire and forget — don't block the UI
          fetch('/api/tracks/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trackId: track.id }),
          }).catch(() => {
            // Silently ignore errors to avoid disrupting playback
          });
          if (playTimerRef.current) {
            clearInterval(playTimerRef.current);
            playTimerRef.current = null;
          }
        }
      }, 1000);
    }

    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [isPlaying, track]);

  const play = (t: Track) => {
    setTrack(t);
    setIsPlaying(true);
    setProgress(0);
    elapsedSecondsRef.current = 0; // Reset elapsed time for new track
  };

  const toggle = () => setIsPlaying((p) => !p);
  const close = () => {
    setTrack(null);
    setIsPlaying(false);
    setProgress(0);
    elapsedSecondsRef.current = 0;
  };

  return (
    <PlayerContext.Provider value={{ track, isPlaying, progress, play, toggle, close }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function MusicPlayerBar() {
  const { track, isPlaying, progress, toggle, close } = usePlayer();

  if (!track) return null;

  const elapsed = Math.floor((progress / 100) * track.duration);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0c0c14]/95 backdrop-blur-xl border-t border-brand-800/30">
      {/* Progress bar */}
      <div className="h-1 bg-brand-950 w-full">
        <div
          className="h-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 gap-4">
        {/* Track info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-sm font-bold shrink-0">
            {track.genre.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{track.title}</p>
            <p className="text-xs text-gray-400 truncate">{track.creator}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Prev */}
          <button className="text-gray-400 hover:text-white transition" aria-label="Previous">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={toggle}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-105 transition"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5 text-brand-950" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-brand-950 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button className="text-gray-400 hover:text-white transition" aria-label="Next">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* Time & close */}
        <div className="flex items-center gap-4 flex-1 justify-end">
          <span className="text-xs text-gray-500 hidden sm:block">
            {formatTime(elapsed)} / {formatTime(track.duration)}
          </span>
          <button
            onClick={close}
            className="text-gray-500 hover:text-white transition"
            aria-label="Close player"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
