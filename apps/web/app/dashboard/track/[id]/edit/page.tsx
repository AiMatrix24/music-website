'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrackEditForm, type EditableTrack } from '@/app/components/track/TrackEditForm';

export default function EditTrackPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: track, isLoading, error } = trpc.tracks.getById.useQuery(
    { id },
    { enabled: !!id }
  );
  const utils = trpc.useUtils();

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
      </div>
    </div>
  );
}
