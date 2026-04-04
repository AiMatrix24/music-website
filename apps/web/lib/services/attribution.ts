/**
 * Attribution Recording Engine
 *
 * Records scan attributions when fans scan QR codes at events.
 * Links the fan's subscription to the creator/facilitator/outlier who brought them.
 *
 * Currently uses console.log and mock results since Redis is not yet available
 * for rate limiting. The logic flow is correct and ready for production integration.
 */

// ─── Types ───

export interface AttributionParams {
  userId: string;
  creatorId: string;
  facilitatorId?: string;
  outlierId?: string;
  eventId?: string;
  geoVerified: boolean;
  totpVerified: boolean;
  qrContext: 'pre_show' | 'during_show' | 'post_show';
  deviceFingerprint?: string;
  ipAddress?: string;
}

export interface AttributionResult {
  success: boolean;
  scanLogId?: string;
  blocked?: string; // reason if blocked
  attribution?: {
    creatorId: string;
    facilitatorId?: string;
    outlierId?: string;
    geoVerified: boolean;
  };
}

// ─── In-Memory Rate Tracking (replace with Redis) ───

const scanLog: Map<string, { timestamps: number[] }> = new Map();
const firstScanLocks: Map<string, number> = new Map();

const VELOCITY_LIMIT = 5; // max scans per hour
const VELOCITY_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const FIRST_SCAN_LOCK_MS = 4 * 60 * 60 * 1000; // 4 hours

// ─── Velocity Check ───

/**
 * Check if a user is under the velocity limit (max 5 scans per hour).
 * Returns true if the user can scan, false if rate-limited.
 */
export function checkVelocity(userId: string): boolean {
  const now = Date.now();
  const entry = scanLog.get(userId);

  if (!entry) {
    console.log(`[Attribution] Velocity check: userId=${userId} — no prior scans, allowed`);
    return true;
  }

  // Filter to scans within the window
  const recentScans = entry.timestamps.filter((ts) => now - ts < VELOCITY_WINDOW_MS);
  const allowed = recentScans.length < VELOCITY_LIMIT;

  console.log(
    `[Attribution] Velocity check: userId=${userId} — ${recentScans.length}/${VELOCITY_LIMIT} scans in window — ${allowed ? 'allowed' : 'BLOCKED'}`
  );

  return allowed;
}

// ─── First-Scan Lock ───

/**
 * Check if a first-scan lock exists for this user+creator+facilitator+event combo.
 * Prevents duplicate attributions within a 4-hour window.
 * Returns true if NOT locked (can proceed), false if locked.
 */
export function checkFirstScanLock(
  userId: string,
  creatorId: string,
  facilitatorId?: string,
  eventId?: string
): boolean {
  const lockKey = `${userId}:${creatorId}:${facilitatorId ?? 'none'}:${eventId ?? 'none'}`;
  const now = Date.now();
  const lockTimestamp = firstScanLocks.get(lockKey);

  if (!lockTimestamp) {
    console.log(`[Attribution] First-scan lock check: key=${lockKey} — no lock, allowed`);
    return true;
  }

  const locked = now - lockTimestamp < FIRST_SCAN_LOCK_MS;

  console.log(
    `[Attribution] First-scan lock check: key=${lockKey} — lock age=${Math.floor((now - lockTimestamp) / 1000)}s — ${locked ? 'LOCKED' : 'expired, allowed'}`
  );

  return !locked;
}

// ─── Record Attribution ───

/**
 * Record a scan attribution when a fan scans a QR code.
 *
 * Flow:
 * 1. Check velocity limit (max 5 scans/hr per user)
 * 2. Check first-scan lock (4h per creator+facilitator+event)
 * 3. Create scan_log entry
 * 4. Create attribution if user has subscription
 */
export async function recordAttribution(params: AttributionParams): Promise<AttributionResult> {
  const {
    userId,
    creatorId,
    facilitatorId,
    outlierId,
    eventId,
    geoVerified,
    totpVerified,
    qrContext,
    deviceFingerprint,
    ipAddress,
  } = params;

  console.log(
    `[Attribution] Recording scan: userId=${userId} creatorId=${creatorId} ` +
      `facilitatorId=${facilitatorId ?? 'none'} eventId=${eventId ?? 'none'} ` +
      `context=${qrContext} geoVerified=${geoVerified} totpVerified=${totpVerified}`
  );

  // Step 1: Velocity check
  if (!checkVelocity(userId)) {
    console.log(`[Attribution] BLOCKED: Velocity limit exceeded for userId=${userId}`);
    return {
      success: false,
      blocked: 'velocity_limit_exceeded',
    };
  }

  // Step 2: First-scan lock check
  if (!checkFirstScanLock(userId, creatorId, facilitatorId, eventId)) {
    console.log(
      `[Attribution] BLOCKED: First-scan lock active for userId=${userId} creatorId=${creatorId}`
    );
    return {
      success: false,
      blocked: 'first_scan_locked',
    };
  }

  // Step 3: Record the scan in the log
  const scanLogId = `scan_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  // Update velocity tracking
  const entry = scanLog.get(userId) ?? { timestamps: [] };
  entry.timestamps.push(Date.now());
  scanLog.set(userId, entry);

  // Set first-scan lock
  const lockKey = `${userId}:${creatorId}:${facilitatorId ?? 'none'}:${eventId ?? 'none'}`;
  firstScanLocks.set(lockKey, Date.now());

  console.log(
    `[Attribution] Scan logged: scanLogId=${scanLogId} ` +
      `device=${deviceFingerprint ?? 'unknown'} ip=${ipAddress ?? 'unknown'}`
  );

  // Step 4: Create attribution record
  // In production, this would check if the user has an active subscription
  // and write to the attributions table in the database
  const attribution = {
    creatorId,
    facilitatorId,
    outlierId,
    geoVerified,
  };

  console.log(
    `[Attribution] Attribution created: creator=${creatorId} ` +
      `facilitator=${facilitatorId ?? 'none'} outlier=${outlierId ?? 'none'} ` +
      `geoVerified=${geoVerified}`
  );

  return {
    success: true,
    scanLogId,
    attribution,
  };
}
