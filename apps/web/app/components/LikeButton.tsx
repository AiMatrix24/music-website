'use client';

import { useState } from 'react';
import { useToast } from './Toast';

interface LikeButtonProps {
  initialCount?: number;
  size?: 'sm' | 'md';
}

export function LikeButton({ initialCount = 0, size = 'md' }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const { toast } = useToast();

  const toggle = () => {
    if (liked) {
      setLiked(false);
      setCount((c) => c - 1);
    } else {
      setLiked(true);
      setCount((c) => c + 1);
      toast('Added to your library');
    }
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
        liked
          ? 'border-red-500/50 text-red-400 bg-red-500/10'
          : 'border-brand-800/30 text-gray-400 hover:text-red-400 hover:border-red-500/30'
      }`}
      aria-label={liked ? 'Unlike' : 'Like'}
    >
      <svg
        className={`${iconSize} transition-transform ${liked ? 'scale-110' : ''}`}
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {count > 0 && <span className="text-xs font-semibold">{count}</span>}
    </button>
  );
}
