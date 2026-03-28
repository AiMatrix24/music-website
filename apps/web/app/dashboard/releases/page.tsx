'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';

interface Release {
  id: number;
  title: string;
  type: 'Single' | 'EP' | 'Album';
  date: string;
  preSave: boolean;
  announcement: boolean;
  autoPost: boolean;
  countdown: boolean;
  status: 'scheduled' | 'released';
  streams?: number;
  saves?: number;
}

const MOCK_RELEASES: Release[] = [
  { id: 1, title: 'Midnight Hour', type: 'Single', date: '2026-04-15', preSave: true, announcement: true, autoPost: true, countdown: true, status: 'scheduled' },
  { id: 2, title: 'Echoes EP', type: 'EP', date: '2026-05-01', preSave: true, announcement: false, autoPost: true, countdown: false, status: 'scheduled' },
  { id: 3, title: 'Summertime Blues', type: 'Single', date: '2026-06-20', preSave: false, announcement: true, autoPost: false, countdown: true, status: 'scheduled' },
  { id: 4, title: 'Neon Nights', type: 'Album', date: '2026-01-10', preSave: false, announcement: false, autoPost: false, countdown: false, status: 'released', streams: 145000, saves: 3200 },
  { id: 5, title: 'Broken Glass', type: 'Single', date: '2025-11-22', preSave: false, announcement: false, autoPost: false, countdown: false, status: 'released', streams: 52000, saves: 1100 },
];

const TYPE_COLORS: Record<string, string> = {
  Single: 'bg-blue-500/20 text-blue-400',
  EP: 'bg-purple-500/20 text-purple-400',
  Album: 'bg-red-600/20 text-red-400',
};

