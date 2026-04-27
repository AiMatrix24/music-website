'use client';

import { ArticleEditor } from '@/app/components/ArticleEditor';
import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditArticlePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const { data: session, status } = useSession();

  const { data: article, isLoading } = trpc.articles.getById.useQuery(
    { id },
    { enabled: !!id && status === 'authenticated' }
  );

  if (status !== 'authenticated' || !session?.user?.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-gray-400">Sign in to edit articles.</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Sign In</Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-8 w-1/2 rounded bg-[#15151f] animate-pulse" />
          <div className="h-12 rounded bg-[#15151f] animate-pulse" />
          <div className="h-64 rounded bg-[#15151f] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-5xl mb-2">📝</p>
        <h1 className="text-2xl font-bold">Article not found</h1>
        <Link href="/dashboard/articles" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white mt-4">
          ← Back to your articles
        </Link>
      </div>
    );
  }

  // Belt-and-suspenders: server already restricts update/delete to the
  // author, but bail out client-side too so non-authors don't see the
  // editor UI at all.
  if (article.authorId !== session.user.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-gray-400">You can only edit your own articles.</p>
        <Link href={`/articles/${article.slug}`} className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white mt-4">
          View article →
        </Link>
      </div>
    );
  }

  return (
    <ArticleEditor
      initial={{
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt ?? '',
        coverUrl: article.coverUrl ?? '',
        body: (article.body as string | null) ?? '',
        status: article.status,
      }}
    />
  );
}
