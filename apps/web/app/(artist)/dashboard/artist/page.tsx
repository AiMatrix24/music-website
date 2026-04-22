'use client';

import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useState, useRef } from 'react';
import { useToast } from '@/app/components/Toast';
import { PodcastsTab } from '@/app/components/podcast/PodcastsTab';
import { CoverImageField } from '@/app/components/podcast/CoverImageField';
import { TrackEditForm, type EditableTrack } from '@/app/components/track/TrackEditForm';
import { useUploadThing } from '@/lib/uploadthing-client';

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

  const myEvents = trpc.events.list.useQuery(
    { limit: 20 },
    { enabled: status === 'authenticated' }
  );

  const [activeTab, setActiveTab] = useState<'tracks' | 'upload' | 'messages' | 'events' | 'podcasts'>('tracks');

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
          <h1 className="text-3xl font-bold mb-4">Sign in to access Creator Dashboard</h1>
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
        Creator <span className="text-brand-500">Dashboard</span>
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Total Plays" value={formatPlays(totalPlays)} sub="All tracks" />
        <SummaryCard label="Tracks" value={String(trackCount)} sub="Published" />
        <SummaryCard label="Messages Sent" value={String(broadcastCount)} sub="To superfans" />
        <SummaryCard label="Role" value={profile.data?.role ?? 'free'} sub="Account type" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {(['tracks', 'upload', 'events', 'podcasts', 'messages'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${
              activeTab === tab
                ? 'bg-brand-600 text-white'
                : 'bg-[#15151f] text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'tracks' ? 'My Tracks' : tab === 'upload' ? 'Upload Music' : tab === 'events' ? 'Events & Tickets' : tab === 'podcasts' ? 'Podcasts' : 'Message Fans'}
          </button>
        ))}
      </div>

      {activeTab === 'tracks' && <MyTracksTab tracks={myTracks.data ?? []} />}
      {activeTab === 'upload' && <UploadTab onSuccess={() => { myTracks.refetch(); setActiveTab('tracks'); }} />}
      {activeTab === 'events' && <EventsTab events={myEvents.data ?? []} onRefresh={() => myEvents.refetch()} />}
      {activeTab === 'podcasts' && <PodcastsTab />}
      {activeTab === 'messages' && <MessagesTab broadcasts={myBroadcasts.data ?? []} onSent={() => myBroadcasts.refetch()} />}
    </div>
  );
}

/* ─── My Tracks Tab ─── */
type MyTracksTabTrack = {
  id: string;
  title: string;
  genre: string | null;
  bpm?: number | null;
  duration?: number | null;
  visibility?: 'public' | 'private' | 'unlisted' | 'subscribers_only';
  status: string;
  playCount: number | null;
  price?: number | null;
  audioUrl?: string | null;
  coverUrl?: string | null;
};

