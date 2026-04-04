/**
 * Region-Based Payment Routing (Task P.9)
 *
 * Routes payments to the appropriate processor based on user's region.
 * - Default: Helio (USDC) primary, NOWPayments (card/crypto) fallback
 * - Chile: Transbank primary, NOWPayments fallback
 * - Crypto-restricted regions: NOWPayments fiat-only mode
 */

// ─── Types ───

export type PaymentMethod = 'helio' | 'nowpayments' | 'transbank' | 'moonpay';

export interface PaymentMethodDisplay {
  id: PaymentMethod;
  label: string;
  icon: string;
  description: string;
  fee: string;
}

export interface AvailablePaymentMethods {
  primary: PaymentMethod;
  fallback: PaymentMethod[];
  fiatOnRamp: boolean;
  displayMethods: PaymentMethodDisplay[];
}

// ─── Constants ───

/** Regions where direct crypto payments are restricted or banned */
const CRYPTO_RESTRICTED_REGIONS = new Set([
  'CN', // China
  'BD', // Bangladesh
  'NP', // Nepal
  'EG', // Egypt
  'DZ', // Algeria
  'MA', // Morocco
  'BO', // Bolivia
  'QA', // Qatar
]);

/** EU member states (MoonPay fiat on-ramp available) */
const EU_REGIONS = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);

// ─── Payment method definitions ───

const HELIO_METHOD: PaymentMethodDisplay = {
  id: 'helio',
  label: 'Pay with USDC',
  icon: '💎',
  description: 'Fast crypto payment via Helio on Polygon/Solana',
  fee: '0% platform fee',
};

const NOWPAYMENTS_CRYPTO_METHOD: PaymentMethodDisplay = {
  id: 'nowpayments',
  label: 'Pay with Crypto',
  icon: '🪙',
  description: '300+ cryptocurrencies via NOWPayments',
  fee: '0.5% processing fee',
};

const NOWPAYMENTS_FIAT_METHOD: PaymentMethodDisplay = {
  id: 'nowpayments',
  label: 'Pay with Card',
  icon: '💳',
  description: 'Credit/debit card via NOWPayments',
  fee: '2.5% processing fee',
};

const TRANSBANK_METHOD: PaymentMethodDisplay = {
  id: 'transbank',
  label: 'Pagar con Transbank',
  icon: '🏦',
  description: 'Tarjeta de crédito/débito o transferencia bancaria',
  fee: '1.5% + IVA',
};

const MOONPAY_METHOD: PaymentMethodDisplay = {
  id: 'moonpay',
  label: 'Buy Crypto with Card',
  icon: '🌙',
  description: 'Fiat on-ramp — purchase USDC with a card via MoonPay',
  fee: '3.5% processing fee',
};

// ─── Region detection ───

/**
 * Detect user region from request headers or fallback to locale hints.
 * In production this would use a GeoIP lookup via Cloudflare/Vercel headers.
 */
export function detectRegion(headers?: Headers): string {
  if (!headers) return 'US';

  // Cloudflare / Vercel geo headers
  const cfCountry = headers.get('cf-ipcountry');
  if (cfCountry) return cfCountry.toUpperCase();

  const vercelCountry = headers.get('x-vercel-ip-country');
  if (vercelCountry) return vercelCountry.toUpperCase();

  // Fallback: try to infer from Accept-Language
  const acceptLang = headers.get('accept-language');
  if (acceptLang) {
    const primary = acceptLang.split(',')[0]?.trim() ?? '';
    // e.g. "es-CL" → "CL", "en-US" → "US", "pt-BR" → "BR"
    const parts = primary.split('-');
    if (parts.length >= 2 && parts[1]!.length === 2) {
      return parts[1]!.toUpperCase();
    }
  }

  return 'US';
}

// ─── Payment routing ───

/**
 * Return the available payment methods for a given region.
 *
 * Routing rules:
 * - CL (Chile): Transbank primary, NOWPayments fiat fallback
 * - Crypto-restricted: NOWPayments fiat-only, MoonPay unavailable
 * - US: Helio primary, NOWPayments crypto fallback, MoonPay on-ramp
 * - EU: Helio primary, NOWPayments crypto fallback, MoonPay on-ramp
 * - Default: Helio primary, NOWPayments crypto fallback
 */
export function getPaymentMethods(
  region: string,
  locale?: string,
): AvailablePaymentMethods {
  const code = region.toUpperCase();

  // ── Chile ──
  if (code === 'CL') {
    const localizedTransbank: PaymentMethodDisplay =
      locale?.startsWith('en')
        ? { ...TRANSBANK_METHOD, label: 'Pay with Transbank', description: 'Credit/debit card or bank transfer (Chile)' }
        : TRANSBANK_METHOD;

    return {
      primary: 'transbank',
      fallback: ['nowpayments'],
      fiatOnRamp: false,
      displayMethods: [localizedTransbank, NOWPAYMENTS_FIAT_METHOD],
    };
  }

  // ── Crypto-restricted regions ──
  if (CRYPTO_RESTRICTED_REGIONS.has(code)) {
    return {
      primary: 'nowpayments',
      fallback: [],
      fiatOnRamp: false,
      displayMethods: [NOWPAYMENTS_FIAT_METHOD],
    };
  }

  // ── US ──
  if (code === 'US') {
    return {
      primary: 'helio',
      fallback: ['nowpayments', 'moonpay'],
      fiatOnRamp: true,
      displayMethods: [HELIO_METHOD, NOWPAYMENTS_CRYPTO_METHOD, MOONPAY_METHOD],
    };
  }

  // ── EU ──
  if (EU_REGIONS.has(code)) {
    return {
      primary: 'helio',
      fallback: ['nowpayments', 'moonpay'],
      fiatOnRamp: true,
      displayMethods: [HELIO_METHOD, NOWPAYMENTS_CRYPTO_METHOD, MOONPAY_METHOD],
    };
  }

  // ── Default (rest of world) ──
  return {
    primary: 'helio',
    fallback: ['nowpayments'],
    fiatOnRamp: false,
    displayMethods: [HELIO_METHOD, NOWPAYMENTS_CRYPTO_METHOD],
  };
}
