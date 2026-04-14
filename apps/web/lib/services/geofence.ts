/**
 * Geofence Verification Service
 *
 * Verifies if a user's GPS coordinates are within a venue's geofence radius
 * using the Haversine formula for great-circle distance.
 *
 * GDPR: Never store raw GPS coordinates. Only store the boolean result.
 */

// Haversine formula for distance between two GPS coordinates
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in meters
}

export interface GeofenceResult {
  verified: boolean;
  distanceMeters: number;
  withinRadius: boolean;
  confidence: 'high' | 'medium' | 'low';
}

export function verifyGeofence(params: {
  userLat: number;
  userLng: number;
  venueLat: number;
  venueLng: number;
  radiusMeters: number; // typically 50-150m
}): GeofenceResult {
  const distance = haversineDistance(
    params.userLat, params.userLng,
    params.venueLat, params.venueLng
  );

  const withinRadius = distance <= params.radiusMeters;
  const confidence = distance <= params.radiusMeters * 0.5 ? 'high'
    : distance <= params.radiusMeters ? 'medium' : 'low';

  return {
    verified: withinRadius,
    distanceMeters: Math.round(distance),
    withinRadius,
    confidence,
  };
}

// GDPR: Never store raw GPS. Only store the boolean result.
export function sanitizeForStorage(result: GeofenceResult): {
  geoVerified: boolean;
  geoConfidence: string;
  geoDiscarded: true; // raw GPS was discarded
} {
  return {
    geoVerified: result.verified,
    geoConfidence: result.confidence,
    geoDiscarded: true,
  };
}
