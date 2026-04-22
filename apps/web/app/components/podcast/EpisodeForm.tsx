'use client';

import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useUploadThing } from '@/lib/uploadthing-client';
import { useToast } from '@/app/components/Toast';

const AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/wav', 'audio/x-m4a'];

export function EpisodeForm({
  podcastId,
  podcastTitle,
  onCreated,
  onCancel,
}: {
  podcastId: string;
  podcastTitle: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [seasonNumber, setSeasonNumber] = useState('');
  const [explicit, setExplicit] = useState(false);
  const [episodeType, setEpisodeType] = useState<'full' | 'trailer' | 'bonus'>('full');
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing('audioUpload');

  const createMutation = trpc.podcastEpisodes.create.useMutation({
    onSuccess: () => {
      toast('Episode published');
      onCreated();
    },
    onError: (err) => {
      toast(err.message || 'Publish failed', 'error');
      setSubmitting(false);
    },
  });

  const handleFileSelect = (f: File) => {
    if (!AUDIO_TYPES.includes(f.type) && !/\.(mp3|m4a|wav|mp4)$/i.test(f.name)) {
      toast('Please choose an audio file (MP3, M4A, WAV)', 'error');
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast('Choose an audio file first', 'error');
      return;
    }
    if (!title.trim()) {
      toast('Title is required', 'error');
      return;
    }
    setSubmitting(true);

    const result = await startUpload([file]);
    const audioUrl = result?.[0]?.ufsUrl;
    if (!audioUrl) {
      toast('Audio upload failed', 'error');
      setSubmitting(false);
      return;
    }

    createMutation.mutate({
      podcastId,
      title: title.trim(),
      description: description.trim() || undefined,
      audioUrl,
      duration: duration ?? undefined,
      fileSize: file.size,
      episodeNumber: episodeNumber ? parseInt(episodeNumber) : undefined,
      seasonNumber: seasonNumber ? parseInt(seasonNumber) : undefined,
      explicit,
      episodeType,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">New Episode</h3>
          <p className="text-xs text-gray-500">For {podcastTitle}</p>
        </div>
        <button type="button" onClick={onCancel} className="text-sm text-gray-400 hover:text-white">Cancel</button>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) handleFileSelect(f);
        }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
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
            <p className="text-2xl mb-2">🎙️</p>
            <p className="font-semibold">{file.name}</p>
            <p className="text-xs text-gray-400 mt-1">
              {(file.size / (1024 * 1024)).toFixed(1)} MB
              {duration !== null && ` · ${formatDuration(duration)}`}
              {isUploading && ' · uploading...'}
            </p>
          </>
        ) : (
          <>
            <p className="text-3xl mb-2">📁</p>
            <p className="text-gray-400 text-sm">Drag an audio file or click to browse</p>
            <p className="text-xs text-gray-600 mt-1">MP3, M4A, WAV — Max 64MB</p>
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
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What this episode is about, links, timestamps..."
          rows={4}
          className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition resize-none"
        />
      </div>

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
        disabled={submitting || !file}
        className="w-full rounded-full bg-gradient-to-r from-brand-600 to-brand-500 py-3 font-semibold text-white transition hover:shadow-lg hover:shadow-brand-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (isUploading ? 'Uploading audio...' : 'Publishing...') : 'Publish Episode'}
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
