'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { usePlayer } from '@/app/components/MusicPlayer';
import { AddToPlaylistModal } from '@/app/components/AddToPlaylistModal';

type LibraryTab = 'uploads' | 'liked' | 'playlists' | 'following';

export default function LibraryPage() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<LibraryTab>('uploads');
  const [addToPlaylistFor, setAddToPlaylistFor] = useState<{ id: string; title: string } | null>(null);

  if (status !== 'authenticated' || !session?.user?.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl mb-2">📚</p>
        <h1 className="text-2xl font-bold mb-2">Your Library</h1>
        <p className="text-gray-400">Sign in to access your saved music, playlists, and follows.</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition mt-4">
          Sign In
        </Link>
      </div>
    );
  }

  const userId = session.user.id;

  const tabs: { id: LibraryTab; label: string; icon: string }[] = [
    { id: 'uploads', label: 'My Uploads', icon: '🎵' },
    { id: 'liked', label: 'Liked Tracks', icon: '❤️' },
    { id: 'playlists', label: 'Playlists', icon: '🎧' },
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

        {tab === 'uploads' && <MyUploads userId={userId} onAddToPlaylist={setAddToPlaylistFor} />}
        {tab === 'liked' && <LikedTracks onAddToPlaylist={setAddToPlaylistFor} />}
        {tab === 'playlists' && <MyPlaylists />}
        {tab === 'following' && <FollowingArtists />}
      </div>

      {addToPlaylistFor && (
        <AddToPlaylistModal
          trackId={addToPlaylistFor.id}
          trackTitle={addToPlaylistFor.title}
          isOpen={true}
          onClose={() => setAddToPlaylistFor(null)}
        />
      )}
    </div>
  );
}

// ─── Tabs ───

interface TrackRow {
  id: string;
  title: string;
  artistName: string | null;
  genre: string | null;
  duration: number | null;
  audioUrl: string | null;
  coverUrl: string | null;
}

