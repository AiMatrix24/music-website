'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

const VENUE_DATA: Record<string, {
  name: string; address: string; city: string; state: string; capacity: number;
  genres: string[]; rating: number; description: string; gradient: string;
}> = {
  '1': { name: 'The Warehouse', address: '742 Industrial Blvd', city: 'Los Angeles', state: 'CA', capacity: 500, genres: ['Rock', 'Electronic'], rating: 4.7, description: 'A converted industrial space in the heart of LA\'s arts district. Known for incredible acoustics and an electric atmosphere that brings out the best in every performer. Our state-of-the-art sound system and intimate layout make every show unforgettable.', gradient: 'from-red-600 to-orange-500' },
  '2': { name: 'Neon Garden', address: '1205 Broadway Ave', city: 'Nashville', state: 'TN', capacity: 1200, genres: ['Acoustic', 'Rock'], rating: 4.5, description: 'Nashville\'s premier live music destination, blending southern hospitality with world-class production. From country legends to indie rockers, Neon Garden has hosted them all.', gradient: 'from-purple-600 to-pink-500' },
  '3': { name: 'Digital Arena', address: '8800 Tech Pkwy', city: 'Austin', state: 'TX', capacity: 3000, genres: ['Electronic', 'Hip Hop'], rating: 4.8, description: 'Austin\'s largest indoor electronic music venue with immersive LED installations, ground-shaking bass, and a crowd that lives for the drop.', gradient: 'from-blue-600 to-cyan-500' },
  '4': { name: 'The Basement', address: '55 Sullivan St', city: 'New York', state: 'NY', capacity: 200, genres: ['Jazz', 'Acoustic'], rating: 4.9, description: 'An underground gem in Greenwich Village. Since 1962, The Basement has been the launching pad for jazz legends and singer-songwriters who define generations.', gradient: 'from-green-600 to-teal-500' },
  '5': { name: 'Blue Note', address: '331 N Michigan Ave', city: 'Chicago', state: 'IL', capacity: 150, genres: ['Jazz', 'Acoustic'], rating: 4.8, description: 'Chicago\'s most storied jazz club. An intimate setting where the music speaks and every seat is the best seat in the house.', gradient: 'from-indigo-600 to-blue-500' },
  '6': { name: 'Soundstage', address: '2100 Larimer St', city: 'Denver', state: 'CO', capacity: 800, genres: ['Rock', 'Multi-Genre'], rating: 4.4, description: 'Denver\'s versatile multi-genre venue in the RiNo district. A flexible space that transforms from rock club to electronic haven night after night.', gradient: 'from-yellow-600 to-red-500' },
  '7': { name: 'The Roxy', address: '9009 Sunset Blvd', city: 'Los Angeles', state: 'CA', capacity: 350, genres: ['Rock', 'Hip Hop'], rating: 4.6, description: 'A Sunset Strip institution since the 70s. The Roxy has launched careers and created legendary moments in music history.', gradient: 'from-pink-600 to-red-500' },
  '8': { name: 'Fillmore', address: '1805 Geary Blvd', city: 'San Francisco', state: 'CA', capacity: 1100, genres: ['Multi-Genre', 'Electronic'], rating: 4.2, description: 'The legendary Fillmore continues its tradition of presenting the finest in live music across every genre, from psychedelic rock to cutting-edge electronic.', gradient: 'from-emerald-600 to-lime-500' },
};

const AVAILABLE_SLOTS = [
  { id: 1, date: '2026-04-18', time: '7:00 PM - 8:30 PM', type: 'Support Act', compensation: 'Revenue Share 20%', applications: 5 },
  { id: 2, date: '2026-04-22', time: '9:00 PM - 11:00 PM', type: 'Headliner', compensation: 'Flat Fee $500', applications: 12 },
  { id: 3, date: '2026-04-25', time: '6:00 PM - 10:00 PM', type: 'Open Mic', compensation: 'Free', applications: 3 },
  { id: 4, date: '2026-05-02', time: '8:00 PM - 9:30 PM', type: 'Test Night', compensation: 'Flat Fee $200', applications: 7 },
  { id: 5, date: '2026-05-10', time: '7:00 PM - 11:00 PM', type: 'Showcase', compensation: 'Door Split 60%', applications: 9 },
];

const UPCOMING_SHOWS = [
  { id: 1, creator: 'Luna Vega', date: '2026-04-15', genre: 'Electronic', ticketsSold: 320 },
  { id: 2, creator: 'The Drift', date: '2026-04-20', genre: 'Indie Rock', ticketsSold: 215 },
  { id: 3, creator: 'Nadia Rose', date: '2026-05-01', genre: 'Pop', ticketsSold: 480 },
];

const PAST_SHOWS = [
  { creator: 'Echo Chamber', date: '2026-03-28', attendance: 410 },
  { creator: 'DJ Koda', date: '2026-03-15', attendance: 495 },
  { creator: 'Solstice', date: '2026-02-22', attendance: 380 },
  { creator: 'Northern Lights', date: '2026-02-10', attendance: 350 },
];

const AMENITIES = [
  { name: 'Sound System', icon: '🔊' },
  { name: 'Green Room', icon: '🛋️' },
  { name: 'Parking', icon: '🅿️' },
  { name: 'Load-In Access', icon: '🚛' },
  { name: 'Merch Table', icon: '👕' },
  { name: 'Recording Available', icon: '🎙️' },
];

