'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/app/components/Toast';
import { useUploadThing } from '@/lib/uploadthing-client';

/**
 * Step 3 — bulk track upload. Up to 10 audio files at once.
 *
 * Flow per submit:
 *   1. Validate (file count, sizes, titles all present)
 *   2. UploadThing.startUpload(files) — parallel upload, single round trip
 *   3. For each returned URL, call tracks.upload mutation with the matching
 *      title/genre/license — tracks ship as `published` because each has
 *      a real audioUrl.
 *
 * Status is tracked per row so the UI can show what succeeded vs failed
 * if the batch is partial. The user can retry the failed ones individually
 * or just skip to the next step (everything that DID land is persisted).
 */
const GENRES = [
  '', 'Rock', 'Pop', 'Hip Hop', 'R&B', 'Country', 'Folk', 'Indie',
  'Electronic', 'House', 'Techno', 'Synthwave', 'Jazz', 'Classical',
  'Metal', 'Punk', 'Reggae', 'Latin', 'Ambient', 'Lo-fi', 'Singer-Songwriter',
  'Christian Country', 'Southern Gospel', 'Worship', 'Christian Rock',
  'Christian Hip Hop', 'CCM',
];

const LICENSES = [
  { value: 'all-rights-reserved', label: 'All Rights Reserved' },
  { value: 'cc-by', label: 'CC BY (attribution)' },
  { value: 'cc-by-nc', label: 'CC BY-NC (non-commercial)' },
  { value: 'cc-by-sa', label: 'CC BY-SA (share-alike)' },
];

interface PendingTrack {
  file: File;
  title: string;
  genre: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 180) +
    '-' +
    Math.random().toString(36).slice(2, 8)
  );
}

function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, '');
}

