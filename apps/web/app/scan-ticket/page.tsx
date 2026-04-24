'use client';

import { trpc } from '@/lib/trpc/client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useToast } from '@/app/components/Toast';

const SCANNER_DIV_ID = 'opynx-ticket-scanner';

type ScanResult =
  | { kind: 'success'; alreadyCheckedIn: boolean; eventTitle: string; checkedInAt: Date | null }
  | { kind: 'error'; message: string };

type GpsState =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'ok'; lat: number; lng: number; accuracy: number; capturedAt: number }
  | { status: 'denied' }
  | { status: 'error'; message: string };

export default function ScanTicketPage() {
  const { status: sessionStatus } = useSession();
  const { toast } = useToast();
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [manualToken, setManualToken] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [gps, setGps] = useState<GpsState>({ status: 'idle' });
  const scannerRef = useRef<unknown>(null);
  const isMountedRef = useRef(true);
  const processingRef = useRef(false); // prevent double-scans from rapid camera callbacks

  const checkInMutation = trpc.tickets.checkIn.useMutation();

  // Re-capture GPS if last reading is older than 60s — coordinates can stale
  // out over the course of an event, especially indoors.
  const captureGps = (): Promise<{ lat: number; lng: number; accuracy: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setGps({ status: 'error', message: 'Geolocation not supported by browser' });
        resolve(null);
        return;
      }
      // If we have a fresh reading (<60s), reuse it
      if (gps.status === 'ok' && Date.now() - gps.capturedAt < 60_000) {
        resolve({ lat: gps.lat, lng: gps.lng, accuracy: gps.accuracy });
        return;
      }
      setGps({ status: 'requesting' });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const reading = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setGps({ ...reading, status: 'ok', capturedAt: Date.now() });
          resolve(reading);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setGps({ status: 'denied' });
          } else {
            setGps({ status: 'error', message: err.message });
          }
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30_000 }
      );
    });
  };

  const handleToken = async (token: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      // Best-effort GPS capture — if event isn't geofence-enforced the
      // backend ignores these fields; if it IS enforced and GPS fails,
      // the backend returns a "GPS required" error that lands in result.
      const reading = await captureGps();
      const res = await checkInMutation.mutateAsync({
        qrToken: token,
        scannerLat: reading?.lat,
        scannerLng: reading?.lng,
        scannerAccuracyMeters: reading?.accuracy,
      });
      if (!isMountedRef.current) return;
      setResult({
        kind: 'success',
        alreadyCheckedIn: res.alreadyCheckedIn,
        eventTitle: res.event?.title ?? 'Event',
        checkedInAt: res.checkedIn ? new Date(res.checkedIn) : null,
      });
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setResult({ kind: 'error', message: err?.message || 'Check-in failed' });
    } finally {
      processingRef.current = false;
    }
  };

  // Initialize camera scanner
  useEffect(() => {
    isMountedRef.current = true;
    if (mode !== 'camera' || sessionStatus !== 'authenticated' || result) {
      return;
    }

    let scanner: any = null;
    let cancelled = false;

    (async () => {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode');
        if (cancelled) return;
        scanner = new Html5QrcodeScanner(
          SCANNER_DIV_ID,
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true,
          },
          /* verbose */ false
        );
        scannerRef.current = scanner;
        scanner.render(
          (decodedText: string) => {
            if (!isMountedRef.current) return;
            handleToken(decodedText);
          },
          () => {
            /* per-frame scan errors are normal — ignore */
          }
        );
      } catch (err: any) {
        setCameraError(err?.message || 'Failed to start camera — try manual entry');
      }
    })();

    return () => {
      cancelled = true;
      isMountedRef.current = false;
      if (scanner) {
        try {
          scanner.clear();
        } catch {
          /* library sometimes throws on cleanup — safe to ignore */
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, sessionStatus, result]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      handleToken(manualToken.trim());
    }
  };

  const reset = () => {
    setResult(null);
    setManualToken('');
    setCameraError('');
  };

  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading…</div>
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-5xl mb-2">🎫</p>
        <h1 className="text-2xl font-bold">Sign in to scan tickets</h1>
        <p className="text-gray-400 text-sm text-center max-w-sm">
          Only the event host can check attendees in.
        </p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  // ── Scan result state ──
  if (result) {
    const isSuccess = result.kind === 'success';
    const isReScan = isSuccess && result.alreadyCheckedIn;
    return (
      <div className="min-h-screen py-16 px-6">
        <div className="max-w-lg mx-auto">
          <div
            className={`rounded-2xl p-8 text-center ${
              isSuccess && !isReScan
                ? 'bg-green-900/30 border-2 border-green-500'
                : isReScan
                  ? 'bg-amber-900/30 border-2 border-amber-500'
                  : 'bg-red-900/30 border-2 border-red-500'
            }`}
          >
            <div className="text-7xl mb-4">
              {isSuccess && !isReScan ? '✅' : isReScan ? '⚠️' : '❌'}
            </div>
            <h1
              className={`text-3xl font-black mb-2 ${
                isSuccess && !isReScan
                  ? 'text-green-400'
                  : isReScan
                    ? 'text-amber-400'
                    : 'text-red-400'
              }`}
            >
              {isSuccess && !isReScan && 'CHECKED IN'}
              {isReScan && 'ALREADY USED'}
              {!isSuccess && 'INVALID'}
            </h1>
            {isSuccess && (
              <>
                <p className="text-lg font-semibold mb-2">{result.eventTitle}</p>
                {isReScan && result.checkedInAt && (
                  <p className="text-sm text-amber-300">
                    Checked in at {result.checkedInAt.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                )}
                {!isReScan && (
                  <p className="text-sm text-green-300">Entry granted — welcome in!</p>
                )}
              </>
            )}
            {!isSuccess && (
              <p className="text-sm text-gray-300 mt-2">{result.message}</p>
            )}
            <button
              onClick={reset}
              className="mt-6 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition"
            >
              Scan next ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Scanner UI ──
  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-lg mx-auto">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-6 inline-block">
          ← Dashboard
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">Ticket Scanner</h1>
          <p className="text-gray-400 text-sm">Scan a ticket QR code to check in attendees.</p>
        </div>

        {/* GPS status (shown only if geo capture has been attempted) */}
        {gps.status !== 'idle' && (
          <div
            className={`mb-4 rounded-lg px-3 py-2 text-xs flex items-center gap-2 ${
              gps.status === 'ok'
                ? 'bg-green-950/30 border border-green-800/30 text-green-300'
                : gps.status === 'requesting'
                  ? 'bg-blue-950/30 border border-blue-800/30 text-blue-300'
                  : 'bg-amber-950/30 border border-amber-800/30 text-amber-300'
            }`}
          >
            <span>📍</span>
            {gps.status === 'requesting' && 'Getting location…'}
            {gps.status === 'ok' && (
              <span>
                Location ready · ±{Math.round(gps.accuracy)}m accuracy
              </span>
            )}
            {gps.status === 'denied' && 'Location permission denied — geofenced events will reject check-ins'}
            {gps.status === 'error' && `Location error: ${gps.message}`}
          </div>
        )}

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setMode('camera'); reset(); }}
            className={`flex-1 py-3 rounded-full text-sm font-semibold transition ${
              mode === 'camera'
                ? 'bg-red-600 text-white'
                : 'bg-[#15151f] text-gray-400 hover:text-white'
            }`}
          >
            📷 Camera
          </button>
          <button
            onClick={() => { setMode('manual'); reset(); }}
            className={`flex-1 py-3 rounded-full text-sm font-semibold transition ${
              mode === 'manual'
                ? 'bg-red-600 text-white'
                : 'bg-[#15151f] text-gray-400 hover:text-white'
            }`}
          >
            ⌨ Manual
          </button>
        </div>

        {mode === 'camera' ? (
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-4">
            {cameraError && (
              <div className="mb-4 rounded-lg bg-red-950/30 border border-red-800/30 p-3 text-sm text-red-300">
                {cameraError}
              </div>
            )}
            {checkInMutation.isPending && (
              <div className="mb-4 rounded-lg bg-blue-950/30 border border-blue-800/30 p-3 text-sm text-blue-300 animate-pulse text-center">
                Verifying ticket…
              </div>
            )}
            <div id={SCANNER_DIV_ID} className="scanner-container" />
            <p className="text-xs text-gray-500 text-center mt-3">
              Point your camera at the attendee&apos;s QR code. Works best in bright light.
            </p>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <label className="block text-sm font-semibold mb-2">Ticket code</label>
              <input
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="opynx_ticket_…"
                className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 focus:outline-none transition font-mono text-sm"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Paste the token printed under the attendee&apos;s QR code.
              </p>
            </div>
            <button
              type="submit"
              disabled={!manualToken.trim() || checkInMutation.isPending}
              className="w-full rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-50 py-4 font-semibold text-white text-lg transition"
            >
              {checkInMutation.isPending ? 'Checking in…' : 'Check In'}
            </button>
          </form>
        )}

        {/* Info */}
        <div className="mt-8 rounded-xl bg-[#15151f] border border-brand-800/20 p-5">
          <h3 className="font-bold text-sm mb-2">How it works</h3>
          <ul className="text-xs text-gray-400 space-y-1.5">
            <li>• Only the event host can check tickets in (scanner is authorized by session)</li>
            <li>• A valid ticket flips from &ldquo;valid&rdquo; to &ldquo;used&rdquo; with a timestamp</li>
            <li>• Re-scanning a used ticket shows the original check-in time, no double entry</li>
            <li>• Cancelled or refunded tickets are rejected</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
