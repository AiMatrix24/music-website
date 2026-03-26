'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useState } from 'react';
import { FadeIn } from '../components/FadeIn';

const CATEGORIES = ['All', 'Music', 'Comedy', 'Sports', 'Arts & Theater', 'Festival', 'Listening Party'];
const PRICE_RANGES = ['Any Price', 'Free', 'Under $25', '$25–$50', '$50–$100', '$100+'];
const SORT_OPTIONS = ['Date (Soonest)', 'Price (Low)', 'Price (High)', 'Most Popular'];

export default function TicketsPage() {
  const { data: events, isLoading } = trpc.events.list.useQuery({
    limit: 50,
    status: 'published',
  });

  const [category, setCategory] = useState('All');
  const [priceRange, setPriceRange] = useState('Any Price');
  const [sortBy, setSortBy] = useState('Date (Soonest)');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter events (client-side for now)
  const filtered = events?.filter((e) => {
    if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }) ?? [];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 px-6 bg-gradient-to-b from-red-950/30 via-brand-950 to-brand-950">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm font-semibold uppercase tracking-[4px] text-red-500 mb-4">Direct from Artists</p>
          <h1 className="text-4xl md:text-6xl font-black mb-4">
            Live Events & <span className="text-red-500">Tickets</span>
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto text-lg mb-8">
            Buy direct. No scalpers. No hidden fees. Every ticket verified on-chain.
          </p>

          {/* Search bar */}
          <div className="max-w-xl mx-auto relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, artists, venues..."
              className="w-full bg-[#15151f] border border-brand-800/30 rounded-full px-6 py-4 text-white placeholder:text-gray-500 focus:border-red-600 outline-none transition pr-12"
            />
            <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </section>

      {/* Anti-scalper banner */}
      <section className="border-y border-brand-800/20 bg-[#15151f]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap items-center justify-center gap-6 text-sm">
          <span className="flex items-center gap-2 text-gray-400"><span className="text-red-500">🛡️</span> Anti-Scalper</span>
          <span className="flex items-center gap-2 text-gray-400"><span className="text-red-500">🔗</span> On-Chain Verified</span>
          <span className="flex items-center gap-2 text-gray-400"><span className="text-red-500">📱</span> QR Entry</span>
          <span className="flex items-center gap-2 text-gray-400"><span className="text-red-500">♿</span> ADA Accessible</span>
          <span className="flex items-center gap-2 text-gray-400"><span className="text-red-500">👥</span> Group Discounts</span>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 px-6 border-b border-brand-800/20">
        <div className="max-w-5xl mx-auto">
          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${
                  category === c ? 'bg-red-600 text-white' : 'bg-[#15151f] text-gray-400 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Advanced filters toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-gray-400 hover:text-white transition flex items-center gap-2"
            >
              <svg className={`w-4 h-4 transition ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {showFilters ? 'Hide Filters' : 'More Filters'}
            </button>
            <span className="text-sm text-gray-500">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-brand-800/20">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Price Range</label>
                <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full bg-[#15151f] border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white focus:border-red-600 outline-none">
                  {PRICE_RANGES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date Range</label>
                <input type="date" className="w-full bg-[#15151f] border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white focus:border-red-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sort By</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-[#15151f] border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white focus:border-red-600 outline-none">
                  {SORT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Event listings */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          {isLoading && (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-[#15151f] p-6 animate-pulse h-48" />
              ))}
            </div>
          )}

          <div className="space-y-6">
            {filtered.map((event) => (
              <FadeIn key={event.id}>
                <EventTicketCard event={event} />
              </FadeIn>
            ))}
          </div>

          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">🎫</p>
              <p className="text-xl font-bold mb-2">No events found</p>
              <p className="text-gray-400 mb-6">Try adjusting your filters or search query.</p>
              <button onClick={() => { setCategory('All'); setSearchQuery(''); setPriceRange('Any Price'); }}
                className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white hover:bg-red-500 transition">
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Recommendations */}
      <section className="py-16 px-6 bg-[#15151f]/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Recommended For You</h2>
          <p className="text-gray-400 text-sm mb-8">Based on your listening history and followed artists</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(events ?? []).slice(0, 3).map((event) => {
              const d = new Date(event.startDate);
              return (
                <Link key={event.id} href={`/tickets/${event.id}`}
                  className="rounded-2xl bg-[#15151f] border border-brand-800/20 overflow-hidden transition hover:-translate-y-1 hover:shadow-xl hover:shadow-red-950/10 block">
                  <div className="h-28 bg-gradient-to-br from-red-800/30 to-brand-950 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-black">{d.getDate()}</p>
                      <p className="text-xs font-semibold text-red-400 uppercase">{d.toLocaleDateString('en-US', { month: 'short' })}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold truncate">{event.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{event.hostName ?? 'Artist'}</p>
                    <p className="text-xs text-red-400 font-semibold mt-2">Recommended for you</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            How <span className="text-red-500">OpynX</span> Tickets Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <HowItWorksCard step="1" title="Artist Lists Event" description="Artists set their own prices, tiers, and capacity. No middlemen markup." />
            <HowItWorksCard step="2" title="You Buy Direct" description="Pay with USDC or card. Anti-scalper verified. Group discounts available." />
            <HowItWorksCard step="3" title="Get QR Ticket" description="Unique QR code tied to your identity. Optional ticket insurance." />
            <HowItWorksCard step="4" title="Scan & Enter" description="Show your QR at the venue. ADA accessible. Instant verification." />
          </div>
        </div>
      </section>
    </div>
  );
}

function EventTicketCard({ event }: { event: any }) {
  const { data: ticketTypes } = trpc.tickets.getTicketTypes.useQuery({ eventId: event.id });

  const date = new Date(event.startDate);
  const totalSold = ticketTypes?.reduce((s, t) => s + (t.sold ?? 0), 0) ?? 0;
  const totalCap = ticketTypes?.reduce((s, t) => s + (t.quantity ?? 0), 0) ?? 0;
  const lowestPrice = ticketTypes?.length ? Math.min(...ticketTypes.map((t) => t.price)) : null;
  const pctSold = totalCap > 0 ? Math.round((totalSold / totalCap) * 100) : 0;
  const hasVIP = ticketTypes?.some((t) => t.tier === 'vip');

  return (
    <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 overflow-hidden transition hover:border-red-900/30 hover:shadow-xl hover:shadow-red-950/10">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-40 bg-gradient-to-br from-red-900/30 to-brand-950 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-red-400">{date.toLocaleDateString('en-US', { month: 'short' })}</p>
            <p className="text-5xl font-black">{date.getDate()}</p>
            <p className="text-sm text-gray-400">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold">{event.title}</h3>
                {hasVIP && <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">VIP Available</span>}
              </div>
              <p className="text-sm text-gray-400 mb-1">
                Hosted by <span className="text-red-400">{event.hostName ?? 'Unknown'}</span>
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
                {event.timezone && <span>📍 {event.timezone.split('/')[1]?.replace('_', ' ')}</span>}
                <span>🕐 {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                {event.capacity && <span>👥 {event.capacity.toLocaleString()}</span>}
                <span>♿ ADA</span>
              </div>

              {/* Ticket tiers */}
              {ticketTypes && ticketTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {ticketTypes.map((tt) => {
                    const available = (tt.quantity ?? 0) - (tt.sold ?? 0);
                    const soldOut = available <= 0;
                    return (
                      <span key={tt.id} className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                        soldOut ? 'bg-gray-800 text-gray-500 line-through'
                        : 'bg-red-600/10 text-red-400 border border-red-800/30'
                      }`}>
                        {tt.name} — {tt.price === 0 ? 'FREE' : `$${(tt.price / 100).toFixed(2)}`}
                        {!soldOut && ` (${available} left)`}
                        {soldOut && ' SOLD OUT'}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Progress bar */}
              {totalCap > 0 && (
                <div className="w-full max-w-xs">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{totalSold} sold</span>
                    <span>{pctSold > 80 ? '🔥 Almost sold out' : `${pctSold}% sold`}</span>
                  </div>
                  <div className="w-full h-2 bg-brand-950 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      pctSold > 80 ? 'bg-red-500' : pctSold > 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`} style={{ width: `${Math.min(pctSold, 100)}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              {lowestPrice !== null && (
                <p className="text-sm text-gray-400">
                  From <span className="text-2xl font-black text-white">{lowestPrice === 0 ? 'FREE' : `$${(lowestPrice / 100).toFixed(2)}`}</span>
                </p>
              )}
              <Link href={`/tickets/${event.id}`}
                className="rounded-full bg-red-600 hover:bg-red-500 text-white px-8 py-3 font-semibold transition hover:shadow-lg hover:shadow-red-900/30 text-center whitespace-nowrap">
                Get Tickets
              </Link>
              <p className="text-xs text-gray-600">No fees · Group discounts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HowItWorksCard({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-lg mx-auto mb-4">{step}</div>
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
