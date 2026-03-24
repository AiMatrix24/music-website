'use client';

import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useState, useRef } from 'react';
import { useToast } from '@/app/components/Toast';

export default function ArtistDashboard() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const profile = trpc.users.getProfile.useQuery(undefined, {
    enabled: status === 'authenticated',
  });
  const myTracks = trpc.tracks.list.useQuery(
    { userId: session?.user?.id, limit: 10 },
    { enabled: status === 'authenticated' && !!session?.user?.id }
  );
  const myBroadcasts = trpc.broadcasts.list.useQuery(
    { artistId: session?.user?.id, limit: 10 },
    { enabled: status === 'authenticated' && !!session?.user?.id }
  );

  const [activeTab, setActiveTab] = useState<'tracks' | 'upload' | 'messages'>('tracks');

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Sign in to access Artist Dashboard</h1>
          <Link
            href="/auth/login"
            className="rounded-full bg-brand-600 px-8 py-3 font-semibold text-white"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const trackCount = myTracks.data?.length ?? 0;
  const totalPlays = myTracks.data?.reduce((sum, t) => sum + (t.playCount ?? 0), 0) ?? 0;
  const broadcastCount = myBroadcasts.data?.length ?? 0;

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Artist <span className="text-brand-500">Dashboard</span>
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Total Plays" value={formatPlays(totalPlays)} sub="All tracks" />
        <SummaryCard label="Tracks" value={String(trackCount)} sub="Published" />
        <SummaryCard label="Messages Sent" value={String(broadcastCount)} sub="To superfans" />
        <SummaryCard label="Role" value={profile.data?.role ?? 'free'} sub="Account type" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['tracks', 'upload', 'messages'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
              activeTab === tab
                ? 'bg-brand-600 text-white'
                : 'bg-[#15151f] text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'tracks' ? 'My Tracks' : tab === 'upload' ? 'Upload Music' : 'Message Fans'}
          </button>
        ))}
      </div>

      {activeTab === 'tracks' && <MyTracksTab tracks={myTracks.data ?? []} />}
      {activeTab === 'upload' && <UploadTab onSuccess={() => { myTracks.refetch(); setActiveTab('tracks'); }} />}
      {activeTab === 'messages' && <MessagesTab broadcasts={myBroadcasts.data ?? []} onSent={() => myBroadcasts.refetch()} />}
    </div>
  );
}

