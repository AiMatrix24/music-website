'use client';

import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';

export default function ArtistDashboard() {
  const { data: session, status } = useSession();
  const profile = trpc.users.getProfile.useQuery(undefined, {
    enabled: status === 'authenticated',
  });
  const myTracks = trpc.tracks.list.useQuery(
    { userId: session?.user?.id, limit: 10 },
    { enabled: status === 'authenticated' && !!session?.user?.id }
  );

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Sign in to access Artist Dashboard</h1>
          <Link
            href="/auth/login"
            className="rounded-full bg-brand-600 px-8 py-3 font-semibold text-white"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const trackCount = myTracks.data?.length ?? 0;

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">
        Artist <span className="text-brand-500">Dashboard</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard label="Total Earned" value="$0.00" sub="All time" />
        <SummaryCard label="Active Subscribers" value="0" sub="Current" />
        <SummaryCard label="Tracks" value={String(trackCount)} sub="Published" />
        <SummaryCard label="Role" value={profile.data?.role ?? 'free'} sub="Account type" />
      </div>

      <div className="rounded-2xl bg-[#15151f] p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Upload Music</h2>
        <div className="border-2 border-dashed border-brand-700/30 rounded-xl p-12 text-center">
          <p className="text-gray-400 mb-4">Drag and drop audio files here, or click to browse</p>
          <button className="rounded-full bg-brand-600 px-6 py-3 font-semibold text-white">
            Select Files
          </button>
          <p className="text-xs text-gray-500 mt-3">MP3, WAV, FLAC — Max 100MB per file</p>
        </div>
      </div>

      <div className="rounded-2xl bg-[#15151f] p-6">
        <h2 className="text-xl font-bold mb-4">My Tracks</h2>
        {trackCount > 0 ? (
          <ul className="space-y-3">
            {myTracks.data?.map((track) => (
              <li key={track.id} className="flex items-center justify-between py-2 border-b border-brand-800/20">
                <div>
                  <p className="font-medium">{track.title}</p>
                  <p className="text-xs text-gray-500">{track.genre ?? 'No genre'} — {track.status}</p>
                </div>
                <span className="text-sm text-gray-400">{track.playCount ?? 0} plays</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No tracks yet. Upload your first track above.</p>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-[#15151f] p-6">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-brand-400">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}
