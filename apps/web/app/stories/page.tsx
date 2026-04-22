'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';

/* ------------------------------------------------------------------ */
/*  Types & mock data                                                 */
/* ------------------------------------------------------------------ */

type DiscoveryMethod = 'Concert' | 'Playlist' | 'Friend' | 'OPYNX Discover' | 'Social Media' | 'Other';

interface Story {
  id: string;
  fanName: string;
  avatarInitial: string;
  artistName: string;
  artistId: string;
  text: string;
  method: DiscoveryMethod;
  likes: number;
  timestamp: string;
  gradientFrom: string;
  gradientTo: string;
}

const MOCK_STORIES: Story[] = [
  {
    id: 's1',
    fanName: 'Alex K.',
    avatarInitial: 'A',
    artistName: 'ZVRA',
    artistId: 'a1',
    text: 'I heard ZVRA at a basement show in Brooklyn three years ago and the bass literally shook the floor. Been obsessed ever since.',
    method: 'Concert',
    likes: 142,
    timestamp: '2 hours ago',
    gradientFrom: 'from-red-600',
    gradientTo: 'to-orange-500',
  },
  {
    id: 's2',
    fanName: 'Priya M.',
    avatarInitial: 'P',
    artistName: 'Mira Solis',
    artistId: 'a2',
    text: 'My best friend sent me "Ocean Protocol" at 2am and I stayed up all night listening on repeat. Changed how I think about electronic music.',
    method: 'Friend',
    likes: 89,
    timestamp: '5 hours ago',
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-cyan-400',
  },
  {
    id: 's3',
    fanName: 'Jordan T.',
    avatarInitial: 'J',
    artistName: 'The Drift',
    artistId: 'a3',
    text: 'OPYNX recommended The Drift on my For You page. Now they are the only thing in my rotation.',
    method: 'OPYNX Discover',
    likes: 214,
    timestamp: '1 day ago',
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-pink-500',
  },
  {
    id: 's4',
    fanName: 'Sam R.',
    avatarInitial: 'S',
    artistName: 'KVLT',
    artistId: 'a4',
    text: 'Saw a TikTok of someone crying to Phantom Signal. Clicked the link and the rest is history.',
    method: 'Social Media',
    likes: 67,
    timestamp: '2 days ago',
    gradientFrom: 'from-green-600',
    gradientTo: 'to-teal-400',
  },
  {
    id: 's5',
    fanName: 'Nina W.',
    avatarInitial: 'N',
    artistName: 'Aether',
    artistId: 'a5',
    text: 'Found Aether on a lofi study playlist during finals week. Their ambient textures literally saved my GPA.',
    method: 'Playlist',
    likes: 178,
    timestamp: '3 days ago',
    gradientFrom: 'from-yellow-500',
    gradientTo: 'to-amber-600',
  },
  {
    id: 's6',
    fanName: 'Dev C.',
    avatarInitial: 'D',
    artistName: 'Undertow',
    artistId: 'a6',
    text: 'My roommate played Deep Currents so loud the neighbors complained. I knocked on his door to ask what it was, not to complain.',
    method: 'Friend',
    likes: 103,
    timestamp: '4 days ago',
    gradientFrom: 'from-indigo-600',
    gradientTo: 'to-violet-500',
  },
];

const DISCOVERY_OPTIONS: DiscoveryMethod[] = ['Concert', 'Playlist', 'Friend', 'OPYNX Discover', 'Social Media', 'Other'];
const FILTER_TABS = ['All', 'Most Liked', 'Recent', 'By Creator'] as const;

