/**
 * Email Template Generator for Resend
 *
 * Returns { subject, html } objects with OPYNX-branded HTML email templates.
 * All templates use a dark background with red accent, responsive layout
 * (max-width 600px), and include an unsubscribe link in the footer.
 */

// ─── Shared Layout Helpers ───

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OPYNX</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e5e7eb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d14;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#15151f;border-radius:16px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 16px;text-align:center;">
              <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">OPYNX</span>
              <div style="width:40px;height:3px;background-color:#dc2626;margin:12px auto 0;border-radius:2px;"></div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:16px 32px 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #1f1f2e;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#6b7280;">Sent from OPYNX &mdash; The FanEngage Protocol</p>
              <a href="https://opynx.com/unsubscribe" style="font-size:11px;color:#6b7280;text-decoration:underline;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
  <tr>
    <td style="background-color:#dc2626;border-radius:9999px;text-align:center;">
      <a href="${href}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">${text}</a>
    </td>
  </tr>
</table>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#d1d5db;">${text}</p>`;
}

function smallText(text: string): string {
  return `<p style="margin:16px 0 0;font-size:12px;color:#6b7280;line-height:1.5;">${text}</p>`;
}

// ─── Template Functions ───

export function welcomeEmail(params: {
  name: string;
}): { subject: string; html: string } {
  const { name } = params;
  return {
    subject: 'Welcome to OPYNX!',
    html: emailWrapper(`
      ${heading(`Welcome to OPYNX, ${name}!`)}
      ${paragraph('You\'re now part of the next generation of music fandom. Discover new artists, unlock exclusive content, and support the creators you love &mdash; directly.')}
      ${paragraph('Here\'s what you can do right now:')}
      <ul style="margin:0 0 14px;padding-left:20px;font-size:14px;line-height:1.8;color:#d1d5db;">
        <li>Explore trending tracks and artists</li>
        <li>Follow your favorite creators</li>
        <li>Subscribe for ad-free listening and exclusive drops</li>
      </ul>
      ${ctaButton('Start Exploring', 'https://opynx.com/explore')}
    `),
  };
}

export function contentTeaserEmail(params: {
  name: string;
  creatorName: string;
  trackTitle: string;
}): { subject: string; html: string } {
  const { name, creatorName, trackTitle } = params;
  return {
    subject: `${creatorName} just dropped something new`,
    html: emailWrapper(`
      ${heading(`Hey ${name}, new music alert!`)}
      ${paragraph(`<strong>${creatorName}</strong> just released <strong>&ldquo;${trackTitle}&rdquo;</strong> &mdash; and subscribers get first access.`)}
      ${paragraph('Listen to a preview now and subscribe to unlock the full track plus exclusive behind-the-scenes content.')}
      ${ctaButton('Listen Now', 'https://opynx.com/explore')}
      ${smallText('Subscribe to any plan to unlock full tracks and exclusive content.')}
    `),
  };
}

export function subscriptionCTAEmail(params: {
  name: string;
  discountCode: string;
}): { subject: string; html: string } {
  const { name, discountCode } = params;
  return {
    subject: 'Your exclusive OPYNX discount inside',
    html: emailWrapper(`
      ${heading(`${name}, we have something special for you`)}
      ${paragraph('You\'ve been enjoying OPYNX &mdash; why not unlock the full experience? For a limited time, use the code below for a discount on your first month.')}
      <div style="margin:20px 0;padding:16px;background-color:#1a1a2e;border:1px dashed #dc2626;border-radius:12px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Your Discount Code</p>
        <p style="margin:0;font-size:24px;font-weight:800;color:#dc2626;letter-spacing:2px;">${discountCode}</p>
      </div>
      ${ctaButton('Subscribe Now', 'https://opynx.com/subscribe')}
      ${smallText('This code is valid for 7 days. Standard plan starts at $8.73/mo.')}
    `),
  };
}

