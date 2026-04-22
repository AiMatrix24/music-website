'use client';

import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useUploadThing } from '@/lib/uploadthing-client';
import { useToast } from '@/app/components/Toast';
import { CoverImageField } from './CoverImageField';
import { RichTextEditor } from './RichTextEditor';

const AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/wav', 'audio/x-m4a'];

export type ExistingEpisode = {
  id: string;
  podcastId: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  audioUrl: string | null;
  duration: number | null;
  episodeNumber: number | null;
  seasonNumber: number | null;
  explicit: boolean;
  episodeType: string;
};

export function EpisodeForm({
  podcastId,
  podcastTitle,
  existing,
  onSaved,
  onCancel,
}: {
  podcastId: string;
  podcastTitle: string;
  existing?: ExistingEpisode;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const isEdit = !!existing;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [episodeNumber, setEpisodeNumber] = useState(existing?.episodeNumber?.toString() ?? '');
  const [seasonNumber, setSeasonNumber] = useState(existing?.seasonNumber?.toString() ?? '');
  const [explicit, setExplicit] = useState(existing?.explicit ?? false);
  const [episodeType, setEpisodeType] = useState<'full' | 'trailer' | 'bonus'>(
    (existing?.episodeType as 'full' | 'trailer' | 'bonus') ?? 'full'
  );
  const [coverUrl, setCoverUrl] = useState<string>(existing?.coverUrl ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>(existing?.audioUrl ?? '');
  const [audioMode, setAudioMode] = useState<'upload' | 'url'>('upload');
  const [duration, setDuration] = useState<number | null>(existing?.duration ?? null);
  const [audioError, setAudioError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const utils = trpc.useUtils();

  const createMutation = trpc.podcastEpisodes.create.useMutation({
    onSuccess: () => {
      toast('Episode published', 'success');
      utils.podcasts.getMine.invalidate();
      onSaved();
    },
    onError: (err) => {
      toast(err.message || 'Publish failed', 'error');
      setSubmitting(false);
    },
  });

  const updateMutation = trpc.podcastEpisodes.update.useMutation({
    onSuccess: () => {
      toast('Episode updated', 'success');
      utils.podcasts.getMine.invalidate();
      onSaved();
    },
    onError: (err) => {
      toast(err.message || 'Update failed', 'error');
      setSubmitting(false);
    },
  });

  const handleFileSelect = async (f: File) => {
    setAudioError('');
    if (!AUDIO_TYPES.includes(f.type) && !/\.(mp3|m4a|wav|mp4)$/i.test(f.name)) {
      setAudioError('Choose an audio file (MP3, M4A, WAV)');
      toast('Choose an audio file (MP3, M4A, WAV)', 'error');
      return;
    }
    if (f.size > 64 * 1024 * 1024) {
      setAudioError(`File is ${(f.size / 1024 / 1024).toFixed(1)}MB — max 64MB. Try paste-URL mode.`);
      toast('File too large for upload — try paste-URL', 'error');
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));

    // Probe duration via HTML5 audio element
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
    if (audioMode === 'upload' && file && !audioUrl && !audioError) {
      toast('Audio is still uploading — wait or switch to paste-URL', 'error');
      return;
    }
    if (!isEdit && !audioUrl) {
      toast('An audio file or URL is required', 'error');
      return;
    }
    setSubmitting(true);

    if (isEdit && existing) {
      updateMutation.mutate({
        id: existing.id,
        title: title.trim(),
        description: description.trim() || undefined,
        coverUrl: coverUrl || undefined,
        audioUrl: audioUrl || undefined,
        duration: duration ?? undefined,
        episodeNumber: episodeNumber ? parseInt(episodeNumber) : undefined,
        seasonNumber: seasonNumber ? parseInt(seasonNumber) : undefined,
        explicit,
        episodeType,
      });
    } else {
      createMutation.mutate({
        podcastId,
        title: title.trim(),
        description: description.trim() || undefined,
        coverUrl: coverUrl || undefined,
        audioUrl,
        duration: duration ?? undefined,
        fileSize: file?.size,
        episodeNumber: episodeNumber ? parseInt(episodeNumber) : undefined,
        seasonNumber: seasonNumber ? parseInt(seasonNumber) : undefined,
        explicit,
        episodeType,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">{isEdit ? 'Edit Episode' : 'New Episode'}</h3>
          <p className="text-xs text-gray-500">For {podcastTitle}</p>
        </div>
        <button type="button" onClick={onCancel} className="text-sm text-gray-400 hover:text-white">Cancel</button>
      </div>

      {/* Audio source: upload or paste URL */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm text-gray-400">Audio File</label>
          <div className="flex gap-1 text-xs">
            <button
              type="button"
              onClick={() => setAudioMode('upload')}
              className={`px-2 py-1 rounded ${audioMode === 'upload' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Upload file
            </button>
            <button
              type="button"
              onClick={() => setAudioMode('url')}
              className={`px-2 py-1 rounded ${audioMode === 'url' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
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
              if (f) handleFileSelect(f);
            }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
              file ? 'border-brand-500 bg-brand-600/5' : 'border-brand-700/30 hover:border-brand-600/50 bg-brand-950/40'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="audio/*,.mp3,.m4a,.wav,.mp4"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
              className="hidden"
            />
            {file ? (
              <>
                <p className="text-2xl mb-1">🎙️</p>
                <p className="font-semibold text-sm">{file.name}</p>
                <p className={`text-xs mt-1 ${audioError ? 'text-red-400' : audioUrl ? 'text-green-400' : 'text-gray-500'}`}>
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                  {duration !== null && ` · ${formatDuration(duration)}`}
                  {isUploading && ' · uploading...'}
                  {audioUrl && !audioError && ' · uploaded ✓'}
                  {audioError && ` · ${audioError}`}
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl mb-1">📁</p>
                <p className="text-gray-400 text-sm">Drag an audio file or click to browse</p>
                <p className="text-xs text-gray-600 mt-1">MP3, M4A, WAV — Max 64MB</p>
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
              placeholder="https://your-host.com/episode.mp3"
              className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition"
            />
            <p className="text-xs text-gray-500 mt-1">Direct link to an MP3, M4A, or WAV file (e.g. hosted on S3, Backblaze, Cloudinary)</p>
          </>
        )}
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Episode Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Ep. 1 — Welcome"
          required
          className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Show Notes</label>
        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder="What this episode is about, links, timestamps..."
          minHeight={160}
        />
      </div>

      <CoverImageField
        label="Episode Cover (optional)"
        hint="Overrides the show cover for this episode. Apple recommends 3000×3000px."
        value={coverUrl}
        onChange={setCoverUrl}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Season #</label>
          <input
            type="number"
            value={seasonNumber}
            onChange={(e) => setSeasonNumber(e.target.value)}
            placeholder="1"
            min="1"
            className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-3 py-2 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Episode #</label>
          <input
            type="number"
            value={episodeNumber}
            onChange={(e) => setEpisodeNumber(e.target.value)}
            placeholder="1"
            min="1"
            className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-3 py-2 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Type</label>
          <select
            value={episodeType}
            onChange={(e) => setEpisodeType(e.target.value as 'full' | 'trailer' | 'bonus')}
            className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-3 py-2 text-white focus:border-brand-500 outline-none transition"
          >
            <option value="full">Full</option>
            <option value="trailer">Trailer</option>
            <option value="bonus">Bonus</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={explicit}
          onChange={(e) => setExplicit(e.target.checked)}
          className="w-5 h-5 rounded accent-brand-600 bg-brand-950"
        />
        <span className="text-sm text-gray-300">Mark episode as explicit</span>
      </label>

      <button
        type="submit"
        disabled={submitting || isUploading}
        className="w-full rounded-full bg-gradient-to-r from-brand-600 to-brand-500 py-3 font-semibold text-white transition hover:shadow-lg hover:shadow-brand-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (isUploading ? 'Uploading audio...' : (isEdit ? 'Saving...' : 'Publishing...')) : (isEdit ? 'Save Changes' : 'Publish Episode')}
      </button>
    </form>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
