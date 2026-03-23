'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';

export default function PlaylistsPage() {
  const { data: playlists, isLoading } = trpc.playlists.list.useQuery({ limit: 20 });

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Playlists</h1>
      <p className="text-gray-400 mb-8">Curated collections from OPYNX creators and fans.</p>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-[#15151f] h-48 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && playlists && playlists.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlists/${playlist.id}`}
              className="rounded-2xl bg-[#15151f] overflow-hidden transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-900/20 block"
            >
              <div className="h-32 bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center text-4xl">
                🎶
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg mb-1">{playlist.title}</h3>
                <p className="text-sm text-gray-400">
                  {playlist.visibility === 'public' ? 'Public' : 'Private'} playlist
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && (!playlists || playlists.length === 0) && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🎶</div>
          <h2 className="text-xl font-bold mb-2">No playlists yet</h2>
          <p className="text-gray-400 mb-6">
            Sign in to create your first playlist, or explore tracks to get started.
          </p>
          <Link
            href="/explore"
            className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-500"
          >
            Explore Tracks
          </Link>
        </div>
      )}
    </div>
  );
}
