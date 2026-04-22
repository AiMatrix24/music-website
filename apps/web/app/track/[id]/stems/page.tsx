'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useToast } from '@/app/components/Toast';

interface Stem {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  volume: number;
  muted: boolean;
  solo: boolean;
}

const INITIAL_STEMS: Stem[] = [
  { id: 'vocals', label: 'Vocals', color: 'bg-red-500', bgColor: 'bg-red-500/20', volume: 80, muted: false, solo: false },
  { id: 'drums', label: 'Drums', color: 'bg-blue-500', bgColor: 'bg-blue-500/20', volume: 100, muted: false, solo: false },
  { id: 'bass', label: 'Bass', color: 'bg-green-500', bgColor: 'bg-green-500/20', volume: 90, muted: false, solo: false },
  { id: 'melody', label: 'Melody', color: 'bg-purple-500', bgColor: 'bg-purple-500/20', volume: 75, muted: false, solo: false },
];

const PRESETS = [
  { name: 'Karaoke', description: 'Mutes vocals', apply: (stems: Stem[]) => stems.map((s) => ({ ...s, muted: s.id === 'vocals', solo: false })) },
  { name: 'Instrumental', description: 'Mutes vocals', apply: (stems: Stem[]) => stems.map((s) => ({ ...s, muted: s.id === 'vocals', solo: false })) },
  { name: 'A Capella', description: 'Solos vocals', apply: (stems: Stem[]) => stems.map((s) => ({ ...s, solo: s.id === 'vocals', muted: false })) },
  { name: 'Drums Only', description: 'Solos drums', apply: (stems: Stem[]) => stems.map((s) => ({ ...s, solo: s.id === 'drums', muted: false })) },
];

export default function StemPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [stems, setStems] = useState<Stem[]>(INITIAL_STEMS);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isolationMode, setIsolationMode] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const totalSeconds = 214; // 3:34
  const currentSeconds = Math.round((progress / 100) * totalSeconds);
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const updateStem = useCallback((stemId: string, updates: Partial<Stem>) => {
    setStems((prev) => prev.map((s) => (s.id === stemId ? { ...s, ...updates } : s)));
    setActivePreset(null);
  }, []);

  const toggleMute = (stemId: string) => {
    updateStem(stemId, { muted: !stems.find((s) => s.id === stemId)!.muted });
  };

  const toggleSolo = (stemId: string) => {
    if (isolationMode) {
      // In isolation mode, soloing one mutes all others
      setStems((prev) =>
        prev.map((s) => ({
          ...s,
          solo: s.id === stemId ? !s.solo : false,
          muted: false,
        }))
      );
    } else {
      updateStem(stemId, { solo: !stems.find((s) => s.id === stemId)!.solo });
    }
    setActivePreset(null);
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setStems(preset.apply(stems));
    setActivePreset(preset.name);
    toast(`Preset applied: ${preset.name}`, 'info');
  };

  const togglePlay = () => {
    setPlaying((p) => !p);
    if (!playing) {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setPlaying(false);
            return 0;
          }
          return prev + 0.5;
        });
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-brand-950 pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <Link href={`/track/${id}`} className="text-gray-400 hover:text-white transition text-sm mb-6 inline-block">
          &larr; Back to Track
        </Link>

        {/* Track header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-600 to-purple-700 flex items-center justify-center text-2xl font-bold shrink-0">
            &#9835;
          </div>
          <div>
            <h1 className="text-2xl font-bold">Midnight Signal</h1>
            <p className="text-gray-400">Nova Synthwave</p>
          </div>
          <span className="ml-auto text-xs text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full font-medium">
            Stem Player
          </span>
        </div>

        {/* Isolation mode toggle */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Stem Channels</h2>
          <button
            onClick={() => setIsolationMode((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              isolationMode
                ? 'bg-red-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isolationMode ? 'bg-white' : 'bg-gray-600'}`} />
            Isolation Mode
          </button>
        </div>

        {/* Stem channels */}
        <div className="space-y-3 mb-8">
          {stems.map((stem) => {
            const hasSolo = stems.some((s) => s.solo);
            const isAudible = stem.solo || (!hasSolo && !stem.muted);

            return (
              <div
                key={stem.id}
                className={`bg-[#15151f] rounded-xl p-5 transition ${
                  !isAudible ? 'opacity-40' : ''
                }`}
              >
                <div className="flex items-center gap-4 mb-3">
                  {/* Label */}
                  <div className="flex items-center gap-2 w-24 shrink-0">
                    <span className={`w-3 h-3 rounded-full ${stem.color}`} />
                    <span className="font-semibold text-sm">{stem.label}</span>
                  </div>

                  {/* Mute/Solo buttons */}
                  <button
                    onClick={() => toggleMute(stem.id)}
                    className={`px-3 py-1 rounded text-xs font-bold transition ${
                      stem.muted
                        ? 'bg-red-600 text-white'
                        : 'bg-white/10 text-gray-400 hover:bg-white/15'
                    }`}
                  >
                    {stem.muted ? 'MUTED' : 'MUTE'}
                  </button>
                  <button
                    onClick={() => toggleSolo(stem.id)}
                    className={`px-3 py-1 rounded text-xs font-bold transition ${
                      stem.solo
                        ? 'bg-yellow-500 text-black'
                        : 'bg-white/10 text-gray-400 hover:bg-white/15'
                    }`}
                  >
                    {stem.solo ? 'SOLO' : 'SOLO'}
                  </button>

                  {/* Volume slider */}
                  <div className="flex-1 flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={stem.volume}
                      onChange={(e) => updateStem(stem.id, { volume: Number(e.target.value) })}
                      className="flex-1 accent-red-500 h-1"
                    />
                    <span className="text-xs text-gray-500 w-8 text-right">{stem.volume}%</span>
                  </div>
                </div>

                {/* Waveform placeholder bar */}
                <div className={`h-8 ${stem.bgColor} rounded-lg overflow-hidden relative`}>
                  <div
                    className={`h-full ${stem.color} rounded-lg transition-all`}
                    style={{ width: `${progress}%`, opacity: isAudible ? 0.6 : 0.15 }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Presets */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Presets</h3>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activePreset === preset.name
                    ? 'bg-red-600 text-white'
                    : 'bg-[#15151f] text-gray-300 hover:bg-[#1a1a28]'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Master controls */}
        <div className="bg-[#15151f] rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition shrink-0"
            >
              {playing ? (
                <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="white" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <div className="flex-1">
              <div
                className="h-2 bg-white/10 rounded-full cursor-pointer relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setProgress(((e.clientX - rect.left) / rect.width) * 100);
                }}
              >
                <div
                  className="h-full bg-red-600 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <span className="text-sm text-gray-400 font-mono shrink-0">
              {formatTime(currentSeconds)} / {formatTime(totalSeconds)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => toast('Export feature coming soon!', 'info')}
            className="px-5 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
          >
            Export Mix
          </button>
          <button
            onClick={() => toast('Request sent to the creator!', 'success')}
            className="px-5 py-3 bg-white/10 hover:bg-white/15 rounded-lg font-medium transition"
          >
            Request Stems from Creator
          </button>
        </div>

        {/* Warning */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-sm text-yellow-400/80">
          <span className="font-semibold">Note:</span> AI-powered stem separation. Results may vary.
          For best quality, request original stems directly from the creator.
        </div>
      </div>
    </div>
  );
}
