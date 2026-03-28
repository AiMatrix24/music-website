'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useToast } from '@/app/components/Toast';

type Mood = 'All' | 'Upbeat' | 'Dramatic' | 'Chill' | 'Dark' | 'Inspirational';
type Tempo = 'All' | 'Slow' | 'Medium' | 'Fast';
type Vocal = 'All' | 'Vocal' | 'Instrumental';

interface Track {
  id: number;
  title: string;
  artist: string;
  genre: string;
  mood: Mood;
  bpm: number;
  duration: string;
  price: number;
  vocal: 'Vocal' | 'Instrumental';
  tags: string[];
}

const TRACKS: Track[] = [
  { id: 1, title: 'Neon Highway', artist: 'Cipher', genre: 'Electronic', mood: 'Upbeat', bpm: 128, duration: '3:24', price: 99, vocal: 'Instrumental', tags: ['Upbeat', 'Energetic'] },
  { id: 2, title: 'Midnight Rain', artist: 'VoxQueen', genre: 'R&B', mood: 'Dramatic', bpm: 85, duration: '4:12', price: 149, vocal: 'Vocal', tags: ['Dramatic', 'Emotional'] },
  { id: 3, title: 'Sunset Drift', artist: 'ChillProducer', genre: 'Lo-Fi', mood: 'Chill', bpm: 72, duration: '2:58', price: 79, vocal: 'Instrumental', tags: ['Chill', 'Relaxing'] },
  { id: 4, title: 'Shadow Protocol', artist: 'SynthLord', genre: 'Cinematic', mood: 'Dark', bpm: 95, duration: '3:45', price: 199, vocal: 'Instrumental', tags: ['Dark', 'Intense'] },
  { id: 5, title: 'Rise Above', artist: 'IndieStar', genre: 'Indie Rock', mood: 'Inspirational', bpm: 110, duration: '3:32', price: 129, vocal: 'Vocal', tags: ['Inspirational', 'Uplifting'] },
  { id: 6, title: 'Digital Dreams', artist: 'NeonWave', genre: 'Synthwave', mood: 'Upbeat', bpm: 118, duration: '4:01', price: 99, vocal: 'Instrumental', tags: ['Upbeat', 'Retro'] },
  { id: 7, title: 'Broken Mirrors', artist: 'BeatDropper', genre: 'Hip-Hop', mood: 'Dark', bpm: 90, duration: '3:15', price: 149, vocal: 'Vocal', tags: ['Dark', 'Raw'] },
  { id: 8, title: 'Ocean Breeze', artist: 'LoopMaster', genre: 'Ambient', mood: 'Chill', bpm: 68, duration: '5:22', price: 69, vocal: 'Instrumental', tags: ['Chill', 'Ambient'] },
  { id: 9, title: 'Victory Lap', artist: 'Cipher', genre: 'Electronic', mood: 'Inspirational', bpm: 135, duration: '3:48', price: 179, vocal: 'Instrumental', tags: ['Inspirational', 'Powerful'] },
  { id: 10, title: 'Velvet Touch', artist: 'VoxQueen', genre: 'Soul', mood: 'Dramatic', bpm: 78, duration: '4:30', price: 159, vocal: 'Vocal', tags: ['Dramatic', 'Soulful'] },
  { id: 11, title: 'Street Lights', artist: 'BeatDropper', genre: 'Trap', mood: 'Upbeat', bpm: 140, duration: '2:45', price: 89, vocal: 'Instrumental', tags: ['Upbeat', 'Hard'] },
  { id: 12, title: 'Morning Light', artist: 'ChillProducer', genre: 'Lo-Fi', mood: 'Inspirational', bpm: 82, duration: '3:10', price: 79, vocal: 'Instrumental', tags: ['Inspirational', 'Warm'] },
];

const LICENSE_TIERS = [
  {
    name: 'Standard',
    price: '$99',
    desc: 'Perfect for creators and small projects',
    features: ['Social media content', 'YouTube videos', 'Podcasts', 'Up to 100K views', 'Non-exclusive license'],
    color: 'border-gray-600',
    bg: 'bg-[#15151f]',
  },
  {
    name: 'Commercial',
    price: '$499',
    desc: 'For professional productions and brands',
    features: ['TV & film productions', 'Advertising campaigns', 'Up to 1M views', 'Radio broadcasts', 'Non-exclusive license'],
    color: 'border-red-500',
    bg: 'bg-gradient-to-b from-red-600/10 to-[#15151f]',
    popular: true,
  },
  {
    name: 'Exclusive',
    price: '$2,499',
    desc: 'Full buyout for unlimited usage',
    features: ['Unlimited usage rights', 'All media types', 'No view limits', 'Exclusive ownership', 'Full buyout license'],
    color: 'border-purple-500',
    bg: 'bg-[#15151f]',
  },
];

