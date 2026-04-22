'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/app/components/Toast';
import { CoverImageField } from './CoverImageField';
import { RichTextEditor } from './RichTextEditor';

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
  const [coverUrl, setCoverUrl] = useState<string>(existing?.coverUrl ?? '');
  const [submitting, setSubmitting] = useState(false);

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
        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder="What's your show about?"
          minHeight={120}
        />
      </div>

      <CoverImageField
        label="Cover Art"
        hint="Apple recommends 3000×3000px JPG/PNG, ≤8MB"
        value={coverUrl}
        onChange={setCoverUrl}
      />

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
        disabled={submitting}
        className="w-full rounded-full bg-gradient-to-r from-brand-600 to-brand-500 py-3 font-semibold text-white transition hover:shadow-lg hover:shadow-brand-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Show')}
      </button>
    </form>
  );
}
