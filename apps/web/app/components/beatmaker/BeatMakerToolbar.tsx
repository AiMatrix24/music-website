'use client';

interface BeatMakerToolbarProps {
  bpm: number;
  isPlaying: boolean;
  onBpmChange: (bpm: number) => void;
  onPlay: () => void;
  onStop: () => void;
  onSave: () => void;
  onExport: () => void;
  saving: boolean;
}

export default function BeatMakerToolbar({
  bpm,
  isPlaying,
  onBpmChange,
  onPlay,
  onStop,
  onSave,
  onExport,
  saving,
}: BeatMakerToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#15151f] px-5 py-4 border border-brand-800/20">
      {/* BPM Control */}
      <div className="flex items-center gap-2">
        <label htmlFor="bpm-input" className="text-sm font-medium text-gray-400">
          BPM
        </label>
        <input
          id="bpm-input"
          type="number"
          min={60}
          max={200}
          value={bpm}
          onChange={(e) => {
            const val = Math.max(60, Math.min(200, Number(e.target.value)));
            onBpmChange(val);
          }}
          className="w-16 rounded-lg bg-brand-950 border border-brand-800/30 px-2 py-1.5 text-center text-sm font-semibold text-white outline-none focus:border-brand-600 transition"
        />
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-brand-800/30" />

      {/* Play / Stop */}
      {isPlaying ? (
        <button
          onClick={onStop}
          className="flex items-center gap-2 rounded-xl bg-red-600/20 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-600/30 hover:-translate-y-0.5 transition-all"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
          Stop
        </button>
      ) : (
        <button
          onClick={onPlay}
          className="flex items-center gap-2 rounded-xl bg-green-600/20 px-4 py-2 text-sm font-semibold text-green-400 hover:bg-green-600/30 hover:-translate-y-0.5 transition-all"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Play
        </button>
      )}

      {/* Divider */}
      <div className="h-8 w-px bg-brand-800/30" />

      {/* Save */}
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-brand-600/20 px-4 py-2 text-sm font-semibold text-brand-400 hover:bg-brand-600/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {saving ? 'Saving...' : 'Save'}
      </button>

      {/* Export */}
      <button
        onClick={onExport}
        className="flex items-center gap-2 rounded-xl bg-brand-600/20 px-4 py-2 text-sm font-semibold text-brand-400 hover:bg-brand-600/30 hover:-translate-y-0.5 transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Export WAV
      </button>
    </div>
  );
}
