'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrackEditForm, type EditableTrack } from '@/app/components/track/TrackEditForm';
import { useToast } from '@/app/components/Toast';

export default function EditTrackPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const { data: track, isLoading, error } = trpc.tracks.getById.useQuery(
    { id },
    { enabled: !!id }
  );
  const utils = trpc.useUtils();
  const deleteMutation = trpc.tracks.delete.useMutation({
    onSuccess: () => {
      toast('Track deleted', 'success');
      utils.tracks.list.invalidate();
      router.push('/dashboard');
    },
    onError: (err) => toast(err.message || 'Delete failed', 'error'),
  });

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading…</div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Sign in to edit your tracks</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Track not found</p>
        <Link href="/dashboard" className="text-red-400 hover:text-red-300 transition">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  // Owner check — only the track's uploader can edit it.
  if ((track as { userId?: string }).userId !== session?.user?.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">You can only edit tracks you uploaded</p>
        <Link href="/dashboard" className="text-red-400 hover:text-red-300 transition">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  // tracks.getById returns extra columns (userId, status, artistName, etc.); strip to EditableTrack.
  const editable: EditableTrack = {
    id: track.id,
    title: track.title,
    genre: track.genre ?? null,
    bpm: track.bpm ?? null,
    duration: track.duration ?? null,
    visibility: track.visibility as EditableTrack['visibility'],
    price: track.price ?? null,
    audioUrl: (track as { audioUrl?: string | null }).audioUrl ?? null,
    coverUrl: (track as { coverUrl?: string | null }).coverUrl ?? null,
    iswc: (track as { iswc?: string | null }).iswc ?? null,
    ipi: (track as { ipi?: string | null }).ipi ?? null,
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-6 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mb-6">Edit Track</h1>
        <TrackEditForm
          track={editable}
          onSaved={() => {
            utils.tracks.list.invalidate();
            utils.tracks.getById.invalidate({ id });
            router.push('/dashboard');
          }}
          onCancel={() => router.push('/dashboard')}
        />

        {/* Danger zone — separated from edit form to avoid mis-clicks */}
        <div className="mt-10 pt-6 border-t border-red-900/30">
          <h2 className="text-sm font-bold uppercase tracking-wide text-red-400 mb-2">Danger zone</h2>
          <p className="text-xs text-gray-500 mb-4">
            Deleting a track removes it permanently — listeners won't see it on your profile, in playlists, or in their history. This can't be undone.
          </p>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete "${editable.title}"? This can't be undone.`)) {
                deleteMutation.mutate({ id });
              }
            }}
            disabled={deleteMutation.isPending}
            className="rounded-full bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 px-5 py-2 text-sm font-semibold text-red-300 hover:text-red-200 transition disabled:opacity-50"
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete Track'}
          </button>
        </div>
      </div>
    </div>
  );
}
