'use client';

import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from 'react';

interface Track {
  id: string;
  title: string;
  creator: string;
  genre: string;
  duration: number;
  /** Direct streamable URL — when present, the player uses an actual <audio> element. */
  audioUrl?: string | null;
  /** Cover image URL (square) for the player bar thumbnail. */
  coverUrl?: string | null;
}

interface PlayerState {
  track: Track | null;
  isPlaying: boolean;
  /** 0–100 percentage based on actual audio currentTime when audioUrl present, else simulated. */
  progress: number;
  /** Real audio time in seconds (only meaningful when audioUrl present). */
  currentTime: number;
  /** Real audio duration in seconds (falls back to track.duration when metadata not loaded). */
  audioDuration: number;
  play: (track: Track) => void;
  toggle: () => void;
  seek: (percent: number) => void;
  close: () => void;
}

const PlayerContext = createContext<PlayerState>({
  track: null,
  isPlaying: false,
  progress: 0,
  currentTime: 0,
  audioDuration: 0,
  play: () => {},
  toggle: () => {},
  seek: () => {},
  close: () => {},
});

export const usePlayer = () => useContext(PlayerContext);

// TODO: Enforce audio quality by subscription tier
// Free → 128kbps only (serve audioUrl128)
// Premium/Bundle → 320kbps (serve audioUrl320)
// Creator (own tracks) → FLAC (serve audioUrlFlac)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [track, setTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Mirror current track into a ref so the timeupdate listener (set up once on
  // mount) always reads the latest track without re-subscribing.
  const trackRef = useRef<Track | null>(null);

  // Play count tracking: increment after 30s of continuous play
  const countedTracksRef = useRef<Set<string>>(new Set());
  const lastTickRef = useRef(0);
  const accumulatedRef = useRef(0);

  // Build the audio element on mount (client only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const audio = new Audio();
    // 'auto' so the file is ready to play the moment the user clicks — critical
    // on iOS Safari where play() must be called synchronously in a gesture and
    // can't wait for buffering.
    audio.preload = 'auto';
    // No crossOrigin — only needed for Web Audio / canvas, and breaks playback
    // on CDNs that don't return Access-Control-Allow-Origin for media requests.
    audioRef.current = audio;

    const onTime = () => {
      setCurrentTime(audio.currentTime);
    };
    const onMeta = () => {
      if (Number.isFinite(audio.duration)) setAudioDuration(audio.duration);
    };
    const onPlay = () => {
      setIsPlaying(true);
      lastTickRef.current = performance.now();
    };
    const onPause = () => {
      setIsPlaying(false);
      lastTickRef.current = 0;
    };
    const onEnded = () => {
      setIsPlaying(false);
    };
    const onTickAccrual = () => {
      const t = trackRef.current;
      if (!audio.paused && t) {
        const now = performance.now();
        if (lastTickRef.current > 0) {
          accumulatedRef.current += (now - lastTickRef.current) / 1000;
        }
        lastTickRef.current = now;
        if (accumulatedRef.current >= 30 && !countedTracksRef.current.has(t.id)) {
          countedTracksRef.current.add(t.id);
          fetch('/api/tracks/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trackId: t.id }),
          }).catch(() => {});
        }
      }
    };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('timeupdate', onTickAccrual);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('timeupdate', onTickAccrual);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  // Keep the ref in sync with track on every render
  useEffect(() => {
    trackRef.current = track;
  }, [track]);

  /**
   * play() — must be called inside a user-gesture event handler (onClick).
   * Sets src + invokes audio.play() synchronously so iOS Safari permits it.
   */
  const play = (t: Track) => {
    const audio = audioRef.current;
    setTrack(t);
    setCurrentTime(0);
    accumulatedRef.current = 0;
    lastTickRef.current = 0;

    if (!audio || !t.audioUrl) {
      setIsPlaying(false);
      return;
    }

    // Only re-load if the URL actually changed (preserves position when toggling)
    if (audio.src !== t.audioUrl) {
      audio.src = t.audioUrl;
      audio.load();
    }

    // Synchronous play() inside the gesture — required for iOS / autoplay policies
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => {
        // Autoplay blocked or media error — surface state, don't crash
        setIsPlaying(false);
      });
    }
  };

  /**
   * toggle() — pause/resume current track. Must also run synchronously inside
   * a click handler so iOS unlocks audio if it hasn't already.
   */
  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      const p = audio.play();
      if (p && typeof p.then === 'function') {
        p.catch(() => setIsPlaying(false));
      }
    } else {
      audio.pause();
    }
  };

  const seek = (percent: number) => {
    const audio = audioRef.current;
    const dur = audioDuration || track?.duration || 0;
    if (!audio || !dur) return;
    const clamped = Math.max(0, Math.min(100, percent));
    audio.currentTime = (clamped / 100) * dur;
    setCurrentTime(audio.currentTime);
  };

  const close = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
    }
    setTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioDuration(0);
    accumulatedRef.current = 0;
    lastTickRef.current = 0;
  };

  const effectiveDuration = audioDuration || track?.duration || 0;
  const progress = effectiveDuration > 0 ? Math.min(100, (currentTime / effectiveDuration) * 100) : 0;

  return (
    <PlayerContext.Provider
      value={{ track, isPlaying, progress, currentTime, audioDuration: effectiveDuration, play, toggle, seek, close }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function MusicPlayerBar() {
  const { track, isPlaying, progress, currentTime, audioDuration, toggle, seek, close } = usePlayer();

  if (!track) return null;

  const total = audioDuration || track.duration;
  const hasAudio = !!track.audioUrl;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0c0c14]/95 backdrop-blur-xl border-t border-brand-800/30">
      {/* Progress bar (clickable to seek when audioUrl present) */}
      <div
        className={`h-1 bg-brand-950 w-full ${hasAudio ? 'cursor-pointer' : ''}`}
        onClick={(e) => {
          if (!hasAudio) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const percent = ((e.clientX - rect.left) / rect.width) * 100;
          seek(percent);
        }}
      >
        <div
          className="h-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 gap-4">
        {/* Track info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {track.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.coverUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-sm font-bold shrink-0">
              {track.genre.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{track.title}</p>
            <p className="text-xs text-gray-400 truncate">{track.creator}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button className="text-gray-400 hover:text-white transition" aria-label="Previous">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <button
            onClick={toggle}
            disabled={!hasAudio}
            title={hasAudio ? '' : 'No audio file uploaded for this track'}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-105 transition disabled:opacity-40 disabled:cursor-not-allowed"
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

          <button className="text-gray-400 hover:text-white transition" aria-label="Next">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* Time & close */}
        <div className="flex items-center gap-4 flex-1 justify-end">
          <span className="text-xs text-gray-500 hidden sm:block">
            {formatTime(Math.floor(currentTime))} / {formatTime(Math.floor(total))}
          </span>
          {!hasAudio && (
            <span className="text-xs text-amber-400 hidden md:block">No audio uploaded</span>
          )}
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
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds) % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
