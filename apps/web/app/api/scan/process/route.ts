import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/scan/process
 *
 * Processes a QR scan for attribution. In production, this would enqueue
 * the scan into BullMQ's scanProcessingQueue for async processing.
 * For now, processes inline but is structured for async migration.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creatorId, facilitatorId, eventId, context, signature, userLat, userLng } = body;

    // Validate required fields
    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId required' }, { status: 400 });
    }

    // TODO: In production, queue this instead of processing inline:
    // await scanProcessingQueue.add('process-scan', { ...body, userId: session.user.id });
    // return NextResponse.json({ status: 'queued', message: 'Scan is being processed' });

    // For now, process inline
    const { verifyQRSignature } = await import('@/lib/services/qr-generator');
    const { recordAttribution } = await import('@/lib/services/attribution');

    // Verify QR signature
    if (signature) {
      const verification = verifyQRSignature({
        creatorId,
        facilitatorId,
        eventId,
        context: context ?? 'during_show',
        timestamp: Math.floor(Date.now() / 1000),
        signature,
      });

      if (!verification.valid) {
        return NextResponse.json({ error: 'Invalid QR code' }, { status: 403 });
      }
      if (verification.expired) {
        return NextResponse.json({ error: 'QR code expired' }, { status: 410 });
      }
    }

    // Verify geofence if coordinates provided
    let geoVerified = false;
    if (userLat && userLng) {
      const { verifyGeofence } = await import('@/lib/services/geofence');
      // TODO: Look up venue coordinates from DB using eventId
      // For now, mark as verified if coordinates were provided
      geoVerified = true;
    }

    // Record attribution
    const result = await recordAttribution({
      userId: 'anonymous', // TODO: Get from session
      creatorId,
      facilitatorId,
      eventId,
      geoVerified,
      totpVerified: false,
      qrContext: context ?? 'during_show',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ScanProcess] Error:', error);
    return NextResponse.json({ error: 'Scan processing failed' }, { status: 500 });
  }
}
