'use client';

import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const profile = trpc.users.getProfile.useQuery(undefined, {
    enabled: status === 'authenticated',
  });
  const subscription = trpc.subscriptions.getMySubscription.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  const [name, setName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [bio, setBio] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialTiktok, setSocialTiktok] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  const [socialSpotify, setSocialSpotify] = useState('');
  const [socialSoundcloud, setSocialSoundcloud] = useState('');
  const [socialWebsite, setSocialWebsite] = useState('');

  useEffect(() => {
    if (profile.data) {
      setName(profile.data.name ?? '');
      setWalletAddress(profile.data.walletAddress ?? '');
      setBio((profile.data as any).bio ?? '');
      setSocialInstagram((profile.data as any).socialInstagram ?? '');
      setSocialTwitter((profile.data as any).socialTwitter ?? '');
      setSocialTiktok((profile.data as any).socialTiktok ?? '');
      setSocialYoutube((profile.data as any).socialYoutube ?? '');
      setSocialSpotify((profile.data as any).socialSpotify ?? '');
      setSocialSoundcloud((profile.data as any).socialSoundcloud ?? '');
      setSocialWebsite((profile.data as any).socialWebsite ?? '');
    }
  }, [profile.data]);

  const updateMutation = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      toast('Profile updated!');
      profile.refetch();
    },
    onError: (err) => {
      toast(err.message || 'Update failed', 'error');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: name.trim() || undefined,
      walletAddress: walletAddress.trim() || undefined,
      bio: bio.trim() || undefined,
      socialInstagram: socialInstagram.trim() || undefined,
      socialTwitter: socialTwitter.trim() || undefined,
      socialTiktok: socialTiktok.trim() || undefined,
      socialYoutube: socialYoutube.trim() || undefined,
      socialSpotify: socialSpotify.trim() || undefined,
      socialSoundcloud: socialSoundcloud.trim() || undefined,
      socialWebsite: socialWebsite.trim() || undefined,
    });
  };

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
          <h1 className="text-3xl font-bold mb-4">Sign in to access Settings</h1>
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

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {/* Profile section */}
        <form onSubmit={handleSave} className="rounded-2xl bg-[#15151f] p-6 mb-6">
          <h2 className="text-xl font-bold mb-6">Profile</h2>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-2xl font-black">
              {(name || session?.user?.name)?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-semibold text-lg">{name || session?.user?.name}</p>
              <p className="text-sm text-gray-400">{session?.user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={session?.user?.email ?? ''}
                disabled
                className="w-full bg-brand-950/50 border border-brand-800/20 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-600 mt-1">Managed by your auth provider</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell fans about yourself..."
                rows={3}
                maxLength={500}
                className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition resize-none"
              />
              <p className="text-xs text-gray-600 mt-1 text-right">{bio.length}/500</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Wallet Address (Polygon)</label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition font-mono text-sm"
              />
              <p className="text-xs text-gray-600 mt-1">Used for on-chain payout verification</p>
            </div>
          </div>

          {/* Social Media Channels */}
          <div className="border-t border-brand-800/20 pt-6 mt-6">
            <h3 className="text-lg font-bold mb-4">Social Media Channels</h3>
            <div className="space-y-4">
              <SocialInput label="Instagram" icon="📸" value={socialInstagram} onChange={setSocialInstagram} placeholder="@yourusername" />
              <SocialInput label="Twitter / X" icon="𝕏" value={socialTwitter} onChange={setSocialTwitter} placeholder="@yourusername" />
              <SocialInput label="TikTok" icon="🎵" value={socialTiktok} onChange={setSocialTiktok} placeholder="@yourusername" />
              <SocialInput label="YouTube" icon="▶️" value={socialYoutube} onChange={setSocialYoutube} placeholder="youtube.com/c/yourchannel" />
              <SocialInput label="Spotify" icon="🎧" value={socialSpotify} onChange={setSocialSpotify} placeholder="open.spotify.com/artist/..." />
              <SocialInput label="SoundCloud" icon="☁️" value={socialSoundcloud} onChange={setSocialSoundcloud} placeholder="soundcloud.com/yourusername" />
              <SocialInput label="Website" icon="🌐" value={socialWebsite} onChange={setSocialWebsite} placeholder="https://yoursite.com" />
            </div>
          </div>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="mt-6 rounded-full bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-500 disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Subscription section */}
        <div className="rounded-2xl bg-[#15151f] p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Subscription</h2>
          {subscription.data ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg capitalize">{subscription.data.tier}</p>
                <p className="text-sm text-gray-400">
                  Status: <span className={subscription.data.status === 'active' ? 'text-green-400' : 'text-yellow-400'}>{subscription.data.status}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Billing: {subscription.data.billingCycle}
                </p>
              </div>
              <Link
                href="/subscribe"
                className="rounded-full border border-brand-500 px-5 py-2 text-sm font-semibold text-brand-400 hover:bg-brand-600/10 transition"
              >
                Change Plan
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-gray-400">No active subscription</p>
              <Link
                href="/subscribe"
                className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500 transition"
              >
                Subscribe
              </Link>
            </div>
          )}
        </div>

        {/* Account section */}
        <div className="rounded-2xl bg-[#15151f] p-6">
          <h2 className="text-xl font-bold mb-4">Account</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Role</span>
              <span className="capitalize">{profile.data?.role ?? 'free'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Member since</span>
              <span>
                {profile.data?.createdAt
                  ? new Date(profile.data.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialInput({
  label,
  icon,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xl w-8 text-center">{icon}</span>
      <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition"
        />
      </div>
    </div>
  );
}
