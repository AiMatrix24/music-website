'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';

/* ------------------------------------------------------------------ */
/*  Mock data                                                         */
/* ------------------------------------------------------------------ */

interface NftDrop {
  id: string;
  title: string;
  creator: string;
  artistId: string;
  edition: string;
  price: number;
  rarity: 'Common' | 'Rare' | 'Legendary';
  endsAt: number; // timestamp
  gradientFrom: string;
  gradientTo: string;
}

const LIVE_DROPS: NftDrop[] = [
  {
    id: '1',
    title: 'Neon Skyline',
    creator: 'ZVRA',
    artistId: 'a1',
    edition: '1 of 50',
    price: 25,
    rarity: 'Legendary',
    endsAt: Date.now() + 3 * 60 * 60 * 1000,
    gradientFrom: 'from-yellow-600',
    gradientTo: 'to-red-700',
  },
  {
    id: '2',
    title: 'Ocean Protocol',
    creator: 'Mira Solis',
    artistId: 'a2',
    edition: '12 of 200',
    price: 8,
    rarity: 'Rare',
    endsAt: Date.now() + 7 * 60 * 60 * 1000,
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-cyan-500',
  },
  {
    id: '3',
    title: 'Concrete Waves',
    creator: 'The Drift',
    artistId: 'a3',
    edition: '89 of 500',
    price: 3,
    rarity: 'Common',
    endsAt: Date.now() + 12 * 60 * 60 * 1000,
    gradientFrom: 'from-gray-600',
    gradientTo: 'to-gray-800',
  },
];

const UPCOMING_DROPS = [
  { id: 'u1', title: 'Phantom Signal', creator: 'KVLT', date: 'Apr 5, 2026', gradientFrom: 'from-purple-600', gradientTo: 'to-pink-600' },
  { id: 'u2', title: 'Solar Drift', creator: 'Aether', date: 'Apr 12, 2026', gradientFrom: 'from-orange-500', gradientTo: 'to-yellow-500' },
  { id: 'u3', title: 'Deep Currents', creator: 'Undertow', date: 'Apr 20, 2026', gradientFrom: 'from-teal-600', gradientTo: 'to-emerald-500' },
];

const OWNED_NFTS = [
  { id: 'o1', title: 'Midnight Protocol', creator: 'ZVRA', edition: '7 of 50', txHash: '0x1a2b3c' },
  { id: 'o2', title: 'Static Dreams', creator: 'Mira Solis', edition: '34 of 100', txHash: '0x4d5e6f' },
];

