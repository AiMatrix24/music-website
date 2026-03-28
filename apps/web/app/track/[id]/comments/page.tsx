'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useToast } from '@/app/components/Toast';

interface Comment {
  id: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: number; // position 0-79 (bar index)
  timeLabel: string;
  likes: number;
  liked: boolean;
}

const MOCK_COMMENTS: Comment[] = [
  { id: '1', username: 'beatslover', avatar: 'B', text: 'This drop is insane!', timestamp: 12, timeLabel: '0:23', likes: 24, liked: false },
  { id: '2', username: 'synthfan99', avatar: 'S', text: 'The synth work here is beautiful', timestamp: 22, timeLabel: '0:45', likes: 18, liked: false },
  { id: '3', username: 'vibecheck', avatar: 'V', text: 'Chills every time', timestamp: 30, timeLabel: '1:02', likes: 31, liked: false },
  { id: '4', username: 'nightowl', avatar: 'N', text: 'Perfect late night track', timestamp: 38, timeLabel: '1:18', likes: 12, liked: false },
  { id: '5', username: 'producer_mike', avatar: 'P', text: 'What plugin is this lead?', timestamp: 48, timeLabel: '1:40', likes: 7, liked: false },
  { id: '6', username: 'melodyjane', avatar: 'M', text: 'The vocals here omg', timestamp: 55, timeLabel: '1:55', likes: 42, liked: false },
  { id: '7', username: 'bassdrop', avatar: 'B', text: 'Sub bass is hitting different', timestamp: 64, timeLabel: '2:12', likes: 15, liked: false },
  { id: '8', username: 'dj_luna', avatar: 'D', text: 'Best outro of 2025', timestamp: 74, timeLabel: '2:35', likes: 28, liked: false },
];

export default function WaveformCommentsPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [clickedBar, setClickedBar] = useState<number | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Generate stable random bar heights
  const barHeights = useMemo(() => {
    const heights: number[] = [];
    let seed = 42;
    for (let i = 0; i < 80; i++) {
      seed = (seed * 16807 + 7) % 2147483647;
      heights.push(2 + (seed % 39));
    }
    return heights;
  }, []);

  const barToTime = (bar: number) => {
    const totalSeconds = Math.round((bar / 79) * 180);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBarClick = (index: number) => {
    setClickedBar(index);
    setNewCommentText('');
  };

  const submitComment = () => {
    if (!newCommentText.trim() || clickedBar === null) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      username: 'you',
      avatar: 'Y',
      text: newCommentText.trim(),
      timestamp: clickedBar,
      timeLabel: barToTime(clickedBar),
      likes: 0,
      liked: false,
    };
    setComments((prev) => [...prev, newComment].sort((a, b) => a.timestamp - b.timestamp));
    setClickedBar(null);
    setNewCommentText('');
    toast('Comment added!', 'success');
  };

  const toggleLike = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
          : c
      )
    );
  };

  return (
    <div className="min-h-screen bg-brand-950 pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <Link href={`/track/${id}`} className="text-gray-400 hover:text-white transition text-sm mb-6 inline-block">
          &larr; Back to Track
        </Link>

        {/* Track header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-600 to-purple-700 flex items-center justify-center text-2xl font-bold shrink-0">
            &#9835;
          </div>
          <div>
            <h1 className="text-2xl font-bold">Midnight Signal</h1>
            <p className="text-gray-400">Nova Synthwave</p>
          </div>
          <span className="ml-auto text-sm text-gray-500">{comments.length} comments</span>
        </div>

        {/* Waveform section */}
        <div className="bg-[#15151f] rounded-2xl p-6 mb-8 relative">
          {/* Comment bubbles above waveform */}
          <div className="relative h-12 mb-2">
            {comments.map((comment) => {
              const leftPct = (comment.timestamp / 79) * 100;
              return (
                <div
                  key={comment.id}
                  className="absolute bottom-0 transform -translate-x-1/2 group"
                  style={{ left: `${leftPct}%` }}
                >
                  <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-[10px] font-bold cursor-pointer hover:scale-110 transition border-2 border-[#15151f]">
                    {comment.avatar}
                  </div>
                  {/* Tooltip */}
                  <div className="hidden group-hover:block absolute bottom-9 left-1/2 -translate-x-1/2 bg-gray-800 text-xs rounded-lg px-3 py-2 whitespace-nowrap z-20 border border-gray-700">
                    <span className="font-semibold">{comment.username}</span>: {comment.text}
                    <div className="text-gray-500 mt-0.5">{comment.timeLabel}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Waveform bars */}
          <div
            className="flex items-end gap-[2px] h-[44px] cursor-pointer relative"
            role="button"
            tabIndex={0}
          >
            {barHeights.map((height, i) => {
              const pct = i / 79;
              const r = Math.round(220 - pct * 80);
              const g = Math.round(40 + pct * 20);
              const b = Math.round(60 + pct * 140);
              return (
                <div
                  key={i}
                  onClick={() => handleBarClick(i)}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                  className="flex-1 rounded-sm transition-all hover:opacity-80"
                  style={{
                    height: `${height}px`,
                    backgroundColor: `rgb(${r},${g},${b})`,
                    opacity: hoveredBar !== null && Math.abs(hoveredBar - i) < 3 ? 0.7 : 1,
                  }}
                />
              );
            })}
          </div>

          {/* Time labels */}
          <div className="flex justify-between text-[10px] text-gray-600 mt-1">
            <span>0:00</span>
            <span>1:00</span>
            <span>2:00</span>
            <span>3:00</span>
          </div>

          {/* Hovered bar tooltip */}
          {hoveredBar !== null && (
            <div
              className="absolute bottom-[70px] text-[10px] text-gray-400 transform -translate-x-1/2 pointer-events-none"
              style={{ left: `${(hoveredBar / 79) * 100}%` }}
            >
              {barToTime(hoveredBar)}
            </div>
          )}

          {/* Comment form */}
          {clickedBar !== null && (
            <div className="mt-4 flex gap-2 items-start animate-[fadeSlideIn_0.3s_ease-out]">
              <div className="text-xs text-gray-500 pt-2 shrink-0 w-10">
                {barToTime(clickedBar)}
              </div>
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                placeholder="Add a comment at this timestamp..."
                className="flex-1 bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-red-500 transition placeholder:text-gray-600"
                autoFocus
              />
              <button
                onClick={submitComment}
                disabled={!newCommentText.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition"
              >
                Post
              </button>
              <button
                onClick={() => setClickedBar(null)}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition"
              >
                Cancel
              </button>
            </div>
          )}

          {!clickedBar && (
            <p className="text-xs text-gray-600 mt-3 text-center">
              Click anywhere on the waveform to leave a comment at that timestamp
            </p>
          )}
        </div>

        {/* Comment list */}
        <div>
          <h2 className="text-lg font-bold mb-4">All Comments ({comments.length})</h2>
          <div className="space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-[#15151f] rounded-xl p-4 flex items-start gap-3 hover:bg-[#1a1a28] transition"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center text-sm font-bold shrink-0">
                  {comment.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{comment.username}</span>
                    <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                      {comment.timeLabel}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{comment.text}</p>
                </div>
                <button
                  onClick={() => toggleLike(comment.id)}
                  className={`flex items-center gap-1 text-sm shrink-0 transition ${
                    comment.liked ? 'text-red-500' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {comment.liked ? '&#9829;' : '&#9825;'}
                  <span className="text-xs">{comment.likes}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
