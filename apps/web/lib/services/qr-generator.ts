import crypto from 'crypto';

const QR_SECRET = process.env.QR_HMAC_SECRET ?? 'opynx-qr-secret-change-me';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://opynx.com';

interface QRParams {
  creatorId: string;
  facilitatorId?: string;
  eventId?: string;
  context: 'pre_show' | 'during_show' | 'post_show';
}

// Generate HMAC signature for QR data
function generateSignature(data: string): string {
  return crypto.createHmac('sha256', QR_SECRET).update(data).digest('hex').slice(0, 16);
}

// Generate a scannable QR URL with HMAC
export function generateQRUrl(params: QRParams): string {
  const timestamp = Math.floor(Date.now() / 1000);
  // Rotate every 15 minutes
  const rotationBucket = Math.floor(timestamp / 900);
  const dataString = `${params.creatorId}:${params.facilitatorId ?? ''}:${params.eventId ?? ''}:${params.context}:${rotationBucket}`;
  const sig = generateSignature(dataString);

  const url = new URL(`${BASE_URL}/scan/attr`);
  url.searchParams.set('c', params.creatorId);
  if (params.facilitatorId) url.searchParams.set('f', params.facilitatorId);
  if (params.eventId) url.searchParams.set('e', params.eventId);
  url.searchParams.set('t', String(timestamp));
  url.searchParams.set('ctx', params.context);
  url.searchParams.set('sig', sig);

  return url.toString();
}

// Verify a scanned QR URL's HMAC signature
export function verifyQRSignature(params: {
  creatorId: string;
  facilitatorId?: string;
  eventId?: string;
  context: string;
  timestamp: number;
  signature: string;
}): { valid: boolean; expired: boolean } {
  const rotationBucket = Math.floor(params.timestamp / 900);
  const currentBucket = Math.floor(Date.now() / 1000 / 900);

  // QR codes expire after 2 rotation periods (30 minutes)
  const expired = currentBucket - rotationBucket > 2;

  const dataString = `${params.creatorId}:${params.facilitatorId ?? ''}:${params.eventId ?? ''}:${params.context}:${rotationBucket}`;
  const expectedSig = generateSignature(dataString);
  const valid = params.signature === expectedSig;

  return { valid, expired };
}
