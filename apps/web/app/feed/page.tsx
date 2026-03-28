'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

// --- Types ---
type PostType = 'new_track' | 'event' | 'behind_the_scenes' | 'milestone' | 'poll' | 'voice_memo';

interface PollOption {
  label: string;
  votes: number;
}

interface FeedPost {
  id: number;
  artistName: string;
  artistInitial: string;
  timestamp: string;
  type: PostType;
  content: string;
  likes: number;
  comments: number;
  // Type-specific fields
  trackTitle?: string;
  trackArtist?: string;
  trackGenre?: string;
  eventDate?: string;
  eventVenue?: string;
  eventCity?: string;
  milestoneValue?: string;
  pollQuestion?: string;
  pollOptions?: PollOption[];
  memoDuration?: string;
}

// --- Mock Data ---
const FEED_POSTS: FeedPost[] = [
  {
    id: 1, artistName: 'ChromeVox', artistInitial: 'C', timestamp: '2m ago', type: 'new_track',
    content: 'Just dropped a brand new single! Check it out.',
    trackTitle: 'Neon Highway', trackArtist: 'ChromeVox', trackGenre: 'Synthwave',
    likes: 142, comments: 23,
  },
  {
    id: 2, artistName: 'UrbanFlora', artistInitial: 'U', timestamp: '15m ago', type: 'event',
    content: 'Excited to announce my first headlining show!',
    eventDate: 'Apr 15, 2026', eventVenue: 'The Echo Lounge', eventCity: 'Los Angeles, CA',
    likes: 89, comments: 31,
  },
  {
    id: 3, artistName: 'DreamWeaver', artistInitial: 'D', timestamp: '1h ago', type: 'behind_the_scenes',
    content: 'In the studio working on something special. New album coming this summer.',
    likes: 234, comments: 45,
  },
  {
    id: 4, artistName: 'SynthLord', artistInitial: 'S', timestamp: '2h ago', type: 'milestone',
    content: 'We did it! Thank you all so much for the love.',
    milestoneValue: '10K plays!',
    likes: 567, comments: 89,
  },
  {
    id: 5, artistName: 'NightBloom', artistInitial: 'N', timestamp: '3h ago', type: 'poll',
    content: 'Help me decide the next single!',
    pollQuestion: 'Which track should I release next?',
    pollOptions: [
      { label: 'Midnight Garden', votes: 342 },
      { label: 'Starfall', votes: 218 },
      { label: 'Lunar Tide', votes: 156 },
    ],
    likes: 98, comments: 12,
  },
  {
    id: 6, artistName: 'VoidWalker', artistInitial: 'V', timestamp: '4h ago', type: 'voice_memo',
    content: 'Quick update on the upcoming EP. Give it a listen!',
    memoDuration: '0:47',
    likes: 76, comments: 8,
  },
  {
    id: 7, artistName: 'RetroWave', artistInitial: 'R', timestamp: '5h ago', type: 'new_track',
    content: 'Collaboration with @ChromeVox finally out!',
    trackTitle: 'Digital Sunset', trackArtist: 'RetroWave ft. ChromeVox', trackGenre: 'Synthwave',
    likes: 312, comments: 67,
  },
  {
    id: 8, artistName: 'CoralMind', artistInitial: 'C', timestamp: '6h ago', type: 'behind_the_scenes',
    content: 'Recording field sounds at the coast for the ambient project.',
    likes: 145, comments: 19,
  },
  {
    id: 9, artistName: 'BitCrush', artistInitial: 'B', timestamp: '8h ago', type: 'milestone',
    content: 'First track to hit the OPYNX Top 50! Dreams come true.',
    milestoneValue: 'Top 50 Charts!',
    likes: 423, comments: 56,
  },
  {
    id: 10, artistName: 'ShockWire', artistInitial: 'S', timestamp: '12h ago', type: 'event',
    content: 'Festival season is here. Catch me at three stages this summer.',
    eventDate: 'Jun 20-22, 2026', eventVenue: 'Frequency Festival', eventCity: 'Austin, TX',
    likes: 198, comments: 34,
  },
];

