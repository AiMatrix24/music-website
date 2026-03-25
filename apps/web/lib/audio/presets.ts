/**
 * Audio presets and default project data for the Beat Maker.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BeatTrack {
  id: string;
  name: string;
  soundId: string;
  steps: boolean[];
  volume: number;
  muted: boolean;
}

export interface BeatProjectData {
  version: 1;
  tracks: BeatTrack[];
  masterVolume: number;
}

// ---------------------------------------------------------------------------
// Drum sound definitions (synth-based)
// ---------------------------------------------------------------------------

export interface DrumSound {
  id: string;
  name: string;
  frequency: number;
  type: OscillatorType;
}

export const DRUM_SOUNDS: DrumSound[] = [
  { id: 'kick', name: 'Kick', frequency: 60, type: 'sine' },
  { id: 'snare', name: 'Snare', frequency: 200, type: 'triangle' },
  { id: 'hihat', name: 'Hi-Hat', frequency: 800, type: 'square' },
  { id: 'clap', name: 'Clap', frequency: 400, type: 'sawtooth' },
];

// ---------------------------------------------------------------------------
// Synth presets
// ---------------------------------------------------------------------------

export interface SynthPreset {
  name: string;
  oscillator: { type: OscillatorType };
  envelope: { attack: number; decay: number; sustain: number; release: number };
}

export const SYNTH_PRESETS: SynthPreset[] = [
  {
    name: 'Bass',
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.2 },
  },
  {
    name: 'Lead',
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.6, release: 0.4 },
  },
  {
    name: 'Pad',
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 1.0 },
  },
];

// ---------------------------------------------------------------------------
// Default project data
// ---------------------------------------------------------------------------

function emptySteps(count = 16): boolean[] {
  return Array.from({ length: count }, () => false);
}

export const DEFAULT_PROJECT_DATA: BeatProjectData = {
  version: 1,
  tracks: [
    { id: 'track-kick', name: 'Kick', soundId: 'kick', steps: emptySteps(), volume: 0.8, muted: false },
    { id: 'track-snare', name: 'Snare', soundId: 'snare', steps: emptySteps(), volume: 0.8, muted: false },
    { id: 'track-hihat', name: 'Hi-Hat', soundId: 'hihat', steps: emptySteps(), volume: 0.6, muted: false },
    { id: 'track-clap', name: 'Clap', soundId: 'clap', steps: emptySteps(), volume: 0.7, muted: false },
  ],
  masterVolume: 0.8,
};
