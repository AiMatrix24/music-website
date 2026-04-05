import { NextResponse } from 'next/server';
import { db } from '@opynx/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  const checks = { postgres: 'unknown', timestamp: new Date().toISOString() };
  let status = 'ok';

  try {
    await db.execute(sql`SELECT 1`);
    checks.postgres = 'connected';
  } catch {
    checks.postgres = 'error';
    status = 'degraded';
  }

  return NextResponse.json(
    { status, ...checks },
    { status: status === 'ok' ? 200 : 503 }
  );
}
