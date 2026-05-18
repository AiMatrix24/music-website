'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { data: myTracks } = trpc.tracks.list.useQuery(
    { limit: 50, userId: session?.user?.id ?? '' },
    { enabled: status === 'authenticated' && !!session?.user?.id }
  );
  const { data: myEvents } = trpc.events.list.useQuery(
    { limit: 50 },
    { enabled: status === 'authenticated' }
  );
  // Used to decide whether to nudge the user toward /onboarding. We don't
  // auto-redirect — the banner is enough.
  const { data: me } = trpc.users.getProfile.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl mb-2">🎤</p>
        <p className="text-gray-400 text-lg">Sign in to access your dashboard</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const totalPlays = myTracks?.reduce((sum, t) => sum + (t.playCount ?? 0), 0) ?? 0;
  const trackCount = myTracks?.length ?? 0;
  const eventCount = myEvents?.length ?? 0;

  const showOnboardingBanner = me && !me.onboardingCompletedAt;

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto">
        {showOnboardingBanner && (
          <Link
            href="/onboarding"
            className="block mb-6 rounded-2xl bg-gradient-to-r from-red-600/20 to-red-700/20 border border-red-600/40 p-4 hover:from-red-600/30 hover:to-red-700/30 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl shrink-0">🚀</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">Finish setting up your creator profile</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Add your bio, upload up to 10 tracks at once, get your shareable QR code. Takes about 5 minutes.
                </p>
              </div>
              <span className="text-red-400 group-hover:text-red-300 text-sm font-bold shrink-0">Continue setup →</span>
            </div>
          </Link>
        )}

        <div className="flex items-center gap-4 mb-8">
          {session.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt=""
              className="w-16 h-16 rounded-full object-cover ring-2 ring-brand-800/40"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-2xl font-black">
              {session.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{session.user?.name ?? 'Creator'}</h1>
            <p className="text-gray-400">{session.user?.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Tracks" value={trackCount} />
          <StatCard label="Total Plays" value={formatNumber(totalPlays)} />
          <StatCard label="Events" value={eventCount} />
          <StatCard label="Revenue" value="$0.00" sub="On-chain" />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <QuickAction href="/dashboard/upload" icon="🎵" label="Upload Track" />
          <QuickAction href="/dashboard/create-event" icon="🎫" label="Create Event" />
          <QuickAction href="/dashboard/analytics" icon="📊" label="Analytics" />
          <QuickAction href="/dashboard/tickets" icon="🎟️" label="Ticket Sales" />
          <QuickAction href="/dashboard/broadcast" icon="📢" label="Message Fans" />
          <QuickAction href="/dashboard/podcasts" icon="🎙️" label="Podcasts" />
          <QuickAction href="/venues/discover" icon="🏟️" label="Find Venues" />
          <QuickAction href="/creators/discover" icon="⭐" label="Find Creators" />
          <QuickAction href="/dashboard/venue" icon="📋" label="Venue Dashboard" />
          <QuickAction href="/dashboard/gigs" icon="🎤" label="My Gigs" />
          <QuickAction href="/showcase" icon="🔦" label="Creator Showcase" />
          <QuickAction href="/dashboard/earnings" icon="💰" label="Earnings" />
          <QuickAction href="/dashboard/qr" icon="📱" label="QR Codes" />
          <QuickAction href="/dashboard/rights" icon="📜" label="Rights & Splits" soon />
          <QuickAction href="/dashboard/compliance" icon="🛡️" label="Royalty Compliance" soon />
          <QuickAction href="/marketplace/songwriting" icon="✏️" label="Songwriter Marketplace" />
          <QuickAction href="/dashboard/radio/channel" icon="📻" label="My Radio Channel" />
          <QuickAction href="/dashboard/radio/studio" icon="🎬" label="Go Live on Radio" />
          <QuickAction href="/dashboard/albums" icon="💿" label="Albums" />
          <QuickAction href="/dashboard/distribute" icon="📡" label="Distribution" />
          <QuickAction href="/settings" icon="⚙️" label="Settings" />
        </div>

        {/* Recent Tracks */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Your Tracks</h2>
            <Link href="/dashboard/upload" className="text-sm text-red-400 hover:text-red-300 font-semibold">
              + Upload New
            </Link>
          </div>
          {trackCount > 0 ? (
            <div className="space-y-3">
              {myTracks?.slice(0, 5).map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-4 rounded-xl bg-[#15151f] p-4 transition hover:bg-[#1a1a2e]"
                >
                  <Link href={`/track/${track.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                    {(track as { coverUrl?: string | null }).coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={(track as { coverUrl?: string | null }).coverUrl ?? ''}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-sm font-bold shrink-0">
                        {track.genre?.charAt(0) ?? '♪'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{track.title}</p>
                      <p className="text-sm text-gray-400">{track.genre}</p>
                    </div>
                  </Link>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-red-400 font-semibold">{formatNumber(track.playCount ?? 0)}</p>
                    <p className="text-xs text-gray-500">plays</p>
                  </div>
                  <Link
                    href={`/dashboard/track/${track.id}/edit`}
                    className="shrink-0 rounded-lg bg-brand-950 hover:bg-brand-900 border border-brand-800/40 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white transition"
                  >
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#15151f] p-12 text-center">
              <p className="text-4xl mb-3">🎵</p>
              <p className="text-gray-400 mb-4">No tracks yet. Upload your first track!</p>
              <Link href="/dashboard/upload" className="inline-block rounded-full bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-500 transition">
                Upload Track
              </Link>
            </div>
          )}
        </section>

        {/* Upcoming Events */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Your Events</h2>
            <Link href="/dashboard/create-event" className="text-sm text-red-400 hover:text-red-300 font-semibold">
              + Create Event
            </Link>
          </div>
          {eventCount > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myEvents?.slice(0, 4).map((event) => {
                const date = new Date(event.startDate);
                return (
                  <Link
                    key={event.id}
                    href={`/dashboard/event/${event.id}`}
                    className="rounded-xl bg-[#15151f] p-5 transition hover:bg-[#1a1a2e]"
                  >
                    <p className="text-xs text-red-400 font-semibold uppercase mb-1">
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <h3 className="font-bold">{event.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{event.status}</p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#15151f] p-12 text-center">
              <p className="text-4xl mb-3">🎫</p>
              <p className="text-gray-400 mb-4">No events yet. Create your first event!</p>
              <Link href="/dashboard/create-event" className="inline-block rounded-full bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-500 transition">
                Create Event
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl bg-[#15151f] border border-brand-800/20 p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function QuickAction({ href, icon, label, soon }: { href: string; icon: string; label: string; soon?: boolean }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl bg-[#15151f] border border-brand-800/20 p-4 transition hover:bg-[#1a1a2e] hover:border-red-600/30 relative"
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-semibold text-sm flex-1">{label}</span>
      {soon && (
        <span className="text-[10px] uppercase tracking-wider bg-yellow-600/20 border border-yellow-600/40 text-yellow-400 px-2 py-0.5 rounded-full font-bold">
          Soon
        </span>
      )}
    </Link>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
