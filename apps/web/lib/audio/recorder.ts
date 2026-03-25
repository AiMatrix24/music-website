/**
 * MediaRecorder wrapper for audio recording.
 */

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;

  /** Optional callback for live waveform data as recording progresses. */
  onDataAvailable?: (data: Uint8Array) => void;

  /**
   * Request microphone access and start recording.
   */
  async start(): Promise<void> {
    this.chunks = [];

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

    this.mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);

        // Provide raw bytes to the live waveform callback
        if (this.onDataAvailable) {
          const arrayBuffer = await event.data.arrayBuffer();
          this.onDataAvailable(new Uint8Array(arrayBuffer));
        }
      }
    };

    // Request data every 100ms for responsive waveform
    this.mediaRecorder.start(100);
  }

  /**
   * Pause the current recording.
   */
  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  /**
   * Resume a paused recording.
   */
  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  /**
   * Stop the recording and return the recorded audio as a Blob.
   */
  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mediaRecorder?.mimeType ?? 'audio/webm' });
        this.chunks = [];

        // Release mic
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }

        resolve(blob);
      };

      this.mediaRecorder.onerror = (event) => {
        reject(new Error(`MediaRecorder error: ${(event as ErrorEvent).message ?? 'unknown'}`));
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Get the current state of the recorder.
   */
  getState(): 'inactive' | 'recording' | 'paused' {
    if (!this.mediaRecorder) return 'inactive';
    return this.mediaRecorder.state as 'inactive' | 'recording' | 'paused';
  }
}
