import { describe, it, expect } from 'vitest';
import { prefColumnForType, type NotificationType } from './notifications';

/**
 * Tests for the type → preference column mapping. Critical because:
 * - If a type maps to the wrong column, users will silently miss
 *   notifications they wanted (or get spam they opted out of).
 * - If 'system' or 'verification_status' accidentally map to a column,
 *   security/compliance notifications could be muted by users — a class
 *   of bug we explicitly designed against.
 */
describe('prefColumnForType', () => {
  it('maps follow → notifFollows', () => {
    expect(prefColumnForType('follow')).toBe('notifFollows');
  });

  it('maps ticket_sale → notifTicketSales', () => {
    expect(prefColumnForType('ticket_sale')).toBe('notifTicketSales');
  });

  it('maps track_sale → notifTrackSales', () => {
    expect(prefColumnForType('track_sale')).toBe('notifTrackSales');
  });

  it('maps tip_received → notifTips', () => {
    expect(prefColumnForType('tip_received')).toBe('notifTips');
  });

  it('maps comment + mention to the same column (notifComments)', () => {
    expect(prefColumnForType('comment')).toBe('notifComments');
    expect(prefColumnForType('mention')).toBe('notifComments');
  });

  it('maps both payout_processed and payout_rejected to notifPayouts', () => {
    expect(prefColumnForType('payout_processed')).toBe('notifPayouts');
    expect(prefColumnForType('payout_rejected')).toBe('notifPayouts');
  });

  it('maps subscription + marketplace_sale into the track-sales bucket', () => {
    expect(prefColumnForType('subscription')).toBe('notifTrackSales');
    expect(prefColumnForType('marketplace_sale')).toBe('notifTrackSales');
  });

  it('milestones map to notifMilestones', () => {
    expect(prefColumnForType('milestone')).toBe('notifMilestones');
  });

  it('returns null for system + verification_status — these MUST always notify', () => {
    expect(prefColumnForType('system')).toBeNull();
    expect(prefColumnForType('verification_status')).toBeNull();
  });

  it('every NotificationType in the union resolves to a string or null (no undefined)', () => {
    // If a new type is added to the union without updating prefColumnForType,
    // it'll fall into the default case and return null (silently always-notify).
    // This isn't strictly a bug — null = always notify is a safe default — but
    // we should still ensure the function returns a defined value for every input.
    const allTypes: NotificationType[] = [
      'ticket_sale',
      'track_sale',
      'subscription',
      'tip_received',
      'marketplace_sale',
      'follow',
      'comment',
      'mention',
      'payout_processed',
      'payout_rejected',
      'milestone',
      'verification_status',
      'system',
    ];
    for (const t of allTypes) {
      const result = prefColumnForType(t);
      expect(result === null || typeof result === 'string').toBe(true);
    }
  });
});
