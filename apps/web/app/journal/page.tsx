'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const MOOD_OPTIONS = [
  { emoji: '\u{1F60A}', label: 'Happy' },
  { emoji: '\u{1F622}', label: 'Sad' },
  { emoji: '\u{1F624}', label: 'Energetic' },
  { emoji: '\u{1F60C}', label: 'Chill' },
  { emoji: '\u{1F914}', label: 'Reflective' },
];

const TAG_OPTIONS = ['Road Trip', 'Workout', 'Late Night', 'Studying', 'Cooking', 'Walking', 'Memories'];

interface JournalEntry {
  id: string;
  date: string;
  month: string;
  mood: string;
  moodLabel: string;
  track: string;
  creator: string;
  text: string;
  tags: string[];
}

const MOCK_ENTRIES: JournalEntry[] = [
  {
    id: 'j1',
    date: 'March 28, 2026',
    month: 'March 2026',
    mood: '\u{1F60A}',
    moodLabel: 'Happy',
    track: 'Neon Highway',
    creator: 'ZVRA',
    text: 'Discovered this track on the way to work and it completely changed my morning. The synth layers feel like driving through a city at night.',
    tags: ['Road Trip', 'Memories'],
  },
  {
    id: 'j2',
    date: 'March 26, 2026',
    month: 'March 2026',
    mood: '\u{1F60C}',
    moodLabel: 'Chill',
    track: 'Ocean Protocol',
    creator: 'Mira Solis',
    text: 'Perfect background for a rainy afternoon. Made some tea and just let this wash over me. Exactly what I needed today.',
    tags: ['Late Night', 'Studying'],
  },
  {
    id: 'j3',
    date: 'March 24, 2026',
    month: 'March 2026',
    mood: '\u{1F624}',
    moodLabel: 'Energetic',
    track: 'Phantom Signal',
    creator: 'KVLT',
    text: 'Hit a new PR at the gym with this blasting. The drop at 2:15 gives me superhuman strength apparently.',
    tags: ['Workout'],
  },
  {
    id: 'j4',
    date: 'March 20, 2026',
    month: 'March 2026',
    mood: '\u{1F914}',
    moodLabel: 'Reflective',
    track: 'Crystal Waves',
    creator: 'ZVRA',
    text: 'This song reminds me of last summer. Funny how music can transport you to a specific moment in time.',
    tags: ['Memories', 'Walking'],
  },
  {
    id: 'j5',
    date: 'March 15, 2026',
    month: 'March 2026',
    mood: '\u{1F622}',
    moodLabel: 'Sad',
    track: 'Deep Currents',
    creator: 'Undertow',
    text: 'One of those days where you need music that understands you. This track has such beautiful melancholy in its chord progression.',
    tags: ['Late Night'],
  },
  {
    id: 'j6',
    date: 'February 28, 2026',
    month: 'February 2026',
    mood: '\u{1F60A}',
    moodLabel: 'Happy',
    track: 'Solar Drift',
    creator: 'Aether',
    text: 'Cooked a big dinner for friends with this album on repeat. Everyone asked what was playing. Great conversation starter.',
    tags: ['Cooking', 'Memories'],
  },
];

