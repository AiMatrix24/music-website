'use client';

import Link from 'next/link';
import { useState } from 'react';

type Category = 'topline' | 'beats' | 'mixing' | 'cowriting';

interface Listing {
  id: number;
  category: Category;
  name: string;
  specialty: string;
  description: string;
  price: string;
  rating: number;
  samples: number;
  genre: string;
  turnaround: string;
}

const LISTINGS: Listing[] = [
  // Topline / Lyrics (12)
  { id: 1, category: 'topline', name: 'Sienna Vox', specialty: 'Pop Topline Writer', description: 'Worked with major labels', price: '$500/song + 25% songwriter share', rating: 4.9, samples: 24, genre: 'Pop', turnaround: '3-5 days' },
  { id: 2, category: 'topline', name: 'KaiHooks', specialty: 'Hip Hop Hooks That Hit', description: 'Catchy, chart-ready hooks', price: '$300/hook + 50% writer share', rating: 4.8, samples: 31, genre: 'Hip Hop', turnaround: '2-4 days' },
  { id: 3, category: 'topline', name: 'Ava Rivers', specialty: 'R&B Melody Specialist', description: 'Smooth melodies, soulful flows', price: '$400/song', rating: 4.9, samples: 18, genre: 'R&B', turnaround: '4-7 days' },
  { id: 4, category: 'topline', name: 'Lyric Forge', specialty: 'Country Storytelling Lyricist', description: 'Authentic Nashville-style lyrics', price: '$350/song', rating: 4.7, samples: 22, genre: 'Country', turnaround: '5-7 days' },
  { id: 5, category: 'topline', name: 'Nova Beat', specialty: 'EDM Topline Writer', description: 'Festival-ready vocal lines', price: '$450/song', rating: 4.8, samples: 27, genre: 'EDM', turnaround: '3-5 days' },
  { id: 6, category: 'topline', name: 'Indie Pen', specialty: 'Indie/Alt Lyricist', description: 'Vulnerable, poetic, raw', price: '$275/song', rating: 4.6, samples: 14, genre: 'Indie', turnaround: '4-6 days' },
  { id: 7, category: 'topline', name: 'Trap Wordsmith', specialty: 'Trap Bars + Hooks', description: 'Punchy bars, chartable hooks', price: '$250/song', rating: 4.7, samples: 38, genre: 'Trap', turnaround: '2-3 days' },
  { id: 8, category: 'topline', name: 'Melody Lane', specialty: 'Songwriter for Sync', description: 'TV/film-ready toplines', price: '$600/song', rating: 4.9, samples: 12, genre: 'Pop', turnaround: '5-7 days' },
  { id: 9, category: 'topline', name: 'Hook Doctor', specialty: 'Hook Specialist', description: 'Earworm hooks on demand', price: '$200/hook', rating: 4.8, samples: 45, genre: 'Pop', turnaround: '1-3 days' },
  { id: 10, category: 'topline', name: 'Verse Architect', specialty: 'Concept-Driven Lyricist', description: 'Story arcs and narrative songs', price: '$425/song + 30% share', rating: 4.7, samples: 19, genre: 'Multi', turnaround: '5-7 days' },
  { id: 11, category: 'topline', name: 'Bilingual Topliner', specialty: 'EN/ES Topline Writer', description: 'Latin pop crossover specialist', price: '$475/song', rating: 4.9, samples: 16, genre: 'Latin', turnaround: '4-6 days' },
  { id: 12, category: 'topline', name: 'Folk Quill', specialty: 'Folk/Americana Lyricist', description: 'Heartfelt acoustic-driven words', price: '$300/song', rating: 4.8, samples: 21, genre: 'Folk', turnaround: '5-7 days' },

  // Beats / Production (12)
  { id: 13, category: 'beats', name: '808 King', specialty: 'Trap Beats — 50K downloads', description: 'Hard-hitting 808s and snares', price: 'Lease $50, Exclusive $1500', rating: 4.9, samples: 156, genre: 'Trap', turnaround: '1-2 days' },
  { id: 14, category: 'beats', name: 'Lo-Fi Lab', specialty: 'Lo-fi Producer for Sync Licensing', description: 'Chill, clearable instrumentals', price: '$200 lease', rating: 4.8, samples: 89, genre: 'Lo-Fi', turnaround: '2-4 days' },
  { id: 15, category: 'beats', name: 'PopSmith', specialty: 'Pop Production Full Service', description: 'Toplined, mixed, and mastered', price: '$1200/song', rating: 4.9, samples: 33, genre: 'Pop', turnaround: '7-10 days' },
  { id: 16, category: 'beats', name: 'Vintage Vinyl', specialty: 'Soul / Boom Bap Beats', description: 'Crate-dug samples, live drums', price: 'Lease $75, Exclusive $1000', rating: 4.7, samples: 64, genre: 'Hip Hop', turnaround: '3-5 days' },
  { id: 17, category: 'beats', name: 'BassWave', specialty: 'EDM / Future Bass Producer', description: 'Festival-ready drops', price: '$800/track', rating: 4.8, samples: 42, genre: 'EDM', turnaround: '5-7 days' },
  { id: 18, category: 'beats', name: 'Synth Witch', specialty: 'Synthwave / Retro Producer', description: '80s-inspired analog warmth', price: 'Lease $100, Exclusive $1200', rating: 4.7, samples: 28, genre: 'Synthwave', turnaround: '4-6 days' },
  { id: 19, category: 'beats', name: 'AfrobeatPro', specialty: 'Afrobeats Producer', description: 'Dancehall + Afro fusion grooves', price: 'Lease $80, Exclusive $1800', rating: 4.9, samples: 51, genre: 'Afrobeats', turnaround: '3-5 days' },
  { id: 20, category: 'beats', name: 'Cinema Sound', specialty: 'Cinematic / Trailer Producer', description: 'Epic orchestral hybrid scores', price: '$1500/track', rating: 4.9, samples: 19, genre: 'Cinematic', turnaround: '7-14 days' },
  { id: 21, category: 'beats', name: 'Drill Director', specialty: 'UK Drill Beats', description: 'Sliding 808s, sinister vibes', price: 'Lease $60, Exclusive $1300', rating: 4.7, samples: 73, genre: 'Drill', turnaround: '1-3 days' },
  { id: 22, category: 'beats', name: 'Country Tracks', specialty: 'Modern Country Production', description: 'Nashville-grade tracks', price: '$950/song', rating: 4.8, samples: 24, genre: 'Country', turnaround: '5-7 days' },
  { id: 23, category: 'beats', name: 'House Hands', specialty: 'House / Tech-House Producer', description: 'Club-ready grooves', price: 'Lease $90, Exclusive $1100', rating: 4.7, samples: 47, genre: 'House', turnaround: '4-6 days' },
  { id: 24, category: 'beats', name: 'R&B Architect', specialty: 'R&B Producer', description: 'Smooth chords, modern drums', price: 'Lease $85, Exclusive $1400', rating: 4.9, samples: 39, genre: 'R&B', turnaround: '4-6 days' },

  // Mixing & Mastering (12)
  { id: 25, category: 'mixing', name: 'Mike Goldfinger', specialty: 'Grammy-nominated mix engineer', description: 'Pop, R&B, Hip Hop credits', price: '$500/song', rating: 5.0, samples: 78, genre: 'Multi', turnaround: '3-5 days' },
  { id: 26, category: 'mixing', name: 'Quick Master', specialty: 'Fast Mastering — 24hr turnaround', description: 'Rush mastering done right', price: '$75/song', rating: 4.7, samples: 234, genre: 'Multi', turnaround: '24 hours' },
  { id: 27, category: 'mixing', name: 'Vinyl Master Co', specialty: 'Vinyl Mastering Specialist', description: 'Cuts that translate to wax', price: '$150/song', rating: 4.9, samples: 42, genre: 'Multi', turnaround: '3-5 days' },
  { id: 28, category: 'mixing', name: 'Loud & Clear', specialty: 'Streaming-Optimized Master', description: 'LUFS-tuned for Spotify/Apple', price: '$60/song', rating: 4.8, samples: 312, genre: 'Multi', turnaround: '1-2 days' },
  { id: 29, category: 'mixing', name: 'EDM Mix Pros', specialty: 'EDM Mix Specialist', description: 'Massive lows, crisp highs', price: '$425/song', rating: 4.9, samples: 56, genre: 'EDM', turnaround: '3-5 days' },
  { id: 30, category: 'mixing', name: 'Atmos Studio', specialty: 'Dolby Atmos Mixing', description: 'Immersive spatial mixes', price: '$650/song', rating: 4.9, samples: 18, genre: 'Multi', turnaround: '5-7 days' },
  { id: 31, category: 'mixing', name: 'Vocal Polish', specialty: 'Vocal Tuning + Mixing', description: 'Pitch, timing, character', price: '$200/song', rating: 4.8, samples: 145, genre: 'Multi', turnaround: '2-4 days' },
  { id: 32, category: 'mixing', name: 'Hip Hop Mixer', specialty: 'Hip Hop / Trap Mix Specialist', description: '808s that knock, vox forward', price: '$350/song', rating: 4.9, samples: 89, genre: 'Hip Hop', turnaround: '3-5 days' },
  { id: 33, category: 'mixing', name: 'Indie Sonics', specialty: 'Indie / Alt Mix Engineer', description: 'Tape warmth, analog feel', price: '$275/song', rating: 4.7, samples: 64, genre: 'Indie', turnaround: '4-6 days' },
  { id: 34, category: 'mixing', name: 'Live Album Pros', specialty: 'Live Recording Mix', description: 'Multitrack live mixing', price: '$450/song', rating: 4.8, samples: 22, genre: 'Multi', turnaround: '5-7 days' },
  { id: 35, category: 'mixing', name: 'Stem Mastering', specialty: 'Stem Mastering Specialist', description: 'Per-stem control mastering', price: '$200/song', rating: 4.8, samples: 73, genre: 'Multi', turnaround: '2-3 days' },
  { id: 36, category: 'mixing', name: 'Album Polish', specialty: 'Album Mix + Master Bundle', description: 'Cohesive 8-12 track albums', price: '$3500/album', rating: 4.9, samples: 14, genre: 'Multi', turnaround: '14-21 days' },

  // Co-writing Sessions (12)
  { id: 37, category: 'cowriting', name: 'Zoom Studio Co-write', specialty: 'Live writing session via Zoom', description: 'Real-time collaboration', price: '$300/hr', rating: 4.9, samples: 47, genre: 'Multi', turnaround: 'Same day' },
  { id: 38, category: 'cowriting', name: 'Pop Writers Camp', specialty: 'In-Person LA Writing Camp', description: 'Full-day session, multiple writers', price: '$1500/day', rating: 5.0, samples: 12, genre: 'Pop', turnaround: 'Booked dates' },
  { id: 39, category: 'cowriting', name: 'Nashville Cowrite', specialty: 'Country Co-writing Session', description: 'Music Row pro setup', price: '$400/hr', rating: 4.9, samples: 28, genre: 'Country', turnaround: 'Scheduled' },
  { id: 40, category: 'cowriting', name: 'Hook Sprint', specialty: '90-Minute Hook Session', description: 'Walk away with a hook', price: '$200/session', rating: 4.7, samples: 56, genre: 'Multi', turnaround: 'Same day' },
  { id: 41, category: 'cowriting', name: 'Topline Together', specialty: 'Async Topline Co-write', description: 'Trade voice memos and sketches', price: '$250/song', rating: 4.6, samples: 38, genre: 'Multi', turnaround: '5-7 days' },
  { id: 42, category: 'cowriting', name: 'Producer + Writer Combo', specialty: 'Producer + Topline Pair', description: 'Beat + topline in one session', price: '$650/song', rating: 4.9, samples: 24, genre: 'Multi', turnaround: '3-5 days' },
  { id: 43, category: 'cowriting', name: 'Hip Hop Cypher Session', specialty: 'Hip Hop Cypher Co-write', description: 'Bars-trading session', price: '$350/hr', rating: 4.8, samples: 19, genre: 'Hip Hop', turnaround: 'Same day' },
  { id: 44, category: 'cowriting', name: 'Indie Songwriter Circle', specialty: 'Indie Songwriter Round', description: 'Small-group acoustic round', price: '$175/session', rating: 4.7, samples: 14, genre: 'Indie', turnaround: 'Scheduled' },
  { id: 45, category: 'cowriting', name: 'Latin Pop Session', specialty: 'Latin Pop Co-write', description: 'EN/ES bilingual writing', price: '$350/hr', rating: 4.9, samples: 22, genre: 'Latin', turnaround: 'Same day' },
  { id: 46, category: 'cowriting', name: 'Sync Writers Lab', specialty: 'Sync-Focused Co-write', description: 'TV/film/ad-ready compositions', price: '$500/song', rating: 4.8, samples: 16, genre: 'Multi', turnaround: '5-7 days' },
  { id: 47, category: 'cowriting', name: 'EDM Topline Lab', specialty: 'EDM Producer + Topline', description: 'Drop + vocal in one session', price: '$425/hr', rating: 4.7, samples: 31, genre: 'EDM', turnaround: 'Same day' },
  { id: 48, category: 'cowriting', name: 'Songwriter Bootcamp', specialty: 'Multi-Day Writers Retreat', description: '3-day intensive co-write', price: '$2400/retreat', rating: 5.0, samples: 8, genre: 'Multi', turnaround: 'Booked dates' },
];

