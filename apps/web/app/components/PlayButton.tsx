'use client';

import { usePlayer } from './MusicPlayer';

interface PlayButtonProps {
  track: {
    id: string;
    title: string;
    artist?: string;
    genre?: string;
    duration?: number;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PlayButton({ track, size = 'md', className = '' }: PlayButtonProps) {
  const { play, track: current, isPlaying, toggle } = usePlayer();

  const isThisTrack = current?.id === track.id;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isThisTrack) {
      toggle();
    } else {
      play({
        id: track.id,
        title: track.title,
        artist: track.artist ?? 'Unknown artist',
        genre: track.genre ?? 'Music',
        duration: track.duration ?? 0,
      });
    }
  };

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={handleClick}
      className={`${sizes[size]} rounded-full bg-brand-600 flex items-center justify-center hover:bg-brand-500 hover:scale-105 transition shadow-lg shadow-brand-900/30 ${className}`}
      aria-label={isThisTrack && isPlaying ? 'Pause' : 'Play'}
    >
      {isThisTrack && isPlaying ? (
        <svg className={`${iconSizes[size]} text-white`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
      ) : (
        <svg className={`${iconSizes[size]} text-white ml-0.5`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
}
