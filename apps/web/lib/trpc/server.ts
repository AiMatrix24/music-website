import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import pino from 'pino';
import type { Session } from 'next-auth';
import { checkRateLimit } from '../services/rate-limit';

// ─── Logger ───
const logger = pino({
  name: 'opynx-trpc',
  level: process.env.LOG_LEVEL ?? 'info',
});

// ─── Context ───
export interface TRPCContext {
  session: Session | null;
  req?: Request;
}

// ─── Initialize tRPC ───
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Only expose internal error details in development
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    };
  },
});

// ─── Middleware: Logger ───
const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;

  if (result.ok) {
    logger.info({ path, type, durationMs }, 'tRPC request completed');
  } else {
    logger.error(
      { path, type, durationMs, error: result.error.message },
      'tRPC request failed'
    );
  }

  return result;
});

// ─── Middleware: Enforce Authentication ───
const enforceAuth = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be signed in to access this resource',
    });
  }

  // Block suspended users from any protected mutation/query. This is the
  // DMCA repeat-infringer enforcement point — once a user accumulates 3
  // strikes, dmca.adminDecide flips their role to 'suspended', and from
  // that moment onward they hit this throw on every protected procedure.
  // Sign-in still works (so admin can lift the suspension), but they can't
  // upload, comment, tip, etc.
  const suspendedRole = (ctx.session.user as { role?: string }).role === 'suspended';
  if (suspendedRole) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Your account has been suspended. Contact support if you believe this is an error.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: {
        ...ctx.session,
        user: {
          ...ctx.session.user,
          id: ctx.session.user.id,
        },
      } as Session & { user: { id: string } },
    },
  });
});

// ─── Middleware: Enforce Admin Role ───
const enforceAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be signed in to access this resource',
    });
  }

  // Check for admin or super_admin role
  const user = ctx.session.user as Session['user'] & { role?: string };
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

// ─── Middleware factory: Rate Limit ───
/**
 * Per-user fixed-window rate limit. Use on money + spam-prone mutations:
 *
 *   tipsRouter = createRouter({
 *     send: protectedProcedure.use(rateLimit({ limit: 10, windowSec: 60 })).input(...).mutation(...)
 *   })
 *
 * Keys are scoped by tRPC path + user id; users are isolated from each
 * other. Anonymous callers fall back to a coarse IP-derived key so they
 * still get rate-limited (less precise than userId but better than nothing).
 *
 * Fails OPEN on Redis errors — logs but doesn't block.
 */
export function rateLimit(opts: { limit: number; windowSec: number }) {
  return t.middleware(async ({ ctx, path, next }) => {
    const userId = ctx.session?.user?.id;
    const ip = ctx.req?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon';
    const id = userId ?? `ip:${ip}`;
    const key = `rl:${path}:${id}`;

    const result = await checkRateLimit({ key, limit: opts.limit, windowSec: opts.windowSec });
    if (!result.allowed) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `You're doing that too quickly. Try again in ${result.retryAfterSec ?? opts.windowSec}s.`,
      });
    }
    return next();
  });
}

// ─── Exports ───
export const createRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

/** Public procedure — no auth required, with logging */
export const publicProcedure = t.procedure.use(loggerMiddleware);

/** Protected procedure — requires authenticated session */
export const protectedProcedure = t.procedure
  .use(loggerMiddleware)
  .use(enforceAuth);

/** Admin procedure — requires admin or super_admin role */
export const adminProcedure = t.procedure
  .use(loggerMiddleware)
  .use(enforceAdmin);

export { logger };