export default function ReleasePlannerPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [releases, setReleases] = useState<Release[]>(MOCK_RELEASES);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: '',
    type: 'Single' as 'Single' | 'EP' | 'Album',
    date: '',
    preSave: false,
    announcement: false,
    autoPost: false,
    countdown: false,
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-brand-950 p-8 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-brand-950 p-8 flex flex-col items-center justify-center gap-4">
        <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        <h2 className="text-xl font-bold text-white">Sign in Required</h2>
        <p className="text-gray-400 text-center">You need to sign in to access the Release Planner.</p>
        <Link href="/api/auth/signin" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition">Sign In</Link>
      </div>
    );
  }

  const upcoming = releases.filter((r) => r.status === 'scheduled').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = releases.filter((r) => r.status === 'released').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getDaysUntil = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getMonthGroup = (date: string) => {
    const d = new Date(date);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId !== null) {
      setReleases(releases.map((r) => r.id === editingId ? { ...r, ...form } : r));
      toast('Release updated!', 'success');
      setEditingId(null);
    } else {
      const newRelease: Release = {
        id: Date.now(),
        ...form,
        status: 'scheduled',
      };
      setReleases([...releases, newRelease]);
      toast('Release scheduled!', 'success');
    }
    setShowForm(false);
    setForm({ title: '', type: 'Single', date: '', preSave: false, announcement: false, autoPost: false, countdown: false });
  };

  const handleEdit = (release: Release) => {
    setForm({
      title: release.title,
      type: release.type,
      date: release.date,
      preSave: release.preSave,
      announcement: release.announcement,
      autoPost: release.autoPost,
      countdown: release.countdown,
    });
    setEditingId(release.id);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    setReleases(releases.filter((r) => r.id !== id));
    toast('Release deleted.', 'info');
  };

  // Group upcoming by month
  const monthGroups: Record<string, Release[]> = {};
  upcoming.forEach((r) => {
    const month = getMonthGroup(r.date);
    if (!monthGroups[month]) monthGroups[month] = [];
    monthGroups[month].push(r);
  });

  return (
    <div className="min-h-screen bg-brand-950 p-6 md:p-8 max-w-5xl mx-auto">
      <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm mb-6 inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-4 mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Release Planner</h1>
          <p className="text-gray-400 mt-1">Schedule and manage your upcoming releases.</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: '', type: 'Single', date: '', preSave: false, announcement: false, autoPost: false, countdown: false }); }} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition whitespace-nowrap">
          {showForm ? 'Cancel' : 'Schedule Release'}
        </button>
      </div>

      {/* Schedule Release Form */}
      {showForm && (
        <div className="bg-[#15151f] rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">{editingId ? 'Edit Release' : 'Schedule a Release'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-300 block mb-1">Track / Album Title</label>
                <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-brand-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600" placeholder="Song title" />
              </div>
              <div>
                <label className="text-sm text-gray-300 block mb-1">Release Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'Single' | 'EP' | 'Album' })} className="w-full bg-brand-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600">
                  <option value="Single">Single</option>
                  <option value="EP">EP</option>
                  <option value="Album">Album</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-300 block mb-1">Release Date</label>
                <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full bg-brand-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'preSave', label: 'Enable Pre-save' },
                { key: 'announcement', label: 'Send Announcement' },
                { key: 'autoPost', label: 'Auto-post to Social' },
                { key: 'countdown', label: 'Show Countdown' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer bg-brand-950 rounded-lg p-3 border border-gray-700">
                  <input type="checkbox" checked={form[key as keyof typeof form] as boolean} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="accent-red-600 w-4 h-4" />
                  <span className="text-sm text-gray-300">{label}</span>
                </label>
              ))}
            </div>

            <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-xl transition">
              {editingId ? 'Update Release' : 'Schedule Release'}
            </button>
          </form>
        </div>
      )}

      {/* Calendar-style: Upcoming by month */}
      <h2 className="text-xl font-bold text-white mb-4">Upcoming Releases</h2>
      {Object.keys(monthGroups).length === 0 ? (
        <div className="bg-[#15151f] rounded-xl p-8 text-center text-gray-400 mb-8">
          <p>No upcoming releases scheduled.</p>
        </div>
      ) : (
        <div className="space-y-6 mb-10">
          {Object.entries(monthGroups).map(([month, items]) => (
            <div key={month}>
              <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wide mb-3">{month}</h3>
              <div className="space-y-3">
                {items.map((release) => {
                  const days = getDaysUntil(release.date);
                  return (
                    <div key={release.id} className="bg-[#15151f] rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-center bg-brand-950 rounded-lg px-3 py-2 min-w-[60px]">
                          <p className="text-white font-bold text-lg">{new Date(release.date).getDate()}</p>
                          <p className="text-gray-500 text-xs">{new Date(release.date).toLocaleString('en-US', { weekday: 'short' })}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-semibold">{release.title}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[release.type]}`}>{release.type}</span>
                          </div>
                          <div className="flex gap-3 mt-1 flex-wrap">
                            {release.preSave && <span className="text-xs text-gray-400">Pre-save</span>}
                            {release.announcement && <span className="text-xs text-gray-400">Announcement</span>}
                            {release.autoPost && <span className="text-xs text-gray-400">Auto-post</span>}
                            {release.countdown && <span className="text-xs text-gray-400">Countdown</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-red-500 font-semibold text-sm whitespace-nowrap">{days} days</span>
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Scheduled</span>
                        <button onClick={() => handleEdit(release)} className="text-gray-400 hover:text-white text-sm">Edit</button>
                        <button onClick={() => handleDelete(release.id)} className="text-gray-400 hover:text-red-500 text-sm">Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Past Releases */}
      <h2 className="text-xl font-bold text-white mb-4">Released</h2>
      {past.length === 0 ? (
        <div className="bg-[#15151f] rounded-xl p-8 text-center text-gray-400">
          <p>No past releases yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {past.map((release) => (
            <div key={release.id} className="bg-[#15151f] rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="text-center bg-brand-950 rounded-lg px-3 py-2 min-w-[60px]">
                  <p className="text-gray-400 font-bold text-lg">{new Date(release.date).getDate()}</p>
                  <p className="text-gray-600 text-xs">{new Date(release.date).toLocaleString('en-US', { month: 'short' })}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-semibold">{release.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[release.type]}`}>{release.type}</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">{new Date(release.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-white text-sm font-semibold">{release.streams?.toLocaleString()} streams</p>
                  <p className="text-gray-500 text-xs">{release.saves?.toLocaleString()} saves</p>
                </div>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Released</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