const PLACEMENTS = [
  { title: 'Echoes of Tomorrow', show: 'Netflix Original Series', type: 'TV Show', artist: 'Cipher' },
  { title: 'Rise Above', show: 'Nike "Just Move" Campaign', type: 'Advertisement', artist: 'IndieStar' },
  { title: 'Shadow Protocol', show: 'The Last Signal (Indie Film)', type: 'Film', artist: 'SynthLord' },
  { title: 'Ocean Breeze', show: 'The Creative Hour Podcast', type: 'Podcast', artist: 'LoopMaster' },
];

const FAQ = [
  { q: 'What rights do I get with a standard license?', a: 'A standard license grants you non-exclusive rights to use the track in social media content, YouTube videos, and podcasts with up to 100K combined views. The artist retains ownership and can license the same track to others.' },
  { q: 'Can I modify or remix a licensed track?', a: 'Yes, all license tiers allow you to edit, cut, loop, and adapt the track to fit your project. However, you cannot redistribute the raw audio file or resell the track itself.' },
  { q: 'How do artists get paid for licensing?', a: 'Artists receive 70% of all licensing fees. Payments are processed within 48 hours of purchase and deposited via USDC on Polygon or direct bank transfer.' },
  { q: 'What if I need a custom composition?', a: 'Contact the artist directly through their OPYNX profile to discuss custom work. Pricing and terms are negotiated between you and the artist.' },
];

const MOODS: Mood[] = ['All', 'Upbeat', 'Dramatic', 'Chill', 'Dark', 'Inspirational'];
const TEMPOS: Tempo[] = ['All', 'Slow', 'Medium', 'Fast'];
const VOCALS: Vocal[] = ['All', 'Vocal', 'Instrumental'];

const MOOD_COLORS: Record<string, string> = {
  Upbeat: 'bg-yellow-600/20 text-yellow-400',
  Dramatic: 'bg-purple-600/20 text-purple-400',
  Chill: 'bg-blue-600/20 text-blue-400',
  Dark: 'bg-gray-600/20 text-gray-300',
  Inspirational: 'bg-green-600/20 text-green-400',
  Energetic: 'bg-orange-600/20 text-orange-400',
  Emotional: 'bg-pink-600/20 text-pink-400',
  Relaxing: 'bg-cyan-600/20 text-cyan-400',
  Intense: 'bg-red-600/20 text-red-400',
  Uplifting: 'bg-emerald-600/20 text-emerald-400',
  Retro: 'bg-amber-600/20 text-amber-400',
  Raw: 'bg-rose-600/20 text-rose-400',
  Ambient: 'bg-indigo-600/20 text-indigo-400',
  Powerful: 'bg-red-600/20 text-red-400',
  Soulful: 'bg-violet-600/20 text-violet-400',
  Hard: 'bg-orange-600/20 text-orange-400',
  Warm: 'bg-yellow-600/20 text-yellow-400',
};

function getTempoCategory(bpm: number): Tempo {
  if (bpm < 90) return 'Slow';
  if (bpm < 120) return 'Medium';
  return 'Fast';
}

