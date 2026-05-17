'use client';

import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';
import { trpc } from '@/lib/trpc/client';

export default function AlbumBuyPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { status: sessionStatus } = useSession();

  const justPurchased = searchParams.get('purchased') === 'true';

  const { data: album, isLoading } = trpc.albums.getById.useQuery({ id });
  const { data: albumTracks } = trpc.albums.getTracks.useQuery({ albumId: id }, { enabled: !!album });
  const { data: existingPurchase } = trpc.albums.hasPurchased.useQuery(
    { albumId: id },
    { enabled: sessionStatus === 'authenticated' }
  );

  const [submitting, setSubmitting] = useState(false);
  const buyMutation = trpc.albums.buy.useMutation({
    onSuccess: (result) => {
      window.location.href = result.paymentUrl;
    },
    onError: (err) => {
      toast(err.message || 'Purchase failed', 'error');
      setSubmitting(false);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading…</div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-5xl mb-2">💿</p>
        <h1 className="text-2xl font-bold">Album not found</h1>
        <Link href="/explore" className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white hover:bg-red-500 transition">
          Browse albums
        </Link>
      </div>
    );
  }

  const priceCents = album.price ?? 0;
  const priceUsd = priceCents / 100;
  const trackCount = albumTracks?.length ?? 0;

  if (priceCents === 0) {
    return (
      <div className="min-h-screen py-16 px-6">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-5xl mb-4">🎁</p>
          <h1 className="text-2xl font-bold mb-2">This album is free</h1>
          <p className="text-gray-400 mb-6">No purchase needed — just hit play.</p>
          <Link href={`/album/${id}`} className="rounded-full bg-red-600 hover:bg-red-500 px-6 py-3 font-semibold text-white transition">
            Go to album
          </Link>
        </div>
      </div>
    );
  }

  if (existingPurchase || justPurchased) {
    return (
      <div className="min-h-screen py-16 px-6">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl text-green-400">✓</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {justPurchased && !existingPurchase ? 'Payment received — album being activated' : 'You own this album'}
          </h1>
          <p className="text-gray-400 mb-6">
            {justPurchased && !existingPurchase
              ? "Your purchase is confirming on-chain. This page will show 'Owned' within a minute once the webhook lands."
              : `You purchased "${album.title}".`}
          </p>
          {existingPurchase && (
            <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Purchased</span>
                <span className="font-semibold">
                  {new Date(existingPurchase.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Amount paid</span>
                <span className="font-semibold">${(existingPurchase.pricePaid / 100).toFixed(2)}</span>
              </div>
            </div>
          )}
          <Link href={`/album/${id}`} className="rounded-full bg-red-600 hover:bg-red-500 px-6 py-3 font-semibold text-white transition">
            Go to album
          </Link>
        </div>
      </div>
    );
  }

  const handleBuy = () => {
    if (sessionStatus !== 'authenticated') {
      toast('Please sign in to buy', 'error');
      return;
    }
    setSubmitting(true);
    buyMutation.mutate({ albumId: id });
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-lg mx-auto">
        <Link href={`/album/${id}`} className="text-sm text-gray-400 hover:text-white transition mb-4 inline-block">
          ← Back to album
        </Link>

        <div className="flex items-center gap-4 mb-8">
          {album.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={album.coverUrl} alt="" className="w-24 h-24 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center text-3xl shrink-0">
              💿
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{album.title}</h1>
            <p className="text-gray-400">{trackCount} track{trackCount === 1 ? '' : 's'}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-sm text-gray-400 uppercase tracking-wider mb-2">Price</h2>
          <p className="text-4xl font-bold">${priceUsd.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">One-time purchase · Permanent access to all {trackCount} tracks</p>
        </div>

        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-sm text-gray-400 uppercase tracking-wider mb-3">Payment</h2>
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <p className="font-semibold">USDC on Polygon</p>
              <p className="text-xs text-gray-500">Via NOWPayments · Settled on-chain</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-sm text-gray-400 uppercase tracking-wider mb-3">Where your money goes</h2>
          <p className="text-xs text-gray-500 mb-2">
            The price is split across {trackCount || 'each'} track{trackCount === 1 ? '' : 's'} on the album. Each track&apos;s share routes to its collaborators according to its master royalty splits.
          </p>
        </div>

        <button
          onClick={handleBuy}
          disabled={submitting || buyMutation.isPending}
          className="w-full rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed py-4 font-bold text-white text-lg transition"
        >
          {submitting || buyMutation.isPending
            ? 'Redirecting to payment...'
            : `Buy Album — $${priceUsd.toFixed(2)}`}
        </button>
        {sessionStatus === 'unauthenticated' && (
          <p className="text-xs text-center text-gray-500 mt-3">
            <Link href="/auth/login" className="text-red-400 hover:text-red-300 underline">Sign in</Link> to complete purchase
          </p>
        )}
      </div>
    </div>
  );
}
