'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';
import { useUploadThing } from '@/lib/uploadthing-client';

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public — anyone can see this album' },
  { value: 'private', label: 'Private — only you' },
  { value: 'unlisted', label: 'Unlisted — only people with the link' },
  { value: 'subscribers_only', label: 'Subscribers only' },
] as const;

export default function MyAlbumsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: myAlbums, isLoading } = trpc.albums.list.useQuery(
    { userId: session?.user?.id ?? '', limit: 50 },
    { enabled: status === 'authenticated' && !!session?.user?.id }
  );

  const [showCreate, setShowCreate] = useState(false);

  const [title, setTitle] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [visibility, setVisibility] = useState<typeof VISIBILITY_OPTIONS[number]['value']>('public');

  const { startUpload, isUploading } = useUploadThing('imageUpload', {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl ?? (res?.[0] as { url?: string })?.url;
      if (url) setCoverUrl(url);
    },
    onUploadError: (e) => toast(`Upload failed: ${e.message}`, 'error'),
  });

  const createMutation = trpc.albums.create.useMutation({
    onSuccess: (album) => {
      toast('Album created — add tracks now', 'success');
      utils.albums.list.invalidate();
      setShowCreate(false);
      setTitle('');
      setCoverUrl('');
      setVisibility('public');
      if (album?.id) router.push(`/album/${album.id}`);
    },
    onError: (err) => toast(err.message || 'Create failed', 'error'),
  });

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Sign in to manage your albums</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const handleCreate = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast('Title is required', 'error');
      return;
    }
    // Slug pattern matches the one used for tracks at /dashboard/artist:
    // title-slug + base36 timestamp for uniqueness. Backend takes a slug
    // input, so we generate it client-side.
    const slug = trimmedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
    createMutation.mutate({
      title: trimmedTitle,
      slug,
      coverUrl: coverUrl || undefined,
      visibility,
    });
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Your Albums</h1>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="rounded-full bg-red-600 hover:bg-red-500 px-5 py-2 text-sm font-bold text-white transition"
          >
            {showCreate ? 'Cancel' : '+ New Album'}
          </button>
        </div>

        {showCreate && (
          <div className="rounded-2xl bg-[#15151f] p-6 mb-8 space-y-4 border border-brand-800/30">
            <h2 className="text-lg font-bold">Create Album</h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="Album title"
                className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Cover Art (optional)</label>
              <div className="flex items-center gap-3">
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverUrl} alt="" className="w-20 h-20 rounded-xl object-cover ring-2 ring-brand-800/40" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center text-2xl">💿</div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) startUpload([file]);
                  }}
                  disabled={isUploading}
                  className="text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-brand-950 file:text-gray-300 file:font-semibold hover:file:bg-brand-900 disabled:opacity-50"
                />
                {coverUrl && (
                  <button type="button" onClick={() => setCoverUrl('')} className="text-xs text-gray-500 hover:text-red-400">
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as typeof visibility)}
                className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-red-600 outline-none transition"
              >
                {VISIBILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCreate}
              disabled={createMutation.isPending || isUploading}
              className="w-full rounded-full bg-red-600 hover:bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating…' : 'Create Album'}
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl bg-[#15151f] p-12 text-center text-gray-500">Loading albums…</div>
        ) : myAlbums && myAlbums.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myAlbums.map((album) => (
              <Link
                key={album.id}
                href={`/album/${album.id}`}
                className="rounded-2xl bg-[#15151f] overflow-hidden transition hover:bg-[#1a1a2e] group"
              >
                {album.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={album.coverUrl} alt="" className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center text-6xl">💿</div>
                )}
                <div className="p-4">
                  <p className="font-bold truncate group-hover:text-red-400 transition">{album.title}</p>
                  <p className="text-xs text-gray-500 capitalize mt-1">{album.visibility}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#15151f] p-12 text-center">
            <p className="text-4xl mb-3">💿</p>
            <p className="text-gray-400 mb-4">No albums yet. Create your first one!</p>
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-full bg-red-600 hover:bg-red-500 px-5 py-2 text-sm font-bold text-white transition"
            >
              + New Album
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
