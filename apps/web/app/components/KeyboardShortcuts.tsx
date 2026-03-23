'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case '/':
          // Focus search — the Navbar handles the overlay
          e.preventDefault();
          document.querySelector<HTMLButtonElement>('[aria-label="Search"]')?.click();
          break;

        case 'Escape':
          // Close any overlay — handled by individual components
          break;

        case 'h':
          // Go home
          if (!e.metaKey && !e.ctrlKey) {
            router.push('/');
          }
          break;

        case 'e':
          // Go to explore
          if (!e.metaKey && !e.ctrlKey) {
            router.push('/explore');
          }
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router]);

  return null;
}
