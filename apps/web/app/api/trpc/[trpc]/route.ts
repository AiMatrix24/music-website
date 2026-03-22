import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@opynx/api';
import { auth } from '@opynx/auth';
import type { TRPCContext } from '@/lib/trpc/server';

const handler = async (req: Request) => {
  const session = await auth();

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: (): TRPCContext => ({
      session,
      req,
    }),
  });
};

export { handler as GET, handler as POST };