const METHOD_COLORS: Record<DiscoveryMethod, string> = {
  Concert: 'bg-red-600/20 text-red-400',
  Playlist: 'bg-green-600/20 text-green-400',
  Friend: 'bg-blue-600/20 text-blue-400',
  'OPYNX Discover': 'bg-purple-600/20 text-purple-400',
  'Social Media': 'bg-pink-600/20 text-pink-400',
  Other: 'bg-gray-600/20 text-gray-400',
};

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function StoriesPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<(typeof FILTER_TABS)[number]>('All');
  const [stories, setStories] = useState(MOCK_STORIES);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // Form state
  const [selectedArtist, setSelectedArtist] = useState('');
  const [method, setMethod] = useState<DiscoveryMethod | ''>('');
  const [storyText, setStoryText] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const toggleLike = (id: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setStories((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, likes: likedIds.has(id) ? s.likes - 1 : s.likes + 1 } : s
      )
    );
  };

  const filteredStories = [...stories].sort((a, b) => {
    if (activeTab === 'Most Liked') return b.likes - a.likes;
    return 0; // 'All', 'Recent', 'By Creator' keep default order for mock
  });

  const handleSubmit = () => {
    if (!storyText.trim() || !selectedArtist || !method) {
      toast('Please fill in all fields', 'error');
      return;
    }
    toast('Your story has been shared!');
    setStoryText('');
    setSelectedArtist('');
    setMethod('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading stories...</div>
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
        <section className="text-center mb-14">
          <h1 className="text-4xl sm:text-5xl font-black mb-3">
            <span className="bg-gradient-to-r from-red-500 to-pink-400 bg-clip-text text-transparent">
              Fan Stories
            </span>
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Share how music changed your life. Tell the world how you discovered your favorite creator.
          </p>
        </section>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                activeTab === tab
                  ? 'bg-red-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Story feed */}
        <section className="grid sm:grid-cols-2 gap-6 mb-14">
          {filteredStories.map((story) => (
            <div
              key={story.id}
              className="rounded-2xl bg-[#15151f] border border-white/5 overflow-hidden hover:border-red-600/20 transition"
            >
              {/* Gradient top bar */}
              <div className={`h-1.5 bg-gradient-to-r ${story.gradientFrom} ${story.gradientTo}`} />
              <div className="p-5">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-red-600/20 flex items-center justify-center text-sm font-bold text-red-400">
                    {story.avatarInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{story.fanName}</p>
                    <p className="text-xs text-gray-500">
                      about{' '}
                      <Link href={`/artist/${story.artistId}`} className="text-red-400 hover:text-red-300 transition">
                        {story.artistName}
                      </Link>
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-600">{story.timestamp}</span>
                </div>

                {/* Story text */}
                <p className="text-sm text-gray-300 leading-relaxed mb-4">{story.text}</p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${METHOD_COLORS[story.method]}`}>
                    {story.method}
                  </span>
                  <button
                    onClick={() => toggleLike(story.id)}
                    className={`flex items-center gap-1 text-sm transition ${
                      likedIds.has(story.id) ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
                    }`}
                  >
                    {likedIds.has(story.id) ? '\u2665' : '\u2661'} {story.likes}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Write Your Story */}
        <section className="rounded-2xl bg-[#15151f] p-6 sm:p-8 border border-white/5">
          <h2 className="text-2xl font-bold mb-6">Write Your Story</h2>

          {!session && (
            <div className="text-center py-6">
              <p className="text-gray-400 mb-4">Sign in to share your story</p>
              <Link href="/auth/login" className="inline-block px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-semibold transition">
                Sign In
              </Link>
            </div>
          )}

          {session && (
            <div className="space-y-5">
              {/* Creator select */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Select Creator</label>
                <select
                  value={selectedArtist}
                  onChange={(e) => setSelectedArtist(e.target.value)}
                  className="w-full bg-brand-950 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-red-600 focus:outline-none transition"
                >
                  <option value="">Choose an creator...</option>
                  {['ZVRA', 'Mira Solis', 'The Drift', 'KVLT', 'Aether', 'Undertow'].map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Discovery method */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">How did you discover them?</label>
                <div className="flex flex-wrap gap-2">
                  {DISCOVERY_OPTIONS.map((opt) => (
                    <label
                      key={opt}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm cursor-pointer border transition ${
                        method === opt
                          ? 'bg-red-600/20 border-red-600/40 text-red-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="method"
                        value={opt}
                        checked={method === opt}
                        onChange={() => setMethod(opt)}
                        className="sr-only"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              {/* Story textarea */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Your Story</label>
                <textarea
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value.slice(0, 500))}
                  placeholder="Tell us how this creator changed your life..."
                  rows={4}
                  className="w-full bg-brand-950 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-red-600 focus:outline-none transition resize-none"
                />
                <p className="text-xs text-gray-500 text-right mt-1">{storyText.length}/500</p>
              </div>

              <button
                onClick={handleSubmit}
                className="px-8 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-bold transition"
              >
                Share Story
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