const TOP_WRITERS = [
  { name: 'Sienna Vox', stat: '12 cuts this week', rating: 4.9 },
  { name: 'KaiHooks', stat: '9 cuts this week', rating: 4.8 },
  { name: 'Mike Goldfinger', stat: '8 mixes this week', rating: 5.0 },
  { name: '808 King', stat: '156 leases this week', rating: 4.9 },
  { name: 'Ava Rivers', stat: '6 cuts this week', rating: 4.9 },
];

const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: 'topline', label: 'Topline / Lyrics', emoji: '✍️' },
  { id: 'beats', label: 'Beats / Production', emoji: '🥁' },
  { id: 'mixing', label: 'Mixing & Mastering', emoji: '🎛️' },
  { id: 'cowriting', label: 'Co-writing Sessions', emoji: '🤝' },
];

const GENRES = ['All', 'Pop', 'Hip Hop', 'R&B', 'Country', 'EDM', 'Indie', 'Trap', 'Latin', 'Folk', 'Lo-Fi', 'Cinematic', 'Drill', 'Synthwave', 'House', 'Afrobeats', 'Multi'];
const PRICE_RANGES = ['All', 'Under $100', '$100-$500', '$500-$1000', '$1000+'];
const TURNAROUNDS = ['All', '24 hours', '1-3 days', '3-5 days', '5-7 days', '7+ days'];
const RATINGS = ['All', '4.5+', '4.7+', '4.9+'];

