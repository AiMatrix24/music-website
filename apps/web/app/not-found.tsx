import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <div className="text-8xl font-black bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
          404
        </div>
      </div>
      <h1 className="text-2xl font-bold mb-3">Page Not Found</h1>
      <p className="text-gray-400 max-w-md mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Let&apos;s get you back on track.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link
          href="/"
          className="rounded-full bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-500"
        >
          Go Home
        </Link>
        <Link
          href="/explore"
          className="rounded-full border border-brand-800/30 px-6 py-3 font-semibold text-white transition hover:border-brand-600"
        >
          Explore Music
        </Link>
      </div>
    </div>
  );
}
