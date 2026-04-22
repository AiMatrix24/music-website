'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

// --- Mock Data ---
const BOOKABLE_ARTISTS = [
  { id: 1, name: 'Luna Vega', genre: 'Electronic', feeRange: '$500–$2,000', available: true, rating: 4.8, pastShows: 42 },
  { id: 2, name: 'The Drift', genre: 'Indie Rock', feeRange: '$800–$3,000', available: true, rating: 4.6, pastShows: 78 },
  { id: 3, name: 'DJ Koda', genre: 'Hip-Hop', feeRange: '$1,200–$5,000', available: false, rating: 4.9, pastShows: 120 },
  { id: 4, name: 'Solstice', genre: 'R&B / Soul', feeRange: '$600–$2,500', available: true, rating: 4.7, pastShows: 35 },
  { id: 5, name: 'Echo Chamber', genre: 'Alternative', feeRange: '$400–$1,500', available: true, rating: 4.4, pastShows: 24 },
  { id: 6, name: 'Nadia Rose', genre: 'Pop', feeRange: '$1,500–$6,000', available: true, rating: 4.9, pastShows: 95 },
];

const INQUIRIES = [
  { id: 1, venue: 'The Blue Note', date: '2026-05-15', fee: '$2,000', status: 'Pending' as const, capacity: 350, message: 'We would love to book you for our Spring Jazz Series.' },
  { id: 2, venue: 'Warehouse 21', date: '2026-06-02', fee: '$1,500', status: 'Pending' as const, capacity: 600, message: 'Electronic night showcase. Great sound system.' },
  { id: 3, venue: 'The Roxy', date: '2026-04-20', fee: '$3,000', status: 'Accepted' as const, capacity: 500, message: 'Album release show — headliner slot.' },
  { id: 4, venue: 'Sunset Lounge', date: '2026-03-10', fee: '$800', status: 'Declined' as const, capacity: 150, message: 'Intimate acoustic set for our Friday night series.' },
];

const BOOKING_HISTORY = [
  { venue: 'Madison Square Garden', date: '2026-02-14', fee: '$5,000', rating: 5.0 },
  { venue: 'The Forum', date: '2025-12-31', fee: '$3,500', rating: 4.8 },
  { venue: 'House of Blues', date: '2025-11-22', fee: '$2,200', rating: 4.6 },
];

const AVAILABILITY = [
  { day: 'Mon', date: '31', available: true },
  { day: 'Tue', date: '1', available: false },
  { day: 'Wed', date: '2', available: true },
  { day: 'Thu', date: '3', available: true },
  { day: 'Fri', date: '4', available: false },
  { day: 'Sat', date: '5', available: true },
  { day: 'Sun', date: '6', available: true },
];

