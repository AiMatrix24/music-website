'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { PodcastsTab } from '@/app/components/podcast/PodcastsTab';

export default function PodcastDashboardPage() {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading…</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-5xl mb-2">🎙️</p>
        <h1 className="text-2xl font-bold">Sign in to manage podcasts</h1>
        <Link href="/auth/login" className="rounded-full bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">← Dashboard</Link>
        <h1 className="text-3xl font-bold mt-2">
          Podcast <span className="text-brand-500">Studio</span>
        </h1>
      </div>
      <PodcastsTab />
    </div>
  );
}