export function renewalConfirmationEmail(params: {
  name: string;
  tier: string;
  nextDate: string;
}): { subject: string; html: string } {
  const { name, tier, nextDate } = params;
  return {
    subject: 'Your OPYNX subscription has been renewed',
    html: emailWrapper(`
      ${heading('Subscription Renewed')}
      ${paragraph(`Hi ${name}, your <strong>${tier}</strong> subscription has been successfully renewed.`)}
      <div style="margin:20px 0;padding:16px;background-color:#1a1a2e;border-radius:12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b7280;">Plan</td>
            <td style="padding:6px 0;font-size:13px;color:#ffffff;text-align:right;font-weight:600;">${tier}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b7280;">Next renewal</td>
            <td style="padding:6px 0;font-size:13px;color:#ffffff;text-align:right;font-weight:600;">${nextDate}</td>
          </tr>
        </table>
      </div>
      ${paragraph('Thank you for supporting independent artists on OPYNX.')}
      ${ctaButton('Manage Subscription', 'https://opynx.com/settings/subscription')}
    `),
  };
}

export function gracePeriodWarningEmail(params: {
  name: string;
  daysLeft: number;
}): { subject: string; html: string } {
  const { name, daysLeft } = params;
  return {
    subject: `Action needed: ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left on your OPYNX subscription`,
    html: emailWrapper(`
      ${heading('Your subscription is expiring soon')}
      ${paragraph(`Hi ${name}, we were unable to process your last payment. You have <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong> left in your grace period before you lose access to premium features.`)}
      ${paragraph('Update your payment method now to avoid any interruption:')}
      <ul style="margin:0 0 14px;padding-left:20px;font-size:14px;line-height:1.8;color:#d1d5db;">
        <li>Ad-free listening</li>
        <li>High-quality audio streaming</li>
        <li>Exclusive artist content</li>
      </ul>
      ${ctaButton('Update Payment', 'https://opynx.com/settings/billing')}
      ${smallText('If you believe this is an error, please contact support@opynx.com.')}
    `),
  };
}

export function commissionPaidEmail(params: {
  name: string;
  amount: string;
  txHash: string;
}): { subject: string; html: string } {
  const { name, amount, txHash } = params;
  return {
    subject: `You've been paid ${amount} on OPYNX`,
    html: emailWrapper(`
      ${heading('Commission Paid!')}
      ${paragraph(`Hey ${name}, great news &mdash; a commission of <strong>${amount}</strong> has been sent to your wallet.`)}
      <div style="margin:20px 0;padding:16px;background-color:#1a1a2e;border-radius:12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b7280;">Amount</td>
            <td style="padding:6px 0;font-size:13px;color:#22c55e;text-align:right;font-weight:700;">${amount}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b7280;">Transaction</td>
            <td style="padding:6px 0;font-size:11px;color:#9ca3af;text-align:right;font-family:monospace;word-break:break-all;">${txHash}</td>
          </tr>
        </table>
      </div>
      ${ctaButton('View Earnings', 'https://opynx.com/dashboard/earnings')}
      ${smallText('Commission payments are processed on-chain and may take a few minutes to confirm.')}
    `),
  };
}

export function ticketPurchaseEmail(params: {
  name: string;
  eventTitle: string;
  ticketType: string;
  qrToken: string;
}): { subject: string; html: string } {
  const { name, eventTitle, ticketType, qrToken } = params;
  return {
    subject: `Your ticket for ${eventTitle}`,
    html: emailWrapper(`
      ${heading('You\'re In!')}
      ${paragraph(`Hey ${name}, your ticket for <strong>${eventTitle}</strong> has been confirmed.`)}
      <div style="margin:20px 0;padding:20px;background-color:#1a1a2e;border:1px solid #2a2a3e;border-radius:12px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Ticket Type</p>
        <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#ffffff;">${ticketType}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">QR Code Token</p>
        <p style="margin:0;font-size:18px;font-weight:800;color:#dc2626;letter-spacing:2px;font-family:monospace;">${qrToken}</p>
      </div>
      ${paragraph('Show the QR code at the entrance for check-in. You can also find your tickets in the OPYNX app.')}
      ${ctaButton('View My Tickets', 'https://opynx.com/tickets')}
      ${smallText('Keep this email &mdash; you\'ll need your QR code for entry.')}
    `),
  };
}

