'use client';

import { useEffect, useState } from 'react';

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote', 'a', 'code', 'pre'];
const ALLOWED_ATTR = ['href', 'target', 'rel'];

/**
 * Sanitize user-provided HTML on the client only. Returns empty string during
 * SSR + initial hydration; populates after the first useEffect runs. We use a
 * dynamic import so the dompurify module never touches the server bundle —
 * this avoids the isomorphic-dompurify → jsdom → serverless-runtime crash.
 */
export function useSafeHtml(rawHtml: string | null | undefined): string {
  const [safe, setSafe] = useState('');
  useEffect(() => {
    if (!rawHtml) {
      setSafe('');
      return;
    }
    let cancelled = false;
    import('dompurify').then((mod) => {
      if (cancelled) return;
      const purify = mod.default ?? mod;
      setSafe(
        purify.sanitize(rawHtml, {
          ALLOWED_TAGS,
          ALLOWED_ATTR,
        })
      );
    });
    return () => {
      cancelled = true;
    };
  }, [rawHtml]);
  return safe;
}
