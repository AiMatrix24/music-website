'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Mode = 'select' | 'attribution' | 'ticket';
type CameraStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'error';
type GeoStatus = 'idle' | 'requesting' | 'verified' | 'denied' | 'error';
type ScanResult = {
  creatorId?: string;
  creatorName?: string;
  facilitatorId?: string;
  eventId?: string;
  context?: 'pre_show' | 'during_show' | 'post_show';
  raw: string;
};

export default function ScanPage() {
  const [mode, setMode] = useState<Mode>('select');
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [ticketToken, setTicketToken] = useState('');
  const [ticketResult, setTicketResult] = useState<{
    valid: boolean;
    eventTitle?: string;
    attendeeName?: string;
    ticketType?: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameLoopRef = useRef<number | null>(null);

  // ─── Camera Management ───
  const stopCamera = useCallback(() => {
    if (frameLoopRef.current) {
      cancelAnimationFrame(frameLoopRef.current);
      frameLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraStatus('active');

      // Start frame capture loop (for future QR processing)
      const captureFrame = () => {
        if (videoRef.current && canvasRef.current && streamRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              // Frame is now on canvas -- a QR library could process ctx.getImageData() here
            }
          }
        }
        frameLoopRef.current = requestAnimationFrame(captureFrame);
      };
      frameLoopRef.current = requestAnimationFrame(captureFrame);
    } catch (err) {
      const error = err as Error;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
      } else {
        setCameraStatus('error');
      }
    }
  }, []);

  // Cleanup on unmount or mode change
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // ─── Geolocation ───
  const requestGeo = useCallback(() => {
    setGeoStatus('requesting');
    if (!navigator.geolocation) {
      setGeoStatus('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setGeoStatus('verified'),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setGeoStatus('denied');
        else setGeoStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ─── Parse QR / Manual Code ───
  const parseAttributionCode = useCallback((raw: string) => {
    try {
      const url = new URL(raw);
      const result: ScanResult = {
        raw,
        creatorId: url.searchParams.get('creatorId') || undefined,
        creatorName: url.searchParams.get('creatorName') || url.searchParams.get('creator') || undefined,
        facilitatorId: url.searchParams.get('facilitatorId') || undefined,
        eventId: url.searchParams.get('eventId') || undefined,
        context: (url.searchParams.get('context') as ScanResult['context']) || undefined,
      };
      setScanResult(result);
      stopCamera();
    } catch {
      // Try as plain params: creatorId=x&facilitatorId=y...
      const params = new URLSearchParams(raw);
      if (params.get('creatorId') || params.get('facilitatorId')) {
        setScanResult({
          raw,
          creatorId: params.get('creatorId') || undefined,
          creatorName: params.get('creatorName') || params.get('creator') || undefined,
          facilitatorId: params.get('facilitatorId') || undefined,
          eventId: params.get('eventId') || undefined,
          context: (params.get('context') as ScanResult['context']) || undefined,
        });
        stopCamera();
      } else {
        // Treat as opaque code
        setScanResult({ raw, creatorId: raw });
        stopCamera();
      }
    }
  }, [stopCamera]);

  // ─── Ticket Validation ───
  const handleValidateTicket = async () => {
    if (!ticketToken.trim()) return;
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/trpc/tickets.validate?input=${encodeURIComponent(JSON.stringify({ qrToken: ticketToken.trim() }))}`);
      const json = await res.json();
      const data = json?.result?.data;
      if (data?.valid) {
        setTicketResult({
          valid: true,
          eventTitle: data.eventTitle || 'Event',
          attendeeName: data.attendeeName || 'Attendee',
          ticketType: data.ticketType || 'General',
        });
      } else {
        setTicketResult({ valid: false });
      }
    } catch {
      setTicketResult({ valid: false });
    }
    setIsVerifying(false);
    stopCamera();
  };

  // ─── Reset ───
  const resetAll = useCallback(() => {
    stopCamera();
    setCameraStatus('idle');
    setScanResult(null);
    setManualCode('');
    setTicketToken('');
    setTicketResult(null);
    setIsVerifying(false);
  }, [stopCamera]);

  const goBack = useCallback(() => {
    resetAll();
    setMode('select');
  }, [resetAll]);

  // ─── Context label helper ───
  const contextLabel = (ctx?: string) => {
    switch (ctx) {
      case 'pre_show': return 'Pre-Show';
      case 'during_show': return 'During Show';
      case 'post_show': return 'Post-Show';
      default: return ctx || 'Unknown';
    }
  };

  // ─── Mode Selection ───
  if (mode === 'select') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Scan</h1>
        <p className="text-gray-400 mb-10 max-w-sm">Choose what you want to scan.</p>

        <div className="w-full max-w-md space-y-4">
          <button
            onClick={() => { resetAll(); setMode('ticket'); }}
            className="w-full rounded-2xl bg-[#15151f] border-2 border-transparent hover:border-red-600/30 p-6 text-left transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-2xl shrink-0">
                🎟️
              </div>
              <div>
                <h3 className="font-bold text-lg">Validate Ticket</h3>
                <p className="text-sm text-gray-400">Scan QR code at event entry for check-in</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { resetAll(); setMode('attribution'); }}
            className="w-full rounded-2xl bg-[#15151f] border-2 border-transparent hover:border-red-600/30 p-6 text-left transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-600 to-purple-800 flex items-center justify-center text-2xl shrink-0">
                📷
              </div>
              <div>
                <h3 className="font-bold text-lg">Attribution Scan</h3>
                <p className="text-sm text-gray-400">Scan facilitator badge to attribute fan connection</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ─── Camera + Manual Fallback UI (shared) ───
  const CameraView = ({ onManualSubmit, manualValue, setManualValue, manualPlaceholder }: {
    onManualSubmit: () => void;
    manualValue: string;
    setManualValue: (v: string) => void;
    manualPlaceholder: string;
  }) => (
    <div className="w-full max-w-sm">
      {/* Camera Feed */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-black border-2 border-red-600/30 mb-4">
        {cameraStatus === 'active' && (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-red-400/80 rounded-lg">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-500 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-500 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-500 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-500 rounded-br-lg" />
              </div>
              {/* Scan line animation */}
              <div className="absolute left-1/2 -translate-x-1/2 w-44 h-0.5 bg-red-500/60 animate-bounce" />
            </div>
            <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/70">
              Point camera at QR code
            </p>
          </>
        )}

        {cameraStatus === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <div className="text-4xl mb-3">📷</div>
            <p className="text-gray-400 text-sm mb-4">Camera not started</p>
            <button
              onClick={startCamera}
              className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition"
            >
              Open Camera
            </button>
          </div>
        )}

        {cameraStatus === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-gray-400 text-sm">Requesting camera access...</p>
          </div>
        )}

        {cameraStatus === 'denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="text-4xl mb-3">🚫</div>
            <p className="text-red-400 font-semibold mb-2">Camera Access Denied</p>
            <p className="text-gray-500 text-xs mb-4">
              Please allow camera access in your browser settings, then reload the page.
            </p>
            <button
              onClick={startCamera}
              className="rounded-full bg-[#15151f] border border-white/10 px-5 py-2 text-sm text-gray-300 hover:border-red-600/40 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {cameraStatus === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-yellow-400 font-semibold mb-2">Camera Error</p>
            <p className="text-gray-500 text-xs mb-4">
              Could not access camera. Make sure no other app is using it.
            </p>
            <button
              onClick={startCamera}
              className="rounded-full bg-[#15151f] border border-white/10 px-5 py-2 text-sm text-gray-300 hover:border-red-600/40 transition"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Hidden canvas for frame processing */}
      <canvas ref={canvasRef} className="hidden" />

      {cameraStatus === 'active' && (
        <button
          onClick={stopCamera}
          className="w-full rounded-full border border-white/20 py-3 text-sm font-semibold text-white mb-4 hover:border-red-600/40 transition"
        >
          Stop Camera
        </button>
      )}

      {/* Manual Fallback */}
      <div className="text-gray-500 text-xs text-center mb-3">-- or enter code manually --</div>
      <div className="flex gap-2">
        <input
          type="text"
          value={manualValue}
          onChange={(e) => setManualValue(e.target.value)}
          placeholder={manualPlaceholder}
          className="flex-1 bg-[#15151f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-500 outline-none transition text-sm"
        />
        <button
          onClick={onManualSubmit}
          disabled={!manualValue.trim()}
          className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white disabled:opacity-40 hover:bg-red-700 transition"
        >
          Go
        </button>
      </div>
    </div>
  );

  // ─── Attribution Mode ───
  if (mode === 'attribution') {
    return (
      <div className="min-h-screen flex flex-col items-center p-6 pt-12">
        <button onClick={goBack} className="text-sm text-gray-400 hover:text-white transition mb-6 self-start">
          ← Back
        </button>

        <h1 className="text-2xl font-bold mb-1 text-center">Attribution Scan</h1>
        <p className="text-gray-400 mb-6 max-w-sm text-center text-sm">
          Point your camera at the Facilitator&apos;s QR badge or enter the code manually.
        </p>

        {/* Geo Status */}
        <div className="w-full max-w-sm mb-4">
          {geoStatus === 'idle' && (
            <button
              onClick={requestGeo}
              className="w-full rounded-lg bg-[#15151f] border border-white/10 p-3 text-left hover:border-red-600/30 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">📍</span>
                <div>
                  <p className="text-sm font-medium">Enable Location</p>
                  <p className="text-xs text-gray-500">We need your location to verify you&apos;re at the venue</p>
                </div>
              </div>
            </button>
          )}
          {geoStatus === 'requesting' && (
            <div className="rounded-lg bg-[#15151f] border border-white/10 p-3 flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Requesting location...</p>
            </div>
          )}
          {geoStatus === 'verified' && (
            <div className="rounded-lg bg-green-600/10 border border-green-600/20 p-3 flex items-center gap-3">
              <span className="text-lg">✅</span>
              <p className="text-sm text-green-400 font-medium">Location verified</p>
            </div>
          )}
          {geoStatus === 'denied' && (
            <div className="rounded-lg bg-yellow-600/10 border border-yellow-600/20 p-3 flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="text-sm text-yellow-400 font-medium">Location not verified</p>
                <p className="text-xs text-gray-500">Attribution will still work, but cannot be geo-verified</p>
              </div>
            </div>
          )}
          {geoStatus === 'error' && (
            <div className="rounded-lg bg-red-600/10 border border-red-600/20 p-3 flex items-center gap-3">
              <span className="text-lg">❌</span>
              <p className="text-sm text-red-400">Location error. Scan will proceed without geo-verification.</p>
            </div>
          )}
        </div>

        {/* Show result or camera */}
        {scanResult ? (
          <div className="w-full max-w-sm">
            <div className="rounded-2xl bg-[#15151f] border border-green-600/20 p-6 mb-6">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">✓</div>
                <h2 className="text-xl font-bold text-green-400">Scan Decoded</h2>
              </div>
              <div className="space-y-3 text-sm">
                {scanResult.creatorName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Creator</span>
                    <span className="font-semibold">{scanResult.creatorName}</span>
                  </div>
                )}
                {scanResult.creatorId && !scanResult.creatorName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Creator ID</span>
                    <span className="font-mono text-xs">{scanResult.creatorId}</span>
                  </div>
                )}
                {scanResult.facilitatorId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Facilitator</span>
                    <span className="font-mono text-xs">{scanResult.facilitatorId}</span>
                  </div>
                )}
                {scanResult.eventId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Event</span>
                    <span className="font-mono text-xs">{scanResult.eventId}</span>
                  </div>
                )}
                {scanResult.context && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Context</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      scanResult.context === 'during_show' ? 'bg-red-600/20 text-red-400' :
                      scanResult.context === 'pre_show' ? 'bg-blue-600/20 text-blue-400' :
                      'bg-purple-600/20 text-purple-400'
                    }`}>{contextLabel(scanResult.context)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Geo</span>
                  <span className={geoStatus === 'verified' ? 'text-green-400' : 'text-yellow-400'}>
                    {geoStatus === 'verified' ? 'Verified ✅' : 'Not verified'}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href={scanResult.creatorId ? `/subscribe?artist=${scanResult.creatorId}` : '/subscribe'}
              className="block w-full rounded-full bg-red-600 py-4 font-semibold text-white text-center hover:bg-red-700 transition mb-3"
            >
              Subscribe to this Artist
            </Link>
            <button
              onClick={resetAll}
              className="w-full rounded-full border border-white/20 py-3 text-sm font-semibold text-white hover:border-red-600/40 transition"
            >
              Scan Another
            </button>
          </div>
        ) : (
          <CameraView
            onManualSubmit={() => { if (manualCode.trim()) parseAttributionCode(manualCode.trim()); }}
            manualValue={manualCode}
            setManualValue={setManualCode}
            manualPlaceholder="Paste QR URL or code..."
          />
        )}
      </div>
    );
  }

  // ─── Ticket Validation Mode ───
  return (
    <div className="min-h-screen flex flex-col items-center p-6 pt-12">
      <button onClick={goBack} className="text-sm text-gray-400 hover:text-white transition mb-6 self-start">
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-1 text-center">Validate Ticket</h1>
      <p className="text-gray-400 mb-6 max-w-sm text-center text-sm">
        Scan or enter the QR code to verify a ticket at the door.
      </p>

      {isVerifying && (
        <div className="text-center mb-6">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Validating ticket...</p>
        </div>
      )}

      {ticketResult && !isVerifying && (
        <div className="w-full max-w-sm mb-6">
          {ticketResult.valid ? (
            <div className="rounded-2xl bg-green-600/10 border-2 border-green-500/30 p-8 text-center">
              <div className="text-5xl mb-3">✅</div>
              <h2 className="text-2xl font-black text-green-400 mb-2">VALID TICKET</h2>
              <p className="text-gray-300 font-semibold">{ticketResult.eventTitle}</p>
              <p className="text-sm text-gray-400 mt-1">{ticketResult.attendeeName}</p>
              <div className="mt-3 inline-block bg-green-600/20 text-green-400 text-xs px-3 py-1 rounded-full font-semibold">
                {ticketResult.ticketType} &middot; Checked In
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-red-600/10 border-2 border-red-500/30 p-8 text-center">
              <div className="text-5xl mb-3">❌</div>
              <h2 className="text-2xl font-black text-red-400 mb-2">INVALID TICKET</h2>
              <p className="text-sm text-gray-400">
                This ticket is not valid. It may be expired, already used, or forged.
              </p>
            </div>
          )}
          <button
            onClick={resetAll}
            className="w-full rounded-full bg-red-600 py-4 font-semibold text-white mt-4 hover:bg-red-700 transition"
          >
            Scan Next Ticket
          </button>
        </div>
      )}

      {!ticketResult && !isVerifying && (
        <CameraView
          onManualSubmit={handleValidateTicket}
          manualValue={ticketToken}
          setManualValue={setTicketToken}
          manualPlaceholder="Enter ticket QR token..."
        />
      )}
    </div>
  );
}