export function newReleaseEmail(params: {
  fanName: string;
  artistName: string;
  trackTitle: string;
  trackUrl: string;
}): { subject: string; html: string } {
  const { fanName, artistName, trackTitle, trackUrl } = params;
  return {
    subject: `${artistName} just dropped "${trackTitle}"`,
    html: emailWrapper(`
      ${heading(`New Release from ${artistName}`)}
      ${paragraph(`Hey ${fanName}, <strong>${artistName}</strong> just released a new track: <strong>&ldquo;${trackTitle}&rdquo;</strong>.`)}
      ${paragraph('Be one of the first to listen. As a subscriber, you get early access and the highest audio quality.')}
      ${ctaButton('Listen Now', trackUrl)}
      ${smallText('You\'re receiving this because you follow this artist on OPYNX.')}
    `),
  };
}

// ─── Generic payment receipt (buyer-facing) ───
/**
 * Generic "your payment landed" receipt for any revenue path.
 * Use type to control framing: 'subscription' | 'ticket' | 'track' | 'tip' | 'merch'
 */
export function paymentReceiptEmail(params: {
  type: 'subscription' | 'ticket' | 'track' | 'tip' | 'merch';
  buyerName: string;
  amountCents: number;
  itemDescription: string;
  ctaUrl: string;
  ctaLabel?: string;
}): { subject: string; html: string } {
  const { type, buyerName, amountCents, itemDescription, ctaUrl, ctaLabel } = params;
  const amount = `$${(amountCents / 100).toFixed(2)}`;
  const subjectByType: Record<typeof type, string> = {
    subscription: `Your OPYNX subscription is active — ${amount}`,
    ticket: `Ticket confirmed: ${itemDescription}`,
    track: `Track purchased: ${itemDescription}`,
    tip: `Tip sent — ${amount}`,
    merch: `Order confirmed: ${itemDescription}`,
  };
  const headlineByType: Record<typeof type, string> = {
    subscription: 'Subscription Active',
    ticket: 'You\'re going to the show',
    track: 'Track unlocked',
    tip: 'Tip sent — thank you',
    merch: 'Order confirmed',
  };
  const defaultCtaLabel: Record<typeof type, string> = {
    subscription: 'Open OPYNX',
    ticket: 'View Ticket',
    track: 'Listen Now',
    tip: 'Back to OPYNX',
    merch: 'View Order',
  };
  return {
    subject: subjectByType[type],
    html: emailWrapper(`
      ${heading(headlineByType[type])}
      ${paragraph(`Hey ${buyerName}, your payment of <strong>${amount}</strong> for <strong>${itemDescription}</strong> has been confirmed on Polygon.`)}
      ${ctaButton(ctaLabel ?? defaultCtaLabel[type], ctaUrl)}
      ${smallText('Settled on-chain via NOWPayments. This receipt is the proof of payment for your records.')}
    `),
  };
}

// ─── Generic creator-earnings notification ───
/**
 * "You earned money" notification to a creator/seller. Sent on every revenue
 * event so creators see income in real-time and trust the platform.
 */
export function creatorEarningsEmail(params: {
  type: 'subscription' | 'ticket' | 'track' | 'tip' | 'merch';
  creatorName: string;
  amountCents: number;
  itemDescription: string;
  fromName?: string;
  ctaUrl?: string;
}): { subject: string; html: string } {
  const { type, creatorName, amountCents, itemDescription, fromName, ctaUrl } = params;
  const amount = `$${(amountCents / 100).toFixed(2)}`;
  const sourceLabel: Record<typeof type, string> = {
    subscription: 'a subscription commission',
    ticket: 'a ticket sale',
    track: 'a track sale',
    tip: 'a tip',
    merch: 'a marketplace order',
  };
  const fromText = fromName ? ` from <strong>${fromName}</strong>` : '';
  return {
    subject: `You earned ${amount} on OPYNX`,
    html: emailWrapper(`
      ${heading(`+${amount} earned`)}
      ${paragraph(`Hey ${creatorName}, you just received <strong>${amount}</strong> from ${sourceLabel[type]}${fromText}.`)}
      ${paragraph(`<strong>${itemDescription}</strong>`)}
      ${paragraph('It\'s been added to your available balance. Request a payout from your dashboard whenever you\'re ready.')}
      ${ctaButton('Open Earnings', ctaUrl ?? 'https://opynx.com/dashboard/earnings')}
      ${smallText('You\'re receiving this because someone paid for your content on OPYNX.')}
    `),
  };
}
