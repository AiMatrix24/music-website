'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/app/components/Toast';

// --- Mock release data ---
function getReleaseData(slug: string) {
  return {
    artistName: 'Luna Vega',
    title: slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    releaseDate: new Date('2026-05-01T00:00:00'),
    description:
      'A genre-defying collection of tracks that blends electronic textures with organic instrumentation. This release pushes boundaries while staying true to an unmistakable artistic vision, exploring themes of connection, solitude, and digital life.',
    tracks: [
      { num: 1, title: 'Opening Signal', revealed: true },
      { num: 2, title: 'Neon Pulse', revealed: true },
      { num: 3, title: '???', revealed: false },
      { num: 4, title: 'Midnight Circuit', revealed: true },
      { num: 5, title: '???', revealed: false },
      { num: 6, title: '???', revealed: false },
      { num: 7, title: 'Echoes in Glass', revealed: true },
      { num: 8, title: '???', revealed: false },
      { num: 9, title: 'Closing Frequency', revealed: true },
    ],
    artistId: 'luna-vega',
    artistBio:
      'Luna Vega is an electronic creator and producer based in Los Angeles. With a distinctive sound that bridges ambient, house, and experimental music, Luna has built a global following across streaming platforms.',
  };
}

export default function ReleaseCountdownPage() {
  const params = useParams();
  const slug = (params?.slug as string) ?? 'untitled';
  const { toast } = useToast();

  const release = getReleaseData(slug);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [preSaved, setPreSaved] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const calc = () => {
      const now = new Date().getTime();
      const target = release.releaseDate.getTime();
      const diff = Math.max(0, target - now);
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(interval);
  }, [release.releaseDate]);

  const handlePreSave = () => {
    setPreSaved(!preSaved);
    toast(preSaved ? 'Pre-save removed' : 'Pre-saved! You\'ll get it on release day.', preSaved ? 'info' : 'success');
  };

  const handleSubscribe = () => {
    if (!email.trim() || !email.includes('@')) {
      toast('Please enter a valid email', 'error');
      return;
    }
    setSubscribed(true);
    toast('You\'ll be notified when this drops!', 'success');
  };

  const handleShare = (platform: string) => {
    if (platform === 'copy') {
      navigator.clipboard.writeText(window.location.href);
      toast('Link copied!', 'success');
    } else {
      toast(`Opening ${platform}...`, 'info');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-red-500/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `pulse ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* Back Navigation */}
        <div className="px-6 pt-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition inline-block">
            ← Back
          </Link>
        </div>

        {/* Hero Countdown Section */}
        <div className="flex flex-col items-center justify-center text-center px-6 pt-12 pb-16">
          {/* Creator Name */}
          <p className="text-sm font-medium text-red-500 tracking-widest uppercase mb-4">{release.artistName}</p>

          {/* Cover Art Placeholder */}
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl bg-gradient-to-br from-red-600 via-red-800 to-brand-950 mb-8 shadow-2xl shadow-red-600/20 flex items-center justify-center">
            <span className="text-6xl opacity-30">♫</span>
          </div>

          {/* Release Title */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">{release.title}</h1>

          {/* Countdown */}
          <div className="flex gap-4 md:gap-8 mb-4">
            {[
              { value: timeLeft.days, label: 'Days' },
              { value: timeLeft.hours, label: 'Hours' },
              { value: timeLeft.minutes, label: 'Minutes' },
              { value: timeLeft.seconds, label: 'Seconds' },
            ].map((unit) => (
              <div key={unit.label} className="flex flex-col items-center">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-[#15151f] border border-brand-800/20 flex items-center justify-center mb-1">
                  <span className="text-2xl md:text-4xl font-bold tabular-nums">
                    {String(unit.value).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-xs text-gray-500 uppercase tracking-wider">{unit.label}</span>
              </div>
            ))}
          </div>

          {/* Release Date */}
          <p className="text-sm text-gray-500 mb-8">
            {release.releaseDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          {/* Pre-Save Button */}
          <button
            onClick={handlePreSave}
            className={`rounded-full px-10 py-4 font-bold text-lg transition ${
              preSaved
                ? 'bg-green-600 text-white hover:bg-green-500'
                : 'bg-red-600 text-white hover:bg-red-500'
            }`}
          >
            {preSaved ? 'Pre-Saved \u2713' : 'Pre-Save'}
          </button>
        </div>

        <div className="max-w-3xl mx-auto px-6 pb-20">
          {/* Notify Me */}
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-8">
            <h2 className="text-lg font-bold mb-3">Notify Me</h2>
            {subscribed ? (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <span className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-xs">&#10003;</span>
                You&apos;re subscribed! We&apos;ll let you know when it drops.
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600/50"
                />
                <button
                  onClick={handleSubscribe}
                  className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-500 transition"
                >
                  Subscribe
                </button>
              </div>
            )}
          </div>

          {/* Teaser / Preview */}
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-8">
            <h2 className="text-lg font-bold mb-4">Preview</h2>
            <div className="relative rounded-xl bg-brand-950/50 p-4">
              {/* Waveform Placeholder */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setIsPlaying(!isPlaying); toast(isPlaying ? 'Paused' : 'Playing 30s preview...', 'info'); }}
                  className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 transition flex-shrink-0"
                >
                  {isPlaying ? (
                    <span className="text-white font-bold">❚❚</span>
                  ) : (
                    <span className="text-white ml-1">▶</span>
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex items-end gap-px h-12">
                    {Array.from({ length: 60 }).map((_, i) => {
                      const height = 20 + Math.sin(i * 0.3) * 15 + Math.random() * 10;
                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-full transition-all ${
                            isPlaying && i < 20 ? 'bg-red-500' : 'bg-gray-700'
                          }`}
                          style={{ height: `${height}%` }}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-600">0:00</span>
                    <span className="text-xs text-gray-600">0:30</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Track Listing */}
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-8">
            <h2 className="text-lg font-bold mb-4">Track Listing</h2>
            <div className="space-y-2">
              {release.tracks.map((track) => (
                <div
                  key={track.num}
                  className={`flex items-center gap-4 rounded-xl p-3 ${
                    track.revealed ? 'bg-brand-950/50' : 'bg-brand-950/20'
                  }`}
                >
                  <span className="text-sm text-gray-500 w-6 font-mono">{String(track.num).padStart(2, '0')}</span>
                  <span className={`text-sm font-medium ${track.revealed ? 'text-white' : 'text-gray-600 italic'}`}>
                    {track.title}
                  </span>
                  {!track.revealed && (
                    <span className="ml-auto text-xs text-gray-600 bg-brand-950/50 rounded-full px-2 py-0.5">Hidden</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Social Share */}
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-8">
            <h2 className="text-lg font-bold mb-4">Share</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleShare('twitter')}
                className="rounded-full bg-brand-950 border border-brand-800/30 px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:border-red-600/50 transition"
              >
                Twitter / X
              </button>
              <button
                onClick={() => handleShare('instagram')}
                className="rounded-full bg-brand-950 border border-brand-800/30 px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:border-red-600/50 transition"
              >
                Instagram
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="rounded-full bg-brand-950 border border-brand-800/30 px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:border-red-600/50 transition"
              >
                Copy Link
              </button>
            </div>
          </div>

          {/* About This Release */}
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-8">
            <h2 className="text-lg font-bold mb-3">About This Release</h2>
            <p className="text-sm text-gray-400 leading-relaxed">{release.description}</p>
          </div>

          {/* Creator Card */}
          <Link
            href={`/artist/${release.artistId}`}
            className="block rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 hover:border-red-600/30 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-xl font-bold flex-shrink-0">
                {release.artistName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold group-hover:text-red-400 transition">{release.artistName}</p>
                <p className="text-sm text-gray-500 line-clamp-2">{release.artistBio}</p>
              </div>
              <span className="text-gray-500 group-hover:text-white transition text-lg">→</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
