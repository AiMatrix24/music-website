'use client';

import { useEffect } from 'react';

/**
 * Registers /sw.js once on mount. Without this, the SW file exists but is
 * never installed by the browser, which means:
 *  - Chrome's PWA install criteria fail silently → InstallAppBanner button
 *    is dead because beforeinstallprompt never fires.
 *  - PushNotificationToggle hangs on `navigator.serviceWorker.ready`.
 *  - Offline cache + background sync never run.
 *
 * Skipped in dev unless NEXT_PUBLIC_ENABLE_SW_DEV=true so the SW doesn't
 * eat hot-module updates during local development.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_SW_DEV !== 'true') return;

    // Register after the page has settled so we don't compete with first-paint.
    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => console.error('[sw] register failed:', err));
    };

    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad, { once: true });
      return () => window.removeEventListener('load', onLoad);
    }
  }, []);

  return null;
}
