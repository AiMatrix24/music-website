'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function DashboardArticlesPage() {
  const { status } = useSession();
  const enabled = status === 'authenticated';

  const utils = trpc.useUtils();
  const { data: articles, isLoading } = trpc.articles.listMine.useQuery({ limit: 100 }, { enabled });

  const deleteMutation = trpc.articles.delete.useMutation({
    onSuccess: () => utils.articles.listMine.invalidate(),
  });

  if (!enabled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-gray-400">Sign in to manage your articles.</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Articles</h1>
            <p className="text-sm text-gray-400 mt-1">Drafts and published posts.</p>
          </div>
          <Link
            href="/dashboard/articles/new"
            className="rounded-full bg-red-600 hover:bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition"
          >
            + New Article
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-[#15151f] animate-pulse" />
            ))}
          </div>
        ) : !articles || articles.length === 0 ? (
          <div className="rounded-2xl bg-[#15151f] p-16 text-center">
            <p className="text-5xl mb-4">📝</p>
            <h2 className="text-xl font-bold mb-2">No articles yet</h2>
            <p className="text-gray-400 mb-6">Write your first post — share thoughts, behind-the-scenes notes, release stories.</p>
            <Link
              href="/dashboard/articles/new"
              className="inline-block rounded-full bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-500 transition"
            >
              Write Your First Article
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {articles.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-4 rounded-xl bg-[#15151f] border border-brand-800/20 p-4 hover:bg-[#1a1a2e] transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold truncate">{a.title}</h2>
                    <StatusBadge status={a.status} />
                  </div>
                  {a.excerpt && (
                    <p className="text-xs text-gray-500 truncate">{a.excerpt}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    Updated {new Date(a.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {a.status === 'public' && (
                    <Link
                      href={`/articles/${a.slug}`}
                      className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded transition"
                      title="View public page"
                    >
                      View
                    </Link>
                  )}
                  <Link
                    href={`/dashboard/articles/${a.id}/edit`}
                    className="text-xs bg-brand-950 hover:bg-brand-900 border border-brand-800/40 px-3 py-1.5 rounded transition font-semibold"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${a.title}"? This can't be undone.`)) {
                        deleteMutation.mutate({ id: a.id });
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="text-xs text-gray-500 hover:text-red-400 px-2 py-1.5 transition"
                    title="Delete article"
                  >
                    🗑
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === 'public'
      ? 'bg-green-600/20 text-green-400'
      : status === 'draft'
      ? 'bg-gray-600/20 text-gray-400'
      : 'bg-amber-600/20 text-amber-400';
  return (
    <span className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full ${styles}`}>
      {status}
    </span>
  );
}
