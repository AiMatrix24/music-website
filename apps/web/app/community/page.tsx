'use client';

import Link from 'next/link';
import { useState } from 'react';

type Category = 'General' | 'Music Production' | 'Events' | 'Feedback' | 'Announcements';

interface Thread {
  id: number;
  title: string;
  author: string;
  authorInitial: string;
  category: Category;
  replies: number;
  lastActivity: string;
  pinned?: boolean;
}

const THREADS: Thread[] = [
  { id: 1, title: 'Welcome to the OPYNX Community!', author: 'OPYNX Team', authorInitial: 'O', category: 'Announcements', replies: 42, lastActivity: '2h ago', pinned: true },
  { id: 2, title: 'Platform Update v2.4 - New embed widgets & API', author: 'Admin', authorInitial: 'A', category: 'Announcements', replies: 18, lastActivity: '5h ago', pinned: true },
  { id: 3, title: 'Best practices for mixing lo-fi beats?', author: 'ChillProducer', authorInitial: 'C', category: 'Music Production', replies: 27, lastActivity: '1h ago' },
  { id: 4, title: 'How to set up your first event on OPYNX', author: 'VenueKing', authorInitial: 'V', category: 'Events', replies: 15, lastActivity: '3h ago' },
  { id: 5, title: 'Introduce yourself! Who are you and what do you create?', author: 'NeonWave', authorInitial: 'N', category: 'General', replies: 89, lastActivity: '30m ago' },
  { id: 6, title: 'Feature request: Collaborative playlists', author: 'BeatDropper', authorInitial: 'B', category: 'Feedback', replies: 34, lastActivity: '4h ago' },
  { id: 7, title: 'Anyone using Ableton with the OPYNX plugin?', author: 'SynthLord', authorInitial: 'S', category: 'Music Production', replies: 11, lastActivity: '6h ago' },
  { id: 8, title: 'Ticket scanning issues at last night\'s show', author: 'GigGoer', authorInitial: 'G', category: 'Events', replies: 7, lastActivity: '8h ago' },
  { id: 9, title: 'Revenue dashboard is incredible - transparency matters', author: 'IndieStar', authorInitial: 'I', category: 'Feedback', replies: 22, lastActivity: '12h ago' },
  { id: 10, title: 'What genre are you listening to this week?', author: 'MusicFan99', authorInitial: 'M', category: 'General', replies: 56, lastActivity: '45m ago' },
];

const CATEGORIES: ('All' | Category)[] = ['All', 'General', 'Music Production', 'Events', 'Feedback', 'Announcements'];

const CATEGORY_COLORS: Record<Category, string> = {
  General: 'bg-blue-600/20 text-blue-400',
  'Music Production': 'bg-purple-600/20 text-purple-400',
  Events: 'bg-green-600/20 text-green-400',
  Feedback: 'bg-yellow-600/20 text-yellow-400',
  Announcements: 'bg-red-600/20 text-red-400',
};

export default function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState<'All' | Category>('All');
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('General');

  const filtered = activeCategory === 'All' ? THREADS : THREADS.filter((t) => t.category === activeCategory);
  const pinned = filtered.filter((t) => t.pinned);
  const regular = filtered.filter((t) => !t.pinned);

  const handleSubmitThread = (e: React.FormEvent) => {
    e.preventDefault();
    setShowNewThread(false);
    setNewTitle('');
    setNewBody('');
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          &larr; Back to Home
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black mb-2">Community</h1>
            <p className="text-gray-400">Connect with creators, fans, and creators.</p>
          </div>
          <button
            onClick={() => setShowNewThread(true)}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition self-start"
          >
            + New Thread
          </button>
        </div>

        {/* New Thread Form */}
        {showNewThread && (
          <div className="rounded-2xl bg-[#15151f] p-6 mb-8 border border-brand-800/20">
            <h2 className="text-lg font-bold mb-4">Create a Thread</h2>
            <form onSubmit={handleSubmitThread} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl bg-brand-950 border border-brand-800/20 px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-red-600 transition"
                  placeholder="Thread title"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as Category)}
                  className="w-full rounded-xl bg-brand-950 border border-brand-800/20 px-4 py-3 text-white outline-none focus:border-red-600 transition"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Body</label>
                <textarea
                  required
                  rows={4}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="w-full rounded-xl bg-brand-950 border border-brand-800/20 px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-red-600 transition resize-none"
                  placeholder="What's on your mind?"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition">
                  Post Thread
                </button>
                <button type="button" onClick={() => setShowNewThread(false)} className="px-5 py-2.5 rounded-xl bg-brand-950 text-gray-400 hover:text-white border border-brand-800/20 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                activeCategory === cat
                  ? 'bg-red-600 text-white'
                  : 'bg-[#15151f] text-gray-400 hover:text-white border border-brand-800/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Pinned Threads */}
        {pinned.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Pinned</h3>
            <div className="space-y-2">
              {pinned.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
            </div>
          </div>
        )}

        {/* Regular Threads */}
        <div className="space-y-2">
          {regular.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            No threads in this category yet. Be the first to start one!
          </div>
        )}
      </div>
    </div>
  );
}

function ThreadCard({ thread }: { thread: Thread }) {
  return (
    <div className="rounded-xl bg-[#15151f] p-4 hover:bg-[#1a1a28] transition border border-brand-800/10 cursor-pointer">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
          {thread.authorInitial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {thread.pinned && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Pinned</span>
            )}
            <h3 className="text-sm font-semibold text-white truncate">{thread.title}</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{thread.author}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${CATEGORY_COLORS[thread.category]}`}>
              {thread.category}
            </span>
            <span>{thread.replies} replies</span>
            <span>{thread.lastActivity}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
