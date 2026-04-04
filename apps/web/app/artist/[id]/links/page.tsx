'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/app/components/Toast';

interface BioLink {
  id: string;
  icon: string;
  title: string;
  url: string;
  clicks: number;
}

const gradientPresets = [
  { name: 'Crimson Night', value: 'from-red-600/30 to-brand-950' },
  { name: 'Ocean Deep', value: 'from-blue-600/30 to-brand-950' },
  { name: 'Purple Haze', value: 'from-purple-600/30 to-brand-950' },
  { name: 'Emerald', value: 'from-green-600/30 to-brand-950' },
  { name: 'Sunset', value: 'from-orange-500/30 to-brand-950' },
];

const defaultLinks: BioLink[] = [
  { id: '1', icon: '🎵', title: 'Spotify', url: 'https://open.spotify.com/artist/example', clicks: 1243 },
  { id: '2', icon: '🍎', title: 'Apple Music', url: 'https://music.apple.com/artist/example', clicks: 876 },
  { id: '3', icon: '📺', title: 'YouTube', url: 'https://youtube.com/@example', clicks: 2104 },
  { id: '4', icon: '📸', title: 'Instagram', url: 'https://instagram.com/example', clicks: 1567 },
  { id: '5', icon: '🎶', title: 'TikTok', url: 'https://tiktok.com/@example', clicks: 934 },
  { id: '6', icon: '🐦', title: 'Twitter/X', url: 'https://x.com/example', clicks: 412 },
  { id: '7', icon: '🌐', title: 'Website', url: 'https://example.com', clicks: 298 },
  { id: '8', icon: '🛍️', title: 'Merch Store', url: 'https://opynx.com/merch/example', clicks: 651 },
];

export default function LinkInBioPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { data: artist } = trpc.users.getById.useQuery({ id });

  const [links, setLinks] = useState<BioLink[]>(defaultLinks);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(0);

  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const mostClicked = [...links].sort((a, b) => b.clicks - a.clicks)[0];
  const clicksToday = 147; // mock

  const shareUrl = `opynx.com/artist/${id}/links`;

  const handleCopyShare = () => {
    navigator.clipboard.writeText(`https://${shareUrl}`);
    toast('Link copied to clipboard!', 'success');
  };

  const handleAddLink = () => {
    if (!newTitle.trim() || !newUrl.trim()) {
      toast('Title and URL are required', 'error');
      return;
    }
    const newLink: BioLink = {
      id: `link_${Date.now()}`,
      icon: '🔗',
      title: newTitle.trim(),
      url: newUrl.trim(),
      clicks: 0,
    };
    setLinks([...links, newLink]);
    setNewTitle('');
    setNewUrl('');
    toast('Link added!', 'success');
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...links];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setLinks(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === links.length - 1) return;
    const updated = [...links];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setLinks(updated);
  };

  const handleDelete = (linkId: string) => {
    setLinks(links.filter((l) => l.id !== linkId));
    toast('Link removed', 'success');
  };

  const truncateUrl = (url: string, maxLen = 40) => {
    if (url.length <= maxLen) return url;
    return url.slice(0, maxLen) + '...';
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/artist/${id}`} className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">
            ← Back to Profile
          </Link>
          <h1 className="text-3xl font-bold">{artist?.name ?? 'Artist'} — Links</h1>
          <p className="text-gray-400 mt-1">
            Your link-in-bio page. Replaces Linktree — one link for everything.
          </p>
        </div>

        {/* Click Analytics */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5 text-center">
            <p className="text-2xl font-bold text-white">{totalClicks.toLocaleString()}</p>
            <p className="text-sm text-gray-400 mt-1">Total Clicks</p>
          </div>
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5 text-center">
            <p className="text-2xl font-bold text-red-400">{mostClicked?.title ?? '—'}</p>
            <p className="text-sm text-gray-400 mt-1">Most Clicked</p>
          </div>
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5 text-center">
            <p className="text-2xl font-bold text-green-400">{clicksToday}</p>
            <p className="text-sm text-gray-400 mt-1">Clicks Today</p>
          </div>
        </div>

        {/* Share Section */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Share your OPYNX link</p>
            <p className="text-white font-mono text-sm mt-1">{shareUrl}</p>
          </div>
          <button
            onClick={handleCopyShare}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
          >
            Copy
          </button>
        </div>

        {/* Links List */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Your Links</h2>
          <div className="space-y-3">
            {links.map((link, index) => (
              <div
                key={link.id}
                className="flex items-center gap-3 rounded-xl bg-brand-950/60 border border-brand-800/20 p-4"
              >
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    className="text-xs text-gray-500 hover:text-white transition disabled:opacity-30"
                    disabled={index === 0}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    className="text-xs text-gray-500 hover:text-white transition disabled:opacity-30"
                    disabled={index === links.length - 1}
                  >
                    ▼
                  </button>
                </div>

                {/* Icon */}
                <span className="text-xl">{link.icon}</span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{link.title}</p>
                  <p className="text-xs text-gray-500 truncate">{truncateUrl(link.url)}</p>
                </div>

                {/* Click Count */}
                <span className="text-sm text-gray-400 font-mono">{link.clicks.toLocaleString()} clicks</span>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="text-xs text-gray-500 hover:text-white transition">Edit</button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="text-xs text-gray-500 hover:text-red-400 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Link Form */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Add Link</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Link title"
              className="flex-1 rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
            />
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
            />
            <button
              onClick={handleAddLink}
              className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700 transition"
            >
              Add
            </button>
          </div>
        </div>

        {/* Customization */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
          <h2 className="text-lg font-bold mb-4">Customize Theme</h2>
          <div className="grid grid-cols-5 gap-3">
            {gradientPresets.map((preset, i) => (
              <button
                key={preset.name}
                onClick={() => setSelectedGradient(i)}
                className={`rounded-xl p-4 text-center transition border ${
                  selectedGradient === i
                    ? 'border-red-600 ring-1 ring-red-600'
                    : 'border-brand-800/20 hover:border-brand-700/40'
                }`}
              >
                <div className={`h-8 w-full rounded-lg bg-gradient-to-br ${preset.value} mb-2`} />
                <span className="text-xs text-gray-400">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
