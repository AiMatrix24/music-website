'use client';

import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { FadeIn } from './components/FadeIn';
import { StatsCounter } from './components/StatsCounter';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 hero-gradient" />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px] hero-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] hero-glow" style={{ animationDelay: '2s' }} />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${6 + Math.random() * 8}s`,
                animationDelay: `${Math.random() * 8}s`,
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                opacity: 0.2 + Math.random() * 0.3,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-6">
          <p className="text-sm font-semibold uppercase tracking-[4px] text-brand-500 mb-4">
            The FanEngage Protocol
          </p>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Music. <span className="text-red-500">Direct.</span>
            <br />
            No Middlemen.
          </h1>
          <p className="text-lg text-gray-400 max-w-lg mx-auto mb-4">
            Subscribe directly to creators for $8.73/month. Every dollar is
            transparent, on-chain, and verifiable. Zero app store tax.
          </p>
          <Link href="/ewyk" className="inline-block mb-10 text-sm font-semibold text-red-400 hover:text-red-300 transition border-b border-red-400/30 hover:border-red-300 pb-0.5">
            🎯 Why OPYNX? &ldquo;Eat What You Kill&rdquo; →
          </Link>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/subscribe"
              className="rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-8 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-600/30"
            >
              Start Listening — $8.73/mo
            </Link>
            <Link
              href="/explore"
              className="rounded-full border-2 border-white/20 px-8 py-4 font-semibold text-white transition hover:border-brand-500 hover:text-brand-400"
            >
              Explore Music
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <StatsCounter />

      {/* Trending Tracks */}
      <TrendingTracks />

      {/* Upcoming Events */}
      <UpcomingEvents />

      {/* Revenue Transparency Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Where Your <span className="text-brand-500">$8.73</span> Goes
          </h2>
          <p className="text-gray-400 mb-16 max-w-xl mx-auto">
            Full transparency. Every cent accounted for. Verified on Polygon.
          </p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <WaterfallCard
              amount="$1.00"
              label="Creator"
              description="Direct to the creator. Always. Never reduced."
              color="from-purple-500 to-indigo-500"
            />
            <WaterfallCard
              amount="$0.25–$0.50"
              label="Facilitator"
              description="Venue staff who connected you. Geo-verified."
              color="from-pink-500 to-rose-500"
            />
            <WaterfallCard
              amount="$7.20"
              label="Platform"
              description="Infrastructure, CDN, support, and growth."
              color="from-blue-500 to-cyan-500"
            />
          </div>
        </div>
      </section>

      {/* Featured Marketplace */}
      <FeaturedMarketplace />

      {/* Features */}
      <section className="py-24 px-6 bg-brand-950/50">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Built for <span className="text-brand-500">Superfans</span>
          </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="320kbps Streaming"
              description="Premium quality audio. No ads. Unlimited skips."
            />
            <FeatureCard
              title="Exclusive Content"
              description="Voice memos, demos, and behind-the-scenes access."
            />
            <FeatureCard
              title="Pre-Sale Tickets"
              description="Priority access to Ticketmaster and AXS events."
            />
            <FeatureCard
              title="Merch Discounts"
              description="10-15% off on creator merchandise."
            />
            <FeatureCard
              title="On-Chain Payouts"
              description="Every payout verifiable on Polygon. No black box."
            />
            <FeatureCard
              title="No App Store"
              description="PWA. Install directly. Zero percent app store tax."
            />
          </div>
        </div>
      </section>

    </main>
  );
}

/* ─── Trending Tracks ─── */
function TrendingTracks() {
  const { data: tracks } = trpc.tracks.list.useQuery({ limit: 6 });

  if (!tracks || tracks.length === 0) return null;

  return (
    <section className="py-24 px-6 bg-brand-950/50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold">Trending Now</h2>
            <p className="text-gray-400 mt-1">Most played tracks this week</p>
          </div>
          <Link
            href="/explore"
            className="text-sm text-brand-400 hover:text-brand-300 transition font-semibold"
          >
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map((track, i) => (
            <Link
              key={track.id}
              href={`/track/${track.id}`}
              className="flex items-center gap-4 rounded-xl bg-[#15151f] p-4 transition hover:bg-[#1a1a2e] hover:-translate-y-0.5"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-lg font-bold">
                  {track.genre?.charAt(0) ?? '♪'}
                </div>
                <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{track.title}</p>
                <p className="text-sm text-gray-400">{track.genre}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-brand-400">
                  {formatPlays(track.playCount ?? 0)}
                </p>
                <p className="text-xs text-gray-500">plays</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Upcoming Events ─── */
function UpcomingEvents() {
  const { data: events } = trpc.events.list.useQuery({
    limit: 3,
    status: 'published',
  });

  if (!events || events.length === 0) return null;

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold">Upcoming Events</h2>
            <p className="text-gray-400 mt-1">Live shows & listening parties</p>
          </div>
          <Link
            href="/explore"
            className="text-sm text-brand-400 hover:text-brand-300 transition font-semibold"
          >
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((event) => {
            const date = new Date(event.startDate);
            return (
              <Link
                key={event.id}
                href={`/event/${event.id}`}
                className="rounded-2xl bg-[#15151f] overflow-hidden transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-900/20 block"
              >
                <div className="h-32 bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-black">{date.getDate()}</p>
                    <p className="text-sm font-semibold uppercase tracking-wider text-brand-300">
                      {date.toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    {event.capacity && (
                      <span>{event.capacity.toLocaleString()} cap</span>
                    )}
                    {event.timezone && (
                      <span>
                        {event.timezone.split('/')[1]?.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Featured Marketplace ─── */
function FeaturedMarketplace() {
  const { data: listings } = trpc.marketplace.listItems.useQuery({ limit: 3 });

  if (!listings || listings.length === 0) return null;

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold">Marketplace</h2>
            <p className="text-gray-400 mt-1">Merch, vinyl, gear & services</p>
          </div>
          <Link
            href="/explore"
            className="text-sm text-brand-400 hover:text-brand-300 transition font-semibold"
          >
            Shop All →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/marketplace/${listing.id}`}
              className="rounded-2xl bg-[#15151f] overflow-hidden transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-900/20 block"
            >
              <div className="h-40 bg-gradient-to-br from-brand-800 to-brand-950 flex items-center justify-center text-4xl">
                {categoryEmoji(listing.category)}
              </div>
              <div className="p-5">
                <h3 className="font-bold mb-1 truncate">{listing.title}</h3>
                <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                  {listing.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-brand-400">
                    ${(listing.price / 100).toFixed(2)}
                  </span>
                  <span className="text-xs bg-brand-600/20 text-brand-400 px-3 py-1 rounded-full">
                    {listing.category.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Helper Components ─── */
function WaterfallCard({
  amount,
  label,
  description,
  color,
}: {
  amount: string;
  label: string;
  description: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-[#15151f] p-8 text-center transition hover:-translate-y-1 hover:shadow-xl">
      <div
        className={`inline-block bg-gradient-to-r ${color} bg-clip-text text-transparent text-4xl font-black mb-2`}
      >
        {amount}
      </div>
      <h3 className="text-xl font-bold mb-2">{label}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-[#15151f] p-6 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-900/20">
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function formatPlays(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

function categoryEmoji(category: string): string {
  switch (category) {
    case 'physical_music': return '💿';
    case 'used_gear': return '🎛️';
    case 'services': return '🎵';
    case 'merch': return '👕';
    default: return '📦';
  }
}
