'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useToast } from '@/app/components/Toast';

// --- Mock EPK Data (supplements real artist data) ---
const EPK_BIO = 'A boundary-pushing artist blending electronic, hip-hop, and ambient textures into immersive sonic experiences. Known for dynamic live performances and innovative production techniques that bridge the gap between underground and mainstream.';

const GENRE_TAGS = ['Electronic', 'Hip-Hop', 'Ambient', 'Experimental'];

const PRESS_QUOTES = [
  { source: 'Music Weekly', quote: 'One of the most exciting emerging artists of the year.' },
  { source: 'Sound Magazine', quote: 'A fresh voice in a crowded scene.' },
];

const UPCOMING_SHOWS = [
  { date: '2026-04-10', venue: 'The Roxy Theatre', city: 'Los Angeles, CA' },
  { date: '2026-04-18', venue: 'House of Blues', city: 'Chicago, IL' },
  { date: '2026-04-25', venue: 'Brooklyn Steel', city: 'New York, NY' },
  { date: '2026-05-03', venue: 'The Fillmore', city: 'San Francisco, CA' },
];

const SOCIAL_LINKS = [
  { platform: 'Instagram', url: '#', icon: 'IG' },
  { platform: 'Twitter / X', url: '#', icon: 'X' },
  { platform: 'Spotify', url: '#', icon: 'SP' },
  { platform: 'SoundCloud', url: '#', icon: 'SC' },
  { platform: 'YouTube', url: '#', icon: 'YT' },
];

export default function EPKPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: artist, isLoading, error } = trpc.users.getById.useQuery({ id });
  const { data: tracks } = trpc.tracks.list.useQuery(
    { userId: id, limit: 5 },
    { enabled: !!artist }
  );
  const { data: followerCount } = trpc.users.getFollowerCount.useQuery(
    { userId: id },
    { enabled: !!artist }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading press kit...</div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Artist not found</p>
        <Link href="/explore" className="text-red-400 hover:text-red-300 transition">
          ← Back to Explore
        </Link>
      </div>
    );
  }

  const totalPlays = tracks?.reduce((sum, t) => sum + (t.playCount ?? 0), 0) ?? 0;

  return (
    <div className="min-h-screen py-16 px-6 print:py-8 print:px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Navigation */}
        <Link href={`/artist/${id}`} className="text-sm text-gray-400 hover:text-white transition mb-6 inline-block print:hidden">
          ← Back to Artist Profile
        </Link>

        {/* EPK Header */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-8 mb-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-4xl font-black shrink-0">
              {artist.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="text-center sm:text-left flex-1">
              <p className="text-xs uppercase tracking-widest text-red-400 font-semibold mb-1">Electronic Press Kit</p>
              <h1 className="text-4xl font-black mb-3">{artist.name}</h1>

              {/* Genre Tags */}
              <div className="flex flex-wrap gap-2 mb-4 justify-center sm:justify-start">
                {GENRE_TAGS.map((tag) => (
                  <span key={tag} className="text-xs bg-red-600/20 text-red-400 px-3 py-1 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-gray-300 leading-relaxed max-w-2xl">{EPK_BIO}</p>
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5 text-center">
            <p className="text-3xl font-bold text-white">{formatNumber(totalPlays)}</p>
            <p className="text-sm text-gray-400 mt-1">Total Plays</p>
          </div>
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5 text-center">
            <p className="text-3xl font-bold text-white">{formatNumber(followerCount ?? 0)}</p>
            <p className="text-sm text-gray-400 mt-1">Followers</p>
          </div>
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5 text-center">
            <p className="text-3xl font-bold text-white">{UPCOMING_SHOWS.length}</p>
            <p className="text-sm text-gray-400 mt-1">Upcoming Shows</p>
          </div>
        </div>

        {/* Latest Releases */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Latest Releases</h2>
          {tracks && tracks.length > 0 ? (
            <div className="space-y-3">
              {tracks.map((track, i) => (
                <div key={track.id} className="flex items-center justify-between rounded-xl bg-brand-950/50 p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-6">{i + 1}</span>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-sm">
                      ♫
                    </div>
                    <div>
                      <p className="font-medium text-white">{track.title}</p>
                      <p className="text-xs text-gray-500">
                        {(track.playCount ?? 0).toLocaleString()} plays
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/track/${track.id}`}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold transition print:hidden"
                  >
                    Listen
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm py-4 text-center">No tracks available yet.</p>
          )}
        </div>

        {/* Upcoming Shows */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Upcoming Shows</h2>
          <div className="space-y-3">
            {UPCOMING_SHOWS.map((show, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-brand-950/50 p-4">
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
              </div>
            ))}
          </div>
        </div>

        {/* Press Photos */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Press Photos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="aspect-[4/3] rounded-xl bg-brand-950/80 border border-brand-800/20 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl text-gray-600 mb-2">📷</p>
                  <p className="text-xs text-gray-500">Photo {n}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">High-resolution press photos available upon request.</p>
        </div>

        {/* Press Quotes */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Press</h2>
          <div className="space-y-4">
            {PRESS_QUOTES.map((pq, i) => (
              <div key={i} className="rounded-xl bg-brand-950/50 p-5">
                <p className="text-gray-300 italic mb-2">&ldquo;{pq.quote}&rdquo;</p>
                <p className="text-sm text-red-400 font-medium">&mdash; {pq.source}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact & Booking */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Contact &amp; Booking</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-brand-950/50 p-4">
              <p className="text-sm text-gray-400 mb-1">Booking Inquiries</p>
              <p className="text-white font-medium">booking@opynx.io</p>
            </div>
            <div className="rounded-xl bg-brand-950/50 p-4">
              <p className="text-sm text-gray-400 mb-1">Press / Media</p>
              <p className="text-white font-medium">press@opynx.io</p>
            </div>
            <div className="rounded-xl bg-brand-950/50 p-4">
              <p className="text-sm text-gray-400 mb-1">Management</p>
              <p className="text-white font-medium">mgmt@opynx.io</p>
            </div>
            <div className="rounded-xl bg-brand-950/50 p-4">
              <p className="text-sm text-gray-400 mb-1">General</p>
              <p className="text-white font-medium">hello@opynx.io</p>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Social Media</h2>
          <div className="flex flex-wrap gap-3">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full bg-brand-950/80 border border-brand-800/20 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:border-red-600/50 transition"
              >
                <span className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center text-xs font-bold">
                  {link.icon}
                </span>
                {link.platform}
              </a>
            ))}
          </div>
        </div>

        {/* Download EPK Button */}
        <div className="text-center print:hidden">
          <button
            onClick={() => toast('EPK PDF download coming soon!', 'info')}
            className="rounded-full bg-red-600 px-8 py-3 font-semibold text-white hover:bg-red-500 transition text-sm"
          >
            Download EPK as PDF
          </button>
          <p className="text-xs text-gray-500 mt-2">Professional press kit document for booking agents</p>
        </div>
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}
