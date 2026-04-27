'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';

export default function ArticlesPage() {
  const { data: articles, isLoading } = trpc.articles.list.useQuery({ limit: 50 });

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-bold mb-2">Articles</h1>
          <p className="text-gray-400">Long-form posts from creators on OPYNX.</p>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-[#15151f] animate-pulse" />
            ))}
          </div>
        ) : !articles || articles.length === 0 ? (
          <div className="rounded-2xl bg-[#15151f] p-16 text-center">
            <p className="text-5xl mb-4">📝</p>
            <h2 className="text-xl font-bold mb-2">No articles yet</h2>
            <p className="text-gray-400 mb-6">When creators publish posts, they'll show up here.</p>
            <Link
              href="/dashboard/articles"
              className="inline-block rounded-full bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-500 transition"
            >
              Write the first one
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {articles.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/articles/${a.slug}`}
                  className="group block rounded-2xl bg-[#15151f] border border-brand-800/20 overflow-hidden transition hover:bg-[#1a1a2e] hover:-translate-y-0.5"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {a.coverUrl && (
                      <div className="sm:w-48 h-32 sm:h-auto shrink-0 bg-brand-950 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.coverUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 p-5 sm:py-5 sm:pr-5 sm:pl-0">
                      <h2 className="text-xl font-bold group-hover:text-red-400 transition truncate">
                        {a.title}
                      </h2>
                      {a.excerpt && (
                        <p className="text-sm text-gray-400 mt-2 line-clamp-2">{a.excerpt}</p>
                      )}
                      {a.publishedAt && (
                        <p className="text-xs text-gray-500 mt-3">
                          {new Date(a.publishedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
