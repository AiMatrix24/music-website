'use client';

import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import { PushNotificationToggle } from '../components/PushNotificationToggle';
import { useUploadThing } from '@/lib/uploadthing-client';

const GENRE_OPTIONS = [
  'Synthwave', 'Lo-fi Hip Hop', 'Electronic', 'Indie Rock', 'Post-Punk',
  'Alternative', 'Ambient', 'R&B', 'Hip Hop', 'Pop', 'Jazz', 'Classical',
  'Metal', 'Country', 'Folk', 'Reggae', 'Latin', 'Afrobeat', 'EDM',
  'Trap', 'House', 'Techno', 'Dubstep', 'Drum & Bass',
];

type SettingsTab = 'profile' | 'socials' | 'payouts' | 'notifications' | 'privacy' | 'security';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const profile = trpc.users.getProfile.useQuery(undefined, {
    enabled: status === 'authenticated',
  });
  const subscription = trpc.subscriptions.getMySubscription.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  // Profile state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [walletAddress, setWalletAddress] = useState('');

  // Social state
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialTiktok, setSocialTiktok] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  const [socialSpotify, setSocialSpotify] = useState('');
  const [socialSoundcloud, setSocialSoundcloud] = useState('');
  const [socialWebsite, setSocialWebsite] = useState('');

  // Payout state
  const [payoutMethod, setPayoutMethod] = useState<'usdc' | 'bank'>('usdc');
  const [payoutThreshold, setPayoutThreshold] = useState('25.00');
  const [payoutSchedule, setPayoutSchedule] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');

  // Notification state
  const [notifNewFollower, setNotifNewFollower] = useState(true);
  const [notifTicketSale, setNotifTicketSale] = useState(true);
  const [notifBroadcast, setNotifBroadcast] = useState(true);
  const [notifWeeklyDigest, setNotifWeeklyDigest] = useState(false);
  const [notifPlayMilestone, setNotifPlayMilestone] = useState(true);
  const [notifNewComment, setNotifNewComment] = useState(true);
  const [notifPayoutComplete, setNotifPayoutComplete] = useState(true);

  // Privacy state
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [showPlayCounts, setShowPlayCounts] = useState(true);
  const [showFollowerCount, setShowFollowerCount] = useState(true);
  const [allowDMs, setAllowDMs] = useState(true);
  const [showInSearch, setShowInSearch] = useState(true);

  // Security state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Connected services
  const [connectedSpotify, setConnectedSpotify] = useState(false);
  const [connectedAppleMusic, setConnectedAppleMusic] = useState(false);

  useEffect(() => {
    if (profile.data) {
      const d = profile.data as any;
      setName(d.name ?? '');
      setBio(d.bio ?? '');
      setAvatar(d.avatar ?? '');
      setWalletAddress(d.walletAddress ?? '');
      setSocialInstagram(d.socialInstagram ?? '');
      setSocialTwitter(d.socialTwitter ?? '');
      setSocialTiktok(d.socialTiktok ?? '');
      setSocialYoutube(d.socialYoutube ?? '');
      setSocialSpotify(d.socialSpotify ?? '');
      setSocialSoundcloud(d.socialSoundcloud ?? '');
      setSocialWebsite(d.socialWebsite ?? '');
    }
  }, [profile.data]);

  const updateMutation = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      toast('Settings saved!');
      profile.refetch();
    },
    onError: (err) => toast(err.message || 'Save failed', 'error'),
  });

  const { startUpload: startAvatarUpload, isUploading: avatarUploading } = useUploadThing('imageUpload', {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl ?? (res?.[0] as { url?: string })?.url;
      if (url) {
        setAvatar(url);
        toast('Avatar uploaded — click Save Changes to apply', 'success');
      }
    },
    onUploadError: (e) => toast(`Upload failed: ${e.message}`, 'error'),
  });

  const handleSaveProfile = () => {
    updateMutation.mutate({
      name: name.trim() || undefined,
      bio: bio.trim() || undefined,
      avatar: avatar || undefined,
      walletAddress: walletAddress.trim() || undefined,
      socialInstagram: socialInstagram.trim() || undefined,
      socialTwitter: socialTwitter.trim() || undefined,
      socialTiktok: socialTiktok.trim() || undefined,
      socialYoutube: socialYoutube.trim() || undefined,
      socialSpotify: socialSpotify.trim() || undefined,
      socialSoundcloud: socialSoundcloud.trim() || undefined,
      socialWebsite: socialWebsite.trim() || undefined,
    });
  };

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading...</div></div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Sign in to access Settings</h1>
          <Link href="/auth/login" className="rounded-full bg-red-600 px-8 py-3 font-semibold text-white">Sign In</Link>
        </div>
      </div>
    );
  }

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'socials', label: 'Socials', icon: '🔗' },
    { id: 'payouts', label: 'Payouts', icon: '💰' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy', icon: '🛡️' },
    { id: 'security', label: 'Security', icon: '🔐' },
  ];

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {/* Tab navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${
                activeTab === t.id ? 'bg-red-600 text-white' : 'bg-[#15151f] text-gray-400 hover:text-white'
              }`}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* ─── Profile Tab ─── */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Avatar & Banner */}
            <div className="rounded-2xl bg-[#15151f] overflow-hidden">
              {/* Banner */}
              <div className="h-32 bg-gradient-to-r from-red-900/40 to-brand-900/40 relative group cursor-pointer">
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40">
                  <span className="text-sm font-semibold">Upload Cover Image</span>
                </div>
              </div>
              {/* Avatar */}
              <div className="px-6 pb-6 -mt-12">
                <div className="flex items-end gap-4">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatar}
                      alt=""
                      className="w-24 h-24 rounded-full object-cover border-4 border-[#15151f]"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-3xl font-black border-4 border-[#15151f]">
                      {(name || session?.user?.name)?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <div className="pb-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) startAvatarUpload([file]);
                      }}
                      disabled={avatarUploading}
                      className="text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-brand-950 file:text-gray-300 file:font-semibold hover:file:bg-brand-900 disabled:opacity-50"
                    />
                    {avatar && (
                      <button
                        type="button"
                        onClick={() => setAvatar('')}
                        className="ml-2 text-xs text-gray-500 hover:text-red-400"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="font-bold text-lg">{name || session?.user?.name}</p>
                  <p className="text-sm text-gray-400">{session?.user?.email}</p>
                </div>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="rounded-2xl bg-[#15151f] p-6 space-y-4">
              <h2 className="text-lg font-bold">Profile Info</h2>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Display Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                  className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Custom URL</label>
                <div className="flex items-center">
                  <span className="text-gray-500 text-sm mr-2">opynx.com/artist/</span>
                  <input type="text" value={customSlug} onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="your-name" className="flex-1 bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition font-mono text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell fans about yourself..." rows={3} maxLength={500}
                  className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition resize-none" />
                <p className="text-xs text-gray-600 mt-1 text-right">{bio.length}/500</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input type="email" value={session?.user?.email ?? ''} disabled
                  className="w-full bg-brand-950/50 border border-brand-800/20 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" />
                <p className="text-xs text-gray-600 mt-1">Managed by your auth provider</p>
              </div>
            </div>

            {/* Genre Tags */}
            <div className="rounded-2xl bg-[#15151f] p-6">
              <h2 className="text-lg font-bold mb-2">Genre Tags</h2>
              <p className="text-xs text-gray-500 mb-4">Select genres that describe your music (max 5)</p>
              <div className="flex flex-wrap gap-2">
                {GENRE_OPTIONS.map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      if (selectedGenres.includes(g) || selectedGenres.length < 5) toggleGenre(g);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                      selectedGenres.includes(g)
                        ? 'bg-red-600 text-white'
                        : 'bg-brand-950 text-gray-400 hover:text-white border border-brand-800/30 hover:border-red-600/30'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              {selectedGenres.length > 0 && (
                <p className="text-xs text-gray-500 mt-3">{selectedGenres.length}/5 selected</p>
              )}
            </div>

            {/* Subscription */}
            <div className="rounded-2xl bg-[#15151f] p-6">
              <h2 className="text-lg font-bold mb-4">Subscription</h2>
              {subscription.data ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold capitalize">{subscription.data.tier}</p>
                    <p className="text-sm text-gray-400">
                      Status: <span className={subscription.data.status === 'active' ? 'text-green-400' : 'text-yellow-400'}>{subscription.data.status}</span>
                      {' · '}{subscription.data.billingCycle}
                    </p>
                  </div>
                  <Link href="/subscribe" className="rounded-full border border-red-600 px-5 py-2 text-sm font-semibold text-red-400 hover:bg-red-600/10 transition">
                    Change Plan
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-gray-400">No active subscription</p>
                  <Link href="/subscribe" className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500 transition">Subscribe</Link>
                </div>
              )}
            </div>

            {/* Account Info */}
            <div className="rounded-2xl bg-[#15151f] p-6">
              <h2 className="text-lg font-bold mb-4">Account</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Role</span><span className="capitalize">{profile.data?.role ?? 'free'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Member since</span>
                  <span>{profile.data?.createdAt ? new Date(profile.data.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</span>
                </div>
              </div>
            </div>

            <button onClick={handleSaveProfile} disabled={updateMutation.isPending}
              className="w-full rounded-full bg-red-600 py-3 font-semibold text-white transition hover:bg-red-500 disabled:opacity-50">
              {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        )}

        {/* ─── Socials Tab ─── */}
        {activeTab === 'socials' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#15151f] p-6">
              <h2 className="text-lg font-bold mb-2">Social Media Channels</h2>
              <p className="text-xs text-gray-500 mb-6">Connect your channels — they&apos;ll appear on your creator profile</p>
              <div className="space-y-5">
                <SocialInput label="Instagram" icon="📸" value={socialInstagram} onChange={setSocialInstagram} placeholder="@yourusername" />
                <SocialInput label="Twitter / X" icon="𝕏" value={socialTwitter} onChange={setSocialTwitter} placeholder="@yourusername" />
                <SocialInput label="TikTok" icon="🎵" value={socialTiktok} onChange={setSocialTiktok} placeholder="@yourusername" />
                <SocialInput label="YouTube" icon="▶️" value={socialYoutube} onChange={setSocialYoutube} placeholder="youtube.com/c/yourchannel" />
                <SocialInput label="Spotify" icon="🎧" value={socialSpotify} onChange={setSocialSpotify} placeholder="open.spotify.com/artist/..." />
                <SocialInput label="SoundCloud" icon="☁️" value={socialSoundcloud} onChange={setSocialSoundcloud} placeholder="soundcloud.com/yourusername" />
                <SocialInput label="Website" icon="🌐" value={socialWebsite} onChange={setSocialWebsite} placeholder="https://yoursite.com" />
              </div>
            </div>

            {/* Connected Streaming Services */}
            <div className="rounded-2xl bg-[#15151f] p-6">
              <h2 className="text-lg font-bold mb-2">Streaming Services</h2>
              <p className="text-xs text-gray-500 mb-4">Link your distributor accounts for cross-platform sync</p>
              <div className="space-y-3">
                <ServiceRow name="Spotify for Creators" icon="🟢" connected={connectedSpotify}
                  onToggle={() => { setConnectedSpotify(!connectedSpotify); toast(connectedSpotify ? 'Spotify disconnected' : 'Spotify connected!', connectedSpotify ? 'info' : 'success'); }} />
                <ServiceRow name="Apple Music for Creators" icon="🍎" connected={connectedAppleMusic}
                  onToggle={() => { setConnectedAppleMusic(!connectedAppleMusic); toast(connectedAppleMusic ? 'Apple Music disconnected' : 'Apple Music connected!', connectedAppleMusic ? 'info' : 'success'); }} />
                <ServiceRow name="YouTube Music" icon="▶️" connected={false} onToggle={() => toast('Coming soon!', 'info')} />
                <ServiceRow name="Amazon Music" icon="🔵" connected={false} onToggle={() => toast('Coming soon!', 'info')} />
              </div>
            </div>

            <button onClick={handleSaveProfile} disabled={updateMutation.isPending}
              className="w-full rounded-full bg-red-600 py-3 font-semibold text-white transition hover:bg-red-500 disabled:opacity-50">
              {updateMutation.isPending ? 'Saving...' : 'Save Socials'}
            </button>
          </div>
        )}

        {/* ─── Payouts Tab ─── */}
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#15151f] p-6">
              <h2 className="text-lg font-bold mb-4">Payout Method</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button onClick={() => setPayoutMethod('usdc')}
                  className={`rounded-xl p-4 text-center transition border-2 ${payoutMethod === 'usdc' ? 'border-red-600 bg-red-900/10' : 'border-brand-800/20 bg-brand-950'}`}>
                  <p className="text-2xl mb-2">💎</p>
                  <p className="font-bold text-sm">USDC (Polygon)</p>
                  <p className="text-xs text-gray-500 mt-1">Instant · No fees</p>
                </button>
                <button onClick={() => setPayoutMethod('bank')}
                  className={`rounded-xl p-4 text-center transition border-2 ${payoutMethod === 'bank' ? 'border-red-600 bg-red-900/10' : 'border-brand-800/20 bg-brand-950'}`}>
                  <p className="text-2xl mb-2">🏦</p>
                  <p className="font-bold text-sm">Bank Transfer</p>
                  <p className="text-xs text-gray-500 mt-1">3-5 days · Via Samiteon</p>
                </button>
              </div>

              {payoutMethod === 'usdc' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Polygon Wallet Address</label>
                  <input type="text" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="0x..."
                    className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition font-mono text-sm" />
                  <p className="text-xs text-gray-600 mt-1">USDC payouts settled on Polygon. Verifiable on-chain.</p>
                </div>
              )}

              {payoutMethod === 'bank' && (
                <div className="rounded-xl bg-brand-950 border border-brand-800/20 p-4">
                  <p className="text-sm text-gray-400">Bank transfers are handled through Samiteon. You&apos;ll be redirected to connect your bank account.</p>
                  <button className="mt-3 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500 transition">
                    Connect Bank via Samiteon
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-[#15151f] p-6">
              <h2 className="text-lg font-bold mb-4">Payout Schedule</h2>
              <div className="space-y-3">
                {(['weekly', 'biweekly', 'monthly'] as const).map((s) => (
                  <button key={s} onClick={() => setPayoutSchedule(s)}
                    className={`w-full flex items-center justify-between rounded-xl p-4 transition border ${
                      payoutSchedule === s ? 'border-red-600 bg-red-900/10' : 'border-brand-800/20 bg-brand-950'
                    }`}>
                    <span className="font-semibold text-sm capitalize">{s}</span>
                    {payoutSchedule === s && <span className="text-red-400 text-xs font-semibold">Selected</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-[#15151f] p-6">
              <h2 className="text-lg font-bold mb-4">Minimum Payout</h2>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-lg">$</span>
                <input type="number" step="1" min="1" value={payoutThreshold} onChange={(e) => setPayoutThreshold(e.target.value)}
                  className="w-32 bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-red-600 outline-none transition text-lg font-bold" />
                <span className="text-sm text-gray-500">minimum before payout is triggered</span>
              </div>
            </div>

            {/* Revenue summary */}
            <div className="rounded-2xl bg-[#15151f] p-6">
              <h2 className="text-lg font-bold mb-4">Revenue Split</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Subscriptions</span><span className="text-red-400 font-bold">$1.00 per subscriber</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Track sales</span><span>85% to you</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Ticket sales</span><span>85% to you</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Marketplace</span><span>85% to you</span></div>
                <div className="border-t border-brand-800/20 pt-3 flex justify-between">
                  <span className="text-gray-400">Verification</span><span className="text-green-400">On-chain (Polygon)</span>
                </div>
              </div>
            </div>

            <button onClick={() => { handleSaveProfile(); toast('Payout settings saved!'); }}
              disabled={updateMutation.isPending}
              className="w-full rounded-full bg-red-600 py-3 font-semibold text-white transition hover:bg-red-500 disabled:opacity-50">
              Save Payout Settings
            </button>
          </div>
        )}

        {/* ─── Notifications Tab ─── */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <PushNotificationToggle />
            <div className="rounded-2xl bg-[#15151f] p-6">
              <h2 className="text-lg font-bold mb-4">Email Notifications</h2>
              <div className="space-y-5">
                <Toggle label="New followers" desc="When someone follows you" checked={notifNewFollower} onChange={setNotifNewFollower} />
                <Toggle label="Ticket sales" desc="When someone buys a ticket to your event" checked={notifTicketSale} onChange={setNotifTicketSale} />
                <Toggle label="Creator broadcasts" desc="Messages from creators you follow" checked={notifBroadcast} onChange={setNotifBroadcast} />
                <Toggle label="Play milestones" desc="When your tracks hit 1K, 10K, 100K plays" checked={notifPlayMilestone} onChange={setNotifPlayMilestone} />
                <Toggle label="New comments" desc="When someone comments on your tracks" checked={notifNewComment} onChange={setNotifNewComment} />
                <Toggle label="Payout complete" desc="When a payout has been processed" checked={notifPayoutComplete} onChange={setNotifPayoutComplete} />
                <Toggle label="Weekly digest" desc="Summary of your platform activity" checked={notifWeeklyDigest} onChange={setNotifWeeklyDigest} />
              </div>
            </div>

            <button onClick={() => toast('Notification preferences saved!')}
              className="w-full rounded-full bg-red-600 py-3 font-semibold text-white transition hover:bg-red-500">
              Save Notification Settings
            </button>
          </div>
        )}

        {/* ─── Privacy Tab ─── */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#15151f] p-6">
              <h2 className="text-lg font-bold mb-4">Profile Visibility</h2>
              <div className="space-y-3">
                {([
                  { id: 'public' as const, label: 'Public', desc: 'Anyone can view your profile' },
                  { id: 'followers' as const, label: 'Followers Only', desc: 'Only people who follow you' },
                  { id: 'private' as const, label: 'Private', desc: 'Only you can see your profile' },
                ]).map((opt) => (
                  <button key={opt.id} onClick={() => setProfileVisibility(opt.id)}
                    className={`w-full flex items-center justify-between rounded-xl p-4 transition border ${
                      profileVisibility === opt.id ? 'border-red-600 bg-red-900/10' : 'border-brand-800/20 bg-brand-950'
                    }`}>
                    <div className="text-left">
                      <p className="font-semibold text-sm">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                    {profileVisibility === opt.id && <span className="text-red-400">●</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-[#15151f] p-6">
              <h2 className="text-lg font-bold mb-4">Display Preferences</h2>
              <div className="space-y-5">
                <Toggle label="Show play counts" desc="Display play counts on your tracks" checked={showPlayCounts} onChange={setShowPlayCounts} />
                <Toggle label="Show follower count" desc="Display follower count on your profile" checked={showFollowerCount} onChange={setShowFollowerCount} />
                <Toggle label="Allow direct messages" desc="Let fans send you messages" checked={allowDMs} onChange={setAllowDMs} />
                <Toggle label="Show in search results" desc="Appear in search and explore pages" checked={showInSearch} onChange={setShowInSearch} />
              </div>
            </div>

            <button onClick={() => toast('Privacy settings saved!')}
              className="w-full rounded-full bg-red-600 py-3 font-semibold text-white transition hover:bg-red-500">
              Save Privacy Settings
            </button>
          </div>
        )}

        {/* ─── Security Tab ─── */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#15151f] p-6">
              <h2 className="text-lg font-bold mb-4">Two-Factor Authentication</h2>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold">2FA {twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
                  <p className="text-xs text-gray-500 mt-1">Add an extra layer of security to your account</p>
                </div>
                <button
                  onClick={() => {
                    setTwoFactorEnabled(!twoFactorEnabled);
                    toast(twoFactorEnabled ? '2FA disabled' : '2FA enabled!', twoFactorEnabled ? 'info' : 'success');
                  }}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                    twoFactorEnabled ? 'bg-green-600/20 text-green-400 hover:bg-red-600/20 hover:text-red-400' : 'bg-red-600 text-white hover:bg-red-500'
                  }`}
                >
                  {twoFactorEnabled ? 'Disable' : 'Enable 2FA'}
                </button>
              </div>
              {twoFactorEnabled && (
                <div className="bg-brand-950/50 rounded-xl p-4 text-sm text-gray-400">
                  <p>2FA is active. You&apos;ll need your authenticator app when signing in.</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-[#15151f] p-6">
              <h2 className="text-lg font-bold mb-4">Connected Auth Providers</h2>
              <div className="space-y-3">
                <ServiceRow name="Discord" icon="💬" connected={false} onToggle={() => toast('Connect via sign-in page', 'info')} />
                <ServiceRow name="Twitter / X" icon="𝕏" connected={false} onToggle={() => toast('Connect via sign-in page', 'info')} />
                <ServiceRow name="Twitch" icon="🟣" connected={false} onToggle={() => toast('Connect via sign-in page', 'info')} />
              </div>
            </div>

            <div className="rounded-2xl bg-[#15151f] p-6">
              <h2 className="text-lg font-bold mb-4">Sessions</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-semibold">Current session</p>
                    <p className="text-xs text-gray-500">Last active: now</p>
                  </div>
                  <span className="text-xs bg-green-600/20 text-green-400 px-3 py-1 rounded-full">Active</span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-2xl bg-red-950/20 border border-red-800/20 p-6">
              <h2 className="text-lg font-bold text-red-400 mb-2">Danger Zone</h2>
              <p className="text-sm text-gray-400 mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
              <button className="rounded-full border border-red-600 text-red-400 px-5 py-2 text-sm font-semibold hover:bg-red-600 hover:text-white transition">
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Reusable Components ─── */

function SocialInput({ label, icon, value, onChange, placeholder }: {
  label: string; icon: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xl w-8 text-center">{icon}</span>
      <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">{label}</label>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition" />
      </div>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <button onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition relative ${checked ? 'bg-red-600' : 'bg-brand-800'}`}>
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}

function ServiceRow({ name, icon, connected, onToggle }: {
  name: string; icon: string; connected: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="font-semibold text-sm">{name}</span>
      </div>
      <button onClick={onToggle}
        className={`text-xs px-4 py-1.5 rounded-full font-semibold transition ${
          connected ? 'bg-green-600/20 text-green-400 hover:bg-red-600/20 hover:text-red-400' : 'bg-brand-950 border border-brand-800/30 text-gray-400 hover:border-red-600 hover:text-white'
        }`}>
        {connected ? 'Connected' : 'Connect'}
      </button>
    </div>
  );
}