/* ─── My Tracks Tab ─── */
function MyTracksTab({ tracks }: { tracks: Array<{ id: string; title: string; genre: string | null; status: string; playCount: number | null }> }) {
  if (tracks.length === 0) {
    return (
      <div className="rounded-2xl bg-[#15151f] p-12 text-center">
        <p className="text-4xl mb-4">🎵</p>
        <p className="text-gray-400 text-lg mb-2">No tracks yet</p>
        <p className="text-gray-500 text-sm">Switch to the Upload tab to add your first track.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#15151f] overflow-hidden">
      <div className="divide-y divide-brand-800/10">
        {tracks.map((track) => (
          <Link
            key={track.id}
            href={`/track/${track.id}`}
            className="flex items-center justify-between px-6 py-4 transition hover:bg-brand-950/50"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-sm font-bold">
                {track.genre?.charAt(0) ?? '♪'}
              </div>
              <div>
                <p className="font-semibold">{track.title}</p>
                <p className="text-xs text-gray-500">{track.genre ?? 'No genre'} · {track.status}</p>
              </div>
            </div>
            <span className="text-sm text-gray-400">{formatPlays(track.playCount ?? 0)} plays</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─── Upload Tab ─── */
function UploadTab({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [bpm, setBpm] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [uploading, setUploading] = useState(false);

  const uploadMutation = trpc.tracks.upload.useMutation({
    onSuccess: () => {
      toast('Track uploaded successfully!');
      setFile(null);
      setTitle('');
      setGenre('');
      setBpm('');
      onSuccess();
    },
    onError: (err) => {
      toast(err.message || 'Upload failed', 'error');
      setUploading(false);
    },
  });

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && isAudioFile(f)) {
      setFile(f);
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
    } else {
      toast('Please drop an audio file (MP3, WAV, FLAC)', 'error');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && isAudioFile(f)) {
      setFile(f);
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setUploading(true);

    // Generate a slug from the title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    uploadMutation.mutate({
      title: title.trim(),
      slug,
      genre: genre || undefined,
      bpm: bpm ? parseInt(bpm) : undefined,
      visibility: visibility as 'public' | 'private' | 'unlisted' | 'subscribers_only',
      originalFileKey: `uploads/${Date.now()}-${file.name}`,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${
          file
            ? 'border-brand-500 bg-brand-600/5'
            : 'border-brand-700/30 hover:border-brand-600/50 bg-[#15151f]'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        {file ? (
          <>
            <p className="text-3xl mb-3">🎵</p>
            <p className="font-semibold text-lg">{file.name}</p>
            <p className="text-sm text-gray-400 mt-1">
              {(file.size / (1024 * 1024)).toFixed(1)} MB · Click to change
            </p>
          </>
        ) : (
          <>
            <p className="text-4xl mb-3">📁</p>
            <p className="text-gray-400 mb-2">Drag and drop an audio file here</p>
            <p className="text-sm text-gray-500">or click to browse</p>
            <p className="text-xs text-gray-600 mt-3">MP3, WAV, FLAC — Max 100MB</p>
          </>
        )}
      </div>

      {/* Track details */}
      <div className="rounded-2xl bg-[#15151f] p-6 space-y-4">
        <h3 className="font-bold text-lg">Track Details</h3>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Track title"
            required
            className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none transition"
            >
              <option value="">Select genre</option>
              <option value="Synthwave">Synthwave</option>
              <option value="Lo-fi Hip Hop">Lo-fi Hip Hop</option>
              <option value="Electronic">Electronic</option>
              <option value="Indie Rock">Indie Rock</option>
              <option value="Post-Punk">Post-Punk</option>
              <option value="Ambient">Ambient</option>
              <option value="Alternative">Alternative</option>
              <option value="Hip Hop">Hip Hop</option>
              <option value="Pop">Pop</option>
              <option value="R&B">R&amp;B</option>
              <option value="Jazz">Jazz</option>
              <option value="Classical">Classical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">BPM</label>
            <input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
              placeholder="120"
              min="1"
              max="999"
              className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none transition"
            >
              <option value="public">Public</option>
              <option value="subscribers_only">Subscribers Only</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!file || !title.trim() || uploading}
        className="w-full rounded-full bg-gradient-to-r from-brand-600 to-brand-500 py-4 font-semibold text-white text-lg transition hover:shadow-lg hover:shadow-brand-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? 'Uploading...' : 'Upload Track'}
      </button>
    </form>
  );
}

/* ─── Messages Tab ─── */
function MessagesTab({
  broadcasts,
  onSent,
}: {
  broadcasts: Array<{ id: string; title: string; body: string; type: string; subscribersOnly: boolean; publishedAt: Date | null; createdAt: Date }>;
  onSent: () => void;
}) {
  const { toast } = useToast();
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<'text' | 'announcement' | 'exclusive'>('text');
  const [subscribersOnly, setSubscribersOnly] = useState(true);

  const sendMutation = trpc.broadcasts.send.useMutation({
    onSuccess: () => {
      toast('Message sent to your fans!');
      setTitle('');
      setBody('');
      setComposing(false);
      onSent();
    },
    onError: (err) => {
      toast(err.message || 'Failed to send', 'error');
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    sendMutation.mutate({
      title: title.trim(),
      body: body.trim(),
      type,
      subscribersOnly,
    });
  };

  return (
    <div className="space-y-6">
      {/* Compose button or form */}
      {!composing ? (
        <button
          onClick={() => setComposing(true)}
          className="w-full rounded-2xl bg-[#15151f] border-2 border-dashed border-brand-700/30 p-8 text-center transition hover:border-brand-600/50"
        >
          <p className="text-3xl mb-2">✉️</p>
          <p className="font-semibold text-lg">Compose Message</p>
          <p className="text-sm text-gray-400">Send a message to your superfans</p>
        </button>
      ) : (
        <form onSubmit={handleSend} className="rounded-2xl bg-[#15151f] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">New Message</h3>
            <button
              type="button"
              onClick={() => setComposing(false)}
              className="text-gray-400 hover:text-white transition text-sm"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Subject *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New track dropping Friday!"
              required
              className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Message *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message to fans..."
              rows={5}
              required
              className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none transition"
              >
                <option value="text">Message</option>
                <option value="announcement">Announcement</option>
                <option value="exclusive">Exclusive Content</option>
              </select>
            </div>

            <div className="flex-1 flex items-end">
              <label className="flex items-center gap-3 cursor-pointer py-3">
                <input
                  type="checkbox"
                  checked={subscribersOnly}
                  onChange={(e) => setSubscribersOnly(e.target.checked)}
                  className="w-5 h-5 rounded bg-brand-950 border-brand-800/30 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-300">Subscribers only</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={!title.trim() || !body.trim() || sendMutation.isPending}
            className="w-full rounded-full bg-gradient-to-r from-brand-600 to-brand-500 py-3 font-semibold text-white transition hover:shadow-lg hover:shadow-brand-600/30 disabled:opacity-50"
          >
            {sendMutation.isPending ? 'Sending...' : 'Send to Fans'}
          </button>
        </form>
      )}

      {/* Previous messages */}
      <div>
        <h3 className="font-bold text-lg mb-4">Sent Messages</h3>
        {broadcasts.length > 0 ? (
          <div className="space-y-3">
            {broadcasts.map((b) => (
              <div key={b.id} className="rounded-2xl bg-[#15151f] p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{b.title}</h4>
                      <span className="text-xs bg-brand-600/20 text-brand-400 px-2 py-0.5 rounded-full">
                        {b.type}
                      </span>
                      {b.subscribersOnly && (
                        <span className="text-xs bg-pink-600/20 text-pink-400 px-2 py-0.5 rounded-full">
                          Subs only
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(b.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 whitespace-pre-wrap">{b.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#15151f] p-8 text-center">
            <p className="text-gray-500">No messages sent yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function SummaryCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-[#15151f] p-6">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-brand-400">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

function formatPlays(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

function isAudioFile(file: File): boolean {
  const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp3', 'audio/x-wav', 'audio/ogg'];
  return audioTypes.includes(file.type) || /\.(mp3|wav|flac|ogg)$/i.test(file.name);
}
