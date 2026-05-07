'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

/**
 * Personalized "for you" feed. Backed by tracks.recommendedForMe which
 * returns either personalized recommendations (collaborative filtering
 * over the user's plays + likes) or a trending fallback when the user
 * has no signal yet.
 *
 * Was previously a 263-line mock-data page (synthwave mixes, fake
 * "because you listened" rails). Replaced wholesale with the real feed.
 */
export default function ForYouPage() {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const recs = trpc.tracks.recommendedForMe.useQuery(
    { limit: 30 },
    { enabled: isAuthenticated }
  );

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-5xl mb-2">✨</p>
        <p className="text-gray-400 text-lg">Sign in to see your personalized feed</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-black mb-2">For you</h1>
        {recs.data?.source === 'trending' ? (
          <p className="text-sm text-gray-500 mb-8">
            We don't have enough listening history yet to personalize. Showing what's trending across OPYNX. Like + play tracks to teach this page what you love.
          </p>
        ) : (
          <p className="text-sm text-gray-500 mb-8">
            Based on what you've played and liked. Updates daily as your tastes evolve.
          </p>
        )}

        {recs.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-[#15151f] aspect-square animate-pulse" />
            ))}
          </div>
        ) : recs.data && recs.data.tracks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recs.data.tracks.map((t) => (
              <Link
                key={t.id}
                href={`/track/${t.id}`}
                className="group rounded-2xl bg-[#15151f] overflow-hidden hover:bg-[#1a1a2e] transition"
              >
                {t.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.coverUrl} alt="" className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center text-6xl">
                    {t.genre?.charAt(0) ?? '♪'}
                  </div>
                )}
                <div className="p-4">
                  <p className="font-bold truncate group-hover:text-red-400 transition">{t.title}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {t.artistName ?? 'Unknown creator'}
                    {t.genre && <> · {t.genre}</>}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#15151f] p-12 text-center">
            <p className="text-4xl mb-3">🎧</p>
            <p className="text-gray-400 mb-2">Nothing to recommend yet — the catalog is too small.</p>
            <p className="text-xs text-gray-500 mb-4">Once a few tracks get plays + likes, this page will fill in.</p>
            <Link href="/explore" className="text-red-400 hover:text-red-300 transition">Explore →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