const STATS = [
  { label: 'Total Minted', value: '12,480' },
  { label: 'Unique Collectors', value: '3,217' },
  { label: 'Floor Price', value: '2 USDC' },
  { label: 'Volume Traded', value: '184K USDC' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const RARITY_STYLES: Record<NftDrop['rarity'], string> = {
  Common: 'bg-gray-600/30 text-gray-300 border-gray-600/40',
  Rare: 'bg-blue-600/20 text-blue-400 border-blue-500/40',
  Legendary: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
};

function useCountdown(target: number) {
  const [remaining, setRemaining] = useState(target - Date.now());
  useEffect(() => {
    const id = setInterval(() => setRemaining(target - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (remaining <= 0) return '00:00:00';
  const h = String(Math.floor(remaining / 3_600_000)).padStart(2, '0');
  const m = String(Math.floor((remaining % 3_600_000) / 60_000)).padStart(2, '0');
  const s = String(Math.floor((remaining % 60_000) / 1000)).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function NftDropsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading drops...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Back nav */}
        <Link href="/explore" className="text-gray-400 hover:text-white text-sm transition mb-6 inline-block">
          &larr; Back to Explore
        </Link>

        {/* Hero */}
        <section className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-red-500 via-pink-500 to-yellow-400 bg-clip-text text-transparent animate-pulse">
              Collectible Music Drops
            </span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Own a piece of your favorite music. Limited-edition collectibles verified on Polygon.
          </p>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-xl bg-[#15151f] p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Live Drops */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live Drops
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {LIVE_DROPS.map((drop) => (
              <NftCard key={drop.id} drop={drop} onCollect={() => toast(`Collected "${drop.title}"!`)} />
            ))}
          </div>
        </section>

        {/* Upcoming Drops */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold mb-6">Upcoming Drops</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {UPCOMING_DROPS.map((d) => (
              <div key={d.id} className="rounded-2xl bg-[#15151f] overflow-hidden border border-white/5">
                <div className={`h-36 bg-gradient-to-br ${d.gradientFrom} ${d.gradientTo} flex items-center justify-center text-4xl font-black opacity-60`}>
                  ?
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-1">{d.title}</h3>
                  <p className="text-sm text-gray-400 mb-3">{d.creator}</p>
                  <p className="text-xs text-gray-500 mb-4">Drops {d.date}</p>
                  <button
                    onClick={() => toast('You will be notified when this drops!', 'info')}
                    className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-semibold transition"
                  >
                    Notify Me
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Your Collection */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold mb-6">Your Collection</h2>
          {!session ? (
            <div className="rounded-2xl bg-[#15151f] p-10 text-center">
              <p className="text-gray-400 mb-4">Sign in to view your collection</p>
              <Link href="/auth/login" className="inline-block px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-semibold transition">
                Sign In
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {OWNED_NFTS.map((nft) => (
                <div key={nft.id} className="rounded-2xl bg-[#15151f] p-5 border border-white/5">
                  <div className="w-full h-28 rounded-xl bg-gradient-to-br from-red-700 to-pink-600 mb-4 flex items-center justify-center text-3xl font-black">
                    &#9830;
                  </div>
                  <h3 className="font-bold">{nft.title}</h3>
                  <p className="text-sm text-gray-400">{nft.creator} &middot; {nft.edition}</p>
                  <a
                    href={`https://polygonscan.com/tx/${nft.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-red-400 hover:text-red-300 mt-3 inline-block transition"
                  >
                    View on Polygon &rarr;
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* How It Works */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Browse', desc: 'Explore live and upcoming drops from your favorite creators.' },
              { step: '2', title: 'Collect', desc: 'Purchase limited-edition music collectibles with USDC.' },
              { step: '3', title: 'Own', desc: 'Your collectible is stored on-chain. Resell or hold forever.' },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl bg-[#15151f] p-6 text-center border border-white/5">
                <div className="w-12 h-12 rounded-full bg-red-600/20 text-red-400 text-xl font-black flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold mb-6 text-center">Benefits of Ownership</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: '&#9733;', title: 'Exclusive Access', desc: 'Unlock gated content, backstage passes, and early releases.' },
              { icon: '&#8644;', title: 'Resale Rights', desc: 'Trade or sell your collectibles on the secondary market.' },
              { icon: '&#9836;', title: 'Royalty Sharing', desc: 'Earn a share of streaming royalties from the track.' },
            ].map((b) => (
              <div key={b.title} className="rounded-2xl bg-[#15151f] p-6 border border-white/5">
                <span className="text-2xl" dangerouslySetInnerHTML={{ __html: b.icon }} />
                <h3 className="font-bold mt-3 mb-2">{b.title}</h3>
                <p className="text-sm text-gray-400">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Polygon badge */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-purple-600/15 text-purple-400 text-sm font-semibold border border-purple-500/20">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            All ownership verified on Polygon
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  NftCard                                                           */
/* ------------------------------------------------------------------ */

function NftCard({ drop, onCollect }: { drop: NftDrop; onCollect: () => void }) {
  const countdown = useCountdown(drop.endsAt);

  return (
    <div className="rounded-2xl bg-[#15151f] overflow-hidden border border-white/5 hover:border-red-600/30 transition-all group">
      <div className={`h-40 bg-gradient-to-br ${drop.gradientFrom} ${drop.gradientTo} flex items-center justify-center relative`}>
        <span className="text-5xl font-black opacity-30 group-hover:scale-110 transition-transform">&#9830;</span>
        <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full border ${RARITY_STYLES[drop.rarity]}`}>
          {drop.rarity}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-lg">{drop.title}</h3>
        <Link href={`/artist/${drop.artistId}`} className="text-sm text-gray-400 hover:text-red-400 transition">
          {drop.creator}
        </Link>
        <p className="text-xs text-gray-500 mt-1">{drop.edition}</p>

        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-xs text-gray-500">Price</p>
            <p className="font-bold text-red-400">{drop.price} USDC</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Ends in</p>
            <p className="font-mono text-sm font-bold">{countdown}</p>
          </div>
        </div>

        <button
          onClick={onCollect}
          className="w-full mt-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-bold transition"
        >
          Collect
        </button>
      </div>
    </div>
  );
}
