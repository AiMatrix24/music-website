'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/app/components/Toast';
import { useRouter } from 'next/navigation';

const GENRES = ['Rock', 'Electronic', 'Hip Hop', 'Jazz', 'Acoustic', 'R&B', 'Pop', 'Metal', 'Country', 'Latin', 'Multi-Genre'];
const AMENITIES = ['Sound System', 'Green Room', 'Parking', 'Load-In Access', 'Merch Table', 'Recording Available', 'Bar/Kitchen', 'Outdoor Area', 'VIP Section', 'Wheelchair Access'];

export default function CreateVenuePage() {
  const { status } = useSession();
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl mb-2">🏟️</p>
        <p className="text-gray-400 text-lg">Sign in to list your venue</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Sign In</Link>
      </div>
    );
  }

  const toggleGenre = (g: string) => {
    setGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  };

  const toggleAmenity = (a: string) => {
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const handleSubmit = async () => {
    if (!name || !city || !capacity) {
      toast('Please fill in venue name, city, and capacity', 'error');
      return;
    }
    setSubmitting(true);
    // In production this would call a tRPC mutation to create the venue
    setTimeout(() => {
      setSubmitting(false);
      toast('Venue listed successfully! It will be reviewed within 24 hours.', 'success');
      router.push('/venues/discover');
    }, 1500);
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/venues/discover" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          ← Back to Venues
        </Link>

        <h1 className="text-3xl font-bold mb-2">List Your Venue</h1>
        <p className="text-gray-400 mb-8">Add your venue to the OPYNX marketplace and connect with creators.</p>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
            <h2 className="font-bold mb-4">Venue Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Venue Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. The Warehouse"
                  className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">City *</label>
                  <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Los Angeles"
                    className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">State</label>
                  <input value={state} onChange={(e) => setState(e.target.value)} placeholder="CA"
                    className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Street Address</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Music Ave"
                  className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Capacity *</label>
                <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="500"
                  className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell creators about your venue..."
                  rows={4} className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition resize-none" />
              </div>
            </div>
          </div>

          {/* Genres */}
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
            <h2 className="font-bold mb-4">Genre Focus</h2>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <button key={g} onClick={() => toggleGenre(g)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                    genres.includes(g) ? 'bg-red-600 text-white' : 'bg-brand-950 text-gray-400 hover:text-white border border-brand-800/30'
                  }`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
            <h2 className="font-bold mb-4">Amenities</h2>
            <div className="grid grid-cols-2 gap-3">
              {AMENITIES.map((a) => (
                <label key={a} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={amenities.includes(a)} onChange={() => toggleAmenity(a)}
                    className="w-5 h-5 rounded accent-red-600 bg-brand-950" />
                  <span className="text-sm text-gray-300">{a}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
            <h2 className="font-bold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="booking@venue.com" type="email"
                className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition" />
              <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="(555) 123-4567" type="tel"
                className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition" />
              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourvenuesite.com"
                className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition" />
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={submitting}
            className="w-full rounded-full bg-red-600 py-4 font-semibold text-white text-lg transition hover:bg-red-500 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'List My Venue'}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Venues are reviewed within 24 hours. Once approved, you can start posting available slots and receiving artist applications.
          </p>
        </div>
      </div>
    </div>
  );
}
