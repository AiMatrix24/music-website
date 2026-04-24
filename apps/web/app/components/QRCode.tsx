'use client';

import { useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';

/**
 * Renders a real scannable QR code as an <img> tag (data URL).
 * Uses the `qrcode` library to generate PNG on the client — no server call,
 * instant render. Max 2953 bytes of data per QR (alphanumeric) or ~400 chars
 * for mixed content at high error correction.
 *
 * Error correction levels:
 *   L — recovers 7%, smallest QR (default — fine for plain tokens)
 *   M — 15%
 *   Q — 25%
 *   H — 30%, largest QR (use if the QR might be printed + scuffed)
 */
export function QRCode({
  value,
  size = 256,
  errorCorrectionLevel = 'M',
  className = '',
}: {
  value: string;
  size?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  className?: string;
}) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setDataUrl('');
      return;
    }
    QRCodeLib.toDataURL(value, {
      errorCorrectionLevel,
      margin: 2,
      width: size,
      color: {
        dark: '#0a0a0f', // near-black — reads well on white background
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'QR generation failed');
      });
    return () => {
      cancelled = true;
    };
  }, [value, size, errorCorrectionLevel]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-red-950/20 border border-red-800/30 rounded-lg text-xs text-red-400 ${className}`}
        style={{ width: size, height: size }}
      >
        QR error: {error}
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        className={`animate-pulse bg-gray-200 rounded-lg ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt="QR code"
      width={size}
      height={size}
      className={className}
    />
  );
}
