'use client';

import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc/client';

/**
 * PushNotificationToggle — drives the Web Push subscribe/unsubscribe flow
 * from the user's browser to our server.
 *
 * UX states:
 *   - "Push API not supported in this browser" (older browsers, desktop Safari)
 *   - "iOS users: install OPYNX to your Home Screen first" (iOS Safari, not in PWA)
 *   - "Permission denied — enable in browser settings" (user previously declined)
 *   - "Notifications enabled on N device(s)" + Disable button (active sub on this device)
 *   - "Notifications disabled" + Enable button (default state)
 *
 * Server side: notify() automatically sends to every push_subscriptions row
 * for the user, so opting in here unlocks push for every existing emit point
 * (tips, ticket sales, follows, payouts, etc.) — no per-trigger wiring needed.
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// Convert URL-safe base64 string to Uint8Array (VAPID public key format).
// Returns a Uint8Array backed by a regular ArrayBuffer — TS's recent strict
// typing won't accept ArrayBufferLike (which could be SharedArrayBuffer)
// for PushSubscriptionOptionsInit.applicationServerKey.
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const buf = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type State =
  | 'loading'
  | 'unsupported'
  | 'ios-needs-install'
  | 'permission-denied'
  | 'enabled'
  | 'disabled';

export function PushNotificationToggle() {
  const [state, setState] = useState<State>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localSubscribed, setLocalSubscribed] = useState(false);

  const utils = trpc.useUtils();
  const countQuery = trpc.pushSubscriptions.countMine.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const subscribeMutation = trpc.pushSubscriptions.subscribe.useMutation();
  const unsubscribeMutation = trpc.pushSubscriptions.unsubscribe.useMutation();

  // ── Detect platform + permission + existing local subscription ──
  useEffect(() => {
    (async () => {
      // Web Push requires SW + Notifications + PushManager
      const supported =
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'Notification' in window &&
        'PushManager' in window;
      if (!supported) {
        setState('unsupported');
        return;
      }

      // iOS-specific: PWA must be Add-to-Home-Screen installed FIRST.
      // Detect iOS in non-standalone mode and short-circuit with helpful copy.
      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document);
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true;
      if (isIOS && !isStandalone) {
        setState('ios-needs-install');
        return;
      }

      if (Notification.permission === 'denied') {
        setState('permission-denied');
        return;
      }

      // Check for an existing local subscription
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          setLocalSubscribed(true);
          setState('enabled');
        } else {
          setState('disabled');
        }
      } catch {
        setState('disabled');
      }
    })();
  }, []);

  const handleEnable = async () => {
    setError(null);
    setBusy(true);
    try {
      if (!VAPID_PUBLIC_KEY) throw new Error('Push not configured (missing VAPID key)');

      // 1) Request notification permission (must follow user gesture)
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setState(perm === 'denied' ? 'permission-denied' : 'disabled');
        return;
      }

      // 2) Subscribe via Push Manager
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // 3) Send subscription to server
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error('Subscription missing required keys');
      }
      await subscribeMutation.mutateAsync({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        userAgent: navigator.userAgent.slice(0, 500),
      });

      setLocalSubscribed(true);
      setState('enabled');
      await utils.pushSubscriptions.countMine.invalidate();
    } catch (err) {
      console.error('[push] enable failed:', err);
      setError((err as Error).message || 'Failed to enable notifications');
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setError(null);
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        // Tell server to remove the row too
        try {
          await unsubscribeMutation.mutateAsync({ endpoint });
        } catch (err) {
          console.warn('[push] server unsubscribe failed (ignored):', err);
        }
      }
      setLocalSubscribed(false);
      setState('disabled');
      await utils.pushSubscriptions.countMine.invalidate();
    } catch (err) {
      console.error('[push] disable failed:', err);
      setError((err as Error).message || 'Failed to disable');
    } finally {
      setBusy(false);
    }
  };

  // ── Render ──
  return (
    <div className="rounded-2xl bg-[#15151f] p-6">
      <div className="flex items-center justify-between gap-4 mb-1">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span aria-hidden>📱</span> Push Notifications
        </h2>
        {state === 'enabled' && (
          <span className="text-xs bg-green-600/20 text-green-400 rounded-full px-3 py-1 font-semibold">
            On
          </span>
        )}
      </div>
      <p className="text-sm text-gray-400 mb-4">
        Get notified on this device even when OPYNX isn't open — tips, sales, follows, and more.
      </p>

      {state === 'loading' && (
        <p className="text-sm text-gray-500">Checking…</p>
      )}

      {state === 'unsupported' && (
        <div className="rounded-lg bg-amber-950/20 border border-amber-800/30 p-4">
          <p className="text-sm text-amber-300">
            Push notifications aren't supported in this browser. Try Chrome, Edge, or Safari on a modern device.
          </p>
        </div>
      )}

      {state === 'ios-needs-install' && (
        <div className="rounded-lg bg-amber-950/20 border border-amber-800/30 p-4">
          <p className="text-sm text-amber-300 mb-2">
            <strong>iPhone users:</strong> Apple only allows push notifications when OPYNX is installed to your Home Screen.
          </p>
          <p className="text-xs text-amber-200/80">
            In Safari, tap the Share button → Add to Home Screen, then open OPYNX from your home screen and come back here to enable.
          </p>
        </div>
      )}

      {state === 'permission-denied' && (
        <div className="rounded-lg bg-red-950/20 border border-red-800/30 p-4">
          <p className="text-sm text-red-300 mb-2">
            Notifications are <strong>blocked</strong> in your browser settings.
          </p>
          <p className="text-xs text-red-200/80">
            To enable: open this site's settings in your browser (lock icon in address bar → Site settings → Notifications → Allow), then refresh this page.
          </p>
        </div>
      )}

      {state === 'enabled' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            Active on {countQuery.data ?? 1} device{(countQuery.data ?? 1) === 1 ? '' : 's'}.
            {localSubscribed && ' This device is one of them.'}
          </p>
          <button
            onClick={handleDisable}
            disabled={busy}
            className="rounded-full bg-brand-950 hover:bg-brand-900 border border-brand-800/40 px-5 py-2 text-sm font-semibold transition disabled:opacity-50"
          >
            {busy ? 'Disabling…' : 'Disable on this device'}
          </button>
        </div>
      )}

      {state === 'disabled' && (
        <button
          onClick={handleEnable}
          disabled={busy}
          className="rounded-full bg-red-600 hover:bg-red-500 px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50"
        >
          {busy ? 'Enabling…' : 'Enable Push Notifications'}
        </button>
      )}

      {error && (
        <p className="text-xs text-red-400 mt-3">{error}</p>
      )}
    </div>
  );
}
