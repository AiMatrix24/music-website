'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useToast } from '@/app/components/Toast';

/* -- Mock data -- */
const MOCK_TRACKS = [
  { id: '1', title: 'Midnight Drive', duration: 214 },
  { id: '2', title: 'Solar Flare', duration: 187 },
  { id: '3', title: 'Concrete Dreams', duration: 243 },
  { id: '4', title: 'Velvet Horizon', duration: 198 },
  { id: '5', title: 'Neon Rain', duration: 226 },
];

const MOCK_RECENT_CLIPS = [
  { id: 'c1', trackTitle: 'Midnight Drive', format: 'Audiogram 9:16', duration: 30, createdAt: '2026-03-28' },
  { id: 'c2', trackTitle: 'Solar Flare', format: 'Audio Clip (MP3)', duration: 15, createdAt: '2026-03-25' },
  { id: 'c3', trackTitle: 'Neon Rain', format: 'Audiogram 1:1', duration: 45, createdAt: '2026-03-20' },
];

type ExportFormat = 'mp3' | '9:16' | '1:1' | '16:9';

const FORMAT_OPTIONS: { id: ExportFormat; label: string; dimensions: string; desc: string }[] = [
  { id: 'mp3', label: 'Audio Clip (MP3)', dimensions: 'Audio only', desc: 'Shareable audio snippet' },
  { id: '9:16', label: 'Audiogram 9:16', dimensions: '1080 x 1920', desc: 'Stories / Reels / TikTok' },
  { id: '1:1', label: 'Audiogram 1:1', dimensions: '1080 x 1080', desc: 'Instagram / Twitter feed' },
  { id: '16:9', label: 'Audiogram 16:9', dimensions: '1920 x 1080', desc: 'YouTube / Desktop' },
];

const TOTAL_BARS = 80;