export default function LicensingPage() {
  const { toast } = useToast();
  const [mood, setMood] = useState<Mood>('All');
  const [tempo, setTempo] = useState<Tempo>('All');
  const [vocal, setVocal] = useState<Vocal>('All');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setLoaded(true); }, []);

  const filtered = TRACKS.filter((t) => {
    if (mood !== 'All' && t.mood !== mood) return false;
    if (tempo !== 'All' && getTempoCategory(t.bpm) !== tempo) return false;
    if (vocal !== 'All' && t.vocal !== vocal) return false;
    return true;
  });

  if (!loaded) {
    return (
      <div className="min-h-screen bg-brand-950 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-brand-800/30 rounded-xl w-2/3" />
            <div className="h-16 bg-brand-800/30 rounded-xl" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-brand-800/30 rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-950 pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Back nav */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-8 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </Link>

        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Get Your Music in <span className="text-red-500">Film, TV & Ads</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            License high-quality tracks from OPYNX artists for your next project. Simple pricing, instant access.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-[#15151f] border border-brand-800/30 rounded-2xl p-4 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mood</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value as Mood)}
                className="bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-500/50"
              >
                {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tempo</label>
              <select
                value={tempo}
                onChange={(e) => setTempo(e.target.value as Tempo)}
                className="bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-500/50"
              >
                {TEMPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Vocal</label>
              <select
                value={vocal}
                onChange={(e) => setVocal(e.target.value as Vocal)}
                className="bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-500/50"
              >
                {VOCALS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="ml-auto text-sm text-gray-400">
              {filtered.length} track{filtered.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* Track Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {filtered.map((track) => (
            <div key={track.id} className="bg-[#15151f] border border-brand-800/30 rounded-2xl overflow-hidden hover:border-red-500/30 transition group">
              {/* Waveform placeholder */}
              <div className="h-20 bg-brand-950 flex items-center justify-center px-4">
                <div className="flex items-end gap-0.5 h-10 w-full">
                  {[...Array(40)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-red-500/30 group-hover:bg-red-500/50 transition rounded-t"
                      style={{ height: `${Math.random() * 100}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-sm mb-0.5">{track.title}</h3>
                <p className="text-xs text-gray-400 mb-3">{track.artist} &middot; {track.genre}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {track.tags.map((tag) => (
                    <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${MOOD_COLORS[tag] || 'bg-gray-600/20 text-gray-400'}`}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>{track.bpm} BPM</span>
                  <span>{track.duration}</span>
                  <span>{track.vocal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-400">${track.price}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toast('Preview playing...', 'info')}
                      className="px-3 py-1.5 bg-brand-800/30 hover:bg-brand-800/50 rounded-lg text-xs font-medium transition"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => toast('Added to cart!', 'success')}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-semibold transition"
                    >
                      License
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* License Tiers */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">License Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {LICENSE_TIERS.map((tier) => (
              <div key={tier.name} className={`${tier.bg} border ${tier.color} rounded-2xl p-6 relative`}>
                {tier.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-600 rounded-full text-xs font-bold">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                <p className="text-3xl font-black text-white mb-2">{tier.price}</p>
                <p className="text-sm text-gray-400 mb-5">{tier.desc}</p>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${
                  tier.popular
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-brand-800/30 hover:bg-brand-800/50'
                }`}>
                  Select {tier.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Split */}
        <div className="bg-[#15151f] border border-brand-800/30 rounded-2xl p-8 text-center mb-16">
          <h2 className="text-2xl font-bold mb-3">Artists Keep 70%</h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-6">
            OPYNX offers industry-leading revenue splits. Artists keep 70% of all licensing fees, with transparent on-chain payments.
          </p>
          <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
            <div className="flex-[7] h-8 bg-red-600 rounded-l-full flex items-center justify-center text-xs font-bold">
              Artist 70%
            </div>
            <div className="flex-[3] h-8 bg-brand-800/50 rounded-r-full flex items-center justify-center text-xs font-bold text-gray-400">
              Platform 30%
            </div>
          </div>
        </div>

        {/* Submit Your Music */}
        <div className="bg-gradient-to-br from-red-600/10 to-purple-600/10 border border-red-500/20 rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold mb-3">Submit Your Music for Licensing</h2>
          <p className="text-gray-400 mb-6">
            Want your tracks in the marketplace? Submit your music and start earning from sync placements.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'WAV Format', desc: '24-bit / 48kHz minimum' },
              { label: 'Full Metadata', desc: 'Title, BPM, key, mood tags' },
              { label: 'Stems (Optional)', desc: 'Separate instrument tracks' },
            ].map((req) => (
              <div key={req.label} className="bg-brand-950/50 rounded-xl p-4 border border-brand-800/20">
                <p className="text-sm font-medium mb-1">{req.label}</p>
                <p className="text-xs text-gray-500">{req.desc}</p>
              </div>
            ))}
          </div>
          <button className="px-8 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-semibold text-sm transition">
            Submit Your Music
          </button>
        </div>

        {/* Recent Placements */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Where OPYNX Music Has Been Featured</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLACEMENTS.map((p, i) => (
              <div key={i} className="bg-[#15151f] border border-brand-800/30 rounded-2xl p-5">
                <span className="text-xs px-2.5 py-1 rounded-full bg-red-600/20 text-red-400 font-semibold">{p.type}</span>
                <h3 className="font-bold text-sm mt-3 mb-1">{p.show}</h3>
                <p className="text-xs text-gray-400">
                  &ldquo;{p.title}&rdquo; by {p.artist}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-[#15151f] border border-brand-800/30 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-medium text-sm">{item.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-gray-400 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
