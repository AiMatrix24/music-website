import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import pino from 'pino';
import type { Session } from 'next-auth';

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
