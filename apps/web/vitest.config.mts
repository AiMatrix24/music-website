import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest config for OPYNX. Scope is intentionally narrow — pre-launch we
 * only test pure-ish helpers (rate limiter, notification preference logic,
 * digest formatting). Procedure-level integration tests need a test DB or
 * a Drizzle mock layer; that's a follow-up.
 *
 * Run: `npm test --workspace=apps/web`
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'app/**/*.test.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
