'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-brand-800/20 bg-brand-950/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        <Link href="/" className="text-xl font-black tracking-tight">
          <span className="text-brand-500">O</span>PYNX
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/explore" className="text-sm text-gray-400 hover:text-white transition hidden sm:block">
            Explore
          </Link>
          <Link href="/subscribe" className="text-sm text-gray-400 hover:text-white transition hidden sm:block">
            Subscribe
          </Link>
          <Link href="/scan" className="text-sm text-gray-400 hover:text-white transition hidden sm:block">
            Scan
          </Link>

          {status === 'authenticated' ? (
            <>
              <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm text-gray-400 hover:text-white transition"
              >
                Sign Out
              </button>
              <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold">
                {session.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-500"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
