/**
 * Tone.js Audio Engine Singleton
 * All Tone.js usage goes through dynamic imports to avoid SSR issues.
 */

let toneModule: typeof import('tone') | null = null;
let audioReady = false;
let currentBPM = 120;

async function getTone() {
  if (!toneModule) {
    toneModule = await import('tone');
  }
  return toneModule;
}

/**
 * Initialize the AudioContext. Must be called from a user gesture (click/tap).
 * Returns true if audio is ready, false if it failed.
 */
export async function initAudio(): Promise<boolean> {
  try {
    const Tone = await getTone();
    await Tone.start();
    Tone.getTransport().bpm.value = currentBPM;
    audioReady = true;
    return true;
  } catch (err) {
    console.error('[AudioEngine] Failed to initialize audio:', err);
    audioReady = false;
    return false;
  }
}

/**
 * Set the global BPM for the Tone.js Transport.
 */
export async function setBPM(bpm: number): Promise<void> {
  currentBPM = Math.max(30, Math.min(300, bpm));
  try {
    const Tone = await getTone();
    Tone.getTransport().bpm.value = currentBPM;
  } catch {
    // Transport not ready yet, BPM will be applied on init
  }
}

/**
 * Get the current BPM value.
 */
export function getBPM(): number {
  return currentBPM;
}

/**
 * Start the Tone.js Transport (global timeline).
 */
export async function startTransport(): Promise<void> {
  const Tone = await getTone();
  if (!audioReady) {
    await initAudio();
  }
  Tone.getTransport().start();
}

/**
 * Stop the Tone.js Transport and reset position.
 */
export async function stopTransport(): Promise<void> {
  const Tone = await getTone();
  Tone.getTransport().stop();
  Tone.getTransport().position = 0;
}

/**
 * Check whether the audio engine has been initialized.
 */
export function isReady(): boolean {
  return audioReady;
}
