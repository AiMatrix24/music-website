'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useToast } from '@/app/components/Toast';

/* ── Mock data ── */
const MOCK_TRACKS = [
  { id: '1', title: 'Midnight Drive', duration: 214 },
  { id: '2', title: 'Solar Flare', duration: 187 },
  { id: '3', title: 'Concrete Dreams', duration: 243 },
  { id: '4', title: 'Velvet Horizon', duration: 198 },
  { id: '5', title: 'Neon Rain', duration: 226 },
];

const TOTAL_BARS = 200;

type ToolAction = 'trim' | 'split' | 'cut' | 'undo' | 'redo';
type PlaybackSpeed = 0.5 | 1 | 1.25 | 1.5 | 2;

const TOOLS: { action: ToolAction; label: string; icon: string }[] = [
  { action: 'trim', label: 'Trim', icon: '&#9986;' },
  { action: 'split', label: 'Split', icon: '&#8968;' },
  { action: 'cut', label: 'Cut', icon: '&#10006;' },
  { action: 'undo', label: 'Undo', icon: '&#8617;' },
  { action: 'redo', label: 'Redo', icon: '&#8618;' },
];

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function EditorPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const [selectedTrack, setSelectedTrack] = useState('');
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0); // 0-1 position
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [enhancementsOpen, setEnhancementsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Enhancement toggles
  const [noiseReduction, setNoiseReduction] = useState(false);
  const [volumeNorm, setVolumeNorm] = useState(false);
  const [silenceRemoval, setSilenceRemoval] = useState(false);
  const [silenceThreshold, setSilenceThreshold] = useState(30);
  const [autoEQ, setAutoEQ] = useState(false);

  const waveRef = useRef<HTMLDivElement>(null);
  const playInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Mock waveform heights ── */
  const bars = useRef(
    Array.from({ length: TOTAL_BARS }, () => 10 + Math.random() * 70)
  ).current;

  /* ── Auth gate ── */
  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Sign in to use the audio editor</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Sign In</Link>
      </div>
    );
  }

  const track = MOCK_TRACKS.find((t) => t.id === selectedTrack);
  const currentTime = track ? playhead * track.duration : 0;

  /* ── Playback mock ── */
  const togglePlay = () => {
    if (playing) {
      if (playInterval.current) clearInterval(playInterval.current);
      playInterval.current = null;
      setPlaying(false);
    } else {
      setPlaying(true);
      playInterval.current = setInterval(() => {
        setPlayhead((p) => {
          if (p >= 1) {
            if (playInterval.current) clearInterval(playInterval.current);
            setPlaying(false);
            return 0;
          }
          return Math.min(1, p + 0.002 * speed);
        });
      }, 50);
    }
  };

  /* ── Click on waveform to scrub ── */
  const handleWaveClick = (e: React.MouseEvent) => {
    if (!waveRef.current) return;
    const rect = waveRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    setPlayhead(Math.max(0, Math.min(1, pct)));
  };

  /* ── Toolbar action ── */
  const handleTool = (action: ToolAction) => {
    toast(`${action.charAt(0).toUpperCase() + action.slice(1)} applied`, 'info');
  };

  /* ── Export ── */
  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      toast('Processing... Your edited track will replace the original.', 'success');
    }, 1500);
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Back + Hero */}
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">
          &larr; Dashboard
        </Link>
        <div className="text-center mb-10">
          <span className="text-5xl mb-4 block">&#127926;</span>
          <h1 className="text-3xl md:text-4xl font-black mb-2">Audio Editor</h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Trim, split, enhance, and export your tracks right in the browser.
          </p>
        </div>

        {/* Track Selector */}
        <div className="bg-[#15151f] rounded-2xl p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-300 mb-2">Select Track</label>
          <select
            value={selectedTrack}
            onChange={(e) => { setSelectedTrack(e.target.value); setPlayhead(0); setPlaying(false); }}
            className="w-full bg-brand-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="">-- Choose a track --</option>
            {MOCK_TRACKS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({formatTime(t.duration)})
              </option>
            ))}
          </select>
        </div>

        {selectedTrack && (
          <>
            {/* Toolbar */}
            <div className="bg-[#15151f] rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-2">
              {TOOLS.map((t) => (
                <button
                  key={t.action}
                  onClick={() => handleTool(t.action)}
                  className="flex items-center gap-1.5 bg-brand-950 border border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-300 hover:text-white hover:border-gray-500 transition"
                >
                  <span dangerouslySetInnerHTML={{ __html: t.icon }} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Waveform */}
            <div className="bg-[#15151f] rounded-2xl p-6 mb-6">
              <div
                ref={waveRef}
                onClick={handleWaveClick}
                className="relative h-40 flex items-end gap-[1px] cursor-pointer select-none"
              >
                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                  style={{ left: `${playhead * 100}%` }}
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full -translate-x-[5px] -translate-y-1" />
                </div>
                {/* Bars */}
                {bars.map((h, i) => {
                  const barPos = i / TOTAL_BARS;
                  const isPast = barPos < playhead;
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm transition-colors ${isPast ? 'bg-red-500' : 'bg-gray-700'}`}
                      style={{ height: `${h}%` }}
                    />
                  );
                })}
              </div>

              {/* Time + playback controls */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition text-lg"
                  >
                    {playing ? '&#9646;&#9646;' : '&#9654;'}
                  </button>
                  <div className="text-sm text-gray-300 font-mono">
                    {formatTime(currentTime)} / {track ? formatTime(track.duration) : '0:00'}
                  </div>
                </div>
                {/* Speed */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 mr-2">Speed:</span>
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                        speed === s ? 'bg-red-600 text-white' : 'bg-brand-950 text-gray-400 hover:text-white border border-gray-700'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Enhancement Panel */}
            <div className="bg-[#15151f] rounded-2xl mb-6 overflow-hidden">
              <button
                onClick={() => setEnhancementsOpen(!enhancementsOpen)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <h2 className="text-lg font-bold">Enhancements</h2>
                <span className={`text-gray-400 transition-transform ${enhancementsOpen ? 'rotate-180' : ''}`}>
                  &#9660;
                </span>
              </button>
              {enhancementsOpen && (
                <div className="px-6 pb-6 space-y-5">
                  {/* Noise Reduction */}
                  <ToggleRow
                    label="Noise Reduction"
                    desc="Remove background hiss and hum"
                    enabled={noiseReduction}
                    onToggle={() => setNoiseReduction(!noiseReduction)}
                  />
                  {/* Volume Normalization */}
                  <ToggleRow
                    label="Volume Normalization"
                    desc="EBU R128 loudness normalization (-16 LUFS)"
                    enabled={volumeNorm}
                    onToggle={() => setVolumeNorm(!volumeNorm)}
                  />
                  {/* Silence Removal */}
                  <div>
                    <ToggleRow
                      label="Silence Removal"
                      desc="Strip silent gaps from the track"
                      enabled={silenceRemoval}
                      onToggle={() => setSilenceRemoval(!silenceRemoval)}
                    />
                    {silenceRemoval && (
                      <div className="mt-3 ml-0 md:ml-4">
                        <label className="text-xs text-gray-500 block mb-1">
                          Threshold: -{silenceThreshold} dB
                        </label>
                        <input
                          type="range"
                          min={10}
                          max={60}
                          value={silenceThreshold}
                          onChange={(e) => setSilenceThreshold(Number(e.target.value))}
                          className="w-full max-w-xs accent-red-600"
                        />
                      </div>
                    )}
                  </div>
                  {/* Auto EQ */}
                  <ToggleRow
                    label="Auto EQ"
                    desc="80 Hz high-pass filter + presence boost (2-5 kHz)"
                    enabled={autoEQ}
                    onToggle={() => setAutoEQ(!autoEQ)}
                  />
                </div>
              )}
            </div>

            {/* Export + Notice */}
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 transition disabled:opacity-50"
              >
                {exporting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Apply & Export'
                )}
              </button>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                &#128274; Non-destructive editing &mdash; original always preserved
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Toggle row component ── */
function ToggleRow({
  label,
  desc,
  enabled,
  onToggle,
}: {
  label: string;
  desc: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-white font-medium">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-12 h-7 rounded-full transition ${enabled ? 'bg-red-600' : 'bg-gray-700'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
}
