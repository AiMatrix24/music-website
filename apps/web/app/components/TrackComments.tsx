'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useToast } from './Toast';
import Link from 'next/link';

interface TrackCommentsProps {
  trackId: string;
}

export function TrackComments({ trackId }: TrackCommentsProps) {
  const { status } = useSession();
  const { toast } = useToast();
  const [body, setBody] = useState('');
  const utils = trpc.useUtils();

  const { data: comments, isLoading } = trpc.comments.list.useQuery({ trackId });

  const addMutation = trpc.comments.add.useMutation({
    onSuccess: () => {
      setBody('');
      utils.comments.list.invalidate({ trackId });
      toast('Comment posted');
    },
    onError: (err) => {
      toast(err.message || 'Failed to post comment', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    addMutation.mutate({ trackId, body: body.trim() });
  };

  return (
    <div className="rounded-2xl bg-[#15151f] p-6">
      <h2 className="text-lg font-bold mb-4">
        Comments {comments && comments.length > 0 && `(${comments.length})`}
      </h2>

      {/* Compose */}
      {status === 'authenticated' ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts on this track..."
            rows={3}
            className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition resize-none mb-3"
          />
          <button
            type="submit"
            disabled={!body.trim() || addMutation.isPending}
            className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-50"
          >
            {addMutation.isPending ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-brand-950/50 rounded-xl text-center">
          <p className="text-gray-400 text-sm">
            <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 transition">
              Sign in
            </Link>{' '}
            to leave a comment
          </p>
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="animate-pulse text-gray-500 text-center py-4">Loading comments...</div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-xs font-bold shrink-0">
                {comment.userName?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{comment.userName ?? 'Anonymous'}</span>
                  <span className="text-xs text-gray-600">
                    {new Date(comment.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{comment.body}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4 text-sm">No comments yet. Be the first!</p>
      )}
    </div>
  );
}
