'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface EmbedTrack {
  id: string;
  title: string;
  artistName: string;
  artistId: string;
  duration: number; // seconds
  audioUrl: string | null;
  coverUrl: string | null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function EmbedPlayerClient({
  track,
  appUrl,
}: {
  track: EmbedTrack;
  appUrl: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrent] = useState(0);
  const [duration, setDuration] = useState(track.duration || 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrent(audio.currentTime);
    const onDuration = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => setPlaying(false);

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !track.audioUrl) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => {});
      setPlaying(true);
    }
  }, [playing, track.audioUrl]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      const bar = progressRef.current;
      if (!audio || !bar || !duration) return;

      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = ratio * duration;
      setCurrent(audio.currentTime);
    },
    [duration]
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full h-[160px] bg-brand-950 text-white flex flex-col justify-between p-4 overflow-hidden select-none"
         style={{ background: '#0a0a14' }}>
      {track.audioUrl && (
        <audio ref={audioRef} src={track.audioUrl} preload="metadata" />
      )}

      {/* Top: cover + info + play */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Cover / Play button */}
        <button
          onClick={togglePlay}
          disabled={!track.audioUrl}
          className="relative w-14 h-14 rounded-lg flex-shrink-0 overflow-hidden bg-red-600/20 flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {track.coverUrl ? (
            <Image
              src={track.coverUrl}
              alt={track.title}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : null}
          {/* Play/Pause overlay */}
          <span className="relative z-10 text-white text-xl drop-shadow-lg">
            {playing ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <rect x="4" y="3" width="4" height="14" rx="1" />
                <rect x="12" y="3" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6 4l10 6-10 6V4z" />
              </svg>
            )}
          </span>
        </button>

        {/* Track info */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate">{track.title}</p>
          <p className="text-xs text-gray-400 truncate">{track.artistName}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="h-1.5 rounded-full bg-white/10 cursor-pointer group relative"
        >
          <div
            className="h-full rounded-full bg-red-600 transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Bottom: branding + link */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1.5">
          <Image
            src={`${appUrl}/logo.png`}
            alt="OPYNX"
            width={16}
            height={16}
            className="rounded-sm"
          />
          <span className="text-[10px] font-bold text-gray-500">OPYNX</span>
        </div>
        <a
          href={`${appUrl}/track/${track.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-semibold text-red-500 hover:text-red-400 transition-colors"
        >
          Listen on OPYNX
        </a>
      </div>
    </div>
  );
}
