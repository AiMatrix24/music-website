'use client';

import Link from 'next/link';
import { useState } from 'react';

const VENUES = [
  { id: 1, name: 'The Warehouse', city: 'Los Angeles', state: 'CA', capacity: 500, genres: ['Rock', 'Electronic'], rating: 4.7, pastShows: 312, availableSlots: 3, gradient: 'from-red-600 to-orange-500' },
  { id: 2, name: 'Neon Garden', city: 'Nashville', state: 'TN', capacity: 1200, genres: ['Acoustic', 'Rock'], rating: 4.5, pastShows: 245, availableSlots: 1, gradient: 'from-purple-600 to-pink-500' },
  { id: 3, name: 'Digital Arena', city: 'Austin', state: 'TX', capacity: 3000, genres: ['Electronic', 'Hip Hop'], rating: 4.8, pastShows: 189, availableSlots: 0, gradient: 'from-blue-600 to-cyan-500' },
  { id: 4, name: 'The Basement', city: 'New York', state: 'NY', capacity: 200, genres: ['Jazz', 'Acoustic'], rating: 4.9, pastShows: 520, availableSlots: 5, gradient: 'from-green-600 to-teal-500' },
  { id: 5, name: 'Blue Note', city: 'Chicago', state: 'IL', capacity: 150, genres: ['Jazz', 'Acoustic'], rating: 4.8, pastShows: 680, availableSlots: 2, gradient: 'from-indigo-600 to-blue-500' },
  { id: 6, name: 'Soundstage', city: 'Denver', state: 'CO', capacity: 800, genres: ['Rock', 'Multi-Genre'], rating: 4.4, pastShows: 156, availableSlots: 4, gradient: 'from-yellow-600 to-red-500' },
  { id: 7, name: 'The Roxy', city: 'Los Angeles', state: 'CA', capacity: 350, genres: ['Rock', 'Hip Hop'], rating: 4.6, pastShows: 430, availableSlots: 2, gradient: 'from-pink-600 to-red-500' },
  { id: 8, name: 'Fillmore', city: 'San Francisco', state: 'CA', capacity: 1100, genres: ['Multi-Genre', 'Electronic'], rating: 4.2, pastShows: 390, availableSlots: 0, gradient: 'from-emerald-600 to-lime-500' },
];

const SIZE_OPTIONS = [
  { label: 'All Sizes', min: 0, max: Infinity },
  { label: 'Intimate (1-100)', min: 1, max: 100 },
  { label: 'Small (100-300)', min: 100, max: 300 },
  { label: 'Medium (300-1000)', min: 300, max: 1000 },
  { label: 'Large (1000+)', min: 1000, max: Infinity },
];

const GENRE_OPTIONS = ['All', 'Rock', 'Electronic', 'Hip Hop', 'Jazz', 'Acoustic', 'Multi-Genre'];

function getSizeLabel(capacity: number) {
  if (capacity <= 100) return 'Intimate';
  if (capacity <= 300) return 'Small';
  if (capacity <= 1000) return 'Medium';
  return 'Large';
}

export default function VenuesDiscoverPage() {
  const [search, setSearch] = useState('');
  const [sizeFilter, setSizeFilter] = useState(0);
  const [genreFilter, setGenreFilter] = useState('All');

  const filtered = VENUES.filter((v) => {
    if (search && !v.city.toLowerCase().includes(search.toLowerCase()) && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.state.toLowerCase().includes(search.toLowerCase())) return false;
    const size = SIZE_OPTIONS[sizeFilter];
    if (size && (v.capacity < size.min || v.capacity > size.max)) return false;
    if (genreFilter !== 'All' && !v.genres.includes(genreFilter)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-brand-950 text-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-red-950 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Home
          </Link>
          <h1 className="mt-4 text-4xl font-bold md:text-5xl">
            <span className="mr-3">🏟️</span>Find Your Stage
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            Browse venues looking for creators. From intimate jazz clubs to massive arenas, find the perfect stage for your next performance.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-brand-950/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search city, region, or venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#15151f] py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>
          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-[#15151f] px-4 py-2.5 text-sm text-white focus:border-red-600 focus:outline-none"
          >
            {SIZE_OPTIONS.map((opt, i) => (
              <option key={i} value={i}>{opt.label}</option>
            ))}
          </select>
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#15151f] px-4 py-2.5 text-sm text-white focus:border-red-600 focus:outline-none"
          >
            {GENRE_OPTIONS.map((g) => (
              <option key={g} value={g}>{g === 'All' ? 'All Genres' : g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Venue Grid */}
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-400">{filtered.length} venue{filtered.length !== 1 ? 's' : ''} found</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((venue) => (
            <div key={venue.id} className="group overflow-hidden rounded-xl border border-white/10 bg-[#15151f] transition hover:border-red-600/50">
              {/* Cover Image Placeholder */}
              <div className={`relative h-40 bg-gradient-to-br ${venue.gradient}`}>
                <div className="absolute inset-0 flex items-center justify-center text-white/30">
                  <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                {/* Available Slots Badge */}
                {venue.availableSlots > 0 ? (
                  <span className="absolute right-3 top-3 rounded-full bg-green-600 px-2.5 py-1 text-xs font-semibold text-white">
                    {venue.availableSlots} Slot{venue.availableSlots !== 1 ? 's' : ''} Open
                  </span>
                ) : (
                  <span className="absolute right-3 top-3 rounded-full bg-gray-600 px-2.5 py-1 text-xs font-semibold text-white">
                    No Slots
                  </span>
                )}
                {/* Size Badge */}
                <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                  {getSizeLabel(venue.capacity)}
                </span>
              </div>

              <div className="p-4">
                <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition">{venue.name}</h3>
                <p className="mt-1 text-sm text-gray-400">{venue.city}, {venue.state}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {venue.genres.map((g) => (
                    <span key={g} className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300">{g}</span>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    <span className="font-medium">{venue.rating}</span>
                  </div>
                  <span className="text-gray-400">Cap: {venue.capacity.toLocaleString()}</span>
                </div>

                <p className="mt-2 text-xs text-gray-500">{venue.pastShows} past shows</p>

                <Link
                  href={`/venues/${venue.id}`}
                  className="mt-4 block w-full rounded-lg bg-red-600 py-2 text-center text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  View Venue
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-gray-400">
            <p className="text-lg">No venues match your filters</p>
            <p className="mt-2 text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* List Your Venue CTA */}
        <div className="mt-16 rounded-2xl border border-white/10 bg-gradient-to-r from-red-950/50 to-brand-900 p-8 text-center">
          <h2 className="text-2xl font-bold">Own a Venue?</h2>
          <p className="mx-auto mt-2 max-w-lg text-gray-300">
            List your venue on OPYNX and connect with thousands of creators looking for their next stage. Post available time slots and manage bookings effortlessly.
          </p>
          <Link
            href="/venues/post-slot"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            List Your Venue
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
