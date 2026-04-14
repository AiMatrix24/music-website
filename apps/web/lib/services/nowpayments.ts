/**
 * NOWPayments API Client
 *
 * Handles crypto payment processing via NOWPayments.
 * API docs: https://documenter.getpostman.com/view/7907941/2s93JusNJt
 *
 * - 0.5% flat fee
 * - 300+ cryptocurrencies supported
 * - USDC on Polygon (usdcmatic) is the default pay currency
 * - Base URL: https://api.nowpayments.io/v1
 */

// ─── Types ───

export interface CreatePaymentParams {
  /** Price in USD (e.g. 8.73) */
  priceAmount: number;
  /** Price currency — always 'usd' for our use case */
  priceCurrency: string;
  /** Crypto to pay with — 'usdcmatic' for USDC on Polygon */
  payCurrency: string;
  /** Internal order ID (e.g. 'sub_xxx', 'ticket_xxx', 'merch_xxx') */
  orderId: string;
  /** Human-readable description */
  orderDescription: string;
  /** IPN callback URL for payment status updates */
  callbackUrl: string;
}

export interface CreatePaymentResponse {
  paymentId: string;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  paymentUrl: string;
}

export interface CreateRecurringPaymentParams {
  subscriptionPlanId: string;
  email: string;
}

export interface CreateRecurringPaymentResponse {
  id: string;
  status: string;
}

export interface PaymentStatusResponse {
  paymentStatus:
    | 'waiting'
    | 'confirming'
    | 'confirmed'
    | 'sending'
    | 'partially_paid'
    | 'finished'
    | 'failed'
    | 'refunded'
    | 'expired';
  payAmount: number;
  actuallyPaid: number;
}

export interface MinAmountResponse {
  minAmount: number;
}

export class NowPaymentsError extends Error {
  public readonly statusCode: number;
  public readonly responseBody: unknown;

  constructor(message: string, statusCode: number, responseBody?: unknown) {
    super(message);
    this.name = 'NowPaymentsError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

// ─── Circuit Breaker ───

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;

  constructor(failureThreshold = 5, resetTimeout = 60000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new NowPaymentsError(
          'Circuit breaker is open — payment service unavailable',
          503
        );
      }
    }
    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.failureThreshold) this.state = 'open';
  }

  private reset() {
    this.failures = 0;
    this.state = 'closed';
  }
}

// ─── Retry Helper ───

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const delay = baseDelayMs * Math.pow(2, attempt); // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// ─── Client ───

const BASE_URL = 'https://api.nowpayments.io/v1';
const REQUEST_TIMEOUT_MS = 15000;

export class NowPaymentsClient {
  private readonly apiKey: string;
  private readonly circuitBreaker: CircuitBreaker;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.NOWPAYMENTS_API_KEY ?? '';
    this.circuitBreaker = new CircuitBreaker(5, 60000);
    if (!this.apiKey) {
      console.warn(
        '[NowPayments] No API key provided. Set NOWPAYMENTS_API_KEY env var.'
      );
    }
  }

  // ─── Private Helpers ───

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    return this.circuitBreaker.execute(() =>
      retryWithBackoff(() => this.rawRequest<T>(method, path, body))
    );
  }

  private async rawRequest<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${BASE_URL}${path}`;

    const headers: Record<string, string> = {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const options: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    if (body && method === 'POST') {
      options.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await fetch(url, options);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new NowPaymentsError(
          `NOWPayments API request timed out after ${REQUEST_TIMEOUT_MS}ms`,
          408
        );
      }
      throw new NowPaymentsError(
        `Network error calling NOWPayments API: ${error instanceof Error ? error.message : String(error)}`,
        0
      );
    } finally {
      clearTimeout(timeout);
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new NowPaymentsError(
        `Invalid JSON response from NOWPayments API`,
        response.status
      );
    }

    if (!response.ok) {
      const message =
        (data as Record<string, string>)?.message ??
        `NOWPayments API error (${response.status})`;
      throw new NowPaymentsError(message, response.status, data);
    }

    return data as T;
  }

  // ─── Public API ───

  /**
   * Create a one-time payment for tickets, merch, etc.
   * Returns a payment address and URL for the user to send crypto.
   */
  async createPayment(
    params: CreatePaymentParams
  ): Promise<CreatePaymentResponse> {
    const data = await this.request<Record<string, unknown>>(
      'POST',
      '/payment',
      {
        price_amount: params.priceAmount,
        price_currency: params.priceCurrency,
        pay_currency: params.payCurrency,
        order_id: params.orderId,
        order_description: params.orderDescription,
        ipn_callback_url: params.callbackUrl,
      }
    );

    return {
      paymentId: String(data.payment_id ?? ''),
      payAddress: String(data.pay_address ?? ''),
      payAmount: Number(data.pay_amount ?? 0),
      payCurrency: String(data.pay_currency ?? ''),
      paymentUrl: String(data.payment_url ?? data.invoice_url ?? ''),
    };
  }

  /**
   * Create a recurring subscription payment.
   * Requires a pre-configured subscription plan in the NOWPayments dashboard.
   */
  async createRecurringPayment(
    params: CreateRecurringPaymentParams
  ): Promise<CreateRecurringPaymentResponse> {
    const data = await this.request<Record<string, unknown>>(
      'POST',
      '/recurring-payments',
      {
        subscription_plan_id: params.subscriptionPlanId,
        email: params.email,
      }
    );

    return {
      id: String(data.id ?? ''),
      status: String(data.status ?? ''),
    };
  }

  /**
   * Get the current status of a payment by ID.
   */
  async getPaymentStatus(
    paymentId: string
  ): Promise<PaymentStatusResponse> {
    const data = await this.request<Record<string, unknown>>(
      'GET',
      `/payment/${encodeURIComponent(paymentId)}`
    );

    return {
      paymentStatus: String(data.payment_status ?? 'waiting') as PaymentStatusResponse['paymentStatus'],
      payAmount: Number(data.pay_amount ?? 0),
      actuallyPaid: Number(data.actually_paid ?? 0),
    };
  }

  /**
   * Get the minimum payment amount for a currency pair.
   * Useful for validating payment amounts before creating a payment.
   */
  async getMinAmount(
    currencyFrom: string,
    currencyTo: string
  ): Promise<MinAmountResponse> {
    const data = await this.request<Record<string, unknown>>(
      'GET',
      `/min-amount?currency_from=${encodeURIComponent(currencyFrom)}&currency_to=${encodeURIComponent(currencyTo)}`
    );

    return {
      minAmount: Number(data.min_amount ?? 0),
    };
  }
}

/**
 * Singleton client instance using env-based API key.
 * Import this for general use; construct NowPaymentsClient directly
 * only if you need a custom API key (e.g. testing).
 */
export const nowpayments = new NowPaymentsClient();
