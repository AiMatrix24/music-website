/**
 * Split Sheet Service
 *
 * Manages songwriter and publisher splits for tracks.
 * Generates legal split sheets and on-chain records.
 *
 * Percentages are stored as numbers 0-100. Tolerance for floating-point
 * sums is ±0.01% to allow for typical fractional splits like 33.33% × 3.
 *
 * Monetary calculations preserve cents-precision (integer cents internally),
 * matching the broader OPYNX commission/payout pattern.
 */

// ─── Types ───

export interface Writer {
  id: string;
  name: string;
  ipiNumber?: string;
  proAffiliation: 'ASCAP' | 'BMI' | 'SESAC' | 'GMR' | 'NONE';
  publisher?: string;
  percentage: number; // 0-100
}

export interface Publisher {
  id: string;
  name: string;
  percentage: number;
  territory: 'Worldwide' | 'US' | 'Europe' | 'Other';
}

export interface MasterOwnership {
  type: 'artist' | 'label' | 'coowned';
  labelName?: string;
  contractRef?: string;
  artistShare?: number; // for coowned (0-100)
  labelShare?: number; // for coowned (0-100)
  effectiveDate?: Date;
  termEnds?: Date;
}

export interface SplitSheet {
  trackId: string;
  writers: Writer[];
  publishers: Publisher[];
  masterOwnership: MasterOwnership;
  mechanicalRegistered: boolean;
  proRegistered: boolean;
  createdAt: Date;
  signedBy?: { email: string; signedAt: Date }[];
  onChainRecord?: string; // Polygon tx hash
}

export interface ValidationResult {
  valid: boolean;
  total: number;
  error?: string;
}

export interface RevenueShareEntry {
  recipientId: string;
  amount: number; // dollars (rounded to cents)
}

// ─── Constants ───

const PERCENT_TOLERANCE = 0.01; // 0.01% tolerance for split totals

// ─── Public API ───

/**
 * Validates a list of split items totals exactly 100% (within tolerance).
 * Returns { valid, total, error? } so the UI can show meaningful messages.
 */
export function validateSplits(
  items: { percentage: number }[]
): ValidationResult {
  if (!items || items.length === 0) {
    return {
      valid: false,
      total: 0,
      error: 'At least one entry is required.',
    };
  }

  const hasInvalid = items.some(
    (i) =>
      typeof i.percentage !== 'number' ||
      Number.isNaN(i.percentage) ||
      i.percentage < 0 ||
      i.percentage > 100
  );
  if (hasInvalid) {
    return {
      valid: false,
      total: 0,
      error: 'Each percentage must be a number between 0 and 100.',
    };
  }

  const total = items.reduce((sum, i) => sum + i.percentage, 0);
  const rounded = Math.round(total * 100) / 100;

  if (Math.abs(rounded - 100) > PERCENT_TOLERANCE) {
    return {
      valid: false,
      total: rounded,
      error: `Splits must total 100% (currently ${rounded.toFixed(2)}%).`,
    };
  }

  return { valid: true, total: rounded };
}

/**
 * Distributes a gross amount across recipients by percentage.
 * Uses cents-precision internally and assigns any rounding remainder to the
 * largest-share recipient so the sum reconciles exactly to grossAmount.
 */
export function calculateRevenueShare(
  grossAmount: number,
  splits: { percentage: number; recipientId: string }[]
): RevenueShareEntry[] {
  if (!splits || splits.length === 0) return [];
  if (!Number.isFinite(grossAmount) || grossAmount < 0) return [];

  const grossCents = Math.round(grossAmount * 100);

  // Allocate floor cents per recipient
  const allocations = splits.map((s) => {
    const cents = Math.floor((grossCents * s.percentage) / 100);
    return { recipientId: s.recipientId, percentage: s.percentage, cents };
  });

  // Distribute remainder cents to largest-percentage recipients first
  const allocatedCents = allocations.reduce((sum, a) => sum + a.cents, 0);
  let remainder = grossCents - allocatedCents;

  if (remainder > 0) {
    const order = [...allocations].sort(
      (a, b) => b.percentage - a.percentage
    );
    let i = 0;
    while (remainder > 0 && order.length > 0) {
      order[i % order.length].cents += 1;
      remainder -= 1;
      i += 1;
    }
  }

  return allocations.map((a) => ({
    recipientId: a.recipientId,
    amount: a.cents / 100,
  }));
}

