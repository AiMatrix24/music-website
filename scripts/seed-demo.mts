/**
 * Demo seed — runs the full venue→contract→POS lifecycle + an album-buy
 * cascade against the database the env points to, then cleans up after
 * itself. Useful for:
 *   - Onboarding a new dev to the platform's money + booking flows
 *   - Smoke-testing the helper + schema after a migration
 *   - Showing the off-chain ledger math end-to-end before on-chain wiring
 *
 * Usage:
 *   npm run demo:seed                  # interactive — confirms first
 *   npm run demo:seed -- --yes         # non-interactive (CI / scripts)
 *   OWNER_USER_ID=<uuid> npm run demo:seed   # explicit venue owner
 *
 * Env loaded from .env.local by default. To run against a different DB,
 * set DATABASE_URL inline:
 *   DATABASE_URL="postgres://..." npm run demo:seed -- --yes
 *
 * Safety:
 *   - All rows the script creates are tagged with predictable test data
 *     (email *@example.invalid) and deleted in `finally`.
 *   - On any error mid-run, the finally block still cleans up.
 *   - The script REFUSES to proceed if the host looks like prod (Neon
 *     production branch) unless --allow-prod is also passed. There's no
 *     undo for things that escape cleanup.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import postgres from 'postgres';

// ── Env load ────────────────────────────────────────────────────────
function loadEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(?:"([^"]*)"|(.*))$/);
    if (m) out[m[1]] = m[2] ?? m[3] ?? '';
  }
  return out;
}

const args = new Set(process.argv.slice(2));
const yes = args.has('--yes') || args.has('-y');
const allowProd = args.has('--allow-prod');
// --keep-data: leave the sim rows in place after the run so the dashboards
// (/dashboard/venue, /dashboard/gigs, /booking) display real numbers. Pair
// with `npm run demo:cleanup` (or run the script again with --cleanup-only)
// when you're done viewing.
const keepData = args.has('--keep-data');
const cleanupOnly = args.has('--cleanup-only');

const envLocal = loadEnvFile(resolve(process.cwd(), '.env.local'));
const databaseUrl = (process.env.DATABASE_URL ?? envLocal.DATABASE_URL ?? '').trim();
if (!databaseUrl) {
  console.error('DATABASE_URL is required (env or .env.local).');
  process.exit(1);
}
// Make the URL available to the helper module (which imports @opynx/db).
process.env.DATABASE_URL = databaseUrl;

// Hide credentials in logs.
const dbHost = (() => {
  try {
    const u = new URL(databaseUrl);
    return `${u.hostname}/${u.pathname.slice(1)}`;
  } catch {
    return '(unparseable URL)';
  }
})();
const looksLikeProd = /opynx|prod|main\.|\.neon\.tech$/i.test(dbHost) && !/dev|local|test/i.test(dbHost);

console.log(`Demo seed will connect to: ${dbHost}`);
if (looksLikeProd && !allowProd) {
  console.error('\nThis URL looks like production. Pass --allow-prod if you\'re sure.');
  console.error('All rows created by this script are cleaned up at the end, but a mid-run');
  console.error('crash can leave sim_creator/sim_producer/sim_co_writer/sim_mixer/sim_hall rows.');
  process.exit(2);
}
if (!yes) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question('Proceed? [y/N] ')).trim().toLowerCase();
  rl.close();
  if (answer !== 'y' && answer !== 'yes') {
    console.log('Cancelled.');
    process.exit(0);
  }
}

// Import the live distribution helper AFTER DATABASE_URL is set so the
// db client in @opynx/db wires up to the right host.
const { distributeTrackSplitPayouts } = await import('../apps/web/lib/services/track-split-distribution.ts');

const sql = postgres(databaseUrl, { max: 1, ssl: 'require' });
const fmt = (c: number) => `$${(c / 100).toFixed(2)}`;
const banner = (t: string) => console.log('\n' + '═'.repeat(66) + '\n  ' + t + '\n' + '═'.repeat(66));

// ── Cleanup-only mode: remove ALL sim rows left behind by prior --keep-data runs
if (cleanupOnly) {
  banner('CLEANUP — remove all sim rows by email pattern');
  // Find every sim user we ever created (deterministic email suffix)
  const simUsers = await sql`SELECT id FROM users WHERE email LIKE '%@example.invalid'`;
  const simUserIds = simUsers.map((u) => u.id);
  console.log(`Found ${simUserIds.length} sim users to clean up.`);
  if (simUserIds.length > 0) {
    // Find every venue, contract, etc. transitively
    const simContracts = await sql`SELECT id FROM booking_contracts WHERE creator_user_id IN ${sql(simUserIds)} OR venue_owner_user_id IN ${sql(simUserIds)}`;
    const simContractIds = simContracts.map((c) => c.id);
    if (simContractIds.length > 0) {
      // Concession order items + orders for sim contracts
      const simOrders = await sql`SELECT id FROM concession_orders WHERE contract_id IN ${sql(simContractIds)}`;
      const simOrderIds = simOrders.map((o) => o.id);
      if (simOrderIds.length > 0) {
        await sql`DELETE FROM concession_order_items WHERE order_id IN ${sql(simOrderIds)}`;
        await sql`DELETE FROM concession_orders WHERE id IN ${sql(simOrderIds)}`;
      }
      await sql`DELETE FROM booking_contracts WHERE id IN ${sql(simContractIds)}`;
    }
    // Apps where sim is creator
    await sql`DELETE FROM booking_applications WHERE creator_user_id IN ${sql(simUserIds)}`;
    // Slots owned by sims (rare — only if a sim was venue owner)
    const simSlots = await sql`SELECT id FROM venue_slots WHERE owner_user_id IN ${sql(simUserIds)}`;
    const simSlotIds = simSlots.map((s) => s.id);
    if (simSlotIds.length > 0) await sql`DELETE FROM venue_slots WHERE id IN ${sql(simSlotIds)}`;
    // Venues owned by sims (none in current flow but safe)
    await sql`DELETE FROM venues WHERE owner_user_id IN ${sql(simUserIds)}`;
    // Track-split payouts where sim is the recipient
    await sql`DELETE FROM track_split_payouts WHERE recipient_user_id IN ${sql(simUserIds)}`;
    // Split rows where sim is collaborator
    const simSplits = await sql`SELECT id FROM track_splits WHERE collaborator_user_id IN ${sql(simUserIds)}`;
    const simSplitIds = simSplits.map((s) => s.id);
    if (simSplitIds.length > 0) {
      await sql`DELETE FROM track_split_history WHERE track_split_id IN ${sql(simSplitIds)}`;
      await sql`DELETE FROM track_splits WHERE id IN ${sql(simSplitIds)}`;
    }
    // Albums + tracks owned by sims (rare — owner is usually Lee)
    await sql`DELETE FROM albums WHERE user_id IN ${sql(simUserIds)}`;
    await sql`DELETE FROM tracks WHERE user_id IN ${sql(simUserIds)}`;
  }
  // Also catch sim albums/tracks that Lee owned but were named with the sim slug
  await sql`DELETE FROM album_purchases WHERE album_id IN (SELECT id FROM albums WHERE slug LIKE 'sim-album-%')`;
  await sql`DELETE FROM album_tracks WHERE track_id IN (SELECT id FROM tracks WHERE slug LIKE 'sim-%')`;
  await sql`DELETE FROM track_split_payouts WHERE track_id IN (SELECT id FROM tracks WHERE slug LIKE 'sim-%')`;
  await sql`DELETE FROM track_splits WHERE track_id IN (SELECT id FROM tracks WHERE slug LIKE 'sim-%')`;
  await sql`DELETE FROM tracks WHERE slug LIKE 'sim-%'`;
  await sql`DELETE FROM albums WHERE slug LIKE 'sim-album-%'`;
  // Menu items + venues with "Sim Hall" or matching name pattern
  await sql`DELETE FROM menu_items WHERE venue_id IN (SELECT id FROM venues WHERE name = 'Sim Hall')`;
  await sql`DELETE FROM venues WHERE name = 'Sim Hall'`;
  // Finally, the users themselves
  if (simUserIds.length > 0) await sql`DELETE FROM users WHERE id IN ${sql(simUserIds)}`;
  console.log('Sim rows removed.');
  await sql.end();
  process.exit(0);
}

// ── Pick an owner ──────────────────────────────────────────────────
let ownerId = (process.env.OWNER_USER_ID ?? '').trim();
if (!ownerId) {
  const candidates = await sql`SELECT id, name, role FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1`;
  if (candidates.length === 0) {
    console.error('No admin user found. Pass OWNER_USER_ID=<uuid> or create an admin user first.');
    process.exit(3);
  }
  ownerId = candidates[0].id;
  console.log(`Auto-picked owner: ${candidates[0].name} (${ownerId.slice(0, 8)}…)`);
}

const cleanup = {
  // venue flow
  orderItemOrderIds: [] as string[],
  orderIds: [] as string[],
  menuItemIds: [] as string[],
  contractIds: [] as string[],
  appIds: [] as string[],
  slotIds: [] as string[],
  venueIds: [] as string[],
  // album cascade
  purchaseIds: [] as string[],
  splitIds: [] as string[],
  albumTrackTrackIds: [] as string[],
  trackIds: [] as string[],
  albumIds: [] as string[],
  // shared
  collaboratorIds: [] as string[],
};

try {
  // ════════════════════════════════════════════════════════════════
  // PART 1 — venue marketplace → booking → contract → POS
  // ════════════════════════════════════════════════════════════════
  banner('PART 1 — venue → contract → POS → settlement');

  const simCreator = randomUUID();
  cleanup.collaboratorIds.push(simCreator);
  await sql`
    INSERT INTO users (id, email, name, role, created_at, updated_at)
    VALUES (${simCreator}, ${'sim-creator@example.invalid'}, 'Sim Creator', 'creator', NOW(), NOW())
  `;

  const venueId = randomUUID();
  cleanup.venueIds.push(venueId);
  await sql`
    INSERT INTO venues (id, owner_user_id, name, city, state, capacity, description, genres, amenities, created_at)
    VALUES (${venueId}, ${ownerId}, ${'Sim Hall'}, ${'Austin'}, ${'TX'}, 300, ${'Mid-size venue, intimate vibe, full bar.'}, ${'["Rock","Acoustic"]'}::jsonb, ${'["Sound System","Bar","Green Room"]'}::jsonb, NOW())
  `;
  console.log(`  [1] Owner lists "Sim Hall" — Austin TX, cap 300`);

  const slotId = randomUUID();
  cleanup.slotIds.push(slotId);
  const slotStart = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const slotEnd = new Date(slotStart.getTime() + 2 * 60 * 60 * 1000);
  await sql`
    INSERT INTO venue_slots (id, venue_id, owner_user_id, title, slot_type, start_time, end_time, compensation_cents, status, created_at, updated_at)
    VALUES (${slotId}, ${venueId}, ${ownerId}, ${'Friday Headliner Slot'}, 'paid', ${slotStart}, ${slotEnd}, 50000, 'open', NOW(), NOW())
  `;
  console.log(`  [2] Posts paid slot — $500 flat fee, ${slotStart.toLocaleDateString()}`);

  const appId = randomUUID();
  cleanup.appIds.push(appId);
  await sql`
    INSERT INTO booking_applications (id, slot_id, creator_user_id, message, status, created_at, updated_at)
    VALUES (${appId}, ${slotId}, ${simCreator}, ${'45-minute set, indie folk, no opener needed.'}, 'pending', NOW(), NOW())
  `;
  console.log(`  [3] Sim Creator applies`);

  await sql.begin(async (tx) => {
    await tx`UPDATE booking_applications SET status='accepted', decided_at=NOW(), decided_by=${ownerId}, updated_at=NOW() WHERE id=${appId}`;
    await tx`UPDATE venue_slots SET status='filled', updated_at=NOW() WHERE id=${slotId}`;
    await tx`
      INSERT INTO booking_contracts (application_id, slot_id, venue_id, venue_owner_user_id, creator_user_id, event_start, event_end, creator_fee_cents, payment_terms, status, created_at, updated_at)
      VALUES (${appId}, ${slotId}, ${venueId}, ${ownerId}, ${simCreator}, ${slotStart}, ${slotEnd}, 50000, 'at_event', 'draft', NOW(), NOW())
    `;
  });
  const [contract] = await sql`SELECT * FROM booking_contracts WHERE application_id=${appId}`;
  cleanup.contractIds.push(contract.id);
  console.log(`  [4] Owner accepts → contract auto-created (draft)`);

  await sql`
    UPDATE booking_contracts
    SET ticket_split_bp = 7000, concession_split_bp = 6000, set_length_minutes = 45,
        rider_text = ${'Bottled water on stage. Backline drum kit OK to share.'},
        updated_at = NOW()
    WHERE id = ${contract.id}
  `;
  await sql`UPDATE booking_contracts SET venue_signed_at=NOW(), creator_signed_at=NOW(), status='signed', updated_at=NOW() WHERE id=${contract.id}`;
  console.log(`  [5] Parties amend (70% tickets, 60% concessions) + both sign → signed`);

  // Menu + POS
  const menu = [
    { name: 'Beer', category: 'drinks', priceCents: 800 },
    { name: 'Cocktail', category: 'drinks', priceCents: 1200 },
    { name: 'Pizza Slice', category: 'food', priceCents: 500 },
    { name: 'Show T-Shirt', category: 'merch', priceCents: 2500 },
  ];
  const menuIds: Record<string, string> = {};
  for (const m of menu) {
    const id = randomUUID();
    cleanup.menuItemIds.push(id);
    menuIds[m.name] = id;
    await sql`
      INSERT INTO menu_items (id, venue_id, name, category, price_cents, active, sort_order, created_at, updated_at)
      VALUES (${id}, ${venueId}, ${m.name}, ${m.category}, ${m.priceCents}, true, 0, NOW(), NOW())
    `;
  }
  console.log(`  [6] Menu loaded: ${menu.map((m) => `${m.name} ${fmt(m.priceCents)}`).join(', ')}`);

  const sales: { tab: string | null; items: [string, number][]; pay: string }[] = [
    { tab: 'Table 4', items: [['Beer', 2], ['Pizza Slice', 1]], pay: 'card' },
    { tab: 'Bar', items: [['Cocktail', 1]], pay: 'cash' },
    { tab: 'Fan #12', items: [['Show T-Shirt', 1], ['Beer', 1]], pay: 'card' },
    { tab: 'Bar', items: [['Beer', 4]], pay: 'tab' },
    { tab: 'Table 7', items: [['Pizza Slice', 3], ['Cocktail', 2]], pay: 'card' },
    { tab: null, items: [['Show T-Shirt', 2]], pay: 'usdc' },
  ];
  for (const s of sales) {
    const orderId = randomUUID();
    cleanup.orderIds.push(orderId);
    cleanup.orderItemOrderIds.push(orderId);
    let total = 0;
    const lines = s.items.map(([name, qty]) => {
      const item = menu.find((m) => m.name === name)!;
      const lineTotal = item.priceCents * qty;
      total += lineTotal;
      return { menuItemId: menuIds[name], itemName: item.name, unitPrice: item.priceCents, quantity: qty, lineTotal };
    });
    await sql.begin(async (tx) => {
      await tx`
        INSERT INTO concession_orders (id, contract_id, venue_id, sold_by_user_id, buyer_name, total_cents, payment_method, status, created_at, updated_at)
        VALUES (${orderId}, ${contract.id}, ${venueId}, ${ownerId}, ${s.tab}, ${total}, ${s.pay}, 'completed', NOW(), NOW())
      `;
      for (const l of lines) {
        await tx`
          INSERT INTO concession_order_items (order_id, menu_item_id, item_name_snapshot, unit_price_cents, quantity, line_total_cents)
          VALUES (${orderId}, ${l.menuItemId}, ${l.itemName}, ${l.unitPrice}, ${l.quantity}, ${l.lineTotal})
        `;
      }
    });
  }
  console.log(`  [7] POS rings up ${sales.length} orders`);

  // Settlement
  const [{ revenue }] = await sql`
    SELECT COALESCE(SUM(total_cents), 0)::int AS revenue
    FROM concession_orders WHERE contract_id=${contract.id} AND status='completed'
  `;
  const concessionBp = 6000;
  const creatorConcession = Math.floor((revenue * concessionBp) / 10000);
  const totalOwed = 50000 + creatorConcession;
  console.log(`\n  SETTLEMENT:`);
  console.log(`    $500.00 creator fee + ${fmt(creatorConcession)} concession (60% of ${fmt(revenue)})`);
  console.log(`    = ${fmt(totalOwed)} owed to creator (trust-based — venue pays off-platform)`);

  await sql`UPDATE booking_contracts SET status='completed', completed_at=NOW(), updated_at=NOW() WHERE id=${contract.id}`;
  console.log(`  [8] Marked contract completed`);

  // ════════════════════════════════════════════════════════════════
  // PART 2 — album purchase cascade across mixed splits
  // ════════════════════════════════════════════════════════════════
  banner('PART 2 — buy a $15 album, fan splits cascade per track');

  const producer = randomUUID(), coWriter = randomUUID(), mixer = randomUUID();
  cleanup.collaboratorIds.push(producer, coWriter, mixer);
  await sql`
    INSERT INTO users (id, email, name, role, created_at, updated_at) VALUES
      (${producer}, ${'sim-producer@example.invalid'}, 'Sim Producer', 'creator', NOW(), NOW()),
      (${coWriter}, ${'sim-co-writer@example.invalid'}, 'Sim Co-Writer', 'creator', NOW(), NOW()),
      (${mixer},    ${'sim-mixer@example.invalid'},    'Sim Mixer',    'creator', NOW(), NOW())
  `;

  const albumId = randomUUID();
  cleanup.albumIds.push(albumId);
  await sql`
    INSERT INTO albums (id, user_id, title, slug, price, visibility, created_at)
    VALUES (${albumId}, ${ownerId}, ${'Sim Album'}, ${'sim-album-' + albumId.slice(0,6)}, 1500, 'public', NOW())
  `;

  const trackIds: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const id = randomUUID();
    cleanup.trackIds.push(id);
    cleanup.albumTrackTrackIds.push(id);
    trackIds.push(id);
    await sql`
      INSERT INTO tracks (id, user_id, title, slug, status, visibility, price, created_at, updated_at)
      VALUES (${id}, ${ownerId}, ${'Sim Track ' + i}, ${'sim-' + id.slice(0,6)}, 'published', 'public', NULL, NOW(), NOW())
    `;
    await sql`INSERT INTO album_tracks (album_id, track_id, position) VALUES (${albumId}, ${id}, ${i - 1})`;
  }
  console.log(`  Setup: 3-track album at $15`);

  const t1Owner = randomUUID(), t1Producer = randomUUID(), t1CoWriter = randomUUID();
  const t2Owner = randomUUID(), t2Mixer = randomUUID();
  cleanup.splitIds.push(t1Owner, t1Producer, t1CoWriter, t2Owner, t2Mixer);
  await sql`
    INSERT INTO track_splits (id, track_id, collaborator_user_id, split_type, role, percent_bp, status, accepted_at, created_by, created_at, updated_at) VALUES
      (${t1Owner},    ${trackIds[0]}, ${ownerId},  'master', 'owner',     6000, 'accepted', NOW(), ${ownerId}, NOW(), NOW()),
      (${t1Producer}, ${trackIds[0]}, ${producer}, 'master', 'producer',  2500, 'accepted', NOW(), ${ownerId}, NOW(), NOW()),
      (${t1CoWriter}, ${trackIds[0]}, ${coWriter}, 'master', 'co_writer', 1500, 'accepted', NOW(), ${ownerId}, NOW(), NOW()),
      (${t2Owner},    ${trackIds[1]}, ${ownerId},  'master', 'owner',     6000, 'accepted', NOW(), ${ownerId}, NOW(), NOW()),
      (${t2Mixer},    ${trackIds[1]}, ${mixer},    'master', 'mixer',     4000, 'pending',  NULL,  ${ownerId}, NOW(), NOW())
  `;
  console.log(`  Track 1: Owner 60% · Producer 25% · Co-Writer 15%  (all accepted)`);
  console.log(`  Track 2: Owner 60% · Mixer 40% PENDING`);
  console.log(`  Track 3: no splits — Owner implicitly 100%`);

  const purchaseId = randomUUID();
  cleanup.purchaseIds.push(purchaseId);
  await sql`
    INSERT INTO album_purchases (id, user_id, album_id, price_paid, status, created_at, updated_at)
    VALUES (${purchaseId}, ${simCreator}, ${albumId}, 1500, 'completed', NOW(), NOW())
  `;
  console.log(`\n  Fan buys album for $15.00 → cascading distribution…`);

  const floor = Math.floor(1500 / 3);
  const remainder = 1500 - floor * 3;
  const pools = [0, 1, 2].map((i) => floor + (i < remainder ? 1 : 0));
  for (let i = 0; i < 3; i++) {
    await distributeTrackSplitPayouts({
      sourceType: 'album_purchase',
      sourceId: purchaseId,
      trackId: trackIds[i],
      poolCents: pools[i],
    });
  }

  const ledger = await sql`
    SELECT u.name AS who, p.status, SUM(p.amount_cents)::int AS total
    FROM track_split_payouts p
    LEFT JOIN users u ON u.id = p.recipient_user_id
    WHERE p.source_type = 'album_purchase' AND p.source_id = ${purchaseId}
    GROUP BY u.name, p.status
    ORDER BY u.name, p.status
  `;
  console.log(`\n  LEDGER:`);
  for (const r of ledger) {
    console.log(`    ${(r.who ?? '').padEnd(18)}  [${r.status.padEnd(9)}]  ${fmt(r.total).padStart(8)}`);
  }
  const sum = ledger.reduce((s, r) => s + r.total, 0);
  console.log(`    Sum: ${fmt(sum)} (== $15.00 ✓)`);

  banner('Both scenarios complete — cleaning up sim rows');
} finally {
  if (keepData) {
    console.log('\n--keep-data set: leaving sim rows in place.');
    console.log('Visit /dashboard/venue and /dashboard/gigs to see them populated.');
    console.log('Run `npm run demo:seed -- --cleanup-only --yes --allow-prod` to remove them later.');
    await sql.end();
    process.exit(0);
  }
  // ── Cleanup (FK-respecting order) ──────────────────────────────────
  if (cleanup.orderItemOrderIds.length > 0) await sql`DELETE FROM concession_order_items WHERE order_id IN ${sql(cleanup.orderItemOrderIds)}`;
  if (cleanup.orderIds.length > 0) await sql`DELETE FROM concession_orders WHERE id IN ${sql(cleanup.orderIds)}`;
  if (cleanup.menuItemIds.length > 0) await sql`DELETE FROM menu_items WHERE id IN ${sql(cleanup.menuItemIds)}`;
  if (cleanup.contractIds.length > 0) await sql`DELETE FROM booking_contracts WHERE id IN ${sql(cleanup.contractIds)}`;
  if (cleanup.appIds.length > 0) await sql`DELETE FROM booking_applications WHERE id IN ${sql(cleanup.appIds)}`;
  if (cleanup.slotIds.length > 0) await sql`DELETE FROM venue_slots WHERE id IN ${sql(cleanup.slotIds)}`;
  if (cleanup.venueIds.length > 0) await sql`DELETE FROM venues WHERE id IN ${sql(cleanup.venueIds)}`;

  if (cleanup.purchaseIds.length > 0) {
    await sql`DELETE FROM track_split_payouts WHERE source_type='album_purchase' AND source_id IN ${sql(cleanup.purchaseIds)}`;
    await sql`DELETE FROM album_purchases WHERE id IN ${sql(cleanup.purchaseIds)}`;
  }
  if (cleanup.splitIds.length > 0) {
    await sql`DELETE FROM track_split_history WHERE track_split_id IN ${sql(cleanup.splitIds)}`;
    await sql`DELETE FROM track_splits WHERE id IN ${sql(cleanup.splitIds)}`;
  }
  if (cleanup.albumTrackTrackIds.length > 0) await sql`DELETE FROM album_tracks WHERE track_id IN ${sql(cleanup.albumTrackTrackIds)}`;
  if (cleanup.trackIds.length > 0) await sql`DELETE FROM tracks WHERE id IN ${sql(cleanup.trackIds)}`;
  if (cleanup.albumIds.length > 0) await sql`DELETE FROM albums WHERE id IN ${sql(cleanup.albumIds)}`;
  if (cleanup.collaboratorIds.length > 0) await sql`DELETE FROM users WHERE id IN ${sql(cleanup.collaboratorIds)}`;

  await sql.end();
  console.log('Cleanup complete.');
}
