'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSafeHtml } from '@/app/components/podcast/useSafeHtml';

export default function ArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';

  const { data: article, isLoading } = trpc.articles.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const safeHtml = useSafeHtml(article?.body ?? null);

  if (isLoading) {
    return (
      <div className="min-h-screen py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-8 w-2/3 rounded bg-[#15151f] animate-pulse" />
          <div className="h-4 w-1/3 rounded bg-[#15151f] animate-pulse" />
          <div className="h-64 rounded-2xl bg-[#15151f] animate-pulse mt-6" />
          <div className="space-y-2 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 rounded bg-[#15151f] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Hide drafts/private from non-authors. (Author can preview via the
  // dashboard; the public route is for published-only.)
  if (!article || article.status !== 'public') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-5xl mb-2">📝</p>
        <h1 className="text-2xl font-bold">Article not found</h1>
        <p className="text-gray-400">It may have been removed or isn't published yet.</p>
        <Link href="/articles" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition mt-4">
          ← Back to all articles
        </Link>
      </div>
    );
  }

  return (
    <article className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/articles"
          className="text-sm text-gray-500 hover:text-red-400 transition inline-flex items-center gap-1 mb-6"
        >
          ← Articles
        </Link>

        <h1 className="text-4xl font-bold mb-3">{article.title}</h1>

        <div className="flex items-center gap-3 mb-8">
          {article.authorAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.authorAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-sm font-black">
              {article.authorName?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
          )}
          <div>
            <Link
              href={`/artist/${article.authorId}`}
              className="font-semibold text-sm hover:text-red-400 transition block"
            >
              {article.authorName ?? 'Unknown'}
            </Link>
            {article.publishedAt && (
              <p className="text-xs text-gray-500">
                {new Date(article.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>

        {article.coverUrl && (
          <div className="rounded-2xl overflow-hidden mb-8 bg-brand-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.coverUrl} alt="" className="w-full h-auto" />
          </div>
        )}

        {article.excerpt && (
          <p className="text-lg text-gray-300 leading-relaxed mb-8 italic">
            {article.excerpt}
          </p>
        )}

        {/* Sanitized HTML body. Tailwind Typography handles all the spacing
            for headings, paragraphs, lists, blockquotes, code from the rich
            text editor's output. Same prose-invert style used on event pages. */}
        {safeHtml ? (
          <div
            className="prose prose-invert max-w-none prose-a:text-brand-400 prose-strong:text-white prose-headings:text-white"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        ) : (
          <p className="text-gray-500 italic">This article has no content yet.</p>
        )}
      </div>
    </article>
  );
}
