import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@opynx/api';

/**
 * tRPC React client — typed to the AppRouter.
 * Used in client components via the TRPCProvider.
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Vanilla tRPC client for use outside of React (e.g., server actions).
 */
export { type AppRouter };
