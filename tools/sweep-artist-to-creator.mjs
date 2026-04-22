#!/usr/bin/env node
/**
 * OPYNX Creator Terminology Sweep
 *
 * Word-bounded replacement of Artist → Creator with protections:
 *  - Skip "artistic", "artisan", "artistry" (negative lookahead)
 *  - Skip URL paths "/artist/..." (preserved until Phase 2 redirect)
 *  - Skip DB column refs "artist_id", "artist_name" (out of scope per spec)
 *  - Skip variable names tied to DB columns (artistId, artistName, artistAvatar)
 *  - Skip /tools/, /docs/specification/, node_modules, build dirs
 */
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

const ROOT = 'apps/web/app';
const EXTS = new Set(['.tsx', '.ts']);
const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'build', '__tests__']);

// Skip these specific directories where /artist/[id] route lives
const SKIP_PATHS = [
  'apps/web/app/artist/',
  'apps/web/app/api/',
];

let filesChanged = 0;
let totalReplacements = 0;
const samples = [];

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walk(path);
    } else if (entry.isFile() && EXTS.has(extname(entry.name))) {
      yield path;
    }
  }
}

function processFile(filepath) {
  // Skip protected paths (URL routes, API)
  for (const skip of SKIP_PATHS) {
    if (filepath.replace(/\\/g, '/').includes(skip)) return;
  }

  const original = readFileSync(filepath, 'utf-8');
  const lines = original.split('\n');
  let changed = false;
  let replacementsInFile = 0;

  const newLines = lines.map((line, idx) => {
    // Skip lines that contain URL paths to /artist/ (preserved for now)
    if (/\/artist[\/\?\"\']/.test(line)) return line;

    // Skip lines with DB column string literals
    if (/[\"\']artist_/.test(line)) return line;

    let newLine = line;

    // Replace plural first to avoid double-replace
    // Skip artistic/artisan/artistry/artistId/artistName/artistAvatar
    newLine = newLine.replace(/\bArtists\b(?!Id|Name|Avatar)/g, 'Creators');
    newLine = newLine.replace(/\bartists\b(?!Id|Name|Avatar|_)/g, 'creators');

    // Singular: stop before -ic, -an, -ry, Id, Name, Avatar
    newLine = newLine.replace(/\bArtist\b(?!Id|Name|Avatar|ic|an|ry)/g, 'Creator');
    newLine = newLine.replace(/\bartist\b(?!Id|Name|Avatar|ic|an|ry|_)/g, 'creator');

    if (newLine !== line) {
      changed = true;
      replacementsInFile++;
      if (samples.length < 10) {
        samples.push(`${filepath}:${idx + 1}`);
        samples.push(`  - ${line.trim().slice(0, 100)}`);
        samples.push(`  + ${newLine.trim().slice(0, 100)}`);
      }
    }
    return newLine;
  });

  if (changed) {
    writeFileSync(filepath, newLines.join('\n'));
    filesChanged++;
    totalReplacements += replacementsInFile;
  }
}

async function main() {
  console.log('OPYNX Creator Terminology Sweep\n');
  console.log(`Scanning: ${ROOT}`);
  console.log(`Skipping: ${[...SKIP_DIRS].join(', ')}`);
  console.log(`Protected paths: ${SKIP_PATHS.join(', ')}\n`);

  for await (const file of walk(ROOT)) {
    processFile(file);
  }

  console.log(`\nFiles changed: ${filesChanged}`);
  console.log(`Total replacements: ${totalReplacements}\n`);
  if (samples.length > 0) {
    console.log('Sample changes:');
    for (const s of samples.slice(0, 30)) console.log(s);
  }
}

main().catch((err) => {
  console.error('Sweep failed:', err);
  process.exit(1);
});
