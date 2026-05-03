'use client';

import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/app/components/Toast';
import { useUploadThing } from '@/lib/uploadthing-client';

/**
 * Step 2 — basic profile setup. Pre-populates from the existing user
 * record (most signups land here with at least an email + name from
 * their OAuth provider, sometimes an avatar). The user can edit + Save.
 *
 * Reuses the existing users.updateProfile mutation; no new tRPC needed.
 */
export function ProfileStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const meQuery = trpc.users.getProfile.useQuery();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');

  // Hydrate from server-side data once it loads.
  useEffect(() => {
    if (meQuery.data) {
      setName(meQuery.data.name ?? '');
      setBio(meQuery.data.bio ?? '');
      setAvatar(meQuery.data.avatar ?? '');
    }
  }, [meQuery.data]);

  const { startUpload, isUploading } = useUploadThing('imageUpload', {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl ?? (res?.[0] as { url?: string })?.url;
      if (url) setAvatar(url);
    },
    onUploadError: (e) => toast(`Upload failed: ${e.message}`, 'error'),
  });

  const updateMutation = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      utils.users.getProfile.invalidate();
      onNext();
    },
    onError: (e) => toast(e.message, 'error'),
  });

  const handleSaveAndContinue = () => {
    updateMutation.mutate({
      name: name.trim() || undefined,
      bio: bio.trim() || undefined,
      avatar: avatar || undefined,
    });
  };

  if (meQuery.isLoading) {
    return <div className="rounded-2xl bg-[#15151f] p-8 text-center text-gray-500">Loading…</div>;
  }

  return (
    <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-8 space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1">Your creator profile</h2>
        <p className="text-sm text-gray-400">
          Fans see this on your /artist page and next to your tracks. You can change it anytime.
        </p>
      </div>

      <Field label="Creator / artist name">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder="Your stage name"
          className="w-full bg-[#0f0f17] border border-brand-800/30 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none"
        />
      </Field>

      <Field label="Avatar" hint="Square image works best. Skip and use the auto-generated one if you don't have one yet.">
        <div className="flex items-center gap-3">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-brand-800/40" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-2xl font-black">
              {name.charAt(0).toUpperCase() || '?'}
            </div>
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
          {avatar && (
            <button
              type="button"
              onClick={() => setAvatar('')}
              className="text-xs text-gray-500 hover:text-red-400"
            >
              Remove
            </button>
          )}
        </div>
      </Field>

      <Field label="Bio" hint="One paragraph. What kind of music? What's your story?">
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="I make…"
          className="w-full bg-[#0f0f17] border border-brand-800/30 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none resize-none"
        />
        <p className="text-xs text-gray-600 mt-1">{bio.length}/500</p>
      </Field>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="rounded-full bg-brand-950 hover:bg-brand-900 border border-brand-800/40 px-5 py-2.5 text-sm font-semibold transition"
        >
          ← Back
        </button>
        <button
          onClick={handleSaveAndContinue}
          disabled={updateMutation.isPending}
          className="flex-1 rounded-full bg-red-600 hover:bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition disabled:opacity-50"
        >
          {updateMutation.isPending ? 'Saving…' : 'Save & Continue →'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-600 mb-2">{hint}</p>}
      {children}
    </div>
  );
}
