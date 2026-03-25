'use client';

import type { BeatTrack } from '@/lib/audio/presets';

interface StepSequencerProps {
  tracks: BeatTrack[];
  currentStep: number | null;
  onToggleStep: (trackIdx: number, stepIdx: number) => void;
  onToggleMute?: (trackIdx: number) => void;
}

export default function StepSequencer({
  tracks,
  currentStep,
  onToggleStep,
  onToggleMute,
}: StepSequencerProps) {
  return (
    <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-4 overflow-x-auto">
      {/* Step number headers */}
      <div className="flex items-center gap-1 mb-2 pl-28">
        {Array.from({ length: 16 }, (_, i) => (
          <div
            key={i}
            className="w-10 h-6 flex items-center justify-center text-[10px] font-medium text-gray-500 shrink-0"
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Track rows */}
      <div className="flex flex-col gap-2">
        {tracks.map((track, trackIdx) => (
          <div key={track.id} className="flex items-center gap-1">
            {/* Track label + mute */}
            <div className="w-28 flex items-center gap-2 shrink-0">
              <button
                onClick={() => onToggleMute?.(trackIdx)}
                title={track.muted ? 'Unmute' : 'Mute'}
                className={`w-6 h-6 rounded text-[10px] font-bold transition-all ${
                  track.muted
                    ? 'bg-red-600/30 text-red-400'
                    : 'bg-brand-950 text-gray-500 hover:text-gray-300'
                }`}
              >
                M
              </button>
              <span
                className={`text-sm font-medium truncate ${
                  track.muted ? 'text-gray-600 line-through' : 'text-gray-300'
                }`}
              >
                {track.name}
              </span>
            </div>

            {/* Step pads */}
            {track.steps.map((active, stepIdx) => {
              const isCurrent = currentStep === stepIdx;
              const isGroupStart = stepIdx % 4 === 0;

              return (
                <button
                  key={stepIdx}
                  onClick={() => onToggleStep(trackIdx, stepIdx)}
                  className={`w-10 h-10 rounded-lg shrink-0 transition-all duration-75
                    ${active ? 'bg-brand-600 hover:bg-brand-500' : isGroupStart ? 'bg-brand-950/80 hover:bg-brand-900' : 'bg-brand-950 hover:bg-brand-900'}
                    ${isCurrent ? 'ring-2 ring-brand-400 ring-offset-1 ring-offset-[#15151f]' : ''}
                    ${track.muted && active ? 'opacity-40' : ''}
                  `}
                  aria-label={`${track.name} step ${stepIdx + 1} ${active ? 'active' : 'inactive'}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
