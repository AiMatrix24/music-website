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

export function PodcastShowForm({ onCreated }: { onCreated: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Music');
  const [language, setLanguage] = useState('en');
  const [author, setAuthor] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [explicit, setExplicit] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const { startUpload: uploadCover, isUploading: coverUploading } = useUploadThing('imageUpload', {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl;
      if (url) {
        setCoverUrl(url);
        toast('Cover uploaded');
      }
    },
    onUploadError: (err) => toast(err.message || 'Cover upload failed', 'error'),
  });

  const createMutation = trpc.podcasts.create.useMutation({
    onSuccess: () => {
      toast('Podcast show created');
      // reset
      setTitle('');
      setDescription('');
      setCategory('Music');
      setAuthor('');
      setOwnerEmail('');
      setExplicit(false);
      setCoverFile(null);
      setCoverUrl('');
      setSubmitting(false);
      onCreated();
    },
    onError: (err) => {
      toast(err.message || 'Create failed', 'error');
      setSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast('Title is required', 'error');
      return;
    }
    setSubmitting(true);

    let finalCoverUrl = coverUrl;
    if (coverFile && !coverUrl) {
      const res = await uploadCover([coverFile]);
      finalCoverUrl = res?.[0]?.ufsUrl ?? '';
      if (!finalCoverUrl) {
        toast('Cover upload failed', 'error');
        setSubmitting(false);
        return;
      }
    }

    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      language,
      author: author.trim() || undefined,
      ownerEmail: ownerEmail.trim() || undefined,
      explicit,
      coverUrl: finalCoverUrl || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 space-y-4">
      <h3 className="font-bold text-lg">Create Podcast Show</h3>

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
        <label className="block text-sm text-gray-400 mb-1">Cover Art</label>
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-brand-600 file:text-white file:font-semibold hover:file:bg-brand-500"
        />
        {coverFile && (
          <p className="text-xs text-gray-500 mt-1">
            {coverFile.name} · {(coverFile.size / 1024).toFixed(0)} KB
            {coverUploading && ' · uploading...'}
            {coverUrl && ' · uploaded ✓'}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">Apple recommends 3000×3000px JPG/PNG, ≤8MB</p>
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
        {submitting ? 'Creating...' : 'Create Show'}
      </button>
    </form>
  );
}