function TrackList({
  tracks,
  emptyIcon,
  emptyTitle,
  emptyDesc,
  emptyAction,
  onAddToPlaylist,
}: {
  tracks: TrackRow[];
  emptyIcon: string;
  emptyTitle: string;
  emptyDesc: string;
  emptyAction: { label: string; href: string };
  onAddToPlaylist: (t: { id: string; title: string }) => void;
}) {
  const { play } = usePlayer();

  if (tracks.length === 0) {
    return <EmptyTab icon={emptyIcon} title={emptyTitle} desc={emptyDesc} actionLabel={emptyAction.label} actionHref={emptyAction.href} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">{tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}</p>
        <button
          onClick={() => {
            if (tracks[0]) {
              play({
                id: tracks[0].id,
                title: tracks[0].title,
                creator: tracks[0].artistName ?? 'Unknown',
                genre: tracks[0].genre ?? '',
                duration: tracks[0].duration ?? 0,
                audioUrl: tracks[0].audioUrl,
                coverUrl: tracks[0].coverUrl,
              });
            }
          }}
          className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500 transition"
        >
          ▶ Play All
        </button>
      </div>
      <div className="space-y-2">
        {tracks.map((track, i) => (
          <div key={track.id}
            className="flex items-center gap-4 rounded-xl bg-[#15151f] p-4 transition hover:bg-[#1a1a2e] group">
            <button
              onClick={() => play({
                id: track.id,
                title: track.title,
                creator: track.artistName ?? 'Unknown',
                genre: track.genre ?? '',
                duration: track.duration ?? 0,
                audioUrl: track.audioUrl,
                coverUrl: track.coverUrl,
              })}
              className="flex items-center gap-4 flex-1 min-w-0 text-left cursor-pointer"
            >
              <span className="text-gray-500 text-sm w-6 text-right group-hover:hidden">{i + 1}</span>
              <span className="text-red-400 text-sm w-6 text-right hidden group-hover:block">▶</span>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
                {track.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  track.genre?.charAt(0) ?? '♪'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{track.title}</p>
                <p className="text-sm text-gray-400 truncate">{track.artistName ?? 'Unknown'}{track.genre ? ` · ${track.genre}` : ''}</p>
              </div>
              <span className="text-xs text-gray-500 hidden sm:block">{formatDuration(track.duration)}</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onAddToPlaylist({ id: track.id, title: track.title }); }}
              className="text-gray-400 hover:text-white px-2 py-1 rounded transition shrink-0"
              title="Add to playlist"
              aria-label={`Add ${track.title} to playlist`}
            >
              +
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MyUploads({
  userId,
  onAddToPlaylist,
}: {
  userId: string;
  onAddToPlaylist: (t: { id: string; title: string }) => void;
}) {
  const { data, isLoading } = trpc.tracks.list.useQuery({ userId, limit: 100 });
  if (isLoading) return <LoadingSkeleton />;
  return (
    <TrackList
      tracks={data ?? []}
      emptyIcon="🎵"
      emptyTitle="You haven't uploaded any tracks yet"
      emptyDesc="Upload your first track to get it on the platform."
      emptyAction={{ label: 'Upload a Track', href: '/dashboard/upload' }}
      onAddToPlaylist={onAddToPlaylist}
    />
  );
}

function LikedTracks({
  onAddToPlaylist,
}: {
  onAddToPlaylist: (t: { id: string; title: string }) => void;
}) {
  const { data, isLoading } = trpc.likes.listMine.useQuery({ limit: 100 });
  if (isLoading) return <LoadingSkeleton />;
  return (
    <TrackList
      tracks={data ?? []}
      emptyIcon="❤️"
      emptyTitle="No liked tracks yet"
      emptyDesc="Hit the heart icon on any track to save it here."
      emptyAction={{ label: 'Explore Music', href: '/explore' }}
      onAddToPlaylist={onAddToPlaylist}
    />
  );
}

function MyPlaylists() {
  const utils = trpc.useUtils();
  const { data: playlists, isLoading } = trpc.playlists.listMine.useQuery({ limit: 100 });
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createMutation = trpc.playlists.create.useMutation({
    onSuccess: () => {
      setTitle('');
      setCreating(false);
      setError(null);
      utils.playlists.listMine.invalidate();
    },
    onError: (e) => setError(e.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    createMutation.mutate({ title: title.trim() });
  };

  if (isLoading) return <LoadingSkeleton />;

  const hasNone = !playlists || playlists.length === 0;

  return (
    <div>
      {hasNone && !creating ? (
        <EmptyTab
          icon="🎧"
          title="No playlists yet"
          desc="Create a playlist to organize your favorite tracks."
          actionLabel="Create Playlist"
          actionHref="#"
          actionOnClick={() => setCreating(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Create new playlist card */}
          {creating ? (
            <form
              onSubmit={handleCreate}
              className="rounded-2xl bg-[#15151f] border border-red-600/40 p-5 flex flex-col gap-3"
            >
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Playlist name"
                maxLength={100}
                className="bg-[#0f0f17] border border-brand-800/30 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!title.trim() || createMutation.isPending}
                  className="flex-1 rounded-lg bg-red-600 hover:bg-red-500 px-3 py-2 text-sm font-semibold transition disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating…' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => { setCreating(false); setTitle(''); setError(null); }}
                  className="text-gray-400 hover:text-white text-sm px-3"
                >
                  Cancel
                </button>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </form>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="rounded-2xl border-2 border-dashed border-brand-800/30 p-8 flex flex-col items-center justify-center text-center transition hover:border-red-600 hover:text-red-400 cursor-pointer"
            >
              <span className="text-3xl mb-2">+</span>
              <span className="text-sm font-semibold">New Playlist</span>
            </button>
          )}

          {(playlists ?? []).map((pl) => (
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
      )}
    </div>
  );
}

function FollowingArtists() {
  const { data, isLoading } = trpc.users.myFollowing.useQuery({ limit: 100 });

  if (isLoading) return <LoadingSkeleton />;

  if (!data || data.length === 0) {
    return <EmptyTab icon="👤" title="Not following anyone" desc="Follow your favorite creators to see them here." actionLabel="Discover Creators" actionHref="/explore" />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {data.map((creator) => (
        <Link key={creator.id} href={`/artist/${creator.id}`}
          className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-5 flex items-center gap-4 transition hover:bg-[#1a1a2e]">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-xl font-black shrink-0 overflow-hidden">
            {creator.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creator.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              creator.name?.charAt(0)?.toUpperCase() ?? '?'
            )}
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

// ─── Helpers ───

function EmptyTab({ icon, title, desc, actionLabel, actionHref, actionOnClick }: {
  icon: string; title: string; desc: string; actionLabel: string; actionHref: string;
  actionOnClick?: () => void;
}) {
  const Inner = (
    <span className="inline-block rounded-full bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-500 transition">
      {actionLabel}
    </span>
  );
  return (
    <div className="rounded-2xl bg-[#15151f] p-16 text-center">
      <p className="text-5xl mb-4">{icon}</p>
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-gray-400 mb-6">{desc}</p>
      {actionOnClick ? (
        <button onClick={actionOnClick}>{Inner}</button>
      ) : (
        <Link href={actionHref}>{Inner}</Link>
      )}
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
