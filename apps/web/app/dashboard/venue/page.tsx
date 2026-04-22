'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

/* ── Mock Data ── */
const VENUE_NAME = 'The Velvet Room';

const STATS = [
  { label: 'Upcoming Shows', value: '7', icon: '🎶' },
  { label: 'Total Creators Hosted', value: '142', icon: '🎤' },
  { label: 'Avg Attendance', value: '284', icon: '👥' },
  { label: 'Revenue This Month', value: '$12,450', icon: '💰' },
  { label: 'Open Slots', value: '3', icon: '📅' },
  { label: 'Applications Pending', value: '5', icon: '📩' },
];

const PENDING_APPLICATIONS = [
  { id: 1, creator: 'Maya Chen', avatar: 'M', slot: 'Friday Night Opener (May 8)', genre: 'Indie Pop', followers: 2400, plays: 18200, daysAgo: 1 },
  { id: 2, creator: 'DJ Flux', avatar: 'D', slot: 'Saturday Electronic Night (May 9)', genre: 'Electronic', followers: 5100, plays: 42000, daysAgo: 2 },
  { id: 3, creator: 'The Brass Roots', avatar: 'T', slot: 'Sunday Jazz Brunch (May 10)', genre: 'Jazz', followers: 1800, plays: 9500, daysAgo: 3 },
  { id: 4, creator: 'Pixel Wave', avatar: 'P', slot: 'Friday Night Opener (May 8)', genre: 'Synthwave', followers: 3300, plays: 27600, daysAgo: 3 },
  { id: 5, creator: 'Rue Dominguez', avatar: 'R', slot: 'Saturday Electronic Night (May 9)', genre: 'Lo-fi', followers: 950, plays: 6800, daysAgo: 5 },
];

const ACTIVE_SLOTS = [
  { id: 1, title: 'Friday Night Opener', date: '2026-05-08', applications: 12 },
  { id: 2, title: 'Saturday Electronic Night', date: '2026-05-09', applications: 8 },
  { id: 3, title: 'Sunday Jazz Brunch', date: '2026-05-10', applications: 4 },
];

const UPCOMING_SHOWS = [
  { id: 1, creator: 'Luna Vega', date: '2026-04-18', ticketsSold: 210, capacity: 300 },
  { id: 2, creator: 'Echo Chamber', date: '2026-04-25', ticketsSold: 145, capacity: 300 },
  { id: 3, creator: 'Nadia Rose', date: '2026-05-02', ticketsSold: 85, capacity: 300 },
];

const REVENUE_BREAKDOWN = [
  { source: 'Ticket Commissions', amount: '$5,200', percent: 42 },
  { source: 'Door Splits', amount: '$3,800', percent: 31 },
  { source: 'Flat Booking Fees', amount: '$2,100', percent: 17 },
  { source: 'Bar Revenue (Show Nights)', amount: '$1,350', percent: 10 },
];

/* ── Calendar helpers ── */
function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

const SHOW_DAYS = [8, 9, 10, 18, 25]; // days with shows (red)
const AVAILABLE_DAYS = [15, 16, 22, 23, 29, 30]; // available slots (green)

const SHOW_DETAILS: Record<number, string> = {
  8: 'Friday Night Opener — Slot Open',
  9: 'Saturday Electronic Night — Slot Open',
  10: 'Sunday Jazz Brunch — Slot Open',
  18: 'Luna Vega — Confirmed',
  25: 'Echo Chamber — Confirmed',
};

