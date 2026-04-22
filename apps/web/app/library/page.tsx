'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { usePlayer } from '@/app/components/MusicPlayer';

type LibraryTab = 'liked' | 'playlists' | 'history' | 'following';

export default function LibraryPage() {
  const { status } = useSession();
  const [tab, setTab] = useState<LibraryTab>('liked');

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl mb-2">📚</p>
        <h1 className="text-2xl font-bold mb-2">Your Library</h1>
        <p className="text-gray-400">Sign in to access your saved music, playlists, and history.</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition mt-4">
          Sign In
        </Link>
      </div>
    );
  }

  const tabs: { id: LibraryTab; label: string; icon: string }[] = [
    { id: 'liked', label: 'Liked Tracks', icon: '❤️' },
    { id: 'playlists', label: 'Playlists', icon: '🎧' },
    { id: 'history', label: 'History', icon: '🕐' },
    { id: 'following', label: 'Following', icon: '👤' },
  ];

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Library</h1>

        <div className="flex gap-2 mb-8 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${
                tab === t.id ? 'bg-red-600 text-white' : 'bg-[#15151f] text-gray-400 hover:text-white'
              }`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {tab === 'liked' && <LikedTracks />}
        {tab === 'playlists' && <SavedPlaylists />}
        {tab === 'history' && <ListeningHistory />}
        {tab === 'following' && <FollowingArtists />}
      </div>
    </div>
  );
}

function LikedTracks() {
  const { data: tracks, isLoading } = trpc.tracks.list.useQuery({ limit: 20 });
  const { play } = usePlayer();

  if (isLoading) return <LoadingSkeleton />;

  // Mock: show first 8 tracks as "liked"
  const likedTracks = tracks?.slice(0, 8) ?? [];

  if (likedTracks.length === 0) {
    return <EmptyTab icon="❤️" title="No liked tracks yet" desc="Hit the heart icon on any track to save it here." actionLabel="Explore Music" actionHref="/explore" />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">{likedTracks.length} liked tracks</p>
        <button onClick={() => {
          if (likedTracks[0]) play({ id: likedTracks[0].id, title: likedTracks[0].title, creator: likedTracks[0].artistName ?? 'Unknown', genre: likedTracks[0].genre ?? '', duration: likedTracks[0].duration ?? 0, audioUrl: (likedTracks[0] as { audioUrl?: string | null }).audioUrl ?? null, coverUrl: (likedTracks[0] as { coverUrl?: string | null }).coverUrl ?? null });
        }} className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500 transition">
          ▶ Play All
        </button>
      </div>
      <div className="space-y-2">
        {likedTracks.map((track, i) => (
          <div key={track.id}
            onClick={() => play({ id: track.id, title: track.title, creator: track.artistName ?? 'Unknown', genre: track.genre ?? '', duration: track.duration ?? 0, audioUrl: (track as { audioUrl?: string | null }).audioUrl ?? null, coverUrl: (track as { coverUrl?: string | null }).coverUrl ?? null })}
            className="flex items-center gap-4 rounded-xl bg-[#15151f] p-4 transition hover:bg-[#1a1a2e] cursor-pointer group">
            <span className="text-gray-500 text-sm w-6 text-right group-hover:hidden">{i + 1}</span>
            <span className="text-red-400 text-sm w-6 text-right hidden group-hover:block">▶</span>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-sm font-bold">
              {track.genre?.charAt(0) ?? '♪'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{track.title}</p>
              <p className="text-sm text-gray-400 truncate">{track.artistName ?? 'Unknown'} · {track.genre}</p>
            </div>
            <span className="text-red-500 text-lg">❤️</span>
            <div className="text-right hidden sm:block">
              <p className="text-sm text-gray-400">{formatDuration(track.duration)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SavedPlaylists() {
  const { data: playlists, isLoading } = trpc.playlists.list.useQuery({ limit: 20 });

  if (isLoading) return <LoadingSkeleton />;

  if (!playlists || playlists.length === 0) {
    return <EmptyTab icon="🎧" title="No playlists yet" desc="Create a playlist to organize your favorite tracks." actionLabel="Create Playlist" actionHref="/explore" />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Create new playlist card */}
      <Link href="/explore" className="rounded-2xl border-2 border-dashed border-brand-800/30 p-8 flex flex-col items-center justify-center text-center transition hover:border-red-600 hover:text-red-400">
        <span className="text-3xl mb-2">+</span>
        <span className="text-sm font-semibold">New Playlist</span>
      </Link>

      {playlists.map((pl) => (
        <Link key={pl.id} href={`/playlist/${pl.id}`}
          className="rounded-2xl bg-[#15151f] border border-brand-800/20 overflow-hidden transition hover:bg-[#1a1a2e] hover:-translate-y-0.5 block">
          <div className="h-28 bg-gradient-to-br from-red-600/30 to-purple-800/30 flex items-center justify-center text-4xl">
            🎧
          </div>
          <div className="p-4">
            <h3 className="font-bold truncate">{pl.title}</h3>
            {pl.description && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{pl.description}</p>}
            <span className="text-xs text-gray-500 capitalize mt-2 inline-block">{pl.visibility}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ListeningHistory() {
  const { data: tracks } = trpc.tracks.list.useQuery({ limit: 15 });
  const { play } = usePlayer();

  // Mock history with timestamps
  const history = (tracks ?? []).slice(0, 10).map((track, i) => ({
    ...track,
    playedAt: new Date(Date.now() - i * 3600000 * (1 + Math.random() * 5)),
  }));

  if (history.length === 0) {
    return <EmptyTab icon="🕐" title="No listening history" desc="Start playing tracks and they'll appear here." actionLabel="Explore Music" actionHref="/explore" />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">Recent listens</p>
        <button className="text-xs text-gray-500 hover:text-red-400 transition">Clear History</button>
      </div>
      <div className="space-y-2">
        {history.map((track) => (
          <div key={track.id + track.playedAt.toISOString()}
            onClick={() => play({ id: track.id, title: track.title, creator: track.artistName ?? 'Unknown', genre: track.genre ?? '', duration: track.duration ?? 0, audioUrl: (track as { audioUrl?: string | null }).audioUrl ?? null, coverUrl: (track as { coverUrl?: string | null }).coverUrl ?? null })}
            className="flex items-center gap-4 rounded-xl bg-[#15151f] p-4 transition hover:bg-[#1a1a2e] cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-sm font-bold">
              {track.genre?.charAt(0) ?? '♪'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{track.title}</p>
              <p className="text-sm text-gray-400 truncate">{track.artistName ?? 'Unknown'}</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500">{timeAgo(track.playedAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FollowingArtists() {
  const { data: creators, isLoading } = trpc.users.listCreators.useQuery({ limit: 20 });

  if (isLoading) return <LoadingSkeleton />;

  // Mock: show first 4 as "followed"
  const following = creators?.slice(0, 4) ?? [];

  if (following.length === 0) {
    return <EmptyTab icon="👤" title="Not following anyone" desc="Follow your favorite creators to see their updates here." actionLabel="Discover Creators" actionHref="/explore" />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {following.map((creator) => (
        <Link key={creator.id} href={`/artist/${creator.id}`}
          className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5 flex items-center gap-4 transition hover:bg-[#1a1a2e]">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-xl font-black shrink-0">
            {creator.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate">{creator.name}</p>
            <span className="text-xs text-red-400 capitalize">{creator.role}</span>
          </div>
          <span className="text-xs bg-red-600/20 text-red-400 px-3 py-1 rounded-full font-semibold">Following</span>
        </Link>
      ))}
    </div>
  );
}

function EmptyTab({ icon, title, desc, actionLabel, actionHref }: {
  icon: string; title: string; desc: string; actionLabel: string; actionHref: string;
}) {
  return (
    <div className="rounded-2xl bg-[#15151f] p-16 text-center">
      <p className="text-5xl mb-4">{icon}</p>
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-gray-400 mb-6">{desc}</p>
      <Link href={actionHref} className="inline-block rounded-full bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-500 transition">
        {actionLabel}
      </Link>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-[#15151f] p-4 animate-pulse h-16" />
      ))}
    </div>
  );
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
