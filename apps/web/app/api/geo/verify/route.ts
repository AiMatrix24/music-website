import { NextRequest, NextResponse } from 'next/server';
import { db, venues } from '@opynx/db';
import { eq } from 'drizzle-orm';
import { verifyGeofence, sanitizeForStorage } from '@/lib/services/geofence';

/**
 * POST /api/geo/verify
 *
 * Accepts { userLat, userLng, venueId } and returns the geofence verification result.
 * Looks up the venue's lat/lng and geofence radius from the database.
 *
 * GDPR: Raw GPS coordinates are never persisted. Only the boolean result
 * and confidence level are returned (and optionally stored).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userLat, userLng, venueId } = body;

    // Validate required fields
    if (typeof userLat !== 'number' || typeof userLng !== 'number') {
      return NextResponse.json(
        { error: 'userLat and userLng must be numbers' },
        { status: 400 }
      );
    }

    if (!venueId || typeof venueId !== 'string') {
      return NextResponse.json(
        { error: 'venueId is required' },
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    if (userLat < -90 || userLat > 90 || userLng < -180 || userLng > 180) {
      return NextResponse.json(
        { error: 'Coordinates out of valid range' },
        { status: 400 }
      );
    }

    // Look up venue from database
    const venue = await db.query.venues.findFirst({
      where: eq(venues.id, venueId),
    });

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    if (venue.lat == null || venue.lng == null) {
      return NextResponse.json(
        { error: 'Venue does not have GPS coordinates configured' },
        { status: 422 }
      );
    }

    // Verify geofence
    const result = verifyGeofence({
      userLat,
      userLng,
      venueLat: venue.lat,
      venueLng: venue.lng,
      radiusMeters: venue.geofenceRadius ?? 50,
    });

    // Return sanitized result (no raw GPS in response)
    const sanitized = sanitizeForStorage(result);

    return NextResponse.json({
      ...sanitized,
      venueId,
      venueName: venue.name,
      distanceMeters: result.distanceMeters,
    });
  } catch (error) {
    console.error('[Geo Verify] Error:', error);
    return NextResponse.json(
      { error: 'Geofence verification failed' },
      { status: 500 }
    );
  }
}
