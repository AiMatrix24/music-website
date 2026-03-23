import postgres from 'postgres';

const sql = postgres(
  process.env.DATABASE_URL ?? 'postgresql://opynx:opynx_dev@localhost:5432/opynx'
);

async function seed() {
  console.log('Seeding database...');

  // Clean existing seed data
  await sql`DELETE FROM comments`;
  await sql`DELETE FROM likes`;
  await sql`DELETE FROM reposts`;
  await sql`DELETE FROM playlist_tracks`;
  await sql`DELETE FROM playlists`;
  await sql`DELETE FROM album_tracks`;
  await sql`DELETE FROM albums`;
  await sql`DELETE FROM tracks`;
  await sql`DELETE FROM order_items`;
  await sql`DELETE FROM orders`;
  await sql`DELETE FROM listings`;
  await sql`DELETE FROM tickets`;
  await sql`DELETE FROM ticket_types`;
  await sql`DELETE FROM event_facilitators`;
  await sql`DELETE FROM events`;
  await sql`DELETE FROM venues`;
  await sql`DELETE FROM event_series`;
  await sql`DELETE FROM article_categories`;
  await sql`DELETE FROM articles`;
  await sql`DELETE FROM categories`;
  await sql`DELETE FROM commissions`;
  await sql`DELETE FROM payout_batches`;
  await sql`DELETE FROM attributions`;
  await sql`DELETE FROM scan_logs`;
  await sql`DELETE FROM sub_events`;
  await sql`DELETE FROM subscriptions`;
  await sql`DELETE FROM oauth_connections`;
  await sql`DELETE FROM follows`;
  await sql`DELETE FROM taggables`;
  await sql`DELETE FROM tags`;
  await sql`DELETE FROM sessions`;
  await sql`DELETE FROM users`;

  // ─── Users (Artists) ───
  const artists = await sql`
    INSERT INTO users (email, name, avatar, role) VALUES
      ('nova@opynx.dev', 'Nova Synthwave', null, 'creator'),
      ('luna@opynx.dev', 'Luna Beats', null, 'creator'),
      ('atlas@opynx.dev', 'Atlas & The Wanderers', null, 'creator'),
      ('cipher@opynx.dev', 'Cipher', null, 'creator'),
      ('echo@opynx.dev', 'Echo Chamber', null, 'creator'),
      ('velvet@opynx.dev', 'Velvet Underground Revival', null, 'creator')
    RETURNING id, name
  `;
  console.log(`Created ${artists.length} artists`);

  // ─── Users (Fans) ───
  const fans = await sql`
    INSERT INTO users (email, name, role) VALUES
      ('fan1@opynx.dev', 'Alex Rivera', 'subscriber'),
      ('fan2@opynx.dev', 'Jordan Kim', 'subscriber'),
      ('fan3@opynx.dev', 'Sam Chen', 'free')
    RETURNING id, name
  `;
  console.log(`Created ${fans.length} fans`);

  // ─── Users (Facilitators) ───
  const facilitators = await sql`
    INSERT INTO users (email, name, role) VALUES
      ('fac1@opynx.dev', 'Maria Gonzalez', 'facilitator'),
      ('fac2@opynx.dev', 'DJ TechVibe', 'facilitator')
    RETURNING id, name
  `;
  console.log(`Created ${facilitators.length} facilitators`);

  // ─── Subscriptions ───
  await sql`
    INSERT INTO subscriptions (user_id, tier, status, billing_cycle) VALUES
      (${fans[0].id}, 'premium', 'active', 'monthly'),
      (${fans[1].id}, 'bundle', 'active', 'monthly'),
      (${fans[2].id}, 'free', 'active', 'monthly')
  `;
  console.log('Created subscriptions');

  // ─── Tracks ───
  const tracks = await sql`
    INSERT INTO tracks (user_id, title, slug, genre, bpm, duration, visibility, status, play_count, price) VALUES
      (${artists[0].id}, 'Midnight Drive', 'midnight-drive', 'Synthwave', 120, 245, 'public', 'published', 12847, null),
      (${artists[0].id}, 'Neon Horizon', 'neon-horizon', 'Synthwave', 128, 312, 'public', 'published', 8932, null),
      (${artists[0].id}, 'Retrograde', 'retrograde', 'Synthwave', 110, 198, 'public', 'published', 5621, null),
      (${artists[1].id}, 'Lunar Eclipse', 'lunar-eclipse', 'Lo-fi Hip Hop', 85, 187, 'public', 'published', 23410, null),
      (${artists[1].id}, 'Stargazer', 'stargazer', 'Lo-fi Hip Hop', 90, 224, 'public', 'published', 18765, null),
      (${artists[1].id}, 'Dreamscape', 'dreamscape', 'Ambient', 75, 356, 'public', 'published', 9543, null),
      (${artists[2].id}, 'Lost Highway', 'lost-highway', 'Indie Rock', 140, 267, 'public', 'published', 31204, null),
      (${artists[2].id}, 'Desert Wind', 'desert-wind', 'Indie Rock', 135, 289, 'public', 'published', 15678, null),
      (${artists[3].id}, 'Binary Sunset', 'binary-sunset', 'Electronic', 138, 312, 'public', 'published', 45102, null),
      (${artists[3].id}, 'Zero Day', 'zero-day', 'Electronic', 145, 278, 'public', 'published', 28934, null),
      (${artists[3].id}, 'Encryption', 'encryption', 'Electronic', 130, 245, 'public', 'published', 19876, null),
      (${artists[4].id}, 'Reverb City', 'reverb-city', 'Post-Punk', 125, 234, 'public', 'published', 7654, null),
      (${artists[4].id}, 'Feedback Loop', 'feedback-loop', 'Post-Punk', 118, 198, 'public', 'published', 4321, null),
      (${artists[5].id}, 'Underground Sessions', 'underground-sessions', 'Alternative', 105, 412, 'public', 'published', 6789, null),
      (${artists[5].id}, 'Pale Blue Eyes Reimagined', 'pale-blue-eyes-reimagined', 'Alternative', 95, 345, 'public', 'published', 11234, null)
    RETURNING id, title
  `;
  console.log(`Created ${tracks.length} tracks`);

  // ─── Albums ───
  const albums = await sql`
    INSERT INTO albums (user_id, title, slug, visibility, price) VALUES
      (${artists[0].id}, 'Neon Nights', 'neon-nights', 'public', 999),
      (${artists[1].id}, 'Moonlit Frequencies', 'moonlit-frequencies', 'public', 799),
      (${artists[2].id}, 'Wanderer Chronicles', 'wanderer-chronicles', 'public', 1299),
      (${artists[3].id}, 'System Override', 'system-override', 'public', 999)
    RETURNING id, title
  `;
  console.log(`Created ${albums.length} albums`);

  // ─── Album Tracks ───
  await sql`
    INSERT INTO album_tracks (album_id, track_id, position) VALUES
      (${albums[0].id}, ${tracks[0].id}, 1),
      (${albums[0].id}, ${tracks[1].id}, 2),
      (${albums[0].id}, ${tracks[2].id}, 3),
      (${albums[1].id}, ${tracks[3].id}, 1),
      (${albums[1].id}, ${tracks[4].id}, 2),
      (${albums[1].id}, ${tracks[5].id}, 3),
      (${albums[2].id}, ${tracks[6].id}, 1),
      (${albums[2].id}, ${tracks[7].id}, 2),
      (${albums[3].id}, ${tracks[8].id}, 1),
      (${albums[3].id}, ${tracks[9].id}, 2),
      (${albums[3].id}, ${tracks[10].id}, 3)
  `;
  console.log('Linked album tracks');

  // ─── Venues ───
  const venues = await sql`
    INSERT INTO venues (name, address, lat, lng, capacity, geofence_radius) VALUES
      ('The Warehouse', '123 Industrial Blvd, Los Angeles, CA', 34.0407, -118.2468, 500, 75),
      ('Neon Garden', '456 Music Row, Nashville, TN', 36.1539, -86.7734, 1200, 100),
      ('Digital Arena', '789 Tech Ave, Austin, TX', 30.2672, -97.7431, 3000, 150),
      ('The Basement', '321 Underground St, New York, NY', 40.7282, -73.7949, 200, 50)
    RETURNING id, name
  `;
  console.log(`Created ${venues.length} venues`);

  // ─── Events ───
  const events = await sql`
    INSERT INTO events (host_id, title, start_date, end_date, venue_id, country_code, timezone, status, capacity) VALUES
      (${artists[0].id}, 'Neon Nights Tour — LA', ${new Date('2026-04-15T20:00:00')}, ${new Date('2026-04-15T23:30:00')}, ${venues[0].id}, 'US', 'America/Los_Angeles', 'published', 500),
      (${artists[2].id}, 'Wanderer Festival', ${new Date('2026-05-20T18:00:00')}, ${new Date('2026-05-21T02:00:00')}, ${venues[1].id}, 'US', 'America/Chicago', 'published', 1200),
      (${artists[3].id}, 'System Override — Live', ${new Date('2026-06-10T21:00:00')}, ${new Date('2026-06-11T01:00:00')}, ${venues[2].id}, 'US', 'America/Chicago', 'published', 3000),
      (${artists[4].id}, 'Echo in the Basement', ${new Date('2026-04-05T22:00:00')}, ${new Date('2026-04-06T02:00:00')}, ${venues[3].id}, 'US', 'America/New_York', 'published', 200),
      (${artists[1].id}, 'Luna Beats — Listening Party', ${new Date('2026-04-25T19:00:00')}, ${new Date('2026-04-25T22:00:00')}, null, 'US', 'America/Los_Angeles', 'published', null)
    RETURNING id, title
  `;
  console.log(`Created ${events.length} events`);

  // ─── Ticket Types ───
  await sql`
    INSERT INTO ticket_types (event_id, name, tier, price, quantity, sold) VALUES
      (${events[0].id}, 'General Admission', 'general', 2500, 400, 156),
      (${events[0].id}, 'VIP', 'vip', 7500, 100, 34),
      (${events[1].id}, 'Early Bird', 'early_bird', 3500, 300, 300),
      (${events[1].id}, 'General', 'general', 5000, 700, 412),
      (${events[1].id}, 'VIP', 'vip', 12000, 200, 87),
      (${events[2].id}, 'General', 'general', 4500, 2500, 1823),
      (${events[2].id}, 'VIP', 'vip', 15000, 500, 198),
      (${events[3].id}, 'Free Entry', 'free', 0, 200, 145)
  `;
  console.log('Created ticket types');

  // ─── Marketplace Listings ───
  await sql`
    INSERT INTO listings (seller_id, title, description, category, price, currency, stock, status) VALUES
      (${artists[0].id}, 'Neon Nights Vinyl LP', 'Limited edition vinyl pressing of the debut album. 180g heavyweight vinyl.', 'physical_music', 3499, 'USD', 50, 'active'),
      (${artists[2].id}, 'Wanderer Tour T-Shirt', 'Official tour merch. 100% organic cotton. Sizes S-XXL.', 'merch', 2999, 'USD', 200, 'active'),
      (${artists[3].id}, 'Signed System Override Poster', '18x24 matte poster signed by Cipher. Limited to 100.', 'merch', 4999, 'USD', 100, 'active'),
      (${facilitators[1].id}, 'Pioneer DDJ-400 Controller', 'Lightly used DJ controller. Great for beginners. Includes USB cable.', 'used_gear', 17500, 'USD', 1, 'active'),
      (${artists[1].id}, 'Custom Beat Production', 'I will produce a custom lo-fi beat tailored to your vibe. 2-week delivery.', 'services', 15000, 'USD', 10, 'active'),
      (${artists[5].id}, 'Underground Sessions Cassette', 'Limited run cassette tape. Includes bonus tracks not on streaming.', 'physical_music', 1499, 'USD', 25, 'active')
  `;
  console.log('Created marketplace listings');

  // ─── Follows ───
  await sql`
    INSERT INTO follows (follower_id, followee_id) VALUES
      (${fans[0].id}, ${artists[0].id}),
      (${fans[0].id}, ${artists[3].id}),
      (${fans[1].id}, ${artists[1].id}),
      (${fans[1].id}, ${artists[2].id}),
      (${fans[1].id}, ${artists[3].id}),
      (${fans[2].id}, ${artists[0].id})
  `;
  console.log('Created follows');

  // ─── Tags ───
  const tags = await sql`
    INSERT INTO tags (name) VALUES
      ('synthwave'), ('electronic'), ('lo-fi'), ('indie-rock'),
      ('post-punk'), ('ambient'), ('alternative'), ('live')
    RETURNING id, name
  `;
  console.log(`Created ${tags.length} tags`);

  // ─── Articles ───
  await sql`
    INSERT INTO articles (author_id, title, slug, excerpt, status, content_locale, published_at) VALUES
      (${artists[0].id}, 'How Transparent Revenue Sharing is Changing Music', 'transparent-revenue-sharing', 'The music industry has always been opaque about money. OPYNX is changing that with on-chain payouts.', 'public', 'en', ${new Date('2026-03-01')}),
      (${artists[3].id}, 'The Future of Live Music x Web3', 'future-live-music-web3', 'Why QR-based attribution and crypto payouts are the next evolution in live events.', 'public', 'en', ${new Date('2026-03-10')}),
      (${artists[1].id}, 'Making Lo-fi Beats: My Process', 'making-lofi-beats-process', 'A behind-the-scenes look at how I create the beats you hear on Moonlit Frequencies.', 'public', 'en', ${new Date('2026-03-15')})
  `;
  console.log('Created articles');

  // ─── Playlists ───
  const playlistData = await sql`
    INSERT INTO playlists (user_id, title, description, visibility) VALUES
      (${fans[0].id}, 'Late Night Synthwave', 'Perfect for midnight coding sessions.', 'public'),
      (${fans[1].id}, 'Chill Lo-fi Vibes', 'Relaxing beats for studying and focus.', 'public'),
      (${artists[3].id}, 'Cipher''s Favorites', 'Tracks that inspire my own production.', 'public'),
      (${fans[2].id}, 'Indie Discovery', 'New indie rock and alternative finds.', 'public')
    RETURNING id, title
  `;
  console.log(`Created ${playlistData.length} playlists`);

  // ─── Playlist Tracks ───
  await sql`
    INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES
      (${playlistData[0].id}, ${tracks[0].id}, 1),
      (${playlistData[0].id}, ${tracks[1].id}, 2),
      (${playlistData[0].id}, ${tracks[2].id}, 3),
      (${playlistData[0].id}, ${tracks[8].id}, 4),
      (${playlistData[1].id}, ${tracks[3].id}, 1),
      (${playlistData[1].id}, ${tracks[4].id}, 2),
      (${playlistData[1].id}, ${tracks[5].id}, 3),
      (${playlistData[2].id}, ${tracks[6].id}, 1),
      (${playlistData[2].id}, ${tracks[7].id}, 2),
      (${playlistData[2].id}, ${tracks[11].id}, 3),
      (${playlistData[2].id}, ${tracks[14].id}, 4),
      (${playlistData[3].id}, ${tracks[6].id}, 1),
      (${playlistData[3].id}, ${tracks[7].id}, 2),
      (${playlistData[3].id}, ${tracks[13].id}, 3)
  `;
  console.log('Linked playlist tracks');

  console.log('\nSeed complete!');
  await sql.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
