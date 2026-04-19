'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';
import { useUploadThing } from '@/lib/uploadthing-client';

const GENRES = [
  'Synthwave', 'Lo-fi Hip Hop', 'Electronic', 'Indie Rock', 'Post-Punk',
  'Alternative', 'Ambient', 'R&B', 'Hip Hop', 'Pop', 'Jazz', 'Classical',
  'Metal', 'Country', 'Folk', 'Reggae', 'Latin', 'Afrobeat', 'Other',
];

export default function UploadTrackPage() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const createTrack = trpc.tracks.create.useMutation();
  const { startUpload, isUploading: utUploading } = useUploadThing('audioUpload');

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [bpm, setBpm] = useState('');
  const [duration, setDuration] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'subscribers_only'>('public');
  const [price, setPrice] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<'details' | 'file' | 'review'>('details');

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Sign in to upload tracks</p>
        <Link href="/auth/login" className="text-red-400 hover:text-red-300">Sign In →</Link>
      </div>
    );
  }

  const handlePublish = async () => {
    if (!title) {
      toast('Please enter a track title', 'error');
      return;
    }

    setUploading(true);
    try {
      // Upload audio file to UploadThing if provided
      let audioUrl: string | undefined;
      if (file) {
        toast('Uploading audio file...', 'info');
        const result = await startUpload([file]);
        if (result?.[0]?.ufsUrl) {
          audioUrl = result[0].ufsUrl;
        } else if (result?.[0]?.url) {
          audioUrl = result[0].url;
        }
      }

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const track = await createTrack.mutateAsync({
        title,
        slug,
        genre: genre || undefined,
        bpm: bpm ? parseInt(bpm) : undefined,
        duration: duration ? parseDuration(duration) : undefined,
        visibility,
        price: price ? Math.round(parseFloat(price) * 100) : undefined,
        audioUrl,
      });

      toast('Track published successfully!', 'success');
      router.push(`/track/${track.id}`);
    } catch (err: any) {
      toast(err.message || 'Failed to publish track', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-2">Upload Track</h1>
        <p className="text-gray-400 mb-8">Share your music with fans worldwide.</p>

        {/* Steps */}
        <div className="flex items-center gap-4 mb-8">
          {(['details', 'file', 'review'] as const).map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`flex items-center gap-2 text-sm font-semibold transition ${
                step === s ? 'text-red-400' : 'text-gray-500'
              }`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s ? 'bg-red-600 text-white' : 'bg-[#15151f] text-gray-500'
              }`}>
                {i + 1}
              </span>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Step 1: Details */}
        {step === 'details' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Track Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midnight Drive"
                className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-red-600 focus:outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-red-600 focus:outline-none transition"
                >
                  <option value="">Select genre...</option>
                  {GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">BPM</label>
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                  placeholder="120"
                  className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-red-600 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Duration (mm:ss)</label>
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="3:45"
                  className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-red-600 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Price ($, 0 = free)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-red-600 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Visibility</label>
              <div className="flex gap-3">
                {(['public', 'subscribers_only', 'private'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVisibility(v)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                      visibility === v
                        ? 'bg-red-600 text-white'
                        : 'bg-[#15151f] text-gray-400 hover:text-white'
                    }`}
                  >
                    {v === 'subscribers_only' ? 'Subs Only' : v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep('file')}
              disabled={!title}
              className="w-full rounded-full bg-red-600 py-3 font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              Next: Upload File →
            </button>
          </div>
        )}

        {/* Step 2: File Upload */}
        {step === 'file' && (
          <div className="space-y-6">
            <div
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition cursor-pointer ${
                file
                  ? 'border-green-600 bg-green-900/10'
                  : 'border-brand-800/30 hover:border-red-600'
              }`}
              onClick={() => document.getElementById('audio-input')?.click()}
            >
              <input
                id="audio-input"
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <>
                  <p className="text-4xl mb-3">✅</p>
                  <p className="font-bold text-green-400">{file.name}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Click to change file</p>
                </>
              ) : (
                <>
                  <p className="text-5xl mb-4">🎵</p>
                  <p className="font-bold text-lg mb-2">Drop your audio file here</p>
                  <p className="text-sm text-gray-400">
                    Supports MP3, WAV, FLAC, AAC, OGG · Max 100MB
                  </p>
                  <p className="text-xs text-gray-500 mt-4">
                    Click to browse files
                  </p>
                </>
              )}
            </div>

            <div className="rounded-xl bg-[#15151f] border border-brand-800/20 p-4">
              <h3 className="font-bold text-sm mb-2">Audio Quality</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Streaming format</span>
                  <span className="text-white">320kbps AAC</span>
                </div>
                <div className="flex justify-between">
                  <span>Lossless (Studio tier)</span>
                  <span className="text-white">FLAC</span>
                </div>
                <div className="flex justify-between">
                  <span>CDN</span>
                  <span className="text-white">Global edge delivery</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('details')}
                className="flex-1 rounded-full border border-brand-800/30 py-3 font-semibold transition hover:border-red-600"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep('review')}
                className="flex-1 rounded-full bg-red-600 py-3 font-semibold text-white transition hover:bg-red-500"
              >
                Review →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <div className="flex gap-4 mb-4">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-3xl shrink-0">
                  {genre ? genre.charAt(0) : '♪'}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{title || 'Untitled'}</h2>
                  <p className="text-gray-400 text-sm">{genre || 'No genre'} {bpm ? `· ${bpm} BPM` : ''}</p>
                  {duration && <p className="text-gray-500 text-sm">{duration}</p>}
                </div>
              </div>

              <div className="space-y-2 text-sm border-t border-brand-800/20 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Visibility</span>
                  <span className="capitalize">{visibility.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price</span>
                  <span>{price && parseFloat(price) > 0 ? `$${parseFloat(price).toFixed(2)}` : 'Free'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">File</span>
                  <span>{file ? file.name : 'No file (metadata only)'}</span>
                </div>
              </div>
            </div>

            {price && parseFloat(price) > 0 && (
              <div className="rounded-xl bg-[#15151f] border border-brand-800/20 p-4">
                <h3 className="font-bold text-sm mb-2">Revenue Split</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">You receive (85%)</span>
                    <span className="text-red-400 font-bold">${(parseFloat(price) * 0.85).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Platform (15%)</span>
                    <span>${(parseFloat(price) * 0.15).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rights & Splits link */}
            <Link
              href="/dashboard/upload/rights"
              className="block rounded-xl border border-brand-800/30 bg-brand-950/50 p-4 hover:border-red-600 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">📜 Configure Rights & Splits</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Set songwriter splits, PRO affiliation, label permissions before publishing
                  </p>
                </div>
                <span className="text-red-400 text-sm font-semibold">Configure →</span>
              </div>
            </Link>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('file')}
                className="flex-1 rounded-full border border-brand-800/30 py-3 font-semibold transition hover:border-red-600"
              >
                ← Back
              </button>
              <button
                onClick={handlePublish}
                disabled={uploading}
                className="flex-1 rounded-full bg-red-600 py-4 font-semibold text-white text-lg transition hover:bg-red-500 disabled:opacity-50"
              >
                {uploading ? 'Publishing...' : 'Publish Track 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function parseDuration(str: string): number {
  const parts = str.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return parseInt(str) || 0;
}
