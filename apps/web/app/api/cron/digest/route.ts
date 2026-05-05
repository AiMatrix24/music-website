import { NextResponse } from 'next/server';
import { eq, and, gte, sql, or, isNull, lt } from 'drizzle-orm';
import { db } from '@opynx/db';
import { users, follows, trackPlays, tracks, tips } from '@opynx/db/schema';
import { sendEmail } from '@/lib/services/email-sender';

/**
 * Weekly email digest — runs daily, but only fires for users who opted in
 * AND haven't received a digest in the last 6 days. Effectively weekly per
 * user, but spread across the week rather than spiking on Monday.
 *
 * Auth: same Bearer-CRON_SECRET pattern as reap-pending.
 *
 * Computes per opted-in user (last 7 days):
 *   - new follower count
 *   - total plays on their tracks
 *   - tip count + total amount (cents)
 *
 * Skips users with zero activity to avoid empty-digest spam. Stamps
 * users.lastDigestSentAt on every send so the cooldown advances even when
 * nothing was eventful this week.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const COOLDOWN_DAYS = 6;
const WINDOW_DAYS = 7;

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const now = new Date();
  const cooldownCutoff = new Date(now.getTime() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
  const windowStart = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  // Eligible recipients: digest_weekly=true AND (never sent OR last sent > cooldown)
  const eligible = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(
      and(
        eq(users.digestWeekly, true),
        or(isNull(users.lastDigestSentAt), lt(users.lastDigestSentAt, cooldownCutoff))
      )
    );

  let sent = 0;
  let skippedNoActivity = 0;
  let skippedNoEmail = 0;
  const errors: string[] = [];

  for (const u of eligible) {
    try {
      // Count new followers in window
      const [followRow] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(follows)
        .where(and(eq(follows.followeeId, u.id), gte(follows.createdAt, windowStart)));
      const newFollowers = Number(followRow?.count ?? 0);

      // Sum plays across user's tracks in window (join via tracks.userId)
      const [playRow] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(trackPlays)
        .innerJoin(tracks, eq(trackPlays.trackId, tracks.id))
        .where(and(eq(tracks.userId, u.id), gte(trackPlays.playedAt, windowStart)));
      const newPlays = Number(playRow?.count ?? 0);

      // Tips received in window (status=completed only — pending/cancelled don't count)
      const [tipRow] = await db
        .select({
          count: sql<number>`COUNT(*)::int`,
          sumCents: sql<number>`COALESCE(SUM(${tips.amount}), 0)::int`,
        })
        .from(tips)
        .where(
          and(
            eq(tips.recipientUserId, u.id),
            eq(tips.status, 'completed'),
            gte(tips.createdAt, windowStart)
          )
        );
      const tipCount = Number(tipRow?.count ?? 0);
      const tipTotalCents = Number(tipRow?.sumCents ?? 0);

      const hasActivity = newFollowers > 0 || newPlays > 0 || tipCount > 0;
      if (!hasActivity) {
        skippedNoActivity++;
        // Still stamp lastDigestSentAt so the user's cooldown advances and
        // we don't recompute their stats every day until they have activity.
        await db.update(users).set({ lastDigestSentAt: now }).where(eq(users.id, u.id));
        continue;
      }

      if (!u.email) {
        skippedNoEmail++;
        continue;
      }

      const html = renderDigestHtml({
        name: u.name ?? 'Creator',
        newFollowers,
        newPlays,
        tipCount,
        tipTotalCents,
      });

      const result = await sendEmail({
        to: u.email,
        subject: 'Your week on OPYNX',
        html,
      });
      if (!result.success) {
        errors.push(`${u.id}: ${result.error ?? 'unknown'}`);
        continue;
      }

      await db.update(users).set({ lastDigestSentAt: now }).where(eq(users.id, u.id));
      sent++;
    } catch (err) {
      errors.push(`${u.id}: ${(err as Error).message ?? String(err)}`);
    }
  }

  console.log(
    `[Cron digest] eligible=${eligible.length} sent=${sent} ` +
      `skippedNoActivity=${skippedNoActivity} skippedNoEmail=${skippedNoEmail} ` +
      `errors=${errors.length}`
  );

  return NextResponse.json({
    ok: true,
    eligible: eligible.length,
    sent,
    skippedNoActivity,
    skippedNoEmail,
    errors: errors.slice(0, 20),
  });
}

function renderDigestHtml(args: {
  name: string;
  newFollowers: number;
  newPlays: number;
  tipCount: number;
  tipTotalCents: number;
}): string {
  const dollars = (args.tipTotalCents / 100).toFixed(2);
  return `
    <!doctype html>
    <html>
      <body style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #fff; background: #0a0a12;">
        <div style="background: linear-gradient(135deg, #15151f, #1a1a2e); border-radius: 16px; padding: 32px;">
          <h1 style="margin: 0 0 8px; font-size: 24px;">Hey ${escapeHtml(args.name)} —</h1>
          <p style="margin: 0 0 24px; color: #aaa;">Here's your week on OPYNX:</p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
            <div style="background: #0a0a12; border: 1px solid #2a2a3a; border-radius: 12px; padding: 16px;">
              <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 0.05em;">New followers</p>
              <p style="margin: 4px 0 0; font-size: 28px; font-weight: 900; color: #ef4444;">${args.newFollowers}</p>
            </div>
            <div style="background: #0a0a12; border: 1px solid #2a2a3a; border-radius: 12px; padding: 16px;">
              <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 0.05em;">Plays</p>
              <p style="margin: 4px 0 0; font-size: 28px; font-weight: 900; color: #ef4444;">${args.newPlays.toLocaleString()}</p>
            </div>
            <div style="background: #0a0a12; border: 1px solid #2a2a3a; border-radius: 12px; padding: 16px;">
              <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 0.05em;">Tips</p>
              <p style="margin: 4px 0 0; font-size: 28px; font-weight: 900; color: #ef4444;">${args.tipCount}</p>
            </div>
            <div style="background: #0a0a12; border: 1px solid #2a2a3a; border-radius: 12px; padding: 16px;">
              <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 0.05em;">Tipped</p>
              <p style="margin: 4px 0 0; font-size: 28px; font-weight: 900; color: #ef4444;">$${dollars}</p>
            </div>
          </div>

          <a href="https://opynx.com/dashboard" style="display: inline-block; background: #ef4444; color: #fff; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 700;">Open dashboard →</a>

          <p style="margin: 32px 0 0; color: #666; font-size: 11px;">
            You're getting this because you opted into the weekly digest in your <a href="https://opynx.com/settings" style="color: #888;">settings</a>.
          </p>
        </div>
      </body>
    </html>
  `;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]!));
}