export function CatalogStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const [tracks, setTracks] = useState<PendingTrack[]>([]);
  const [license, setLicense] = useState(LICENSES[0].value);
  const [visibility] = useState<'public' | 'private' | 'unlisted' | 'subscribers_only'>('public');
  const [submitting, setSubmitting] = useState(false);

  const uploadMutation = trpc.tracks.upload.useMutation();

  const { startUpload } = useUploadThing('audioUpload', {
    onUploadError: (e) => toast(`Upload error: ${e.message}`, 'error'),
  });

  const onFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files).slice(0, 10 - tracks.length);
    if (incoming.length === 0) {
      toast('Up to 10 tracks per batch.', 'error');
      return;
    }
    const next: PendingTrack[] = incoming.map((file) => ({
      file,
      title: stripExt(file.name),
      genre: '',
      status: 'pending',
    }));
    setTracks((prev) => [...prev, ...next]);
  };

  const updateRow = (i: number, patch: Partial<PendingTrack>) => {
    setTracks((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  };

  const removeRow = (i: number) => {
    setTracks((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleUploadAll = async () => {
    const pending = tracks.filter((t) => t.status === 'pending' || t.status === 'error');
    if (pending.length === 0) return;
    if (pending.some((t) => !t.title.trim())) {
      toast('Every track needs a title.', 'error');
      return;
    }
    setSubmitting(true);
    setTracks((prev) =>
      prev.map((t) => (t.status === 'pending' || t.status === 'error' ? { ...t, status: 'uploading' } : t))
    );

    try {
      const files = pending.map((t) => t.file);
      const results = await startUpload(files);
      if (!results || results.length === 0) {
        throw new Error('Upload returned no results');
      }

      // Pair results with their pending row by file order (UploadThing
      // preserves the order of the input array).
      for (let i = 0; i < pending.length; i++) {
        const row = pending[i];
        const result = results[i];
        const audioUrl = result?.ufsUrl ?? (result as unknown as { url?: string })?.url;
        if (!audioUrl) {
          updateRow(tracks.indexOf(row), { status: 'error', error: 'Upload failed' });
          continue;
        }
        try {
          await uploadMutation.mutateAsync({
            title: row.title.trim(),
            slug: slugify(row.title),
            genre: row.genre || undefined,
            license,
            visibility,
            audioUrl,
          });
          updateRow(tracks.indexOf(row), { status: 'done' });
        } catch (err) {
          updateRow(tracks.indexOf(row), {
            status: 'error',
            error: (err as Error).message ?? 'DB write failed',
          });
        }
      }

      utils.tracks.list.invalidate();
      toast('Upload complete.');
    } catch (err) {
      toast((err as Error).message || 'Upload failed', 'error');
      // Mark any still-uploading rows as error
      setTracks((prev) =>
        prev.map((t) =>
          t.status === 'uploading' ? { ...t, status: 'error', error: 'Upload failed' } : t
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const successCount = tracks.filter((t) => t.status === 'done').length;
  const allDone = tracks.length > 0 && tracks.every((t) => t.status === 'done');
  const remainingSlots = 10 - tracks.length;

  return (
    <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-8 space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1">Upload your catalog</h2>
        <p className="text-sm text-gray-400">
          Drop up to 10 audio files. Each row's title is editable; pick genre per track or leave blank. Shared license applies to the batch. You can always upload more later from your dashboard.
        </p>
      </div>

      {/* File picker */}
      <div className="rounded-xl border-2 border-dashed border-brand-800/40 p-6 text-center">
        <p className="text-sm text-gray-400 mb-3">
          {tracks.length === 0
            ? 'Pick up to 10 audio files (.mp3, .wav, .m4a, etc.)'
            : `${tracks.length} of 10 picked${remainingSlots > 0 ? ` — ${remainingSlots} slot${remainingSlots === 1 ? '' : 's'} left` : ''}`}
        </p>
        <input
          type="file"
          accept="audio/*"
          multiple
          disabled={submitting || remainingSlots === 0}
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = ''; // allow re-picking the same files
          }}
          className="text-xs text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-red-600 file:text-white file:font-semibold hover:file:bg-red-500 disabled:opacity-50"
        />
      </div>

      {/* Per-track rows */}
      {tracks.length > 0 && (
        <div className="space-y-2">
          {tracks.map((t, i) => (
            <div
              key={i}
              className={`rounded-xl border p-3 transition ${
                t.status === 'done'
                  ? 'bg-green-950/20 border-green-800/30'
                  : t.status === 'error'
                  ? 'bg-red-950/20 border-red-800/30'
                  : t.status === 'uploading'
                  ? 'bg-brand-950/40 border-brand-800/40 animate-pulse'
                  : 'bg-brand-950/20 border-brand-800/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-sm font-bold shrink-0">
                  {t.status === 'done' ? '✓' : t.status === 'error' ? '✗' : i + 1}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={t.title}
                      onChange={(e) => updateRow(i, { title: e.target.value })}
                      maxLength={200}
                      disabled={submitting || t.status === 'done'}
                      placeholder="Track title"
                      className="flex-1 bg-[#0f0f17] border border-brand-800/30 rounded-md px-3 py-1.5 text-sm focus:border-red-600 outline-none disabled:opacity-70"
                    />
                    <select
                      value={t.genre}
                      onChange={(e) => updateRow(i, { genre: e.target.value })}
                      disabled={submitting || t.status === 'done'}
                      className="bg-[#0f0f17] border border-brand-800/30 rounded-md px-2 py-1.5 text-xs focus:border-red-600 outline-none disabled:opacity-70 max-w-[140px]"
                    >
                      {GENRES.map((g) => (
                        <option key={g} value={g}>{g || 'Genre'}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-600 truncate">
                    {t.file.name} · {(t.file.size / 1024 / 1024).toFixed(1)} MB
                    {t.status === 'error' && t.error && (
                      <span className="text-red-400 ml-2">— {t.error}</span>
                    )}
                  </p>
                </div>
                {!submitting && t.status !== 'done' && (
                  <button
                    onClick={() => removeRow(i)}
                    className="text-gray-500 hover:text-red-400 text-sm shrink-0"
                    title="Remove"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shared license */}
      {tracks.length > 0 && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">License (applies to all)</label>
          <select
            value={license}
            onChange={(e) => setLicense(e.target.value)}
            disabled={submitting}
            className="w-full bg-[#0f0f17] border border-brand-800/30 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none"
          >
            {LICENSES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Action row */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          disabled={submitting}
          className="rounded-full bg-brand-950 hover:bg-brand-900 border border-brand-800/40 px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50"
        >
          ← Back
        </button>

        {tracks.length === 0 ? (
          <button
            onClick={onNext}
            className="flex-1 rounded-full bg-brand-950 hover:bg-brand-900 border border-brand-800/40 px-5 py-2.5 text-sm font-semibold transition"
          >
            Skip for now →
          </button>
        ) : allDone ? (
          <button
            onClick={onNext}
            className="flex-1 rounded-full bg-red-600 hover:bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition"
          >
            {successCount} uploaded — Continue →
          </button>
        ) : (
          <>
            <button
              onClick={handleUploadAll}
              disabled={submitting}
              className="flex-1 rounded-full bg-red-600 hover:bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition disabled:opacity-50"
            >
              {submitting ? 'Uploading…' : `Upload ${tracks.length} track${tracks.length === 1 ? '' : 's'}`}
            </button>
            <button
              onClick={onNext}
              disabled={submitting}
              className="text-xs text-gray-500 hover:text-white px-2"
            >
              Skip
            </button>
          </>
        )}
      </div>
    </div>
  );
}