export default function VenueDashboardPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const [applications, setApplications] = useState(PENDING_APPLICATIONS);
  const [tooltipDay, setTooltipDay] = useState<number | null>(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const calendarDays = getCalendarDays(year, month);
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  /* ── Auth gate ── */
  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Sign in to access your venue dashboard</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold hover:bg-red-700 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const handleApplication = (id: number, action: 'accept' | 'decline') => {
    setApplications((prev) => prev.filter((a) => a.id !== id));
    toast(
      action === 'accept' ? 'Creator accepted! Confirmation sent.' : 'Application declined.',
      action === 'accept' ? 'success' : 'info'
    );
  };

  const dayClass = (day: number) => {
    if (SHOW_DAYS.includes(day)) return 'bg-red-600/20 text-red-400 border-red-600/40 cursor-pointer';
    if (AVAILABLE_DAYS.includes(day)) return 'bg-green-600/15 text-green-400 border-green-600/30 cursor-pointer';
    return 'text-gray-500 border-transparent';
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Back nav */}
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">
          &larr; Home
        </Link>

        {/* Hero */}
        <div className="mb-8">
          <p className="text-sm text-red-400 font-medium mb-1">{VENUE_NAME}</p>
          <h1 className="text-3xl font-bold">Venue Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage bookings, creators, and revenue</p>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-4 text-center">
              <p className="text-xl mb-1">{s.icon}</p>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Calendar & Pending Apps ── */}
        <div className="grid lg:grid-cols-2 gap-6 mb-10">
          {/* Calendar */}
          <section className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
            <h2 className="text-lg font-bold mb-4">Calendar &mdash; {monthName}</h2>
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <span key={d} className="text-gray-600 py-1">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => (
                <div
                  key={i}
                  className={`relative rounded-lg border text-center py-2 text-sm ${
                    day ? dayClass(day) : 'border-transparent'
                  }`}
                  onMouseEnter={() => day && setTooltipDay(day)}
                  onMouseLeave={() => setTooltipDay(null)}
                >
                  {day || ''}
                  {/* Tooltip */}
                  {day && tooltipDay === day && (SHOW_DAYS.includes(day) || AVAILABLE_DAYS.includes(day)) && (
                    <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-brand-950 border border-brand-800/30 rounded-xl p-2.5 text-xs text-left shadow-lg">
                      <p className="font-medium text-white">
                        {SHOW_DETAILS[day] || 'Available slot'}
                      </p>
                      <p className="text-gray-500 mt-0.5">
                        {SHOW_DAYS.includes(day) ? 'Show scheduled' : 'Open for booking'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-red-600/30 border border-red-600/40" /> Shows
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-green-600/20 border border-green-600/30" /> Available
              </span>
            </div>
          </section>

          {/* Pending Applications */}
          <section className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
            <h2 className="text-lg font-bold mb-4">Pending Applications</h2>
            {applications.length === 0 ? (
              <p className="text-gray-500 text-sm">No pending applications</p>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {applications.map((app) => (
                  <div key={app.id} className="rounded-xl bg-brand-950/50 border border-brand-800/10 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-bold text-sm shrink-0">
                        {app.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm">{app.creator}</p>
                        <p className="text-xs text-gray-500 truncate">{app.slot}</p>
                      </div>
                      <span className="text-xs text-gray-600 shrink-0">{app.daysAgo}d ago</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs mb-3">
                      <span className="px-2 py-0.5 rounded-full bg-red-600/10 text-red-400">{app.genre}</span>
                      <span className="text-gray-500">{app.followers.toLocaleString()} followers</span>
                      <span className="text-gray-500">{app.plays.toLocaleString()} plays</span>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/artist/${app.id}`}
                        className="flex-1 rounded-lg bg-brand-800/20 hover:bg-brand-800/30 py-2 text-xs text-center font-medium transition"
                      >
                        Listen Preview
                      </Link>
                      <button
                        onClick={() => handleApplication(app.id, 'accept')}
                        className="flex-1 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 py-2 text-xs font-medium transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleApplication(app.id, 'decline')}
                        className="flex-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 text-xs font-medium transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── Active Slots & Upcoming Shows ── */}
        <div className="grid lg:grid-cols-2 gap-6 mb-10">
          {/* Active Slots */}
          <section>
            <h2 className="text-lg font-bold mb-4">Active Slots</h2>
            <div className="space-y-3">
              {ACTIVE_SLOTS.map((slot) => (
                <div key={slot.id} className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{slot.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{slot.applications} applications</span>
                    <button
                      onClick={() => toast('Managing slot...', 'info')}
                      className="rounded-lg bg-brand-800/20 hover:bg-brand-800/30 px-4 py-2 text-xs font-medium transition"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming Shows */}
          <section>
            <h2 className="text-lg font-bold mb-4">Upcoming Shows</h2>
            <div className="space-y-3">
              {UPCOMING_SHOWS.map((show) => (
                <div key={show.id} className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-sm">{show.creator}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(show.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">{show.ticketsSold}/{show.capacity} tickets</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-brand-800/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-600 transition-all"
                      style={{ width: `${(show.ticketsSold / show.capacity) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">{Math.round((show.ticketsSold / show.capacity) * 100)}% sold</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Quick Actions ── */}
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Post New Slot', href: '/booking', icon: '➕' },
              { label: 'Browse Creators', href: '/explore', icon: '🔍' },
              { label: 'View Analytics', href: '/dashboard/analytics', icon: '📊' },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="rounded-xl bg-[#15151f] border border-brand-800/20 hover:border-red-600/30 px-5 py-3 text-sm font-medium transition flex items-center gap-2"
              >
                <span>{action.icon}</span> {action.label}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Revenue Breakdown ── */}
        <section>
          <h2 className="text-lg font-bold mb-4">Revenue Breakdown</h2>
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
            <div className="space-y-4">
              {REVENUE_BREAKDOWN.map((item) => (
                <div key={item.source}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span>{item.source}</span>
                    <span className="font-semibold">{item.amount}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-brand-800/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-600 transition-all"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{item.percent}% of total</p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-brand-800/20 flex items-center justify-between">
              <span className="text-sm text-gray-400">Total This Month</span>
              <span className="text-lg font-bold">$12,450</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