export default function FeedPage() {
  const { data: session, status } = useSession();
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [postLikes, setPostLikes] = useState<Record<number, number>>(
    Object.fromEntries(FEED_POSTS.map((p) => [p.id, p.likes]))
  );
  const [votedPolls, setVotedPolls] = useState<Set<number>>(new Set());

  if (status === 'loading') {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-[#15151f] h-64 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-black mb-4">Sign In Required</h1>
          <p className="text-gray-400 mb-6">You need to be signed in to view your feed.</p>
          <Link href="/auth/login" className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const toggleLike = (postId: number) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
        setPostLikes((pl) => ({ ...pl, [postId]: (pl[postId] ?? 0) - 1 }));
      } else {
        next.add(postId);
        setPostLikes((pl) => ({ ...pl, [postId]: (pl[postId] ?? 0) + 1 }));
      }
      return next;
    });
  };

  const handleVote = (postId: number) => {
    setVotedPolls((prev) => new Set(prev).add(postId));
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          &larr; Back to Home
        </Link>

        <h1 className="text-3xl font-black mb-2">Your Feed</h1>
        <p className="text-gray-400 mb-8">Updates from artists you follow.</p>

        {/* Feed Items */}
        <div className="space-y-6">
          {FEED_POSTS.map((post) => (
            <article key={post.id} className="rounded-2xl bg-[#15151f] overflow-hidden">
              {/* Post Header */}
              <div className="flex items-center gap-3 p-5 pb-3">
                <Link href={`/artist/${post.artistName.toLowerCase()}`} className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center font-bold text-sm shrink-0">
                  {post.artistInitial}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/artist/${post.artistName.toLowerCase()}`} className="font-semibold hover:text-red-500 transition">
                    {post.artistName}
                  </Link>
                  <p className="text-xs text-gray-500">{post.timestamp}</p>
                </div>
              </div>

              {/* Post Content */}
              <div className="px-5 pb-3">
                <p className="text-gray-300 mb-3">{post.content}</p>
                <PostContent post={post} votedPolls={votedPolls} onVote={handleVote} />
              </div>

              {/* Post Actions */}
              <div className="flex items-center gap-6 px-5 py-3 border-t border-white/5">
                <button
                  onClick={() => toggleLike(post.id)}
                  className="flex items-center gap-1.5 text-sm transition hover:text-red-500"
                >
                  <svg className={`w-5 h-5 ${likedPosts.has(post.id) ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill={likedPosts.has(post.id) ? 'currentColor' : 'none'}>
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span className={likedPosts.has(post.id) ? 'text-red-500' : 'text-gray-400'}>
                    {postLikes[post.id] ?? post.likes}
                  </span>
                </button>
                <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>{post.comments}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition ml-auto">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  <span>Share</span>
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Load More */}
        <div className="mt-8 text-center">
          <button className="px-8 py-3 rounded-xl bg-[#15151f] hover:bg-[#1a1a2e] text-gray-400 hover:text-white font-semibold transition">
            Load More
          </button>
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 flex items-center justify-center transition hover:scale-110 z-50">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}

function PostContent({ post, votedPolls, onVote }: { post: FeedPost; votedPolls: Set<number>; onVote: (id: number) => void }) {
  switch (post.type) {
    case 'new_track':
      return (
        <Link href={`/track/${post.trackTitle?.toLowerCase().replace(/\s+/g, '-')}`} className="flex items-center gap-4 rounded-xl bg-brand-950/50 p-4 hover:bg-brand-950/70 transition">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shrink-0">
            <span className="text-2xl">&#9654;</span>
          </div>
          <div className="min-w-0">
            <p className="font-bold truncate">{post.trackTitle}</p>
            <p className="text-sm text-gray-400 truncate">{post.trackArtist}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-600/20 text-red-400">{post.trackGenre}</span>
          </div>
        </Link>
      );

    case 'event':
      return (
        <div className="flex items-start gap-4 rounded-xl bg-brand-950/50 p-4">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex flex-col items-center justify-center shrink-0 text-center">
            <span className="text-xs font-bold uppercase">{post.eventDate?.split(' ')[0]}</span>
            <span className="text-xl font-black">{post.eventDate?.split(' ')[1]?.replace(',', '')}</span>
          </div>
          <div>
            <p className="font-bold">{post.eventVenue}</p>
            <p className="text-sm text-gray-400">{post.eventCity}</p>
            <p className="text-xs text-gray-500 mt-1">{post.eventDate}</p>
          </div>
        </div>
      );

    case 'behind_the_scenes':
      return (
        <div className="rounded-xl bg-brand-950/50 aspect-video flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="text-sm">Behind the Scenes</p>
          </div>
        </div>
      );

    case 'milestone':
      return (
        <div className="rounded-xl bg-gradient-to-br from-yellow-600/20 to-amber-600/20 border border-yellow-600/30 p-6 text-center">
          <p className="text-4xl mb-2">&#127942;</p>
          <p className="text-2xl font-black text-yellow-400">{post.milestoneValue}</p>
        </div>
      );

    case 'poll':
      const totalVotes = post.pollOptions?.reduce((sum, o) => sum + o.votes, 0) ?? 1;
      const hasVoted = votedPolls.has(post.id);
      return (
        <div className="rounded-xl bg-brand-950/50 p-4">
          <p className="font-semibold mb-3">{post.pollQuestion}</p>
          <div className="space-y-2">
            {post.pollOptions?.map((option, i) => {
              const pct = Math.round((option.votes / totalVotes) * 100);
              return (
                <button
                  key={i}
                  onClick={() => onVote(post.id)}
                  disabled={hasVoted}
                  className="relative w-full text-left rounded-lg overflow-hidden h-10 border border-white/10 hover:border-red-600/50 transition disabled:cursor-default"
                >
                  <div
                    className={`absolute inset-y-0 left-0 ${hasVoted ? 'bg-red-600/30' : 'bg-white/5'} transition-all`}
                    style={{ width: hasVoted ? `${pct}%` : '0%' }}
                  />
                  <div className="relative flex items-center justify-between px-3 h-full">
                    <span className="text-sm">{option.label}</span>
                    {hasVoted && <span className="text-sm text-gray-400">{pct}%</span>}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">{totalVotes} total votes</p>
        </div>
      );

    case 'voice_memo':
      return (
        <div className="flex items-center gap-4 rounded-xl bg-brand-950/50 p-4">
          <button className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shrink-0 transition">
            <span className="text-lg">&#9654;</span>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-1 h-8">
              {Array.from({ length: 30 }, (_, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-600/60 rounded-full"
                  style={{ height: `${Math.random() * 100}%` }}
                />
              ))}
            </div>
          </div>
          <span className="text-sm text-gray-400">{post.memoDuration}</span>
        </div>
      );

    default:
      return null;
  }
}
