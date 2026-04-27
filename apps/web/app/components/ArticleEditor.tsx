'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/app/components/Toast';
import { CoverImageField } from '@/app/components/podcast/CoverImageField';
import { RichTextEditor } from '@/app/components/podcast/RichTextEditor';

/**
 * Generate a URL-safe slug from a title. Same lower-kebab convention used
 * elsewhere in the app. Stripped to ASCII letters/digits/dashes; consecutive
 * spaces collapse to a single dash; leading/trailing dashes trimmed.
 */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

interface InitialValues {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  coverUrl: string;
  body: string;
  status: 'draft' | 'private' | 'listed' | 'public';
}

const EMPTY: InitialValues = {
  title: '',
  slug: '',
  excerpt: '',
  coverUrl: '',
  body: '',
  status: 'draft',
};

export function ArticleEditor({ initial = EMPTY }: { initial?: InitialValues }) {
  const router = useRouter();
  const { toast } = useToast();

  const isEditing = !!initial.id;
  const [title, setTitle] = useState(initial.title);
  // Slug is derived from title until the user manually edits it. We track
  // a `touched` flag so we don't blow away their custom slug on subsequent
  // title edits.
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(isEditing);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [coverUrl, setCoverUrl] = useState(initial.coverUrl);
  const [body, setBody] = useState(initial.body);
  const [status, setStatus] = useState(initial.status);

  const utils = trpc.useUtils();

  const createMutation = trpc.articles.create.useMutation({
    onSuccess: (created) => {
      utils.articles.listMine.invalidate();
      toast('Draft saved');
      // Hop to the edit URL so subsequent saves are updates, not duplicates.
      if (created?.id) router.replace(`/dashboard/articles/${created.id}/edit`);
    },
    onError: (e) => toast(`Save failed: ${e.message}`),
  });

  const updateMutation = trpc.articles.update.useMutation({
    onSuccess: () => {
      utils.articles.listMine.invalidate();
      toast('Saved');
    },
    onError: (e) => toast(`Save failed: ${e.message}`),
  });

  const publishMutation = trpc.articles.publish.useMutation({
    onSuccess: () => {
      setStatus('public');
      utils.articles.listMine.invalidate();
      utils.articles.list.invalidate();
      toast('Published');
    },
    onError: (e) => toast(`Publish failed: ${e.message}`),
  });

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast('Title is required');
      return;
    }
    if (!slug.trim()) {
      toast('Slug is required');
      return;
    }
    const payload = {
      title: title.trim(),
      excerpt: excerpt.trim() || undefined,
      coverUrl: coverUrl.trim() || undefined,
      body,
    };
    if (isEditing && initial.id) {
      await updateMutation.mutateAsync({ id: initial.id, ...payload });
    } else {
      await createMutation.mutateAsync({ slug: slug.trim(), ...payload });
    }
  };

  const handlePublish = async () => {
    if (!isEditing || !initial.id) {
      // Need to create first, then publish in one flow.
      toast('Save the draft first, then publish.');
      return;
    }
    if (!confirm('Publish this article? It will be visible at /articles/' + slug)) return;
    await publishMutation.mutateAsync({ id: initial.id });
  };

  const saving = createMutation.isPending || updateMutation.isPending;
  const publishing = publishMutation.isPending;

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard/articles"
            className="text-sm text-gray-500 hover:text-red-400 transition inline-flex items-center gap-1"
          >
            ← All articles
          </Link>
          <span className="text-xs uppercase tracking-wide font-bold text-gray-500">
            {status}
          </span>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Your article title"
              maxLength={200}
              className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-2xl font-bold focus:border-red-600 outline-none"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">URL slug</label>
            <div className="flex items-center gap-2 bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-2.5 focus-within:border-red-600">
              <span className="text-sm text-gray-500 shrink-0">/articles/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }}
                placeholder="my-article"
                disabled={isEditing}
                className="flex-1 bg-transparent text-sm focus:outline-none disabled:opacity-50"
              />
            </div>
            {isEditing && (
              <p className="text-xs text-gray-500 mt-1">Slug can't change after creation (would break SEO + bookmarks).</p>
            )}
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
              Excerpt <span className="text-gray-600 font-normal normal-case">— shown in the article list</span>
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="One-line teaser (optional)"
              maxLength={500}
              rows={2}
              className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-sm resize-none focus:border-red-600 outline-none"
            />
            <p className="text-xs text-gray-600 mt-1">{excerpt.length}/500</p>
          </div>

          {/* Cover */}
          <CoverImageField
            label="Cover Image"
            hint="Optional — appears at the top of the article and in the list. 1600×900 ideal."
            value={coverUrl}
            onChange={setCoverUrl}
          />

          {/* Body */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Body</label>
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder="Write your article…"
              minHeight={300}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-brand-800/20">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-brand-950 hover:bg-brand-900 border border-brand-800/40 px-5 py-2.5 text-sm font-bold transition disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save Draft'}
            </button>
            {isEditing && status !== 'public' && (
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="rounded-full bg-red-600 hover:bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition disabled:opacity-50"
              >
                {publishing ? 'Publishing…' : 'Publish'}
              </button>
            )}
            {status === 'public' && initial.slug && (
              <Link
                href={`/articles/${initial.slug}`}
                target="_blank"
                className="text-sm text-gray-400 hover:text-white px-3"
              >
                View public page →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
