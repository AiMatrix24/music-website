'use client';

import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useUploadThing } from '@/lib/uploadthing-client';
import { useToast } from '@/app/components/Toast';
import { CoverImageField } from '@/app/components/podcast/CoverImageField';

const TRACK_GENRES = [
  'Synthwave', 'Lo-fi Hip Hop', 'Electronic', 'Indie Rock', 'Post-Punk',
  'Ambient', 'Alternative', 'Hip Hop', 'Pop', 'R&B', 'Jazz', 'Classical',
  'Metal', 'Country', 'Folk', 'Reggae', 'Latin', 'Afrobeat',
  'Christian Country', 'Southern Gospel', 'Worship', 'Christian Rock',
  'Christian Hip Hop', 'CCM',
  'Other',
];

const AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/wav', 'audio/x-m4a', 'audio/flac'];

export type EditableTrack = {
  id: string;
  title: string;
  genre: string | null;
  bpm: number | null;
  duration: number | null;
  visibility: 'public' | 'private' | 'unlisted' | 'subscribers_only';
  price: number | null;
  audioUrl: string | null;
  coverUrl: string | null;
  iswc?: string | null;
  ipi?: string | null;
  derivativeWork?: boolean;
  derivativeAttestation?: string | null;
};

export function TrackEditForm({
  track,
  onSaved,
  onCancel,
}: {
  track: EditableTrack;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(track.title);
  const [genre, setGenre] = useState(track.genre ?? '');
  const [bpm, setBpm] = useState(track.bpm?.toString() ?? '');
  const [visibility, setVisibility] = useState(track.visibility);
  const [price, setPrice] = useState(track.price ? (track.price / 100).toFixed(2) : '');
  const [coverUrl, setCoverUrl] = useState(track.coverUrl ?? '');
  const [iswc, setIswc] = useState(track.iswc ?? '');
  const [ipi, setIpi] = useState(track.ipi ?? '');
  const [derivativeWork, setDerivativeWork] = useState(track.derivativeWork ?? false);
  const [derivativeAttestation, setDerivativeAttestation] = useState(track.derivativeAttestation ?? '');

  // Audio replacement
  const [audioUrl, setAudioUrl] = useState(track.audioUrl ?? '');
  const [audioMode, setAudioMode] = useState<'keep' | 'upload' | 'url'>('keep');
  const [file, setFile] = useState<File | null>(null);
  const [audioError, setAudioError] = useState('');
  const [duration, setDuration] = useState<number | null>(track.duration);
  const fileRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);

  const { startUpload, isUploading } = useUploadThing('audioUpload', {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl ?? res?.[0]?.url;
      if (url) {
        setAudioUrl(url);
        setAudioError('');
        toast('Audio replaced', 'success');
      } else {
        setAudioError('Upload returned no URL — try paste-URL mode.');
      }
    },
    onUploadError: (err) => {
      const msg = err.message || 'Audio upload failed';
      setAudioError(msg);
      toast(msg, 'error');
    },
  });

  const utils = trpc.useUtils();
  const updateMutation = trpc.tracks.update.useMutation({
    onSuccess: () => {
      toast('Track updated', 'success');
      utils.tracks.list.invalidate();
      onSaved();
    },
    onError: (err) => {
      toast(err.message || 'Update failed', 'error');
      setSubmitting(false);
    },
  });

  const handleFile = async (f: File) => {
    setAudioError('');
    if (!AUDIO_TYPES.includes(f.type) && !/\.(mp3|m4a|wav|mp4|flac)$/i.test(f.name)) {
      setAudioError('Pick an audio file (MP3, M4A, WAV, FLAC)');
      return;
    }
    if (f.size > 64 * 1024 * 1024) {
      setAudioError(`File is ${(f.size / 1024 / 1024).toFixed(1)}MB — max 64MB. Try paste-URL mode.`);
      return;
    }
    setFile(f);
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration)) setDuration(Math.round(audio.duration));
      URL.revokeObjectURL(audio.src);
    };
    audio.src = URL.createObjectURL(f);
    try {
      const res = await startUpload([f]);
      if (!res || res.length === 0) {
        setAudioError('Upload returned no result. Try paste-URL mode.');
      }
    } catch (err: any) {
      setAudioError(err?.message || 'Upload threw an error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast('Title is required', 'error');
      return;
    }
    if (audioMode === 'upload' && file && !audioUrl && !audioError) {
      toast('Audio still uploading — wait or switch mode', 'error');
      return;
    }
    setSubmitting(true);
    if (derivativeWork && derivativeAttestation.trim().length < 5) {
      toast('Cover/sample tracks need a rights-clearance attestation.', 'error');
      setSubmitting(false);
      return;
    }
    updateMutation.mutate({
      id: track.id,
      title: title.trim(),
      genre: genre || undefined,
      bpm: bpm ? parseInt(bpm) : undefined,
      duration: duration ?? undefined,
      visibility,
      price: price ? Math.round(parseFloat(price) * 100) : null,
      audioUrl: audioMode !== 'keep' && audioUrl ? audioUrl : undefined,
      coverUrl: coverUrl || null,
      iswc: iswc.trim() || null,
      ipi: ipi.trim() || null,
      derivativeWork,
      derivativeAttestation: derivativeWork ? derivativeAttestation.trim() : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Edit Track</h3>
        <button type="button" onClick={onCancel} className="text-sm text-gray-400 hover:text-white">Cancel</button>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none transition"
        />
      </div>

      <CoverImageField
        label="Cover Art"
        hint="Square JPG/PNG, 1500×1500+ recommended, ≤8MB"
        value={coverUrl}
        onChange={setCoverUrl}
      />

      {/* Replace audio */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm text-gray-400">Audio File</label>
          <div className="flex gap-1 text-xs">
            <button
              type="button"
              onClick={() => setAudioMode('keep')}
              className={`px-2 py-1 rounded ${audioMode === 'keep' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Keep current
            </button>
            <button
              type="button"
              onClick={() => setAudioMode('upload')}
              className={`px-2 py-1 rounded ${audioMode === 'upload' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Replace (upload)
            </button>
            <button
              type="button"
              onClick={() => setAudioMode('url')}
              className={`px-2 py-1 rounded ${audioMode === 'url' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Replace (URL)
            </button>
          </div>
        </div>
        {audioMode === 'keep' ? (
          <p className="text-xs text-gray-500">
            {track.audioUrl ? '✓ Existing audio kept' : '⚠ No audio file currently attached'}
          </p>
        ) : audioMode === 'upload' ? (
          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
              file ? 'border-brand-500 bg-brand-600/5' : 'border-brand-700/30 hover:border-brand-600/50 bg-brand-950/40'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="audio/*,.mp3,.m4a,.wav,.flac"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="hidden"
            />
            {file ? (
              <>
                <p className="font-semibold text-sm">{file.name}</p>
                <p className={`text-xs mt-1 ${audioError ? 'text-red-400' : audioUrl !== track.audioUrl ? 'text-green-400' : 'text-gray-500'}`}>
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                  {isUploading && ' · uploading...'}
                  {audioUrl !== track.audioUrl && audioUrl && !audioError && ' · uploaded ✓'}
                  {audioError && ` · ${audioError}`}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">Click to select replacement audio (MP3, WAV, FLAC, M4A — max 64MB)</p>
            )}
          </div>
        ) : (
          <input
            type="url"
            value={audioUrl}
            onChange={(e) => {
              setAudioUrl(e.target.value);
              setAudioError('');
            }}
            placeholder="https://your-host.com/track.mp3"
            className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none transition"
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Genre</label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-3 py-2 text-white focus:border-brand-500 outline-none transition"
          >
            <option value="">No genre</option>
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
            min="1"
            max="999"
            className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-3 py-2 text-white focus:border-brand-500 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0 = free"
            className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-3 py-2 text-white focus:border-brand-500 outline-none transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Visibility</label>
        <div className="flex flex-wrap gap-2">
          {(['public', 'subscribers_only', 'unlisted', 'private'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVisibility(v)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                visibility === v ? 'bg-brand-600 text-white' : 'bg-brand-950 text-gray-400 hover:text-white'
              }`}
            >
              {v === 'subscribers_only' ? 'Subs Only' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Cover-song / sample / interpolation gate */}
      <div className="rounded-xl bg-brand-950/30 border border-brand-800/20 p-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={derivativeWork}
            onChange={(e) => setDerivativeWork(e.target.checked)}
            className="mt-1 accent-red-600"
          />
          <div className="flex-1">
            <p className="text-sm font-semibold">This track contains a cover, sample, or interpolation</p>
            <p className="text-xs text-gray-500 mt-1">Tick if you didn't write the underlying composition or your recording uses a sample.</p>
          </div>
        </label>
        {derivativeWork && (
          <div className="mt-3">
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">
              Rights clearance
            </label>
            <textarea
              value={derivativeAttestation}
              onChange={(e) => setDerivativeAttestation(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="License #, public domain status, direct deal, etc."
              className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition resize-none"
            />
            <p className="text-xs text-gray-600 mt-1">{derivativeAttestation.length}/2000</p>
          </div>
        )}
      </div>

      {/* Composition / songwriting metadata — for future MLC + PRO matching.
          Not used for any payment routing yet. */}
      <details className="rounded-xl bg-brand-950/30 border border-brand-800/20 p-3">
        <summary className="text-xs font-bold uppercase tracking-wide text-gray-400 cursor-pointer">
          Composition metadata (optional)
        </summary>
        <p className="text-xs text-gray-500 mt-2 mb-3">
          Leave blank if you don't have these yet — you can fill them in later. Used for matching your work in songwriter rights databases.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">ISWC</label>
            <input
              type="text"
              value={iswc}
              onChange={(e) => setIswc(e.target.value)}
              placeholder="T-345246800-1"
              maxLength={20}
              className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">IPI / writer ID</label>
            <input
              type="text"
              value={ipi}
              onChange={(e) => setIpi(e.target.value)}
              placeholder="00012345678"
              maxLength={20}
              className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition font-mono"
            />
          </div>
        </div>
      </details>

      <button
        type="submit"
        disabled={submitting || isUploading}
        className="w-full rounded-full bg-gradient-to-r from-brand-600 to-brand-500 py-3 font-semibold text-white transition hover:shadow-lg hover:shadow-brand-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