const STATS = {
  entriesThisMonth: 5,
  topMood: '\u{1F60A} Happy',
  topArtist: 'ZVRA',
  topTag: 'Memories',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function JournalPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // View mode
  const [view, setView] = useState<'feed' | 'calendar'>('feed');
  const [showNewEntry, setShowNewEntry] = useState(false);

  // New entry form
  const [entryDate, setEntryDate] = useState('2026-03-28');
  const [entryMood, setEntryMood] = useState('');
  const [entryTrack, setEntryTrack] = useState('');
  const [entryText, setEntryText] = useState('');
  const [entryTags, setEntryTags] = useState<string[]>([]);

  // Entries state
  const [entries, setEntries] = useState<JournalEntry[]>(MOCK_ENTRIES);

  // Calendar state
  const [calYear] = useState(2026);
  const [calMonth] = useState(2); // March (0-indexed)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const toggleTag = (tag: string) => {
    setEntryTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveEntry = () => {
    if (!entryMood) {
      toast('Please select a mood.', 'error');
      return;
    }
    if (!entryText.trim()) {
      toast('Please write something in your journal entry.', 'error');
      return;
    }
    const moodOption = MOOD_OPTIONS.find((m) => m.emoji === entryMood);
    const newEntry: JournalEntry = {
      id: `j${Date.now()}`,
      date: new Date(entryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      month: new Date(entryDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      mood: entryMood,
      moodLabel: moodOption?.label || '',
      track: entryTrack || 'Unknown Track',
      creator: 'Unknown Creator',
      text: entryText,
      tags: entryTags,
    };
    setEntries((prev) => [newEntry, ...prev]);
    toast('Journal entry saved!', 'success');
    setShowNewEntry(false);
    setEntryMood('');
    setEntryTrack('');
    setEntryText('');
    setEntryTags([]);
  };

  // Group entries by month
  const groupedEntries = entries.reduce<Record<string, JournalEntry[]>>((acc, entry) => {
    if (!acc[entry.month]) acc[entry.month] = [];
    acc[entry.month].push(entry);
    return acc;
  }, {});

  // Calendar: which days have entries
  const entryDays = new Set(
    entries
      .filter((e) => e.month === 'March 2026')
      .map((e) => {
        const match = e.date.match(/(\d+)/);
        return match ? parseInt(match[0]) : 0;
      })
  );

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="rounded-2xl bg-[#15151f] h-48 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl bg-[#15151f] h-40 animate-pulse" />
              ))}
            </div>
            <div className="rounded-xl bg-[#15151f] h-64 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-black mb-4">Sign In Required</h1>
          <p className="text-gray-400 mb-6">Sign in to access your music journal.</p>
          <Link href="/auth/login" className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          &larr; Back to Home
        </Link>

        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-red-600/20 to-purple-600/20 border border-red-600/30 p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black mb-2">&#128214; Music Journal</h1>
              <p className="text-gray-400">Your personal listening diary</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewEntry(!showNewEntry)}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition"
              >
                New Entry
              </button>
              <button
                onClick={() => toast('Export coming soon!', 'info')}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition"
              >
                Export Journal
              </button>
            </div>
          </div>
        </div>

        {/* New Entry Form */}
        {showNewEntry && (
          <div className="rounded-2xl bg-[#15151f] border border-white/5 p-6 mb-8">
            <h2 className="text-lg font-bold mb-4">New Journal Entry</h2>
            <div className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Date</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-600/50"
                />
              </div>

              {/* Mood */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">How are you feeling?</label>
                <div className="flex gap-2">
                  {MOOD_OPTIONS.map((mood) => (
                    <button
                      key={mood.label}
                      onClick={() => setEntryMood(mood.emoji)}
                      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition ${
                        entryMood === mood.emoji
                          ? 'bg-red-600/10 border-red-600'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="text-2xl">{mood.emoji}</span>
                      <span className="text-[10px] text-gray-400">{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Track */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">What are you listening to?</label>
                <input
                  type="text"
                  value={entryTrack}
                  onChange={(e) => setEntryTrack(e.target.value)}
                  placeholder="Track name or creator..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-600/50"
                />
              </div>

              {/* Journal Text */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Journal Entry</label>
                <textarea
                  value={entryText}
                  onChange={(e) => setEntryText(e.target.value)}
                  placeholder="What's on your mind..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-600/50 resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm border transition ${
                        entryTags.includes(tag)
                          ? 'bg-red-600/20 border-red-600/50 text-red-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleSaveEntry} className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition">
                Save Entry
              </button>
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setView('feed')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              view === 'feed' ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Feed View
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              view === 'calendar' ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Calendar View
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {view === 'feed' ? (
              /* ---- Feed View ---- */
              <div className="space-y-8">
                {Object.entries(groupedEntries).map(([month, monthEntries]) => (
                  <div key={month}>
                    <h3 className="text-lg font-bold mb-4 text-gray-300">{month}</h3>
                    <div className="space-y-4">
                      {monthEntries.map((entry) => (
                        <div key={entry.id} className="rounded-2xl bg-[#15151f] border border-white/5 p-5 hover:border-white/10 transition">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-500">{entry.date}</span>
                            <span className="text-xl" title={entry.moodLabel}>{entry.mood}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600/20 to-purple-600/20 flex items-center justify-center text-sm">
                              &#9835;
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{entry.track}</p>
                              <p className="text-xs text-gray-500 truncate">{entry.creator}</p>
                            </div>
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed mb-3">{entry.text}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1.5">
                              {entry.tags.map((tag) => (
                                <span key={tag} className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-gray-400">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            {/* Waveform decoration */}
                            <div className="flex items-end gap-[2px] h-4">
                              {[3, 6, 4, 8, 5, 7, 3, 6, 4, 5].map((h, i) => (
                                <div
                                  key={i}
                                  className="w-[2px] rounded-full bg-red-600/30"
                                  style={{ height: `${h * 2}px` }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* ---- Calendar View ---- */
              <div className="rounded-2xl bg-[#15151f] border border-white/5 p-6">
                <h3 className="text-lg font-bold mb-4">March 2026</h3>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-xs text-gray-500 py-2 font-medium">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for first day offset */}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {/* Days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const hasEntry = entryDays.has(day);
                    const isToday = day === 28;
                    return (
                      <div
                        key={day}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition ${
                          hasEntry
                            ? 'bg-red-600/20 border border-red-600/30 text-red-400 font-medium'
                            : isToday
                            ? 'bg-white/10 text-white font-medium'
                            : 'text-gray-500 hover:bg-white/5'
                        }`}
                      >
                        <span>{day}</span>
                        {hasEntry && <span className="w-1 h-1 rounded-full bg-red-500 mt-0.5" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#15151f] border border-white/5 p-6">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">This Month</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-black">{STATS.entriesThisMonth}</p>
                  <p className="text-xs text-gray-500">Entries written</p>
                </div>
                <div className="border-t border-white/5 pt-3">
                  <p className="text-sm text-gray-400">Top Mood</p>
                  <p className="font-semibold">{STATS.topMood}</p>
                </div>
                <div className="border-t border-white/5 pt-3">
                  <p className="text-sm text-gray-400">Most Journaled Creator</p>
                  <p className="font-semibold">{STATS.topArtist}</p>
                </div>
                <div className="border-t border-white/5 pt-3">
                  <p className="text-sm text-gray-400">Most Used Tag</p>
                  <p className="font-semibold">{STATS.topTag}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#15151f] border border-white/5 p-6">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Tips</h2>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>&#8226; Journal after each listening session</li>
                <li>&#8226; Tag entries for easy filtering later</li>
                <li>&#8226; Reflect on how music affects your mood</li>
                <li>&#8226; Export your journal as a keepsake</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
