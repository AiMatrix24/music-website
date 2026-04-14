/**
 * Error Monitoring Abstraction
 *
 * Provides structured error logging that can be swapped for Sentry
 * (@sentry/nextjs) when the integration is ready. All errors are logged
 * as structured JSON for aggregation by log management tools.
 */

export interface ErrorContext {
  userId?: string;
  action: string;
  metadata?: Record<string, unknown>;
}

export function captureError(error: unknown, context: ErrorContext): void {
  const err = error instanceof Error ? error : new Error(String(error));

  console.error(JSON.stringify({
    level: 'error',
    timestamp: new Date().toISOString(),
    message: err.message,
    stack: err.stack,
    action: context.action,
    userId: context.userId,
    metadata: context.metadata,
    // TODO: Replace with Sentry.captureException(err, { extra: context })
  }));
}

export function captureMessage(message: string, level: 'info' | 'warning' = 'info', context?: Record<string, unknown>): void {
  console.log(JSON.stringify({
    level,
    timestamp: new Date().toISOString(),
    message,
    ...context,
    // TODO: Replace with Sentry.captureMessage(message, level)
  }));
}

export function startTransaction(name: string, op: string) {
  const startTime = Date.now();
  return {
    finish: () => {
      const duration = Date.now() - startTime;
      console.log(JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        transaction: name,
        operation: op,
        durationMs: duration,
        // TODO: Replace with Sentry transaction tracking
      }));
    },
  };
}
