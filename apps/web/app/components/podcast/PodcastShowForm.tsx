'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useUploadThing } from '@/lib/uploadthing-client';
import { useToast } from '@/app/components/Toast';

// Apple Podcasts top-level categories — see https://podcasters.apple.com/support/1691
const CATEGORIES = [
  'Arts',
  'Business',
  'Comedy',
  'Education',
  'Health & Fitness',
  'History',
  'Music',
  'News',
  'Religion & Spirituality',
  'Society & Culture',
  'Sports',
  'Technology',
  'TV & Film',
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
];

export type ExistingShow = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  language: string;
  author: string | null;
  ownerEmail: string | null;
  explicit: boolean;
  coverUrl: string | null;
};

export function PodcastShowForm({
  existing,
  onCreated,
  onCancel,
}: {
  existing?: ExistingShow;
  onCreated: () => void;
  onCancel?: () => void;
}) {
  const { toast } = useToast();
  const isEdit = !!existing;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [category, setCategory] = useState(existing?.category ?? 'Music');
  const [language, setLanguage] = useState(existing?.language ?? 'en');
  const [author, setAuthor] = useState(existing?.author ?? '');
  const [ownerEmail, setOwnerEmail] = useState(existing?.ownerEmail ?? '');
  const [explicit, setExplicit] = useState(existing?.explicit ?? false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string>(existing?.coverUrl ?? '');
  const [coverError, setCoverError] = useState<string>('');
  const [coverMode, setCoverMode] = useState<'upload' | 'url'>('upload');
  const [submitting, setSubmitting] = useState(false);

  const { startUpload: uploadCover, isUploading: coverUploading } = useUploadThing('imageUpload', {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl ?? res?.[0]?.url;
      if (url) {
        setCoverUrl(url);
        setCoverError('');
        toast('Cover uploaded', 'success');
      } else {
        setCoverError('Upload completed but no URL returned. Try paste-URL mode.');
      }
    },
    onUploadError: (err) => {
      const msg = err.message || 'Cover upload failed';
      setCoverError(msg);
      toast(msg, 'error');
    },
  });

  const handleCoverFile = async (file: File | null) => {
    setCoverError('');
    setCoverFile(file);
    if (!file) {
      setCoverUrl('');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      const msg = `File is ${(file.size / 1024 / 1024).toFixed(1)}MB — max 8MB. Try paste-URL mode.`;
      setCoverError(msg);
      toast(msg, 'error');
      return;
    }
    if (!file.type.startsWith('image/')) {
      const msg = `File type "${file.type || 'unknown'}" is not an image`;
      setCoverError(msg);
      toast(msg, 'error');
      return;
    }
    try {
      const res = await uploadCover([file]);
      if (!res || res.length === 0) {
        setCoverError('Upload returned no result. Try paste-URL mode.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Upload threw an error';
      setCoverError(msg);
      toast(msg, 'error');
    }
  };

  const utils = trpc.useUtils();

  const createMutation = trpc.podcasts.create.useMutation({
    onSuccess: () => {
      toast('Podcast show created', 'success');
      utils.podcasts.getMine.invalidate();
      onCreated();
    },
    onError: (err) => {
      toast(err.message || 'Create failed', 'error');
      setSubmitting(false);
    },
  });

  const updateMutation = trpc.podcasts.update.useMutation({
    onSuccess: () => {
      toast('Podcast updated', 'success');
      utils.podcasts.getMine.invalidate();
      onCreated();
    },
    onError: (err) => {
      toast(err.message || 'Update failed', 'error');
      setSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast('Title is required', 'error');
      return;
    }
    if (coverMode === 'upload' && coverFile && !coverUrl && !coverError) {
      toast('Cover is still uploading — wait or switch to paste-URL', 'error');
      return;
    }
    setSubmitting(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      language,
      author: author.trim() || undefined,
      ownerEmail: ownerEmail.trim() || undefined,
      explicit,
      coverUrl: coverUrl || undefined,
    };

    if (isEdit && existing) {
      updateMutation.mutate({ id: existing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">{isEdit ? 'Edit Show' : 'Create Podcast Show'}</h3>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm text-gray-400 hover:text-white">Cancel</button>
        )}
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Show Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. The OPYNX Show"
          required
          className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's your show about?"
          rows={3}
          className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition resize-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm text-gray-400">Cover Art</label>
          <div className="flex gap-1 text-xs">
            <button
              type="button"
              onClick={() => setCoverMode('upload')}
              className={`px-2 py-1 rounded ${coverMode === 'upload' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Upload file
            </button>
            <button
              type="button"
              onClick={() => setCoverMode('url')}
              className={`px-2 py-1 rounded ${coverMode === 'url' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Paste URL
            </button>
          </div>
        </div>

        <div className="flex items-start gap-3">
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt=""
              className="w-16 h-16 rounded-lg object-cover shrink-0 border border-brand-800/30"
              onError={() => setCoverError('Cover URL did not load — check the link')}
            />
          )}
          <div className="flex-1 space-y-1">
            {coverMode === 'upload' ? (
              <>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleCoverFile(e.target.files?.[0] ?? null)}
                  disabled={coverUploading}
                  className="block w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-brand-600 file:text-white file:font-semibold hover:file:bg-brand-500 disabled:opacity-50"
                />
                {coverFile && (
                  <p className={`text-xs ${coverError ? 'text-red-400' : coverUrl ? 'text-green-400' : 'text-gray-500'}`}>
                    {coverFile.name} · {(coverFile.size / 1024).toFixed(0)} KB
                    {coverUploading && ' · uploading...'}
                    {coverUrl && !coverError && ' · uploaded ✓'}
                    {coverError && ` · ${coverError}`}
                  </p>
                )}
              </>
            ) : (
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => {
                  setCoverUrl(e.target.value);
                  setCoverError('');
                }}
                placeholder="https://your-host.com/cover.jpg"
                className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-2 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition"
              />
            )}
            <p className="text-xs text-gray-500">Apple recommends 3000×3000px JPG/PNG, ≤8MB</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none transition"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none transition"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Author / Host Name</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your display name"
            className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Owner Email</label>
          <input
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            placeholder="contact@example.com"
            className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition"
          />
          <p className="text-xs text-gray-500 mt-1">Required by Apple Podcasts; not displayed publicly</p>
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={explicit}
          onChange={(e) => setExplicit(e.target.checked)}
          className="w-5 h-5 rounded accent-brand-600 bg-brand-950"
        />
        <span className="text-sm text-gray-300">Mark show as explicit</span>
      </label>

      <button
        type="submit"
        disabled={submitting || coverUploading}
        className="w-full rounded-full bg-gradient-to-r from-brand-600 to-brand-500 py-3 font-semibold text-white transition hover:shadow-lg hover:shadow-brand-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Show')}
      </button>
    </form>
  );
}
