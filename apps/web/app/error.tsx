'use client';

import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">⚡</div>
        <h1 className="text-3xl font-black mb-3">Something went wrong</h1>
        <p className="text-gray-400 mb-8">
          An unexpected error occurred. This has been logged and we&apos;re working on it.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-500 transition"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-full border border-brand-800/30 px-6 py-3 text-sm font-semibold text-gray-400 hover:text-white hover:border-brand-600 transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
