'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

// --- Mock Data ---
interface Show {
  id: string;
  date: string;
  venue: string;
  city: string;
  ticketsSold: number;
  ticketsTotal: number;
  revenue: number;
}

interface Tour {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  shows: Show[];
}

const INITIAL_TOURS: Tour[] = [
  {
    id: 't1',
    name: 'Neon Nights Tour 2026',
    startDate: '2026-04-10',
    endDate: '2026-05-15',
    shows: [
      { id: 's1', date: '2026-04-10', venue: 'The Roxy Theatre', city: 'Los Angeles, CA', ticketsSold: 420, ticketsTotal: 500, revenue: 12600 },
      { id: 's2', date: '2026-04-18', venue: 'House of Blues', city: 'Chicago, IL', ticketsSold: 380, ticketsTotal: 450, revenue: 11400 },
      { id: 's3', date: '2026-04-25', venue: 'Brooklyn Steel', city: 'New York, NY', ticketsSold: 550, ticketsTotal: 600, revenue: 16500 },
      { id: 's4', date: '2026-05-03', venue: 'The Fillmore', city: 'San Francisco, CA', ticketsSold: 310, ticketsTotal: 400, revenue: 9300 },
      { id: 's5', date: '2026-05-15', venue: '9:30 Club', city: 'Washington, DC', ticketsSold: 290, ticketsTotal: 350, revenue: 8700 },
    ],
  },
  {
    id: 't2',
    name: 'Crystal Waves Acoustic',
    startDate: '2026-06-01',
    endDate: '2026-06-20',
    shows: [
      { id: 's6', date: '2026-06-01', venue: 'The Troubadour', city: 'Los Angeles, CA', ticketsSold: 150, ticketsTotal: 200, revenue: 6000 },
      { id: 's7', date: '2026-06-10', venue: 'City Winery', city: 'Nashville, TN', ticketsSold: 120, ticketsTotal: 180, revenue: 4800 },
    ],
  },
];

export default function ToursPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [tours] = useState<Tour[]>(INITIAL_TOURS);
  const [expandedTour, setExpandedTour] = useState<string | null>('t1');

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading tours...</div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Sign in to manage tours</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">
              ← Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Tour Management</h1>
            <p className="text-gray-400 mt-1">Plan and track your live shows</p>
          </div>
          <button
            onClick={() => toast('Tour creation coming soon!', 'info')}
            className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition"
          >
            + Create Tour
          </button>
        </div>

        {/* Tour Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <OverviewCard
            label="Total Tours"
            value={String(tours.length)}
          />
          <OverviewCard
            label="Total Shows"
            value={String(tours.reduce((s, t) => s + t.shows.length, 0))}
          />
          <OverviewCard
            label="Tickets Sold"
            value={tours.reduce((s, t) => s + t.shows.reduce((ss, sh) => ss + sh.ticketsSold, 0), 0).toLocaleString()}
          />
          <OverviewCard
            label="Total Revenue"
            value={`$${tours.reduce((s, t) => s + t.shows.reduce((ss, sh) => ss + sh.revenue, 0), 0).toLocaleString()}`}
            accent
          />
        </div>

        {/* Tours List */}
        <div className="space-y-4">
          {tours.map((tour) => {
            const isExpanded = expandedTour === tour.id;
            const totalTickets = tour.shows.reduce((s, sh) => s + sh.ticketsSold, 0);
            const totalCapacity = tour.shows.reduce((s, sh) => s + sh.ticketsTotal, 0);
            const tourRevenue = tour.shows.reduce((s, sh) => s + sh.revenue, 0);
            const sellThrough = totalCapacity > 0 ? Math.round((totalTickets / totalCapacity) * 100) : 0;

            return (
              <div key={tour.id} className="rounded-2xl bg-[#15151f] border border-brand-800/20 overflow-hidden">
                {/* Tour Header */}
                <button
                  onClick={() => setExpandedTour(isExpanded ? null : tour.id)}
                  className="w-full text-left p-6 hover:bg-brand-900/20 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">{tour.name}</h2>
                      <p className="text-sm text-gray-400">
                        {new Date(tour.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &mdash;{' '}
                        {new Date(tour.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        <span className="mx-2">&middot;</span>
                        {tour.shows.length} show{tour.shows.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-lg font-bold text-green-400">${tourRevenue.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{sellThrough}% sold</p>
                      </div>
                      <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-brand-800/20 px-6 pb-6">
                    {/* Tour Revenue Summary */}
                    <div className="grid grid-cols-3 gap-4 py-4 border-b border-brand-800/10 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{totalTickets.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Tickets Sold</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{totalCapacity.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Total Capacity</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">${tourRevenue.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Tour Revenue</p>
                      </div>
                    </div>

                    {/* Shows */}
                    <div className="space-y-3">
                      {tour.shows.map((show) => {
                        const showSellPct = Math.round((show.ticketsSold / show.ticketsTotal) * 100);
                        return (
                          <div key={show.id} className="flex items-center justify-between rounded-xl bg-brand-950/50 p-4">
                            <div className="flex items-center gap-4">
                              <div className="text-center shrink-0 w-14">
                                <p className="text-lg font-bold text-white">
                                  {new Date(show.date).getDate()}
                                </p>
                                <p className="text-xs text-gray-500 uppercase">
                                  {new Date(show.date).toLocaleDateString('en-US', { month: 'short' })}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium text-white">{show.venue}</p>
                                <p className="text-sm text-gray-400">{show.city}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right hidden sm:block">
                                <p className="text-sm text-white font-medium">
                                  {show.ticketsSold}/{show.ticketsTotal}
                                </p>
                                <div className="w-24 h-2 rounded-full bg-brand-900/50 mt-1">
                                  <div
                                    className={`h-full rounded-full ${
                                      showSellPct >= 90 ? 'bg-green-500' : showSellPct >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${showSellPct}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-green-400 font-semibold text-sm w-20 text-right">
                                ${show.revenue.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Show Button */}
                    <button
                      onClick={() => toast('Add show form coming soon!', 'info')}
                      className="mt-4 w-full rounded-xl border border-dashed border-brand-800/30 py-3 text-sm text-gray-400 hover:text-white hover:border-red-600/50 transition"
                    >
                      + Add Show
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OverviewCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-green-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