/**
 * Generates a plain-text split sheet suitable for PDF rendering or
 * archival storage. Includes all parties, percentages, and registration
 * status.
 */
export function generateSplitSheetText(
  splitSheet: SplitSheet,
  trackTitle: string
): string {
  const lines: string[] = [];
  const divider = '='.repeat(60);
  const subDivider = '-'.repeat(60);

  lines.push(divider);
  lines.push('OPYNX SPLIT SHEET');
  lines.push(divider);
  lines.push('');
  lines.push(`Track Title: ${trackTitle}`);
  lines.push(`Track ID:    ${splitSheet.trackId}`);
  lines.push(`Created:     ${splitSheet.createdAt.toISOString()}`);
  lines.push('');

  // Songwriter splits
  lines.push('SONGWRITER SPLITS');
  lines.push(subDivider);
  if (splitSheet.writers.length === 0) {
    lines.push('  (no writers listed)');
  } else {
    for (const w of splitSheet.writers) {
      lines.push(`  ${w.name} — ${w.percentage.toFixed(2)}%`);
      lines.push(`    PRO:       ${w.proAffiliation}`);
      if (w.ipiNumber) lines.push(`    IPI/CAE:   ${w.ipiNumber}`);
      if (w.publisher) lines.push(`    Publisher: ${w.publisher}`);
    }
    const writerTotal = splitSheet.writers.reduce(
      (s, w) => s + w.percentage,
      0
    );
    lines.push('');
    lines.push(`  TOTAL: ${writerTotal.toFixed(2)}%`);
  }
  lines.push('');

  // Publisher splits
  lines.push('PUBLISHER SPLITS');
  lines.push(subDivider);
  if (splitSheet.publishers.length === 0) {
    lines.push('  (no publishers listed)');
  } else {
    for (const p of splitSheet.publishers) {
      lines.push(
        `  ${p.name} — ${p.percentage.toFixed(2)}% (${p.territory})`
      );
    }
    const pubTotal = splitSheet.publishers.reduce(
      (s, p) => s + p.percentage,
      0
    );
    lines.push('');
    lines.push(`  TOTAL: ${pubTotal.toFixed(2)}%`);
  }
  lines.push('');

  // Master ownership
  lines.push('MASTER RECORDING OWNERSHIP');
  lines.push(subDivider);
  const m = splitSheet.masterOwnership;
  if (m.type === 'artist') {
    lines.push('  Artist owns 100% of master recording.');
  } else if (m.type === 'label') {
    lines.push(`  Label: ${m.labelName ?? '(unspecified)'}`);
    if (m.contractRef) lines.push(`  Contract Ref: ${m.contractRef}`);
  } else {
    lines.push('  Co-owned:');
    lines.push(`    Artist share: ${(m.artistShare ?? 0).toFixed(2)}%`);
    lines.push(`    Label share:  ${(m.labelShare ?? 0).toFixed(2)}%`);
    if (m.labelName) lines.push(`    Label: ${m.labelName}`);
    if (m.contractRef) lines.push(`    Contract Ref: ${m.contractRef}`);
  }
  if (m.effectiveDate)
    lines.push(`  Effective: ${m.effectiveDate.toISOString().slice(0, 10)}`);
  if (m.termEnds)
    lines.push(`  Expires:   ${m.termEnds.toISOString().slice(0, 10)}`);
  lines.push('');

  // Registration
  lines.push('REGISTRATION STATUS');
  lines.push(subDivider);
  lines.push(
    `  Mechanical (MLC): ${splitSheet.mechanicalRegistered ? 'Registered' : 'Not Registered'}`
  );
  lines.push(
    `  Performance (PRO): ${splitSheet.proRegistered ? 'Registered' : 'Not Registered'}`
  );
  lines.push('');

  // Signatures
  if (splitSheet.signedBy && splitSheet.signedBy.length > 0) {
    lines.push('SIGNATURES');
    lines.push(subDivider);
    for (const s of splitSheet.signedBy) {
      lines.push(`  ${s.email} — ${s.signedAt.toISOString()}`);
    }
    lines.push('');
  }

  if (splitSheet.onChainRecord) {
    lines.push(`On-Chain Record: ${splitSheet.onChainRecord}`);
    lines.push('');
  }

  lines.push(divider);
  lines.push(
    'This split sheet is a binding agreement between the listed parties.'
  );
  lines.push('Generated by OPYNX FanEngage Protocol.');
  lines.push(divider);

  return lines.join('\n');
}
