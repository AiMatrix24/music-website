#!/usr/bin/env node
/**
 * Cleanup: mark published tracks that have no audio URL as "draft" so they
 * stop showing up in public listings with "No audio uploaded" tags.
 *
 * Usage (dry run — prints what would change, does not modify):
 *   node tools/cleanup-broken-tracks.mjs
 *
 * Usage (execute the update):
 *   node tools/cleanup-broken-tracks.mjs --execute
 *
 * Requires DATABASE_URL in the environment. Pull from Vercel with:
 *   vercel env pull .env.vercel --environment=production
 *   set -a; source .env.vercel; set +a
 */

import postgres from 'postgres';

const EXECUTE = process.argv.includes('--execute');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set. Pull from Vercel: vercel env pull .env.vercel --environment=production');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 2 });

const broken = await sql`
  SELECT id, title, slug, status, created_at
  FROM tracks
  WHERE status = 'published'
    AND audio_url_128 IS NULL
    AND audio_url_320 IS NULL
    AND audio_url_flac IS NULL
  ORDER BY created_at
`;

console.log(`Found ${broken.length} published tracks with no audio URL:\n`);
for (const t of broken) {
  console.log(`  ${t.id}  ${t.title.slice(0, 50).padEnd(50)}  (created ${new Date(t.created_at).toISOString().slice(0, 10)})`);
}

if (broken.length === 0) {
  console.log('\nNothing to clean up.');
  await sql.end();
  process.exit(0);
}

if (!EXECUTE) {
  console.log(`\nDry run — pass --execute to mark all ${broken.length} as status='draft'.`);
  console.log('(draft is reversible: to restore, UPDATE tracks SET status=\'published\' WHERE ...)');
  await sql.end();
  process.exit(0);
}

console.log('\nMarking as draft...');
const result = await sql`
  UPDATE tracks
  SET status = 'draft', updated_at = NOW()
  WHERE status = 'published'
    AND audio_url_128 IS NULL
    AND audio_url_320 IS NULL
    AND audio_url_flac IS NULL
  RETURNING id
`;
console.log(`Updated ${result.length} rows.`);

await sql.end();
