import type { Config } from 'drizzle-kit';

export default {
  schema: './packages/db/schema/index.ts',
  out: './packages/db/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://opynx:opynx_dev@localhost:5432/opynx',
  },
} satisfies Config;