export default function ClipsPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const [selectedTrack, setSelectedTrack] = useState('');
  const [regionStart, setRegionStart] = useState(20);
  const [regionEnd, setRegionEnd] = useState(50);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('9:16');
  const [autoCaption, setAutoCaption] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [clipReady, setClipReady] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareText, setShareText] = useState('');

  const dragging = useRef<'start' | 'end' | null>(null);
  const waveRef = useRef<HTMLDivElement>(null);

  /* -- Mock waveform heights -- */
  const bars = useRef(
    Array.from({ length: TOTAL_BARS }, () => 20 + Math.random() * 60)
  ).current;

  /* -- Auth gate -- */
  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Sign in to create clips</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Sign In</Link>
      </div>
    );
  }

  const track = MOCK_TRACKS.find((t) => t.id === selectedTrack);
  const regionSeconds = track
    ? Math.round(((regionEnd - regionStart) / TOTAL_BARS) * track.duration)
    : 0;

  /* -- Drag handling for waveform region -- */
  const handleWavePointer = (e: React.PointerEvent) => {
    if (!waveRef.current || !dragging.current) return;
    const rect = waveRef.current.getBoundingClientRect();
    const pct = Math.round(((e.clientX - rect.left) / rect.width) * TOTAL_BARS);
    const clamped = Math.max(0, Math.min(TOTAL_BARS, pct));
    if (dragging.current === 'start') {
      setRegionStart(Math.min(clamped, regionEnd - 5));
    } else {
      setRegionEnd(Math.max(clamped, regionStart + 5));
    }
  };

  /* -- Auto-detect -- */
  const autoDetect = () => {
    if (!track) return;
    setAutoDetecting(true);
    setTimeout(() => {
      const mid = Math.floor(TOTAL_BARS / 2);
      const halfRegion = Math.floor((30 / track.duration) * TOTAL_BARS / 2);
      setRegionStart(mid - halfRegion);
      setRegionEnd(mid + halfRegion);
      setAutoDetecting(false);
      toast('Best 30-second moment detected!', 'success');
    }, 1000);
  };

  /* -- Generate clip: create shareable link -- */
  const generateClip = () => {
    if (!track) return;
    setGenerating(true);
    setClipReady(false);

    // Calculate start time in seconds from the region
    const startSeconds = Math.round((regionStart / TOTAL_BARS) * track.duration);

    setTimeout(() => {
      const url = `https://opynx.com/track/${track.id}?t=${startSeconds}`;
      const text = `Check out this clip from ${track.title} on OPYNX`;
      setShareUrl(url);
      setShareText(text);
      setGenerating(false);
      setClipReady(true);
      toast('Your clip is ready!', 'success');
    }, 1500);
  };

  /* -- Share actions -- */
  const shareToTwitter = () => {
    const tweetText = encodeURIComponent(`${shareText} ${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank', 'noopener');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast('Link copied to clipboard!', 'success');
    } catch {
      toast('Failed to copy link', 'error');
    }
  };

  const shareToTikTok = () => {
    navigator.clipboard?.writeText(`${shareText}\n${shareUrl}`);
    toast('Share text copied! Paste it into TikTok.', 'success');
  };

  const shareToInstagram = () => {
    navigator.clipboard?.writeText(`${shareText}\n${shareUrl}`);
    toast('Share text copied! Paste it into Instagram.', 'success');
  };

  const formatInfo = FORMAT_OPTIONS.find((f) => f.id === exportFormat)!;

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back + Hero */}
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">
          &larr; Dashboard
        </Link>
        <div className="text-center mb-10">
          <span className="text-5xl mb-4 block">&#9986;</span>
          <h1 className="text-3xl md:text-4xl font-black mb-2">Create Clips &amp; Audiograms</h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Turn your tracks into shareable social clips with waveform visuals and auto-captions.
          </p>
        </div>

        {/* Track Selector */}
        <div className="bg-[#15151f] rounded-2xl p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-300 mb-2">Select Track</label>
          <select
            value={selectedTrack}
            onChange={(e) => { setSelectedTrack(e.target.value); setClipReady(false); setShareUrl(''); }}
            className="w-full bg-brand-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="">-- Choose a track --</option>
            {MOCK_TRACKS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({Math.floor(t.duration / 60)}:{String(t.duration % 60).padStart(2, '0')})
              </option>
            ))}
          </select>
        </div>

        {/* Waveform + Region Selector */}
        {selectedTrack && (
          <div className="bg-[#15151f] rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-300">Select Region ({regionSeconds}s)</h2>
              <button
                onClick={autoDetect}
                disabled={autoDetecting}
                className="text-xs bg-brand-950 border border-gray-700 rounded-full px-4 py-2 text-gray-300 hover:text-white transition disabled:opacity-50"
              >
                {autoDetecting ? 'Analyzing...' : '&#10024; Auto-detect best moment'}
              </button>
            </div>
            <div
              ref={waveRef}
              className="relative h-24 flex items-end gap-[2px] select-none cursor-col-resize"
              onPointerMove={handleWavePointer}
              onPointerUp={() => { dragging.current = null; }}
            >
              {/* Region highlight */}
              <div
                className="absolute top-0 bottom-0 bg-red-600/20 border-l-2 border-r-2 border-red-500 z-10 pointer-events-none"
                style={{
                  left: `${(regionStart / TOTAL_BARS) * 100}%`,
                  width: `${((regionEnd - regionStart) / TOTAL_BARS) * 100}%`,
                }}
              />
              {/* Drag handle: start */}
              <div
                className="absolute top-0 bottom-0 w-3 z-20 cursor-ew-resize group"
                style={{ left: `${(regionStart / TOTAL_BARS) * 100}%`, transform: 'translateX(-50%)' }}
                onPointerDown={() => { dragging.current = 'start'; }}
              >
                <div className="w-1 h-full bg-red-500 mx-auto group-hover:bg-red-400" />
              </div>
              {/* Drag handle: end */}
              <div
                className="absolute top-0 bottom-0 w-3 z-20 cursor-ew-resize group"
                style={{ left: `${(regionEnd / TOTAL_BARS) * 100}%`, transform: 'translateX(-50%)' }}
                onPointerDown={() => { dragging.current = 'end'; }}
              >
                <div className="w-1 h-full bg-red-500 mx-auto group-hover:bg-red-400" />
              </div>
              {/* Bars */}
              {bars.map((h, i) => {
                const inRegion = i >= regionStart && i <= regionEnd;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm transition-colors ${inRegion ? 'bg-red-500' : 'bg-gray-700'}`}
                    style={{ height: `${h}%` }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0:00</span>
              <span>
                {track ? `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}` : ''}
              </span>
            </div>
          </div>
        )}

        {/* Export Format */}
        {selectedTrack && (
          <div className="bg-[#15151f] rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Export Format</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {FORMAT_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setExportFormat(f.id)}
                  className={`rounded-xl p-4 border text-left transition ${
                    exportFormat === f.id
                      ? 'border-red-500 bg-red-600/10'
                      : 'border-gray-700 bg-brand-950 hover:border-gray-500'
                  }`}
                >
                  <p className="text-sm font-semibold text-white">{f.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{f.dimensions}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview Area + Options */}
        {selectedTrack && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Preview */}
            <div className="bg-[#15151f] rounded-2xl p-6 flex flex-col items-center justify-center">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">Preview</h2>
              {exportFormat === 'mp3' ? (
                <div className="w-full h-32 bg-brand-950 rounded-xl flex items-center justify-center border border-gray-700">
                  <span className="text-3xl">&#127925;</span>
                  <span className="ml-3 text-gray-400 text-sm">Audio-only clip</span>
                </div>
              ) : (
                <div
                  className="bg-brand-950 rounded-xl border border-gray-700 flex items-center justify-center overflow-hidden"
                  style={{
                    width: exportFormat === '9:16' ? 120 : exportFormat === '1:1' ? 160 : 240,
                    height: exportFormat === '9:16' ? 213 : exportFormat === '1:1' ? 160 : 135,
                  }}
                >
                  <div className="flex items-end gap-[1px] h-12">
                    {bars.slice(regionStart, regionEnd).map((h, i) => (
                      <div key={i} className="w-1 bg-red-500 rounded-sm" style={{ height: `${h * 0.5}%` }} />
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-3">{formatInfo.dimensions}</p>
            </div>

            {/* Options */}
            <div className="bg-[#15151f] rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">Options</h2>

              {/* Auto-caption toggle */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-white font-medium">Auto-caption</p>
                  <p className="text-xs text-gray-500">Whisper transcription overlay</p>
                </div>
                <button
                  onClick={() => setAutoCaption(!autoCaption)}
                  className={`relative w-12 h-7 rounded-full transition ${autoCaption ? 'bg-red-600' : 'bg-gray-700'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                      autoCaption ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Generate */}
              <button
                onClick={generateClip}
                disabled={generating || !selectedTrack}
                className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold py-3 transition disabled:opacity-50 mb-3"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  'Generate Clip'
                )}
              </button>

              {clipReady && (
                <div className="space-y-3">
                  <p className="text-green-400 text-sm font-semibold text-center">Your clip is ready!</p>

                  {/* Shareable URL display */}
                  {shareUrl && (
                    <div className="bg-brand-950 border border-gray-700 rounded-xl px-3 py-2 flex items-center gap-2">
                      <p className="text-xs text-gray-400 font-mono truncate flex-1">{shareUrl}</p>
                      <button
                        onClick={copyLink}
                        className="text-xs text-red-400 font-semibold hover:text-red-300 transition shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  )}

                  {/* Coming soon note */}
                  <p className="text-xs text-gray-500 text-center">
                    Full audio clip generation coming soon &mdash; share the timestamped link for now
                  </p>

                  {/* Copy Link button */}
                  <button
                    onClick={copyLink}
                    className="w-full rounded-xl bg-brand-950 border border-gray-700 text-white font-semibold py-3 hover:border-gray-500 transition"
                  >
                    &#128279; Copy Link
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={shareToTwitter}
                      className="flex-1 rounded-xl bg-[#1DA1F2]/10 border border-[#1DA1F2]/30 text-[#1DA1F2] text-sm py-2 hover:bg-[#1DA1F2]/20 transition"
                    >
                      Twitter
                    </button>
                    <button
                      onClick={shareToInstagram}
                      className="flex-1 rounded-xl bg-[#E1306C]/10 border border-[#E1306C]/30 text-[#E1306C] text-sm py-2 hover:bg-[#E1306C]/20 transition"
                    >
                      Instagram
                    </button>
                    <button
                      onClick={shareToTikTok}
                      className="flex-1 rounded-xl bg-white/10 border border-white/20 text-white text-sm py-2 hover:bg-white/20 transition"
                    >
                      TikTok
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Clips */}
        <div className="bg-[#15151f] rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">Recent Clips</h2>
          {MOCK_RECENT_CLIPS.length === 0 ? (
            <p className="text-gray-500 text-sm">No clips yet. Create your first one above!</p>
          ) : (
            <div className="space-y-3">
              {MOCK_RECENT_CLIPS.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-brand-950 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{c.trackTitle}</p>
                    <p className="text-xs text-gray-500">
                      {c.format} &middot; {c.duration}s &middot; {c.createdAt}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const mockTrack = MOCK_TRACKS.find((t) => t.title === c.trackTitle);
                        if (mockTrack) {
                          const url = `https://opynx.com/track/${mockTrack.id}?t=0`;
                          navigator.clipboard?.writeText(url);
                          toast('Link copied!', 'success');
                        }
                      }}
                      className="text-xs text-gray-400 hover:text-white transition"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => {
                        const mockTrack = MOCK_TRACKS.find((t) => t.title === c.trackTitle);
                        if (mockTrack) {
                          const url = `https://opynx.com/track/${mockTrack.id}?t=0`;
                          const text = encodeURIComponent(`Check out this clip from ${c.trackTitle} on OPYNX ${url}`);
                          window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener');
                        }
                      }}
                      className="text-xs text-red-500 hover:text-red-400 transition"
                    >
                      Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
