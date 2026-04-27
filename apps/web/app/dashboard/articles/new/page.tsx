'use client';

import { ArticleEditor } from '@/app/components/ArticleEditor';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function NewArticlePage() {
  const { status } = useSession();

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-gray-400">Sign in to write an article.</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Sign In</Link>
      </div>
    );
  }

  return <ArticleEditor />;
}
