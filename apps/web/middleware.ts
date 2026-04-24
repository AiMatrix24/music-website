import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Site-wide Basic Auth gate for pre-launch mode.
 *
 * When SITE_PASSWORD is set in env, the entire frontend is gated behind
 * a browser Basic Auth dialog. Any username works — only the password is
 * checked. When SITE_PASSWORD is unset (local dev, or when going public),
 * the gate is bypassed entirely.
 *
 * The `config.matcher` below already excludes /api/* paths, so webhooks
 * (NOWPayments), cron (Vercel), and UploadThing callbacks are never gated.
 */
function siteAuthCheck(request: NextRequest): boolean {
  const password = process.env.SITE_PASSWORD;
  if (!password) return true; // No password configured = site is public

  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Basic ')) return false;

  try {
    const encoded = header.slice(6);
    // Basic Auth is "username:password" base64-encoded. Any username, exact password.
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    const idx = decoded.indexOf(':');
    if (idx === -1) return false;
    const providedPassword = decoded.slice(idx + 1);
    // Constant-time compare to avoid timing attacks (basic cover)
    if (providedPassword.length !== password.length) return false;
    let mismatch = 0;
    for (let i = 0; i < password.length; i++) {
      mismatch |= providedPassword.charCodeAt(i) ^ password.charCodeAt(i);
    }
    return mismatch === 0;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  // Site-wide basic auth gate (pre-launch)
  if (!siteAuthCheck(request)) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="OPYNX — Pre-launch", charset="UTF-8"',
        'Content-Type': 'text/plain',
      },
    });
  }

  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(self)');

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except static files and api.
    // /api/* is excluded so webhooks, cron, and uploadthing callbacks work
    // without basic auth. Static assets + service worker + PWA manifest
    // are excluded so browsers can load them before presenting the auth
    // dialog.
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|logo.jpeg|manifest.json|sw.js|api/).*)',
  ],
};
