/**
 * Commission Waterfall Algorithm — CRITICAL
 *
 * ⚠ WARNING: This is the most important algorithm in the platform.
 * Implement EXACTLY as specified in Section 6.2.
 *
 * Rules:
 * 1. Creator: ALWAYS $1.00 (100 cents). NEVER pro-rated. NEVER reduced.
 * 2. Facilitator: Tier rate ($0.25–$0.50) IF geo/TOTP verified. Else $0.
 * 3. Outlier: Negotiated rate ($1.00–$1.50) if attributed. Else $0.
 * 4. If total exceeds $3.50: pro-rate Facilitator + Outlier. Creator NEVER reduced.
 * 5. Unattributed amounts = breakage (stays in platform treasury).
 *
 * ALL monetary values are INTEGER CENTS. $1.00 = 100.
 * Floating-point arithmetic on currency is FORBIDDEN.
 */

// Constants — all in INTEGER CENTS
const CREATOR_AMOUNT = 100; // $1.00 — NEVER changes
const MAX_PAYOUT_PER_SUB = 350; // $3.50 cap
const DEFAULT_FACILITATOR_RATE = 25; // $0.25 — Silver tier
const DEFAULT_OUTLIER_RATE = 100; // $1.00

export interface AttributionData {
  creatorId: string;
  facilitatorId: string | null;
  outlierId: string | null;
  geoVerified: boolean;
  totpVerified: boolean;
  facilitatorTier?: 'silver' | 'gold' | 'platinum';
  outlierRate?: number; // cents, negotiated per-deal
}

export interface CommissionSplit {
  recipientId: string;
  tier: 'creator' | 'facilitator' | 'outlier';
  amount: number; // INTEGER CENTS
}

/**
 * Facilitator tier rates (cents)
 * Silver: $0.25, Gold: $0.35, Platinum: $0.50
 */
const FACILITATOR_TIER_RATES: Record<string, number> = {
  silver: 25,
  gold: 35,
  platinum: 50,
};

export function calculateWaterfall(attr: AttributionData): CommissionSplit[] {
  const splits: CommissionSplit[] = [];

  // ─── Step 1: Creator — ALWAYS $1.00 ───
  splits.push({
    recipientId: attr.creatorId,
    tier: 'creator',
    amount: CREATOR_AMOUNT,
  });

  let totalPayout = CREATOR_AMOUNT;

  // ─── Step 2: Facilitator ───
  // ⚠ FRAUD PREVENTION: If geoVerified=false AND totpVerified=false,
  // facilitatorId MUST be null. This is non-negotiable.
  const facilitatorVerified = attr.geoVerified || attr.totpVerified;
  let facilitatorAmount = 0;

  if (attr.facilitatorId && facilitatorVerified) {
    facilitatorAmount =
      FACILITATOR_TIER_RATES[attr.facilitatorTier ?? 'silver'] ??
      DEFAULT_FACILITATOR_RATE;
  }

  // ─── Step 3: Outlier ───
  let outlierAmount = 0;

  if (attr.outlierId) {
    outlierAmount = attr.outlierRate ?? DEFAULT_OUTLIER_RATE;
  }

  // ─── Step 4: Pro-rate if exceeds cap ───
  const combined = facilitatorAmount + outlierAmount;

  if (totalPayout + combined > MAX_PAYOUT_PER_SUB) {
    // Pro-rate Facilitator + Outlier proportionally. Creator NEVER reduced.
    const remaining = MAX_PAYOUT_PER_SUB - CREATOR_AMOUNT;

    if (combined > 0) {
      facilitatorAmount = Math.floor(
        (facilitatorAmount * remaining) / combined
      );
      outlierAmount = Math.floor((outlierAmount * remaining) / combined);
    }
  }

  // ─── Add Facilitator split ───
  if (attr.facilitatorId && facilitatorVerified && facilitatorAmount > 0) {
    splits.push({
      recipientId: attr.facilitatorId,
      tier: 'facilitator',
      amount: facilitatorAmount,
    });
  }

  // ─── Add Outlier split ───
  if (attr.outlierId && outlierAmount > 0) {
    splits.push({
      recipientId: attr.outlierId,
      tier: 'outlier',
      amount: outlierAmount,
    });
  }

  return splits;
}

/**
 * Calculate waterfall for Superfan 4-Creator Bundle ($12.73)
 * All 4 Creators receive their uncompromised $1.00.
 * Facilitator cost ($0.50) amortized across the bundle.
 */
export function calculateBundleWaterfall(
  creatorIds: [string, string, string, string],
  attr: Omit<AttributionData, 'creatorId'>
): CommissionSplit[] {
  const splits: CommissionSplit[] = [];

  // Each of 4 Creators gets $1.00 — ALWAYS
  for (const creatorId of creatorIds) {
    splits.push({
      recipientId: creatorId,
      tier: 'creator',
      amount: CREATOR_AMOUNT,
    });
  }

  // Bundle cap: $4.53 total stakeholder payout
  const BUNDLE_MAX = 453;
  const totalCreators = CREATOR_AMOUNT * 4; // 400 cents
  const remaining = BUNDLE_MAX - totalCreators; // 53 cents

  const facilitatorVerified = attr.geoVerified || attr.totpVerified;

  if (attr.facilitatorId && facilitatorVerified) {
    const facAmount = Math.min(
      FACILITATOR_TIER_RATES[attr.facilitatorTier ?? 'silver'] ??
        DEFAULT_FACILITATOR_RATE,
      remaining
    );
    splits.push({
      recipientId: attr.facilitatorId,
      tier: 'facilitator',
      amount: facAmount,
    });
  }

  return splits;
}
