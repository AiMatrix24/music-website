'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ShareButton } from '@/app/components/ShareButton';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: listing, isLoading, error } = trpc.marketplace.getItem.useQuery({ id });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading listing...</div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Listing not found</p>
        <Link href="/explore" className="text-brand-400 hover:text-brand-300 transition">
          ← Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/explore"
          className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block"
        >
          ← Back to Explore
        </Link>

        {/* Listing header */}
        <div className="rounded-2xl bg-[#15151f] overflow-hidden mb-8">
          <div className="h-56 bg-gradient-to-br from-brand-800 to-brand-950 flex items-center justify-center text-6xl">
            {categoryEmoji(listing.category)}
          </div>
          <div className="p-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="inline-block bg-brand-600/20 text-brand-400 text-xs px-3 py-1 rounded-full mb-3 font-semibold uppercase">
                  {listing.category.replace('_', ' ')}
                </span>
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-3xl font-black">{listing.title}</h1>
                  <ShareButton title={listing.title} />
                </div>
                {listing.sellerName && (
                  <Link
                    href={`/artist/${listing.sellerId}`}
                    className="text-gray-400 hover:text-brand-400 transition text-sm mt-1 inline-block"
                  >
                    by {listing.sellerName}
                  </Link>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-black text-brand-400">
                  ${(listing.price / 100).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 uppercase">{listing.currency}</p>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed">{listing.description}</p>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCard label="In Stock" value={String(listing.stock)} />
          <StatCard
            label="Status"
            value={listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
          />
        </div>

        {/* Purchase CTA */}
        <div className="rounded-2xl bg-gradient-to-r from-brand-700 to-brand-900 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Want this?</h2>
            <p className="text-gray-300 text-sm">
              {(listing.stock ?? 0) > 0
                ? `${listing.stock} left in stock`
                : 'Sold out'}
            </p>
          </div>
          <button
            disabled={(listing.stock ?? 0) === 0}
            className="rounded-full bg-white text-brand-950 px-8 py-3 font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {(listing.stock ?? 0) > 0 ? 'Add to Cart' : 'Sold Out'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#15151f] p-4 text-center">
      <p className="text-2xl font-bold text-brand-400">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
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
