'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { VerifiedBadge } from '@/app/components/VerifiedBadge';

/**
 * Unified search across creators, tracks, events, articles, and marketplace
 * listings. Server-side ILIKE per bucket via the search.everything procedure
 * — no more client-side filtering of the first 100 rows (which silently
 * missed everything past row 100).
 *
 * Query is bound to the URL `?q=…` so results are shareable + survive page
 * refresh. Input is debounced 250ms client-side; the actual tRPC fetch is
 * gated by `enabled: trimmedQuery.length > 0` so empty queries don't fire.
 */

function SearchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';

  // Local input state — debounced into the URL (and thus the tRPC query).
  const [input, setInput] = useState(urlQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync URL → input when the user navigates back/forward.
  useEffect(() => { setInput(urlQuery); }, [urlQuery]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const trimmed = input.trim();
      if (trimmed === urlQuery) return;
      const sp = new URLSearchParams(searchParams.toString());
      if (trimmed) sp.set('q', trimmed);
      else sp.delete('q');
      router.replace(`/search?${sp.toString()}`, { scroll: false });
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  const trimmedUrlQuery = urlQuery.trim();
  const { data, isLoading } = trpc.search.everything.useQuery(
    { query: trimmedUrlQuery, limit: 10 },
    { enabled: trimmedUrlQuery.length > 0 }
  );

  return (
    <>
      {/* Search input */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search creators, tracks, events, articles, merch…"
            autoFocus
            className="w-full bg-[#15151f] border border-brand-800/30 rounded-2xl pl-12 pr-4 py-4 text-base focus:border-red-600 outline-none"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
        </div>
      </div>

      {!trimmedUrlQuery ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">Start typing to search the platform.</p>
          <p className="text-gray-500 text-sm mt-2">Looks across creators, tracks, events, articles, and merch.</p>
        </div>
      ) : isLoading ? (
        <SearchSkeleton />
      ) : !data || data.totalResults === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No results for &quot;{trimmedUrlQuery}&quot;</p>
          <p className="text-gray-500 text-sm mt-2">Try a different search term, or check spelling.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-8">
            {data.totalResults} result{data.totalResults !== 1 ? 's' : ''} for &quot;{trimmedUrlQuery}&quot;
          </p>

          {/* Creators */}
          {data.creators.length > 0 && (
            <Section title="Creators">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.creators.map((c) => (
                  <Link
                    key={c.id}
                    href={`/artist/${c.id}`}
                    className="flex items-center gap-3 rounded-xl bg-[#15151f] border border-brand-800/20 p-3 transition hover:bg-[#1a1a2e]"
                  >
                    {c.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-base font-bold shrink-0">
                        {c.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate flex items-center gap-1">
                        {c.name}
                        {c.verifiedAt && <VerifiedBadge size="sm" />}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{c.role}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* Tracks */}
          {data.tracks.length > 0 && (
            <Section title="Tracks">
              <ul className="space-y-2">
                {data.tracks.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/track/${t.id}`}
                      className="flex items-center gap-3 rounded-xl bg-[#15151f] border border-brand-800/20 p-3 transition hover:bg-[#1a1a2e]"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
                        {t.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.coverUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          t.genre?.charAt(0) ?? '♪'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{t.title}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {t.artistName ?? 'Unknown'}{t.genre ? ` · ${t.genre}` : ''}
                        </p>
                      </div>
                      <div className="text-right hidden sm:block shrink-0">
                        <p className="text-xs text-gray-500">{formatDuration(t.duration)}</p>
                        {typeof t.playCount === 'number' && (
                          <p className="text-xs text-gray-600">{formatPlays(t.playCount)} plays</p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Events */}
          {data.events.length > 0 && (
            <Section title="Events">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.events.map((e) => (
                  <Link
                    key={e.id}
                    href={`/event/${e.id}`}
                    className="rounded-xl bg-[#15151f] border border-brand-800/20 p-4 transition hover:bg-[#1a1a2e] block"
                  >
                    <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1">
                      {new Date(e.startDate).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric',
                      })}
                    </p>
                    <h3 className="font-bold truncate">{e.title}</h3>
                    {(e.venueName || e.venueCity) && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {[e.venueName, e.venueCity].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {e.hostName && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">by {e.hostName}</p>
                    )}
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* Articles */}
          {data.articles.length > 0 && (
            <Section title="Articles">
              <ul className="space-y-2">
                {data.articles.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/articles/${a.slug}`}
                      className="flex items-start gap-3 rounded-xl bg-[#15151f] border border-brand-800/20 p-3 transition hover:bg-[#1a1a2e]"
                    >
                      {a.coverUrl && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={a.coverUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{a.title}</p>
                        {a.excerpt && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.excerpt}</p>
                        )}
                        {a.authorName && (
                          <p className="text-xs text-gray-600 mt-1">by {a.authorName}</p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Marketplace */}
          {data.listings.length > 0 && (
            <Section title="Merch">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.listings.map((l) => (
                  <Link
                    key={l.id}
                    href={`/marketplace/${l.id}`}
                    className="rounded-xl bg-[#15151f] border border-brand-800/20 overflow-hidden transition hover:bg-[#1a1a2e] block"
                  >
                    {l.imageUrls && l.imageUrls.length > 0 && (
                      <div className="aspect-square bg-brand-950 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={l.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="font-bold text-sm truncate">{l.title}</h3>
                      {l.sellerName && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">by {l.sellerName}</p>
                      )}
                      <p className="text-base font-bold text-red-400 mt-2">${(l.price / 100).toFixed(2)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
    </section>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-[#15151f] animate-pulse" />
      ))}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Search</h1>
        <Suspense fallback={<div className="animate-pulse text-gray-400 py-8">Loading…</div>}>
          <SearchInner />
        </Suspense>
      </div>
    </div>
  );
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatPlays(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}