function MyTracksTab({ tracks }: { tracks: Array<MyTracksTabTrack> }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState<EditableTrack | null>(null);

  const deleteMutation = trpc.tracks.delete.useMutation({
    onSuccess: () => {
      toast('Track deleted', 'success');
      utils.tracks.list.invalidate();
    },
    onError: (err) => toast(err.message || 'Delete failed', 'error'),
  });

  if (editing) {
    return (
      <div className="space-y-4">
        <button onClick={() => setEditing(null)} className="text-sm text-gray-400 hover:text-white">
          ← Back to tracks
        </button>
        <TrackEditForm
          track={editing}
          onSaved={() => {
            setEditing(null);
            utils.tracks.list.invalidate();
          }}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

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
          <div key={track.id} className="flex items-center justify-between gap-3 px-6 py-4 transition hover:bg-brand-950/50">
            <Link href={`/track/${track.id}`} className="flex items-center gap-4 flex-1 min-w-0">
              {track.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={track.coverUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-sm font-bold shrink-0">
                  {track.genre?.charAt(0) ?? '♪'}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold truncate">{track.title}</p>
                <p className="text-xs text-gray-500 truncate">
                  {track.genre ?? 'No genre'} · {track.status}
                  {!track.audioUrl && <span className="text-amber-400"> · no audio</span>}
                </p>
              </div>
            </Link>
            <span className="text-sm text-gray-400 hidden sm:block shrink-0">{formatPlays(track.playCount ?? 0)} plays</span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() =>
                  setEditing({
                    id: track.id,
                    title: track.title,
                    genre: track.genre,
                    bpm: track.bpm ?? null,
                    duration: track.duration ?? null,
                    visibility: (track.visibility as EditableTrack['visibility']) ?? 'public',
                    price: track.price ?? null,
                    audioUrl: track.audioUrl ?? null,
                    coverUrl: track.coverUrl ?? null,
                  })
                }
                className="text-xs px-3 py-1 rounded-full bg-brand-950 border border-brand-800/30 text-gray-300 hover:text-white transition"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${track.title}"?`)) {
                    deleteMutation.mutate({ id: track.id });
                  }
                }}
                className="text-xs px-3 py-1 rounded-full bg-red-950/40 border border-red-800/30 text-red-400 hover:bg-red-900/40 hover:text-red-300 transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Upload Tab ─── */
const TRACK_GENRES = [
  'Synthwave', 'Lo-fi Hip Hop', 'Electronic', 'Indie Rock', 'Post-Punk',
  'Ambient', 'Alternative', 'Hip Hop', 'Pop', 'R&B', 'Jazz', 'Classical',
];

function UploadTab({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [bpm, setBpm] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioMode, setAudioMode] = useState<'upload' | 'url'>('upload');
  const [audioError, setAudioError] = useState('');
  const [duration, setDuration] = useState<number | null>(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { startUpload, isUploading } = useUploadThing('audioUpload', {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl ?? res?.[0]?.url;
      if (url) {
        setAudioUrl(url);
        setAudioError('');
        toast('Audio uploaded', 'success');
      } else {
        setAudioError('Upload completed but no URL returned. Try paste-URL mode.');
      }
    },
    onUploadError: (err) => {
      const msg = err.message || 'Audio upload failed';
      setAudioError(msg);
      toast(msg, 'error');
    },
  });

  const uploadMutation = trpc.tracks.upload.useMutation({
    onSuccess: () => {
      toast('Track published!', 'success');
      setFile(null);
      setTitle('');
      setGenre('');
      setBpm('');
      setAudioUrl('');
      setCoverUrl('');
      setDuration(null);
      setAudioError('');
      setSubmitting(false);
      onSuccess();
    },
    onError: (err) => {
      toast(err.message || 'Publish failed', 'error');
      setSubmitting(false);
    },
  });

  const handleFile = async (f: File | null) => {
    setAudioError('');
    if (!f) return;
    if (!isAudioFile(f)) {
      setAudioError('Please choose an audio file (MP3, WAV, FLAC, M4A)');
      toast('Please choose an audio file (MP3, WAV, FLAC, M4A)', 'error');
      return;
    }
    if (f.size > 64 * 1024 * 1024) {
      setAudioError(`File is ${(f.size / 1024 / 1024).toFixed(1)}MB — max 64MB. Try paste-URL mode.`);
      toast('File too large for upload — try paste-URL', 'error');
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));

    // Probe duration via HTML5 audio
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration)) setDuration(Math.round(audio.duration));
      URL.revokeObjectURL(audio.src);
    };
    audio.src = URL.createObjectURL(f);

    // Auto-upload
    try {
      const res = await startUpload([f]);
      if (!res || res.length === 0) {
        setAudioError('Upload returned no result. Try paste-URL mode.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Upload threw an error';
      setAudioError(msg);
      toast(msg, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast('Title is required', 'error');
      return;
    }
    if (!audioUrl) {
      toast('Upload an audio file or paste a URL first', 'error');
      return;
    }
    if (audioMode === 'upload' && file && !audioUrl && !audioError) {
      toast('Audio is still uploading — wait for it to finish', 'error');
      return;
    }
    setSubmitting(true);

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    uploadMutation.mutate({
      title: title.trim(),
      slug,
      genre: genre || undefined,
      bpm: bpm ? parseInt(bpm) : undefined,
      visibility: visibility as 'public' | 'private' | 'unlisted' | 'subscribers_only',
      audioUrl,
      coverUrl: coverUrl || undefined,
      duration: duration ?? undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Audio source: upload or paste URL */}
      <div className="rounded-2xl bg-[#15151f] p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Audio File *</h3>
          <div className="flex gap-1 text-xs">
            <button
              type="button"
              onClick={() => setAudioMode('upload')}
              className={`px-3 py-1 rounded ${audioMode === 'upload' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Upload file
            </button>
            <button
              type="button"
              onClick={() => setAudioMode('url')}
              className={`px-3 py-1 rounded ${audioMode === 'url' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Paste URL
            </button>
          </div>
        </div>

        {audioMode === 'upload' ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              file ? 'border-brand-500 bg-brand-600/5' : 'border-brand-700/30 hover:border-brand-600/50 bg-brand-950/40'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="audio/*,.mp3,.wav,.flac,.m4a"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="hidden"
            />
            {file ? (
              <>
                <p className="text-3xl mb-2">🎵</p>
                <p className="font-semibold">{file.name}</p>
                <p className={`text-xs mt-1 ${audioError ? 'text-red-400' : audioUrl ? 'text-green-400' : 'text-gray-500'}`}>
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                  {duration !== null && ` · ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`}
                  {isUploading && ' · uploading...'}
                  {audioUrl && !audioError && ' · uploaded ✓'}
                  {audioError && ` · ${audioError}`}
                </p>
              </>
            ) : (
              <>
                <p className="text-4xl mb-3">📁</p>
                <p className="text-gray-400 mb-2">Drag an audio file or click to browse</p>
                <p className="text-xs text-gray-600">MP3, WAV, FLAC, M4A — Max 64MB</p>
              </>
            )}
          </div>
        ) : (
          <>
            <input
              type="url"
              value={audioUrl}
              onChange={(e) => {
                setAudioUrl(e.target.value);
                setAudioError('');
              }}
              placeholder="https://your-host.com/track.mp3"
              className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition"
            />
            <p className="text-xs text-gray-500">Direct link to MP3, WAV, FLAC, or M4A (S3, Backblaze, your own server)</p>
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

        <CoverImageField
          label="Cover Art (optional)"
          hint="Square image, 1500×1500+ recommended, ≤8MB"
          value={coverUrl}
          onChange={setCoverUrl}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none transition"
            >
              <option value="">Select genre</option>
              {TRACK_GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
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
        disabled={!audioUrl || !title.trim() || submitting || isUploading}
        className="w-full rounded-full bg-gradient-to-r from-brand-600 to-brand-500 py-4 font-semibold text-white text-lg transition hover:shadow-lg hover:shadow-brand-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Publishing...' : isUploading ? 'Uploading audio...' : 'Publish Track'}
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

/* ─── Events & Tickets Tab ─── */
function EventsTab({ events, onRefresh }: { events: Array<{ id: string; title: string; startDate: string | Date; status: string; capacity: number | null; hostName?: string | null }>; onRefresh: () => void }) {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [capacity, setCapacity] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const { toast } = useToast();

  const createEvent = trpc.events.create.useMutation({
    onSuccess: () => {
      toast('Event created! Add ticket types to start selling.', 'success');
      setShowCreate(false);
      setTitle('');
      setStartDate('');
      setEndDate('');
      setCapacity('');
      onRefresh();
    },
    onError: (err) => {
      toast(err.message ?? 'Failed to create event', 'error');
    },
  });

  const handleCreate = () => {
    if (!title || !startDate) {
      toast('Title and start date are required', 'error');
      return;
    }
    createEvent.mutate({
      title,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      capacity: capacity ? parseInt(capacity) : undefined,
      timezone,
    });
  };

  return (
    <div className="space-y-6">
      {/* Create event form */}
      {showCreate ? (
        <div className="rounded-2xl bg-[#15151f] p-6">
          <h3 className="font-bold text-lg mb-4">Create Event</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Event Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Neon Nights Tour — LA"
                className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none transition"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Capacity</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="500"
                  className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none transition"
                >
                  <option value="America/New_York">Eastern (ET)</option>
                  <option value="America/Chicago">Central (CT)</option>
                  <option value="America/Denver">Mountain (MT)</option>
                  <option value="America/Los_Angeles">Pacific (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Berlin">Berlin (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                </select>
              </div>
            </div>

            {/* Anti-scalper info */}
            <div className="rounded-xl bg-brand-600/5 border border-brand-600/20 p-4">
              <p className="text-sm font-semibold text-brand-400 mb-2">Anti-Scalper Protections (Auto-Enabled)</p>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• 4 ticket max per buyer</li>
                <li>• Non-transferable QR tickets with ID verification</li>
                <li>• Refunds go back to buyer, never resold</li>
                <li>• Revenue breakdown: 70% Creator / 10% Venue / 15% Platform / 5% Processing</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={createEvent.isPending}
                className="rounded-full bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-500 transition disabled:opacity-50"
              >
                {createEvent.isPending ? 'Creating...' : 'Create Event'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-full border border-brand-800/30 px-6 py-3 font-semibold text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-full bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-500 transition"
        >
          + Create Event
        </button>
      )}

      {/* Events list */}
      {events.length === 0 ? (
        <div className="rounded-2xl bg-[#15151f] p-12 text-center">
          <p className="text-4xl mb-4">🎪</p>
          <p className="text-gray-400">No events yet. Create your first event to start selling tickets directly to fans.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const date = new Date(event.startDate);
            return (
              <Link
                key={event.id}
                href={`/event/${event.id}`}
                className="flex items-center gap-4 rounded-2xl bg-[#15151f] p-5 transition hover:bg-[#1a1a2e] block"
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 flex flex-col items-center justify-center shrink-0">
                  <p className="text-xl font-black">{date.getDate()}</p>
                  <p className="text-[10px] font-semibold uppercase text-brand-300">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{event.title}</p>
                  <p className="text-sm text-gray-400">
                    {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    {event.capacity && ` · ${event.capacity} cap`}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  event.status === 'published'
                    ? 'bg-green-600/20 text-green-400'
                    : event.status === 'draft'
                    ? 'bg-yellow-600/20 text-yellow-400'
                    : 'bg-brand-600/20 text-brand-400'
                }`}>
                  {event.status}
                </span>
              </Link>
            );
          })}
        </div>
      )}
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
