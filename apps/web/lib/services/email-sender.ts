/**
 * Email Sending Service using Resend
 *
 * NOTE: The `resend` package must be installed:
 *   cd apps/web && npm install resend
 */

import { Resend } from 'resend';
import {
  welcomeEmail,
  ticketPurchaseEmail,
  commissionPaidEmail,
  newReleaseEmail,
} from '@/lib/emails/templates';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM ?? 'OPYNX <noreply@opynx.com>';

// ─── Core Send Function ───

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error('[email-sender] Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    console.error('[email-sender] Exception:', message);
    return { success: false, error: message };
  }
}

// ─── Convenience Functions ───

export async function sendWelcomeEmail(to: string, name: string) {
  const { subject, html } = welcomeEmail({ name });
  return sendEmail({ to, subject, html });
}

export async function sendTicketEmail(
  to: string,
  params: {
    name: string;
    eventTitle: string;
    ticketType: string;
    qrToken: string;
  }
) {
  const { subject, html } = ticketPurchaseEmail(params);
  return sendEmail({ to, subject, html });
}

export async function sendPayoutEmail(
  to: string,
  params: {
    name: string;
    amount: string;
    txHash: string;
  }
) {
  const { subject, html } = commissionPaidEmail(params);
  return sendEmail({ to, subject, html });
}

export async function sendNewReleaseEmail(
  to: string,
  params: {
    fanName: string;
    artistName: string;
    trackTitle: string;
    trackUrl: string;
  }
) {
  const { subject, html } = newReleaseEmail(params);
  return sendEmail({ to, subject, html });
}
