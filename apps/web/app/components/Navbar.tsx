'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationBell } from './NotificationCenter';

export function Navbar() {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-brand-800/20 bg-brand-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.jpeg" alt="OPYNX" width={36} height={36} className="rounded-lg" />
            <span className="text-xl font-black tracking-tight">
              <span className="text-red-500">O</span>pyn<span className="text-red-500">X</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/explore" className="text-sm text-gray-400 hover:text-white transition">
              Explore
            </Link>
            <Link href="/library" className="text-sm text-gray-400 hover:text-white transition">
              Library
            </Link>
            <Link href="/tickets" className="text-sm text-gray-400 hover:text-white transition">
              Tickets
            </Link>
            <Link href="/subscribe" className="text-sm text-gray-400 hover:text-white transition">
              Subscribe
            </Link>
            <Link href="/scan" className="text-sm text-gray-400 hover:text-white transition">
              Scan
            </Link>

            {/* Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="text-gray-400 hover:text-white transition"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {status === 'authenticated' ? (
              <>
                <NotificationBell />
                <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
                  Dashboard
                </Link>
                <Link href="/settings" className="text-sm text-gray-400 hover:text-white transition">
                  Settings
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

          {/* Mobile buttons */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setSearchOpen(true)}
              className="text-gray-400 hover:text-white transition p-2"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-gray-400 hover:text-white transition p-2"
              aria-label="Menu"
            >
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-brand-800/20 bg-brand-950/95 backdrop-blur-xl">
            <div className="flex flex-col px-6 py-4 gap-3">
              <Link
                href="/explore"
                onClick={() => setMobileOpen(false)}
                className="text-sm text-gray-300 hover:text-white transition py-2"
              >
                Explore
              </Link>
              <Link
                href="/library"
                onClick={() => setMobileOpen(false)}
                className="text-sm text-gray-300 hover:text-white transition py-2"
              >
                Library
              </Link>
              <Link
                href="/tickets"
                onClick={() => setMobileOpen(false)}
                className="text-sm text-gray-300 hover:text-white transition py-2"
              >
                Tickets
              </Link>
              <Link
                href="/subscribe"
                onClick={() => setMobileOpen(false)}
                className="text-sm text-gray-300 hover:text-white transition py-2"
              >
                Subscribe
              </Link>
              <Link
                href="/scan"
                onClick={() => setMobileOpen(false)}
                className="text-sm text-gray-300 hover:text-white transition py-2"
              >
                Scan
              </Link>

              {status === 'authenticated' ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm text-gray-300 hover:text-white transition py-2"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      signOut({ callbackUrl: '/' });
                    }}
                    className="text-sm text-gray-300 hover:text-white transition py-2 text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white text-center transition hover:bg-brand-500 mt-2"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-6">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery('');
            }}
          />
          <form
            onSubmit={handleSearch}
            className="relative w-full max-w-xl bg-[#15151f] rounded-2xl border border-brand-800/30 overflow-hidden shadow-2xl"
          >
            <div className="flex items-center px-5 gap-3">
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracks, artists, events..."
                className="flex-1 bg-transparent py-4 text-white placeholder:text-gray-500 outline-none text-lg"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className="text-gray-400 hover:text-white transition text-sm"
              >
                ESC
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