export default function BookingPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [role, setRole] = useState<'venue' | 'creator'>('venue');
  const [inquiries, setInquiries] = useState(INQUIRIES);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<typeof BOOKABLE_ARTISTS[0] | null>(null);
  const [genreFilter, setGenreFilter] = useState('All');
  const [priceFilter, setPriceFilter] = useState('All');
  const [inquiryForm, setInquiryForm] = useState({ eventDate: '', venueName: '', capacity: '', offeredFee: '', message: '' });
  const [ratesForm, setRatesForm] = useState({ minimum: '500', standard: '1500', festival: '5000' });

  const isAuth = status === 'authenticated';

  const handleInquiry = (creator: typeof BOOKABLE_ARTISTS[0]) => {
    setSelectedArtist(creator);
    setShowInquiryModal(true);
  };

  const submitInquiry = () => {
    if (!inquiryForm.eventDate || !inquiryForm.venueName) {
      toast('Please fill in required fields', 'error');
      return;
    }
    toast(`Inquiry sent to ${selectedArtist?.name}!`, 'success');
    setShowInquiryModal(false);
    setInquiryForm({ eventDate: '', venueName: '', capacity: '', offeredFee: '', message: '' });
  };

  const handleInquiryAction = (id: number, action: 'Accepted' | 'Declined') => {
    setInquiries((prev) => prev.map((inq) => inq.id === id ? { ...inq, status: action } : inq));
    toast(`Booking ${action.toLowerCase()}`, action === 'Accepted' ? 'success' : 'info');
  };

  const genres = ['All', ...new Set(BOOKABLE_ARTISTS.map((a) => a.genre))];
  const filteredArtists = BOOKABLE_ARTISTS.filter((a) => {
    if (genreFilter !== 'All' && a.genre !== genreFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">
            ← Home
          </Link>
          <h1 className="text-3xl font-bold">Booking Portal</h1>
          <p className="text-gray-400 mt-1">Connect creators with venues and events</p>
        </div>

        {/* Role Toggle */}
        <div className="flex items-center gap-1 rounded-full bg-[#15151f] border border-brand-800/20 p-1 w-fit mb-8">
          <button
            onClick={() => setRole('venue')}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
              role === 'venue' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            I&apos;m a Venue
          </button>
          <button
            onClick={() => setRole('creator')}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
              role === 'creator' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            I&apos;m an Creator
          </button>
        </div>

        {/* =================== VENUE VIEW =================== */}
        {role === 'venue' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="rounded-xl bg-[#15151f] border border-brand-800/30 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/50"
              >
                {genres.map((g) => <option key={g} value={g}>{g === 'All' ? 'All Genres' : g}</option>)}
              </select>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="rounded-xl bg-[#15151f] border border-brand-800/30 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/50"
              >
                <option value="All">Any Price</option>
                <option value="low">Under $1,000</option>
                <option value="mid">$1,000–$3,000</option>
                <option value="high">$3,000+</option>
              </select>
            </div>

            <h2 className="text-lg font-bold mb-4">Find Creators to Book</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {filteredArtists.map((creator) => (
                <div key={creator.id} className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5 hover:border-red-600/30 transition">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-bold">
                      {creator.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{creator.name}</p>
                      <p className="text-xs text-gray-500">{creator.genre}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Fee Range</span>
                      <span className="font-medium">{creator.feeRange}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Rating</span>
                      <span className="font-medium text-yellow-400">{'★'.repeat(Math.floor(creator.rating))} {creator.rating}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Past Shows</span>
                      <span className="font-medium">{creator.pastShows}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Availability</span>
                      <span className={`flex items-center gap-1 font-medium ${creator.available ? 'text-green-400' : 'text-red-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${creator.available ? 'bg-green-400' : 'bg-red-400'}`} />
                        {creator.available ? 'Available' : 'Booked'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleInquiry(creator)}
                    disabled={!creator.available}
                    className="w-full rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Send Inquiry
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* =================== ARTIST VIEW =================== */}
        {role === 'creator' && (
          <>
            {!isAuth ? (
              <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-12 text-center">
                <p className="text-gray-400 text-lg mb-4">Sign in to manage your booking profile</p>
                <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition inline-block">
                  Sign In
                </Link>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <BookingStatCard label="Total Bookings" value="23" icon="🎤" />
                  <BookingStatCard label="Avg Fee" value="$2,150" icon="💰" />
                  <BookingStatCard label="Response Rate" value="94%" icon="⚡" />
                  <BookingStatCard label="Rating" value="4.8" icon="⭐" />
                </div>

                {/* Booking Profile */}
                <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
                  <h2 className="text-lg font-bold mb-4">Your Booking Profile</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Fee Range</p>
                      <p className="font-bold text-lg">$500 – $5,000</p>
                      <p className="text-sm text-gray-400 mt-3 mb-1">Genres</p>
                      <div className="flex gap-2">
                        {['Electronic', 'Ambient', 'Live DJ'].map((g) => (
                          <span key={g} className="rounded-full bg-red-600/10 text-red-400 px-3 py-1 text-xs font-medium">{g}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Availability (This Week)</p>
                      <div className="flex gap-2">
                        {AVAILABILITY.map((d) => (
                          <div
                            key={d.day}
                            className={`flex flex-col items-center rounded-lg px-2.5 py-2 text-xs ${
                              d.available
                                ? 'bg-green-600/10 text-green-400 border border-green-600/20'
                                : 'bg-red-600/10 text-red-400 border border-red-600/20'
                            }`}
                          >
                            <span className="font-medium">{d.day}</span>
                            <span className="text-[10px] opacity-70">{d.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Incoming Inquiries */}
                <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
                  <h2 className="text-lg font-bold mb-4">Incoming Inquiries</h2>
                  <div className="space-y-3">
                    {inquiries.map((inq) => (
                      <div key={inq.id} className="rounded-xl bg-brand-950/50 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600/50 to-red-800/50 flex items-center justify-center text-sm font-bold">
                              {inq.venue.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{inq.venue}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(inq.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — Capacity: {inq.capacity}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">{inq.fee}</p>
                            <span className={`text-xs font-medium ${
                              inq.status === 'Accepted' ? 'text-green-400' : inq.status === 'Declined' ? 'text-red-400' : 'text-yellow-400'
                            }`}>
                              {inq.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">{inq.message}</p>
                        {inq.status === 'Pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleInquiryAction(inq.id, 'Accepted')}
                              className="rounded-full bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-500 transition"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleInquiryAction(inq.id, 'Declined')}
                              className="rounded-full bg-brand-950 border border-brand-800/30 px-4 py-1.5 text-xs font-semibold text-gray-400 hover:text-white transition"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Booking History */}
                <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
                  <h2 className="text-lg font-bold mb-4">Booking History</h2>
                  <div className="space-y-3">
                    {BOOKING_HISTORY.map((b) => (
                      <div key={b.venue} className="flex items-center justify-between rounded-xl bg-brand-950/50 p-4">
                        <div>
                          <p className="font-semibold text-sm">{b.venue}</p>
                          <p className="text-xs text-gray-500">{new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{b.fee}</p>
                          <p className="text-xs text-yellow-400">{'★'.repeat(Math.floor(b.rating))} {b.rating}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Set Rates */}
                <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
                  <h2 className="text-lg font-bold mb-4">Set Your Rates</h2>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1.5">Minimum Fee</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          value={ratesForm.minimum}
                          onChange={(e) => setRatesForm({ ...ratesForm, minimum: e.target.value })}
                          className="w-full rounded-xl bg-brand-950 border border-brand-800/30 pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-red-600/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1.5">Standard Fee</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          value={ratesForm.standard}
                          onChange={(e) => setRatesForm({ ...ratesForm, standard: e.target.value })}
                          className="w-full rounded-xl bg-brand-950 border border-brand-800/30 pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-red-600/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1.5">Festival Fee</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          value={ratesForm.festival}
                          onChange={(e) => setRatesForm({ ...ratesForm, festival: e.target.value })}
                          className="w-full rounded-xl bg-brand-950 border border-brand-800/30 pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-red-600/50"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toast('Rates updated!', 'success')}
                    className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition"
                  >
                    Save Rates
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* Inquiry Modal */}
        {showInquiryModal && selectedArtist && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInquiryModal(false)} />
            <div className="relative w-full max-w-lg rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Book {selectedArtist.name}</h3>
                <button onClick={() => setShowInquiryModal(false)} className="text-gray-500 hover:text-white transition text-xl">
                  &times;
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Event Date *</label>
                  <input
                    type="date"
                    value={inquiryForm.eventDate}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, eventDate: e.target.value })}
                    className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-red-600/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Venue Name *</label>
                  <input
                    type="text"
                    value={inquiryForm.venueName}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, venueName: e.target.value })}
                    placeholder="e.g. The Blue Note"
                    className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Capacity</label>
                    <input
                      type="number"
                      value={inquiryForm.capacity}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, capacity: e.target.value })}
                      placeholder="e.g. 500"
                      className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Offered Fee</label>
                    <input
                      type="text"
                      value={inquiryForm.offeredFee}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, offeredFee: e.target.value })}
                      placeholder="e.g. $2,000"
                      className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Message</label>
                  <textarea
                    value={inquiryForm.message}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                    placeholder="Tell the creator about your event..."
                    rows={3}
                    className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600/50 resize-none"
                  />
                </div>
                <button
                  onClick={submitInquiry}
                  className="w-full rounded-full bg-red-600 py-3 font-semibold text-white hover:bg-red-500 transition"
                >
                  Send Booking Inquiry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BookingStatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5">
      <span className="text-lg">{icon}</span>
      <p className="text-2xl font-bold mt-2">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
