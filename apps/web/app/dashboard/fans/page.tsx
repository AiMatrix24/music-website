'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';

export default function FansPage() {
  const { status } = useSession();
  const { data, isLoading } = trpc.users.myFollowers.useQuery(
    { limit: 100, offset: 0 },
    { enabled: status === 'authenticated' }
  );

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl mb-2">👥</p>
        <p className="text-gray-400 text-lg">Sign in to see your followers</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const total = data?.total ?? 0;
  const recent = data?.recentLast30Days ?? 0;
  const followers = data?.followers ?? [];

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">← Dashboard</Link>
        <h1 className="text-3xl font-bold mt-2">
          Your <span className="text-red-500">Followers</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          People who follow you on OPYNX. They see your new tracks, episodes, and events first.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl bg-[#15151f] p-12 text-center">
          <div className="animate-pulse text-gray-400">Loading followers…</div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="rounded-2xl bg-gradient-to-br from-red-600/20 to-red-900/10 border border-red-800/30 p-6">
              <p className="text-xs text-red-400 uppercase tracking-wider mb-1">Total followers</p>
              <p className="text-4xl font-black">{total.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">New in last 30 days</p>
              <p className="text-4xl font-black">+{recent.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">
                {total > 0 ? `${Math.round((recent / total) * 100)}% of total` : '—'}
              </p>
            </div>
          </div>

          {/* Followers list */}
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
            <h2 className="font-bold mb-4">Recent followers</h2>
            {followers.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-4xl mb-3">👋</p>
                <p className="text-sm text-gray-400">No followers yet.</p>
                <p className="text-xs text-gray-500 mt-1">
                  Share your tracks and events — followers will appear here as they sign up.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-brand-800/20">
                {followers.map((f) => (
                  <Link
                    key={f.followerId}
                    href={`/artist/${f.followerId}`}
                    className="flex items-center gap-3 py-3 hover:bg-brand-950/40 -mx-6 px-6 transition"
                  >
                    {f.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-sm font-bold shrink-0">
                        {f.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.name ?? 'Unnamed user'}</p>
                      <p className="text-xs text-gray-500">
                        {f.role} · followed {new Date(f.followedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Honest note about unbuilt features */}
          <div className="rounded-2xl bg-amber-950/20 border border-amber-800/30 p-5 mt-6">
            <p className="text-sm font-semibold text-amber-300">
              📊 Advanced fan analytics — coming soon
            </p>
            <p className="text-xs text-amber-200/60 mt-1">
              We&apos;re working on top-fan rankings (by play count), country/region breakdowns,
              and engagement type analysis. They&apos;ll appear here once the play-tracking data
              is rich enough to be meaningful.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
