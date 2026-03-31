'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const FREQUENCIES = ['60Hz', '170Hz', '310Hz', '600Hz', '1kHz', '3kHz', '6kHz', '14kHz'];

interface Preset {
  id: string;
  name: string;
  icon: string;
  values: number[];
}

const PRESETS: Preset[] = [
  { id: 'flat', name: 'Flat', icon: '&#9644;', values: [0, 0, 0, 0, 0, 0, 0, 0] },
  { id: 'bass-boost', name: 'Bass Boost', icon: '&#128165;', values: [8, 6, 4, 1, 0, 0, -1, -2] },
  { id: 'vocal-clarity', name: 'Vocal Clarity', icon: '&#127908;', values: [-2, -1, 0, 3, 5, 4, 2, 0] },
  { id: 'treble-boost', name: 'Treble Boost', icon: '&#10024;', values: [-2, -1, 0, 0, 1, 3, 6, 8] },
  { id: 'live-concert', name: 'Live Concert', icon: '&#127926;', values: [4, 3, 0, -1, 2, 4, 3, 2] },
  { id: 'late-night', name: 'Late Night', icon: '&#127769;', values: [3, 2, 0, -2, -1, 0, 1, 2] },
  { id: 'electronic', name: 'Electronic', icon: '&#9889;', values: [6, 5, 2, 0, -1, 2, 5, 7] },
  { id: 'classical', name: 'Classical', icon: '&#127931;', values: [0, 0, 0, 0, 2, 3, 3, 4] },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function EqualizerPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // EQ state
  const [activePreset, setActivePreset] = useState('flat');
  const [bands, setBands] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);
  const [customPresetName, setCustomPresetName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  // Audio quality state
  const [streamingQuality, setStreamingQuality] = useState('high');
  const [normalizeVolume, setNormalizeVolume] = useState(true);
  const [crossfade, setCrossfade] = useState(2);
  const [monoAudio, setMonoAudio] = useState(false);
  const [loudMode, setLoudMode] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const handlePresetSelect = (preset: Preset) => {
    setActivePreset(preset.id);
    setBands([...preset.values]);
  };

  const handleBandChange = (index: number, value: number) => {
    const newBands = [...bands];
    newBands[index] = value;
    setBands(newBands);
    setActivePreset('custom');
  };

  const handleReset = () => {
    setActivePreset('flat');
    setBands([0, 0, 0, 0, 0, 0, 0, 0]);
    setStreamingQuality('high');
    setNormalizeVolume(true);
    setCrossfade(2);
    setMonoAudio(false);
    setLoudMode(false);
    toast('Settings reset to default.', 'info');
  };

  const handleSavePreset = () => {
    if (!customPresetName.trim()) {
      toast('Please enter a preset name.', 'error');
      return;
    }
    toast(`Preset "${customPresetName}" saved!`, 'success');
    setCustomPresetName('');
    setShowSaveForm(false);
  };

  // Calculate curve points for visual EQ
  const getCurvePoints = () => {
    const width = 100;
    const height = 60;
    const midY = height / 2;
    const points = bands.map((val, i) => {
      const x = (i / (bands.length - 1)) * width;
      const y = midY - (val / 12) * midY;
      return `${x},${y}`;
    });
    return points.join(' ');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="rounded-2xl bg-[#15151f] h-48 animate-pulse" />
          <div className="rounded-xl bg-[#15151f] h-64 animate-pulse" />
          <div className="rounded-xl bg-[#15151f] h-48 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-black mb-4">Sign In Required</h1>
          <p className="text-gray-400 mb-6">Sign in to customize your audio settings.</p>
          <Link href="/auth/login" className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          &larr; Back to Home
        </Link>

        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-red-600/20 to-purple-600/20 border border-red-600/30 p-8 mb-8">
          <h1 className="text-3xl font-black mb-2">&#128264; Audio Settings</h1>
          <p className="text-gray-400">Fine-tune your listening experience</p>
        </div>

        {/* EQ Presets */}
        <h2 className="text-xl font-bold mb-4">EQ Presets</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset)}
              className={`rounded-xl p-4 border transition text-left ${
                activePreset === preset.id
                  ? 'bg-red-600/10 border-red-600 shadow-lg shadow-red-600/10'
                  : 'bg-[#15151f] border-white/5 hover:border-white/20'
              }`}
            >
              <span className="text-xl" dangerouslySetInnerHTML={{ __html: preset.icon }} />
              <p className={`font-semibold text-sm mt-1 ${activePreset === preset.id ? 'text-red-400' : ''}`}>
                {preset.name}
              </p>
            </button>
          ))}
        </div>

        {/* Visual EQ Curve */}
        <div className="rounded-2xl bg-[#15151f] border border-white/5 p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">EQ Curve</h2>
          <div className="relative w-full h-32 mb-2">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="border-b border-white/5 text-[10px] text-gray-600 text-right pr-1">+12dB</div>
              <div className="border-b border-white/10 text-[10px] text-gray-600 text-right pr-1">0dB</div>
              <div className="text-[10px] text-gray-600 text-right pr-1">-12dB</div>
            </div>
            {/* Curve visualization using dots and connecting lines */}
            <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              {/* Fill area under curve */}
              <polygon
                points={`0,60 ${getCurvePoints()} 100,60`}
                className="fill-red-600/10"
              />
              {/* Line */}
              <polyline
                points={getCurvePoints()}
                className="stroke-red-600 fill-none"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Dots */}
              {bands.map((val, i) => {
                const x = (i / (bands.length - 1)) * 100;
                const y = 30 - (val / 12) * 30;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="1.5"
                    className="fill-red-500"
                  />
                );
              })}
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-gray-600 px-1">
            {FREQUENCIES.map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
        </div>

        {/* Manual EQ Sliders */}
        <div className="rounded-2xl bg-[#15151f] border border-white/5 p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Manual EQ</h2>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
            {FREQUENCIES.map((freq, i) => (
              <div key={freq} className="flex flex-col items-center">
                <span className="text-xs text-gray-400 font-mono mb-1">
                  {bands[i] > 0 ? '+' : ''}{bands[i]}dB
                </span>
                <div className="relative h-36 flex items-center justify-center">
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={bands[i]}
                    onChange={(e) => handleBandChange(i, Number(e.target.value))}
                    className="absolute w-36 accent-red-600"
                    style={{
                      transform: 'rotate(-90deg)',
                      transformOrigin: 'center',
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 mt-1">{freq}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/5">
            <button
              onClick={() => setShowSaveForm(!showSaveForm)}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition"
            >
              Save Custom Preset
            </button>
            {showSaveForm && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customPresetName}
                  onChange={(e) => setCustomPresetName(e.target.value)}
                  placeholder="Preset name..."
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-600/50"
                />
                <button onClick={handleSavePreset} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-semibold transition">
                  Save
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Audio Quality Settings */}
        <div className="rounded-2xl bg-[#15151f] border border-white/5 p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Audio Quality</h2>

          {/* Streaming Quality */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Streaming Quality</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'low', label: 'Low', detail: '96 kbps' },
                { id: 'normal', label: 'Normal', detail: '160 kbps' },
                { id: 'high', label: 'High', detail: '320 kbps' },
                { id: 'lossless', label: 'Lossless', detail: 'FLAC' },
              ].map((q) => (
                <button
                  key={q.id}
                  onClick={() => setStreamingQuality(q.id)}
                  className={`rounded-xl p-3 border transition text-center ${
                    streamingQuality === q.id
                      ? 'bg-red-600/10 border-red-600'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <p className={`font-semibold text-sm ${streamingQuality === q.id ? 'text-red-400' : ''}`}>{q.label}</p>
                  <p className="text-xs text-gray-500">{q.detail}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            {/* Normalize Volume */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Normalize Volume</p>
                <p className="text-xs text-gray-500">Keep volume consistent across tracks</p>
              </div>
              <button
                onClick={() => setNormalizeVolume(!normalizeVolume)}
                className={`w-12 h-6 rounded-full transition relative ${normalizeVolume ? 'bg-red-600' : 'bg-white/10'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${normalizeVolume ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Crossfade */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">Crossfade</p>
                  <p className="text-xs text-gray-500">Smooth transition between tracks</p>
                </div>
                <span className="text-sm text-gray-400">{crossfade}s</span>
              </div>
              <input
                type="range"
                min={0}
                max={12}
                step={1}
                value={crossfade}
                onChange={(e) => setCrossfade(Number(e.target.value))}
                className="w-full accent-red-600"
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>0s</span>
                <span>12s</span>
              </div>
            </div>

            {/* Mono Audio */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Mono Audio</p>
                <p className="text-xs text-gray-500">Combine left and right channels</p>
              </div>
              <button
                onClick={() => setMonoAudio(!monoAudio)}
                className={`w-12 h-6 rounded-full transition relative ${monoAudio ? 'bg-red-600' : 'bg-white/10'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${monoAudio ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Loud Mode */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Loud Mode</p>
                <p className="text-xs text-gray-500">Boost overall output level</p>
              </div>
              <button
                onClick={() => setLoudMode(!loudMode)}
                className={`w-12 h-6 rounded-full transition relative ${loudMode ? 'bg-red-600' : 'bg-white/10'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${loudMode ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Reset */}
        <div className="text-center">
          <button
            onClick={handleReset}
            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-semibold transition"
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}
