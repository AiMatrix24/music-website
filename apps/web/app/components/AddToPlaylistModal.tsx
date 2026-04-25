'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';

/**
 * AddToPlaylistModal — pick one of the user's playlists and append the track.
 * If they have none, they can create one inline. Refetches playlist list on
 * success so the same modal can be reopened on another track right away.
 */
interface Props {
  trackId: string;
  trackTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddToPlaylistModal({ trackId, trackTitle, isOpen, onClose }: Props) {
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [justAddedTo, setJustAddedTo] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const playlistsQuery = trpc.playlists.listMine.useQuery(undefined, { enabled: isOpen });
  const myPlaylists = playlistsQuery.data ?? [];

  const addTrack = trpc.playlists.addTrack.useMutation({
    onSuccess: (_data, vars) => {
      setJustAddedTo(vars.playlistId);
      utils.playlists.getTracks.invalidate({ playlistId: vars.playlistId });
      // Auto-clear the success badge after a moment
      setTimeout(() => setJustAddedTo(null), 1500);
    },
    onError: (e) => setError(e.message),
  });

  const createPlaylist = trpc.playlists.create.useMutation({
    onSuccess: async (created) => {
      setCreating(false);
      setNewTitle('');
      setError(null);
      await utils.playlists.listMine.invalidate();
      // Immediately add the track to the just-created playlist
      addTrack.mutate({ playlistId: created.id, trackId, position: 0 });
    },
    onError: (e) => setError(e.message),
  });

  const handleAdd = (playlistId: string, currentTrackCount: number) => {
    setError(null);
    addTrack.mutate({ playlistId, trackId, position: currentTrackCount });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setError(null);
    createPlaylist.mutate({ title: newTitle.trim() });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#15151f] border border-brand-800/30 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-800/20">
          <div className="min-w-0">
            <h3 className="font-bold">Add to playlist</h3>
            <p className="text-xs text-gray-500 truncate mt-0.5">{trackTitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none px-1">×</button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {playlistsQuery.isLoading ? (
            <p className="p-6 text-center text-gray-500 text-sm">Loading…</p>
          ) : myPlaylists.length === 0 && !creating ? (
            <p className="p-6 text-center text-gray-500 text-sm">
              You don't have any playlists yet. Create one below.
            </p>
          ) : (
            <ul>
              {myPlaylists.map((p) => {
                const isAdded = justAddedTo === p.id;
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => handleAdd(p.id, 0)}
                      disabled={addTrack.isPending}
                      className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left hover:bg-brand-950/40 transition disabled:opacity-50 border-b border-brand-800/10 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{p.title}</p>
                        <p className="text-xs text-gray-500 capitalize">{p.visibility}</p>
                      </div>
                      {isAdded ? (
                        <span className="text-xs text-green-400 font-semibold shrink-0">✓ Added</span>
                      ) : (
                        <span className="text-gray-500 text-lg shrink-0">+</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Inline create */}
        <div className="border-t border-brand-800/20 p-4">
          {creating ? (
            <form onSubmit={handleCreate} className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="New playlist name"
                maxLength={100}
                className="flex-1 bg-[#0f0f17] border border-brand-800/30 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none"
              />
              <button
                type="submit"
                disabled={!newTitle.trim() || createPlaylist.isPending}
                className="rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2 text-sm font-semibold transition disabled:opacity-50"
              >
                {createPlaylist.isPending ? '…' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setCreating(false); setNewTitle(''); setError(null); }}
                className="text-gray-500 hover:text-white text-sm px-2"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full text-center text-sm text-red-400 hover:text-red-300 font-semibold transition"
            >
              + Create new playlist
            </button>
          )}
          {error && <p className="text-xs text-red-400 mt-2 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}
