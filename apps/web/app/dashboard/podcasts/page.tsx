'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';
import { trpc } from '@/lib/trpc/client';

export default function PodcastDashboardPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [tab, setTab] = useState<'shows' | 'create'>('shows');

  // Create show form
  const [showTitle, setShowTitle] = useState('');
  const [showDescription, setShowDescription] = useState('');
  const [showCategory, setShowCategory] = useState('Music');

  // Real data from tRPC
  const utils = trpc.useUtils();
  const { data: shows = [], isLoading } = trpc.podcasts.list.useQuery(
    { userId: session?.user?.id },
    { enabled: status === 'authenticated' && !!session?.user?.id }
  );

  const createMutation = trpc.podcasts.create.useMutation({
    onSuccess: () => {
      toast('Podcast show created!', 'success');
      setTab('shows');
      setShowTitle('');
      setShowDescription('');
      setShowCategory('Music');
      utils.podcasts.list.invalidate();
    },
    onError: (err) => {
      toast(err.message || 'Failed to create show', 'error');
    },
  });

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl mb-2">&#127897;</p>
        <p className="text-gray-400">Sign in to manage podcasts</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Sign In</Link>
      </div>
    );
  }

  const handleCreateShow = () => {
    if (!showTitle) { toast('Enter a show title', 'error'); return; }
    createMutation.mutate({
      title: showTitle,
      description: showDescription || undefined,
      category: showCategory,
    });
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">&larr; Dashboard</Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Podcasts</h1>
            <p className="text-gray-400 mt-1">Create and manage your podcast shows</p>
          </div>
          <button onClick={() => setTab(tab === 'create' ? 'shows' : 'create')}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500 transition">
            {tab === 'create' ? 'Cancel' : '+ New Show'}
          </button>
        </div>

        {/* Create Show */}
        {tab === 'create' && (
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-8">
            <h2 className="text-lg font-bold mb-4">Create Podcast Show</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Show Title *</label>
                <input value={showTitle} onChange={(e) => setShowTitle(e.target.value)} placeholder="e.g. Behind The Beat"
                  className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea value={showDescription} onChange={(e) => setShowDescription(e.target.value)}
                  placeholder="What's your podcast about?" rows={3}
                  className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Category</label>
                  <select value={showCategory} onChange={(e) => setShowCategory(e.target.value)}
                    className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-red-600 outline-none transition">
                    {['Music', 'Arts', 'Technology', 'Business', 'Education', 'Comedy', 'Society & Culture', 'News'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Cover Art</label>
                  <div className="w-full bg-brand-950 border-2 border-dashed border-brand-800/30 rounded-xl px-4 py-3 text-center cursor-pointer hover:border-red-600 transition">
                    <span className="text-gray-500 text-sm">&#128247; Upload (3000x3000)</span>
                  </div>
                </div>
              </div>
              <button onClick={handleCreateShow} disabled={createMutation.isPending}
                className="rounded-full bg-red-600 px-8 py-3 font-semibold text-white hover:bg-red-500 transition disabled:opacity-50">
                {createMutation.isPending ? 'Creating...' : 'Create Show'}
              </button>
            </div>
          </div>
        )}

        {/* Shows list */}
        {tab === 'shows' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="rounded-2xl bg-[#15151f] p-16 text-center">
                <p className="text-gray-400">Loading your podcasts...</p>
              </div>
            ) : shows.length === 0 ? (
              <div className="rounded-2xl bg-[#15151f] p-16 text-center">
                <p className="text-5xl mb-4">&#127897;</p>
                <h2 className="text-xl font-bold mb-2">No podcasts yet</h2>
                <p className="text-gray-400 mb-6">Start your first podcast show and reach fans in a new way.</p>
                <button onClick={() => setTab('create')}
                  className="rounded-full bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-500 transition">
                  Create Your First Show
                </button>
              </div>
            ) : (
              shows.map((show) => (
                <div key={show.id} className="rounded-2xl bg-[#15151f] border border-brand-800/20 overflow-hidden">
                  {/* Show header */}
                  <div className="p-6 border-b border-brand-800/20">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-red-600 to-purple-700 flex items-center justify-center text-3xl shrink-0">
                        &#127897;
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold">{show.title}</h2>
                        <p className="text-sm text-gray-400 mt-1">{show.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span>{show.episodeCount} episodes</span>
                          <span>{formatNumber(show.totalPlays)} plays</span>
                          {show.category && (
                            <span className="text-xs bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full">{show.category}</span>
                          )}
                        </div>
                      </div>
                      <Link href={`/dashboard/podcasts/${show.id}/upload`}
                        className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition shrink-0">
                        + Episode
                      </Link>
                    </div>

                    {/* RSS feed */}
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex-1 bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 font-mono text-xs text-gray-500 truncate">
                        https://opynx.com/rss/{show.id}
                      </div>
                      <button onClick={() => { navigator.clipboard?.writeText(`https://opynx.com/rss/${show.id}`); toast('RSS URL copied!', 'success'); }}
                        className="text-xs text-red-400 font-semibold hover:text-red-300 transition">
                        Copy RSS
                      </button>
                    </div>

                    {/* Distribution */}
                    <div className="mt-3 flex gap-2">
                      {['Apple Podcasts', 'Spotify', 'Google', 'YouTube'].map((p) => (
                        <span key={p} className="text-xs bg-brand-950 border border-brand-800/30 text-gray-500 px-3 py-1 rounded-full">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Episodes */}
                  <div className="divide-y divide-brand-800/10">
                    {show.episodes.length === 0 ? (
                      <div className="px-6 py-8 text-center text-gray-500 text-sm">
                        No episodes yet. Upload your first episode!
                      </div>
                    ) : (
                      show.episodes.map((ep) => (
                        <div key={ep.id} className="px-6 py-4 flex items-center gap-4 transition hover:bg-brand-950/50">
                          <button className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shrink-0 hover:bg-red-500 transition">
                            &#9654;
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{ep.title}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              {ep.duration != null && <span>{formatDuration(ep.duration)}</span>}
                              <span>{formatNumber(ep.downloadCount ?? 0)} plays</span>
                              {ep.publishedAt && (
                                <span>{new Date(ep.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              )}
                              <span className="text-xs capitalize">{ep.status}</span>
                            </div>
                          </div>
                          <button className="text-xs text-gray-500 hover:text-white transition">&hellip;</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
