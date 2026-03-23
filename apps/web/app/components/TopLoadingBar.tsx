'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function TopLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Reset on route change complete
    setLoading(false);
    setProgress(100);
    const timeout = setTimeout(() => setProgress(0), 300);
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  useEffect(() => {
    // Intercept link clicks to detect navigation start
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (
        anchor &&
        anchor.href &&
        anchor.href.startsWith(window.location.origin) &&
        !anchor.href.includes('#') &&
        !anchor.target &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        const url = new URL(anchor.href);
        if (url.pathname !== pathname) {
          setLoading(true);
          setProgress(30);
          // Simulate progress
          setTimeout(() => setProgress(60), 100);
          setTimeout(() => setProgress(80), 300);
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname]);

  if (progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px]">
      <div
        className={`h-full bg-brand-500 shadow-[0_0_10px_rgba(124,58,237,0.5)] transition-all ${
          loading ? 'duration-[2s] ease-out' : 'duration-300 ease-in-out'
        }`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