export default function VenueProfilePage() {
  const params = useParams();
  const { toast } = useToast();
  const id = params?.id as string;
  const venue = VENUE_DATA[id] || VENUE_DATA['1'];
  const [appliedSlots, setAppliedSlots] = useState<number[]>([]);

  const handleApply = (slotId: number) => {
    setAppliedSlots((prev) => [...prev, slotId]);
    toast('Application submitted! The venue will review your profile.', 'success');
  };

  const stats = [
    { label: 'Total Shows', value: '312' },
    { label: 'Creators Hosted', value: '185' },
    { label: 'Avg Attendance', value: `${Math.round(venue.capacity * 0.78)}` },
    { label: 'Rating', value: venue.rating.toString() },
  ];

  return (
    <div className="min-h-screen bg-brand-950 text-white">
      {/* Cover Image */}
      <div className={`relative h-64 bg-gradient-to-br ${venue.gradient} md:h-80`}>
        <div className="absolute inset-0 flex items-center justify-center text-white/20">
          <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        </div>
        <div className="absolute left-4 top-4">
          <Link href="/venues/discover" className="inline-flex items-center gap-2 rounded-lg bg-black/40 px-3 py-2 text-sm text-white backdrop-blur hover:bg-black/60 transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            All Venues
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        {/* Venue Header */}
        <div className="-mt-12 relative z-10 rounded-xl border border-white/10 bg-[#15151f] p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold md:text-4xl">{venue.name}</h1>
              <p className="mt-1 text-gray-400">{venue.address}, {venue.city}, {venue.state}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-gray-300">Capacity: {venue.capacity.toLocaleString()}</span>
                {venue.genres.map((g) => (
                  <span key={g} className="rounded-full bg-red-600/20 px-3 py-1 text-sm text-red-400">{g}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-yellow-400">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                <span className="text-xl font-bold">{venue.rating}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-[#15151f] p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{s.value}</p>
              <p className="mt-1 text-sm text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* About */}
        <div className="mt-8 rounded-xl border border-white/10 bg-[#15151f] p-6">
          <h2 className="text-xl font-bold">About</h2>
          <p className="mt-3 leading-relaxed text-gray-300">{venue.description}</p>
        </div>

        {/* Available Slots */}
        <div className="mt-8 rounded-xl border border-white/10 bg-[#15151f] p-6">
          <h2 className="text-xl font-bold">Available Slots</h2>
          <p className="mt-1 text-sm text-gray-400">Apply for an open time slot at this venue</p>
          <div className="mt-4 space-y-3">
            {AVAILABLE_SLOTS.map((slot) => (
              <div key={slot.id} className="flex flex-col gap-3 rounded-lg border border-white/5 bg-brand-950/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white">{slot.date}</span>
                    <span className="text-sm text-gray-400">{slot.time}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-red-600/20 px-2.5 py-0.5 text-xs font-medium text-red-400">{slot.type}</span>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-gray-300">{slot.compensation}</span>
                    <span className="text-xs text-gray-500">{slot.applications} application{slot.applications !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleApply(slot.id)}
                  disabled={appliedSlots.includes(slot.id)}
                  className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                    appliedSlots.includes(slot.id)
                      ? 'bg-green-600/20 text-green-400 cursor-default'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {appliedSlots.includes(slot.id) ? 'Applied' : 'Apply'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Shows */}
        <div className="mt-8 rounded-xl border border-white/10 bg-[#15151f] p-6">
          <h2 className="text-xl font-bold">Upcoming Shows</h2>
          <div className="mt-4 space-y-3">
            {UPCOMING_SHOWS.map((show) => (
              <div key={show.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-brand-950/50 p-4">
                <div>
                  <p className="font-semibold">{show.creator}</p>
                  <p className="text-sm text-gray-400">{show.date} &middot; {show.genre}</p>
                </div>
                <span className="text-sm text-gray-400">{show.ticketsSold} tickets sold</span>
              </div>
            ))}
          </div>
        </div>

        {/* Past Shows */}
        <div className="mt-8 rounded-xl border border-white/10 bg-[#15151f] p-6">
          <h2 className="text-xl font-bold">Past Shows</h2>
          <div className="mt-4 space-y-3">
            {PAST_SHOWS.map((show, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-brand-950/50 p-4">
                <div>
                  <p className="font-semibold">{show.creator}</p>
                  <p className="text-sm text-gray-400">{show.date}</p>
                </div>
                <span className="text-sm text-gray-400">{show.attendance} attended</span>
              </div>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div className="mt-8 rounded-xl border border-white/10 bg-[#15151f] p-6">
          <h2 className="text-xl font-bold">Amenities</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {AMENITIES.map((a) => (
              <div key={a.name} className="flex items-center gap-3 rounded-lg border border-white/5 bg-brand-950/50 p-3">
                <span className="text-xl">{a.icon}</span>
                <span className="text-sm text-gray-300">{a.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact & Map */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#15151f] p-6">
            <h2 className="text-xl font-bold">Contact & Booking</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-3 text-gray-300">
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                booking@{venue.name.toLowerCase().replace(/\s+/g, '')}.com
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                (555) 012-3456
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                www.{venue.name.toLowerCase().replace(/\s+/g, '')}.com
              </div>
            </div>
            <button
              onClick={() => toast('Claim request sent! We\'ll verify your ownership.', 'info')}
              className="mt-5 w-full rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10"
            >
              I&apos;m the Venue Owner
            </button>
          </div>

          {/* Map Placeholder */}
          <div className="rounded-xl border border-white/10 bg-[#15151f] p-6">
            <h2 className="text-xl font-bold">Location</h2>
            <div className="mt-4 flex h-48 items-center justify-center rounded-lg border border-white/5 bg-brand-950/50">
              <div className="text-center text-gray-500">
                <svg className="mx-auto h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <p className="mt-2 text-sm">{venue.address}</p>
                <p className="text-sm">{venue.city}, {venue.state}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="h-16" />
      </div>
    </div>
  );
}
