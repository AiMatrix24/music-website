'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';

const GENRES = ['All', 'Hip Hop', 'Trap', 'R&B', 'Pop', 'Electronic'] as const;
const KEYS = ['All', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

const MOCK_BEATS = [
  { id: 1, title: 'Midnight Flex', producer: 'ProdByNova', genre: 'Trap', bpm: 140, key: 'C#', prices: { basic: 29.99, premium: 99.99, exclusive: 499.99 } },
  { id: 2, title: 'Velvet Dreams', producer: 'SoulChef', genre: 'R&B', bpm: 85, key: 'G', prices: { basic: 29.99, premium: 99.99, exclusive: 499.99 } },
  { id: 3, title: 'Cloud Nine', producer: 'BeatsByAri', genre: 'Pop', bpm: 120, key: 'E', prices: { basic: 29.99, premium: 99.99, exclusive: 499.99 } },
  { id: 4, title: 'Dark Matter', producer: 'ProdByNova', genre: 'Trap', bpm: 155, key: 'A', prices: { basic: 29.99, premium: 99.99, exclusive: 499.99 } },
  { id: 5, title: 'Sunset Boulevard', producer: '808Wizard', genre: 'Hip Hop', bpm: 90, key: 'F', prices: { basic: 29.99, premium: 99.99, exclusive: 499.99 } },
  { id: 6, title: 'Neon Pulse', producer: 'SynthLord', genre: 'Electronic', bpm: 128, key: 'D', prices: { basic: 29.99, premium: 99.99, exclusive: 499.99 } },
  { id: 7, title: 'Street Gospel', producer: '808Wizard', genre: 'Hip Hop', bpm: 95, key: 'B', prices: { basic: 29.99, premium: 99.99, exclusive: 499.99 } },
  { id: 8, title: 'Crystal Lake', producer: 'SoulChef', genre: 'R&B', bpm: 78, key: 'A#', prices: { basic: 29.99, premium: 99.99, exclusive: 499.99 } },
  { id: 9, title: 'Hyperdrive', producer: 'SynthLord', genre: 'Electronic', bpm: 135, key: 'F#', prices: { basic: 29.99, premium: 99.99, exclusive: 499.99 } },
  { id: 10, title: 'Golden Hour', producer: 'BeatsByAri', genre: 'Pop', bpm: 110, key: 'G#', prices: { basic: 29.99, premium: 99.99, exclusive: 499.99 } },
  { id: 11, title: 'Phantom', producer: 'ProdByNova', genre: 'Trap', bpm: 148, key: 'D#', prices: { basic: 29.99, premium: 99.99, exclusive: 499.99 } },
  { id: 12, title: 'Slow Burn', producer: 'SoulChef', genre: 'R&B', bpm: 72, key: 'C', prices: { basic: 29.99, premium: 99.99, exclusive: 499.99 } },
];

const FEATURED_PRODUCERS = [
  { name: 'ProdByNova', beats: 48, genre: 'Trap / Hip Hop' },
  { name: 'SoulChef', beats: 35, genre: 'R&B / Soul' },
  { name: '808Wizard', beats: 62, genre: 'Hip Hop' },
  { name: 'SynthLord', beats: 29, genre: 'Electronic' },
];

export default function BeatsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [genre, setGenre] = useState<string>('All');
  const [keyFilter, setKeyFilter] = useState<string>('All');
  const [bpmRange, setBpmRange] = useState<[number, number]>([60, 180]);
  const [priceRange, setPriceRange] = useState<string>('All');
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [showLicense, setShowLicense] = useState(false);
  const [selectedBeat, setSelectedBeat] = useState<typeof MOCK_BEATS[0] | null>(null);

  const filtered = MOCK_BEATS.filter((b) => {
    if (genre !== 'All' && b.genre !== genre) return false;
    if (keyFilter !== 'All' && b.key !== keyFilter) return false;
    if (b.bpm < bpmRange[0] || b.bpm > bpmRange[1]) return false;
    return true;
  });

  const handleBuy = (beat: typeof MOCK_BEATS[0]) => {
    setSelectedBeat(beat);
    setShowLicense(true);
  };

  return (
    <div className="min-h-screen bg-brand-950 p-6 md:p-8 max-w-6xl mx-auto">
      <Link href="/" className="text-gray-400 hover:text-white text-sm mb-6 inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Home
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-4 mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Beat Store</h1>
          <p className="text-gray-400 mt-1">Find the perfect beat for your next hit.</p>
        </div>
        {session && (
          <button onClick={() => toast('Upload feature coming soon!', 'info')} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition whitespace-nowrap">
            Upload Beat
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-[#15151f] rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Genre</label>
          <select value={genre} onChange={(e) => setGenre(e.target.value)} className="bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-600">
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Key</label>
          <select value={keyFilter} onChange={(e) => setKeyFilter(e.target.value)} className="bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-600">
            {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">BPM Range</label>
          <div className="flex items-center gap-2">
            <input type="number" value={bpmRange[0]} onChange={(e) => setBpmRange([Number(e.target.value), bpmRange[1]])} className="w-16 bg-brand-950 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-red-600" />
            <span className="text-gray-500">-</span>
            <input type="number" value={bpmRange[1]} onChange={(e) => setBpmRange([bpmRange[0], Number(e.target.value)])} className="w-16 bg-brand-950 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-red-600" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Price</label>
          <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-600">
            <option value="All">All</option>
            <option value="basic">Basic ($29.99)</option>
            <option value="premium">Premium ($99.99)</option>
            <option value="exclusive">Exclusive ($499.99)</option>
          </select>
        </div>
      </div>

      {/* Beat Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {filtered.map((beat) => (
          <div key={beat.id} className="bg-[#15151f] rounded-xl p-4 hover:border-red-600/30 border border-transparent transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white font-semibold">{beat.title}</h3>
                <p className="text-gray-400 text-sm">{beat.producer}</p>
              </div>
              <span className="text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded-full font-medium">{beat.genre}</span>
            </div>

            <div className="flex gap-3 text-xs text-gray-400 mb-3">
              <span>{beat.bpm} BPM</span>
              <span>Key: {beat.key}</span>
            </div>

            {/* Waveform placeholder + play */}
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => setPlayingId(playingId === beat.id ? null : beat.id)} className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shrink-0 transition">
                {playingId === beat.id ? (
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
              <div className="flex-1 h-8 bg-brand-950 rounded-lg overflow-hidden flex items-center gap-px px-1">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div key={i} className={`w-1 rounded-full transition-all ${playingId === beat.id && i < 20 ? 'bg-red-600' : 'bg-gray-700'}`} style={{ height: `${Math.random() * 60 + 20}%` }} />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-white font-semibold">${beat.prices.basic}</span>
                <span className="text-gray-500 text-xs ml-1">Basic</span>
              </div>
              <button onClick={() => handleBuy(beat)} className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
                Buy License
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No beats match your filters.</p>
          <button onClick={() => { setGenre('All'); setKeyFilter('All'); setBpmRange([60, 180]); }} className="text-red-500 hover:text-red-400 text-sm mt-2">Clear filters</button>
        </div>
      )}

      {/* License Comparison Modal */}
      {showLicense && selectedBeat && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowLicense(false)}>
          <div className="bg-[#15151f] rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">License Options &mdash; {selectedBeat.title}</h2>
              <button onClick={() => setShowLicense(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { tier: 'Basic', price: selectedBeat.prices.basic, features: ['MP3 file only', 'Up to 5,000 streams', 'No profit sharing required', 'Credit required', 'Non-exclusive'] },
                { tier: 'Premium', price: selectedBeat.prices.premium, features: ['WAV + stems included', 'Up to 100,000 streams', '50% profit share', 'Credit required', 'Non-exclusive'], popular: true },
                { tier: 'Exclusive', price: selectedBeat.prices.exclusive, features: ['Full ownership transfer', 'Unlimited streams', 'All rights included', 'No credit required', 'Beat removed from store'] },
              ].map((l) => (
                <div key={l.tier} className={`rounded-xl p-5 border ${l.popular ? 'border-red-600 bg-red-600/5' : 'border-gray-700 bg-brand-950'}`}>
                  {l.popular && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-medium mb-3 inline-block">Most Popular</span>}
                  <h3 className="text-white font-bold text-lg">{l.tier}</h3>
                  <p className="text-red-500 text-2xl font-bold mt-1">${l.price}</p>
                  <ul className="mt-4 space-y-2">
                    {l.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => { toast(`${l.tier} license for "${selectedBeat.title}" added to cart!`, 'success'); setShowLicense(false); }} className={`w-full mt-4 py-2.5 rounded-lg font-semibold text-sm transition ${l.popular ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}>
                    Buy {l.tier}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Featured Producers */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Featured Producers</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURED_PRODUCERS.map((p) => (
            <div key={p.name} className="bg-[#15151f] rounded-xl p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-brand-950 mx-auto mb-3 flex items-center justify-center text-red-500 font-bold text-xl">
                {p.name.charAt(0)}
              </div>
              <h3 className="text-white font-semibold">{p.name}</h3>
              <p className="text-gray-400 text-sm">{p.genre}</p>
              <p className="text-gray-500 text-xs mt-1">{p.beats} beats</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
