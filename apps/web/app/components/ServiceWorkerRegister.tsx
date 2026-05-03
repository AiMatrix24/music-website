'use client';

import { useEffect } from 'react';

/**
 * Registers /sw.js on mount AND aggressively pulls SW updates.
 *
 * Two important options here that aren't the defaults:
 *
 * 1. `updateViaCache: 'none'` — without this, the browser caches sw.js
 *    via normal HTTP headers (often hours/days). Even when we ship a new
 *    SW version, returning users wouldn't see it on their next visit;
 *    they'd keep running the cached old SW. Setting this to 'none'
 *    forces sw.js (and its imports) to be fetched fresh on every
 *    registration check.
 *
 * 2. Explicit `registration.update()` after register — if a SW is
 *    already installed, register() reuses it without checking for an
 *    update. update() forces the check NOW so the new version gets
 *    discovered + installed + (because the new SW calls skipWaiting()
 *    in its install handler) activated immediately.
 *
 * Plus a controllerchange listener so we reload the page once when a
 * new SW takes control — otherwise the page is still being served by
 * the old SW until the user navigates away and back.
 *
 * Skipped in dev unless NEXT_PUBLIC_ENABLE_SW_DEV=true so the SW doesn't
 * eat hot-module updates during local development.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_SW_DEV !== 'true') return;

    let didReload = false;
    const onControllerChange = () => {
      // A fresh SW just took over. Reload once so the current page is
      // served through the new SW (instead of staying tied to the old).
      // Guard against the boot-time case where the page already has no
      // controller (first-ever visit) — controllerchange fires there too.
      if (didReload) return;
      didReload = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    const onLoad = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });
        // Force an immediate update check — register() alone won't detect
        // a new sw.js if one is already installed.
        reg.update().catch(() => {});
      } catch (err) {
        console.error('[sw] register failed:', err);
      }
    };

    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad, { once: true });
    }

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      window.removeEventListener('load', onLoad);
    };
  }, []);

  return null;
}