export default function SongwritingMarketplacePage() {
  const [activeCategory, setActiveCategory] = useState<Category>('topline');
  const [genre, setGenre] = useState('All');
  const [priceRange, setPriceRange] = useState('All');
  const [turnaround, setTurnaround] = useState('All');
  const [rating, setRating] = useState('All');

  const filtered = LISTINGS.filter((l) => {
    if (l.category !== activeCategory) return false;
    if (genre !== 'All' && l.genre !== genre) return false;
    if (rating === '4.5+' && l.rating < 4.5) return false;
    if (rating === '4.7+' && l.rating < 4.7) return false;
    if (rating === '4.9+' && l.rating < 4.9) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-brand-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <p className="text-5xl mb-3">🖊️</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Songwriter & Producer Marketplace</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Hire songwriters, producers, and engineers — or list your services
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`rounded-full px-5 py-2.5 font-semibold transition ${
                activeCategory === c.id
                  ? 'bg-red-600 text-white'
                  : 'bg-[#15151f] text-gray-300 hover:bg-[#1d1d2a]'
              }`}
            >
              <span className="mr-1.5">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Main */}
          <div>
            {/* Filter bar */}
            <div className="bg-[#15151f] rounded-xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Price Range</label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  {PRICE_RANGES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Turnaround Time</label>
                <select
                  value={turnaround}
                  onChange={(e) => setTurnaround(e.target.value)}
                  className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  {TURNAROUNDS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Rating</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full bg-brand-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  {RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* Listings grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((l) => (
                <div
                  key={l.id}
                  className="bg-[#15151f] rounded-xl p-5 border border-transparent hover:border-red-600/40 transition flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-400 flex items-center justify-center font-bold text-lg">
                      {l.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{l.name}</p>
                      <p className="text-xs text-gray-400 truncate">{l.specialty}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">{l.description}</p>
                  <div className="text-sm text-red-400 font-semibold mb-3">{l.price}</div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                    <span>⭐ {l.rating}</span>
                    <span>{l.samples} samples</span>
                    <span>{l.turnaround}</span>
                  </div>
                  <button className="mt-auto w-full rounded-full bg-red-600 hover:bg-red-500 transition py-2 font-semibold text-sm">
                    Hire
                  </button>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center text-gray-500 py-16">
                No listings match your filters.
              </div>
            )}

            {/* Become a Service Provider */}
            <div className="mt-10 bg-gradient-to-r from-red-600/20 to-red-400/10 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Become a Service Provider</h2>
              <p className="text-gray-300 mb-5 max-w-xl mx-auto">
                List your songwriting, production, or mixing services. Set your rates, choose your turnaround, and start booking.
              </p>
              <Link
                href="/marketplace/songwriting/apply"
                className="inline-block rounded-full bg-red-600 hover:bg-red-500 transition px-6 py-3 font-semibold"
              >
                Apply to List
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="bg-[#15151f] rounded-xl p-5">
              <h3 className="text-lg font-bold mb-4">Top Songwriters This Week</h3>
              <ol className="space-y-3">
                {TOP_WRITERS.map((w, i) => (
                  <li key={w.name} className="flex items-center gap-3">
                    <span className="text-red-400 font-bold w-5">{i + 1}</span>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-400 flex items-center justify-center font-bold">
                      {w.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{w.name}</p>
                      <p className="text-xs text-gray-400">{w.stat}</p>
                    </div>
                    <span className="text-xs text-gray-400">⭐ {w.rating}</span>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
