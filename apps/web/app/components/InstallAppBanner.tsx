'use client';

import { useEffect, useState } from 'react';

/**
 * InstallAppBanner — surfaces the PWA install action that's normally hidden
 * behind the browser's Share/menu UI.
 *
 *   - Android (Chrome/Edge/Samsung Internet): captures the
 *     `beforeinstallprompt` event and exposes a one-tap install button.
 *   - iOS Safari: shows a 3-step "Tap Share → Add to Home Screen" modal,
 *     since iOS deliberately disallows programmatic install prompts.
 *   - Desktop / unsupported browsers / already-installed PWAs: hides itself.
 *
 * Dismissal is sticky for 30 days via localStorage so we don't nag.
 */

const DISMISS_KEY = 'opynx_install_dismissed_at';
const DISMISS_DAYS = 30;

// Subset of the BeforeInstallPromptEvent we actually use.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Platform = 'ios-safari' | 'android' | 'desktop' | 'unsupported';

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'desktop';
  const ua = window.navigator.userAgent;
  // iPad on iOS 13+ reports as Mac — check for touch + Mac UA as well.
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes('Macintosh') && 'ontouchend' in document);
  if (isIOS) {
    // Only Safari can install PWAs on iOS. Other in-iOS browsers (Chrome,
    // Firefox, Edge) all use WebKit but don't expose the install flow.
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    return isSafari ? 'ios-safari' : 'unsupported';
  }
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

function isAlreadyInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  // Modern browsers — display-mode media query
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS Safari legacy
  if ((window.navigator as unknown as { standalone?: boolean }).standalone === true) return true;
  return false;
}

function wasRecentlyDismissed(): boolean {
  try {
    const at = localStorage.getItem(DISMISS_KEY);
    if (!at) return false;
    const daysAgo = (Date.now() - parseInt(at, 10)) / 86_400_000;
    return daysAgo < DISMISS_DAYS;
  } catch {
    return false;
  }
}

export function InstallAppBanner() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [iosModalOpen, setIosModalOpen] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  // ── Initial gate: standalone? dismissed? unsupported platform? ──
  useEffect(() => {
    if (isAlreadyInstalled()) return;
    if (wasRecentlyDismissed()) return;

    const p = detectPlatform();
    setPlatform(p);

    // iOS Safari: show immediately (no event to wait for).
    if (p === 'ios-safari') setShow(true);
    // Android: defer to beforeinstallprompt handler below.
    // Desktop / unsupported: stay hidden.
  }, []);

  // ── Android: capture beforeinstallprompt ──
  useEffect(() => {
    if (platform !== 'android') return;
    const handler = (e: Event) => {
      e.preventDefault(); // Suppress Chrome's native banner — we render our own.
      setInstallEvent(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, [platform]);

  // ── Listen for successful install — hide immediately ──
  useEffect(() => {
    const handler = () => setShow(false);
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {}
    setShow(false);
  };

  const handleAndroidInstall = async () => {
    if (!installEvent) return;
    try {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      if (outcome === 'accepted') {
        setShow(false); // 'appinstalled' will also fire — belt and suspenders.
      } else {
        dismiss();
      }
    } catch (err) {
      console.warn('[InstallAppBanner] prompt() rejected:', err);
    }
  };

  if (!show) return null;

  return (
    <>
      {/* Floating banner — sits above the music player bar (bottom-20) */}
      <div className="fixed bottom-20 left-3 right-3 z-40 sm:left-auto sm:right-4 sm:max-w-sm">
        <div className="bg-[#15151f] border border-red-600/30 rounded-2xl shadow-2xl shadow-black/50 p-4 flex items-start gap-3">
          <div className="text-3xl shrink-0" aria-hidden>📱</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Install OPYNX</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Get app-style access. No app store, no waiting — installs in one tap.
            </p>
            <div className="flex gap-3 mt-3">
              {platform === 'android' && (
                <button
                  onClick={handleAndroidInstall}
                  className="rounded-full bg-red-600 hover:bg-red-500 px-4 py-1.5 text-xs font-bold text-white transition"
                >
                  Install
                </button>
              )}
              {platform === 'ios-safari' && (
                <button
                  onClick={() => setIosModalOpen(true)}
                  className="rounded-full bg-red-600 hover:bg-red-500 px-4 py-1.5 text-xs font-bold text-white transition"
                >
                  Show me how
                </button>
              )}
              <button
                onClick={dismiss}
                className="text-xs text-gray-400 hover:text-white px-2"
              >
                Maybe later
              </button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="text-gray-500 hover:text-white text-xl leading-none px-1 shrink-0"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>

      {/* iOS instructions modal */}
      {iosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIosModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#15151f] border border-brand-800/30 rounded-2xl shadow-2xl shadow-black/40 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold">Install OPYNX on iPhone</h3>
              <button
                onClick={() => setIosModalOpen(false)}
                className="text-gray-500 hover:text-white text-2xl leading-none px-1"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <ol className="space-y-4 text-sm">
              <li className="flex gap-3 items-start">
                <span className="rounded-full bg-red-600 w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <div className="flex-1">
                  <p>Tap the <strong>Share</strong> button at the bottom of Safari</p>
                  <p className="text-xs text-gray-400 mt-1">It's the square icon with an up-arrow</p>
                  <div className="mt-2 inline-flex items-center gap-1 text-xs text-gray-300 bg-brand-950/50 rounded px-2 py-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Share</span>
                  </div>
                </div>
              </li>

              <li className="flex gap-3 items-start">
                <span className="rounded-full bg-red-600 w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <div className="flex-1">
                  <p>Scroll down, tap <strong>"Add to Home Screen"</strong></p>
                </div>
              </li>

              <li className="flex gap-3 items-start">
                <span className="rounded-full bg-red-600 w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <div className="flex-1">
                  <p>Tap <strong>Add</strong> in the top-right corner</p>
                  <p className="text-xs text-gray-400 mt-1">OPYNX appears on your home screen as a real app</p>
                </div>
              </li>
            </ol>

            <div className="mt-5 p-3 rounded-lg bg-amber-950/30 border border-amber-800/30">
              <p className="text-xs text-amber-300">
                <strong>Must use Safari</strong> — Chrome, Firefox, and other iOS browsers can't install PWAs.
              </p>
            </div>

            <button
              onClick={() => { setIosModalOpen(false); dismiss(); }}
              className="mt-5 w-full rounded-full bg-red-600 hover:bg-red-500 px-4 py-2 text-sm font-bold text-white transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
