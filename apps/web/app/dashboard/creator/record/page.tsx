'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/app/components/Toast';

/* ── Types ── */
type RecordingStatus = 'ready' | 'recording' | 'paused' | 'saved';

const MOCK_DEVICES = [
  { id: 'built-in', label: 'Built-in Microphone' },
  { id: 'usb', label: 'USB Mic' },
  { id: 'interface', label: 'Audio Interface' },
];

const SOUNDBOARD: { id: string; label: string; emoji: string }[] = [
  { id: 'applause', label: 'Applause', emoji: '&#128079;' },
  { id: 'transition', label: 'Transition', emoji: '&#127926;' },
  { id: 'ding', label: 'Ding', emoji: '&#128276;' },
  { id: 'drum-roll', label: 'Drum Roll', emoji: '&#129345;' },
  { id: 'air-horn', label: 'Air Horn', emoji: '&#128226;' },
  { id: 'crickets', label: 'Crickets', emoji: '&#129431;' },
];

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function RecordPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const [device, setDevice] = useState('built-in');
  const [recStatus, setRecStatus] = useState<RecordingStatus>('ready');
  const [elapsed, setElapsed] = useState(0);
  const [autoDucking, setAutoDucking] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  /* ── Mock waveform for playback preview ── */
  const previewBars = useRef(
    Array.from({ length: 100 }, () => 10 + Math.random() * 70)
  ).current;

  /* ── Auth gate ── */
  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Sign in to use the recording studio</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Sign In</Link>
      </div>
    );
  }

  /* ── Timer logic ── */
  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  /* ── Recording controls ── */
  const handleRecord = () => {
    if (recStatus === 'ready' || recStatus === 'saved') {
      setElapsed(0);
      setRecStatus('recording');
      startTimer();
      startLevelAnimation();
    }
  };

  const handlePause = () => {
    if (recStatus === 'recording') {
      setRecStatus('paused');
      stopTimer();
      stopLevelAnimation();
    } else if (recStatus === 'paused') {
      setRecStatus('recording');
      startTimer();
      startLevelAnimation();
    }
  };

  const handleStop = () => {
    setRecStatus('saved');
    stopTimer();
    stopLevelAnimation();
    toast('Recording saved!', 'success');
  };

  const handleRestart = () => {
    setElapsed(0);
    setRecStatus('ready');
    stopTimer();
    stopLevelAnimation();
  };

  /* ── Level meter animation (CSS-driven mock) ── */
  const startLevelAnimation = () => {
    const animate = () => {
      if (levelRef.current) {
        const level = 30 + Math.random() * 60;
        levelRef.current.style.width = `${level}%`;
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
  };

  const stopLevelAnimation = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (levelRef.current) levelRef.current.style.width = '0%';
  };

  /* ── Soundboard ── */
  const playSFX = (label: string) => {
    toast(`Playing: ${label}`, 'info');
  };

  /* ── Invite link generator ── */
  const generateInviteLink = () => {
    const code = Math.random().toString(36).slice(2, 10).toUpperCase();
    setInviteLink(`https://opynx.com/studio/join/${code}`);
    toast('Invite link generated!', 'success');
  };

  /* ── Status badge ── */
  const statusColors: Record<RecordingStatus, string> = {
    ready: 'text-gray-400',
    recording: 'text-red-500',
    paused: 'text-yellow-400',
    saved: 'text-green-400',
  };
  const statusLabels: Record<RecordingStatus, string> = {
    ready: 'Ready',
    recording: 'Recording...',
    paused: 'Paused',
    saved: 'Saved',
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back + Hero */}
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">
          &larr; Dashboard
        </Link>
        <div className="text-center mb-10">
          <span className="text-5xl mb-4 block">&#127908;</span>
          <h1 className="text-3xl md:text-4xl font-black mb-2">Recording Studio</h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Record vocals, podcasts, and voiceovers right from your browser.
          </p>
        </div>

        {/* Input Device */}
        <div className="bg-[#15151f] rounded-2xl p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-300 mb-2">Input Device</label>
          <select
            value={device}
            onChange={(e) => setDevice(e.target.value)}
            className="w-full bg-brand-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            {MOCK_DEVICES.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* Record Button + Level Meter + Timer */}
        <div className="bg-[#15151f] rounded-2xl p-8 mb-6 flex flex-col items-center">
          {/* Status */}
          <p className={`text-sm font-semibold mb-4 ${statusColors[recStatus]}`}>
            {statusLabels[recStatus]}
          </p>

          {/* Big Record Button */}
          <button
            onClick={handleRecord}
            disabled={recStatus === 'recording' || recStatus === 'paused'}
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all mb-6 ${
              recStatus === 'recording'
                ? 'bg-red-600 animate-pulse shadow-lg shadow-red-600/40'
                : recStatus === 'paused'
                  ? 'bg-red-600/60'
                  : 'bg-red-600 hover:bg-red-700 hover:scale-105'
            } disabled:cursor-default`}
          >
            <div className={`rounded-full bg-white ${recStatus === 'recording' ? 'w-8 h-8 rounded-sm' : 'w-10 h-10'}`} />
          </button>

          {/* Timer */}
          <p className="text-3xl font-mono text-white mb-6">{formatTimer(elapsed)}</p>

          {/* Level Meter */}
          <div className="w-full max-w-md h-4 bg-brand-950 rounded-full overflow-hidden mb-6">
            <div
              ref={levelRef}
              className="h-full rounded-full bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 transition-[width] duration-75"
              style={{ width: '0%' }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {(recStatus === 'recording' || recStatus === 'paused') && (
              <>
                <button
                  onClick={handlePause}
                  className="px-5 py-2.5 rounded-xl bg-brand-950 border border-gray-700 text-gray-300 hover:text-white text-sm font-semibold transition"
                >
                  {recStatus === 'paused' ? '&#9654; Resume' : '&#9646;&#9646; Pause'}
                </button>
                <button
                  onClick={handleStop}
                  className="px-5 py-2.5 rounded-xl bg-brand-950 border border-gray-700 text-gray-300 hover:text-white text-sm font-semibold transition"
                >
                  &#9632; Stop
                </button>
              </>
            )}
            {recStatus === 'saved' && (
              <button
                onClick={handleRestart}
                className="px-5 py-2.5 rounded-xl bg-brand-950 border border-gray-700 text-gray-300 hover:text-white text-sm font-semibold transition"
              >
                &#8635; Restart
              </button>
            )}
          </div>
        </div>

        {/* Soundboard */}
        <div className="bg-[#15151f] rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Soundboard</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {SOUNDBOARD.map((sfx) => (
              <button
                key={sfx.id}
                onClick={() => playSFX(sfx.label)}
                className="bg-brand-950 border border-gray-700 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-gray-500 hover:bg-gray-800 transition"
              >
                <span className="text-2xl" dangerouslySetInnerHTML={{ __html: sfx.emoji }} />
                <span className="text-xs text-gray-400">{sfx.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Auto-ducking */}
        <div className="bg-[#15151f] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">Auto-ducking</p>
              <p className="text-xs text-gray-500">Background music dips when voice detected</p>
            </div>
            <button
              onClick={() => setAutoDucking(!autoDucking)}
              className={`relative w-12 h-7 rounded-full transition ${autoDucking ? 'bg-red-600' : 'bg-gray-700'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                  autoDucking ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* After recording: preview + actions */}
        {recStatus === 'saved' && (
          <div className="bg-[#15151f] rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Recording Preview</h2>
            <div className="flex items-end gap-[1px] h-20 mb-4">
              {previewBars.map((h, i) => (
                <div key={i} className="flex-1 bg-red-500 rounded-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
            <p className="text-sm text-gray-400 mb-4">Duration: {formatTimer(elapsed)}</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => toast('Recording uploaded!', 'success')}
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 transition"
              >
                Save &amp; Upload
              </button>
              <button
                onClick={handleRestart}
                className="rounded-xl bg-brand-950 border border-gray-700 text-gray-300 hover:text-white font-semibold px-6 py-3 transition"
              >
                Re-record
              </button>
              <Link
                href="/dashboard/creator/editor"
                className="rounded-xl bg-brand-950 border border-gray-700 text-gray-300 hover:text-white font-semibold px-6 py-3 transition inline-flex items-center"
              >
                Edit in Audio Editor &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Remote Guest */}
        <div className="bg-[#15151f] rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-2">Remote Guest</h2>
          <p className="text-sm text-gray-400 mb-4">Invite a guest to record together in real-time.</p>
          {inviteLink ? (
            <div className="flex items-center gap-3">
              <input
                readOnly
                value={inviteLink}
                className="flex-1 bg-brand-950 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm font-mono"
              />
              <button
                onClick={() => { navigator.clipboard?.writeText(inviteLink); toast('Link copied!', 'success'); }}
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-3 transition text-sm"
              >
                Copy
              </button>
            </div>
          ) : (
            <button
              onClick={generateInviteLink}
              className="rounded-xl bg-brand-950 border border-gray-700 text-gray-300 hover:text-white font-semibold px-6 py-3 transition"
            >
              Generate Invite Link
            </button>
          )}
        </div>

        {/* Max session notice */}
        <p className="text-center text-xs text-gray-500">
          &#9200; Max session: 4 hours
        </p>
      </div>
    </div>
  );
}
