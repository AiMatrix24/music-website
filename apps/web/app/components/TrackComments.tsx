'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { useToast } from './Toast';
import { VerifiedBadge } from './VerifiedBadge';
import Link from 'next/link';

/**
 * Threaded track comments — top-level comments + one level of replies.
 * Reddit-style infinite nesting is overkill for music tracks, and one-deep
 * is what 95% of users actually use.
 *
 * Comments are loaded ASC by createdAt, then grouped client-side by parentId.
 * Replies sit visually under their parent in submission order.
 *
 * On comment / reply submit: backend's notify() helper fires bell + push
 * notifications to the track owner (and the parent comment's author for
 * replies, deduped if they're the same person).
 */
interface TrackCommentsProps {
  trackId: string;
}

interface CommentRow {
  id: string;
  userId: string;
  trackId: string;
  body: string;
  timestampMs: number | null;
  parentId: string | null;
  createdAt: Date | string;
  userName: string | null;
  userAvatar: string | null;
  userVerifiedAt: Date | string | null;
}

export function TrackComments({ trackId }: TrackCommentsProps) {
  const { status, data: session } = useSession();
  const currentUserId = session?.user?.id;
  const { toast } = useToast();
  const [body, setBody] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');

  const utils = trpc.useUtils();

  const { data: rawComments, isLoading } = trpc.comments.list.useQuery({ trackId, limit: 200 });

  const addMutation = trpc.comments.add.useMutation({
    onSuccess: () => {
      setBody('');
      setReplyBody('');
      setReplyingTo(null);
      utils.comments.list.invalidate({ trackId });
    },
    onError: (err) => toast(err.message || 'Failed to post comment', 'error'),
  });

  const deleteMutation = trpc.comments.delete.useMutation({
    onSuccess: () => utils.comments.list.invalidate({ trackId }),
    onError: (err) => toast(err.message || 'Failed to delete', 'error'),
  });

  // Group flat list into top-level + replies-by-parent map
  const { topLevel, repliesByParent } = useMemo(() => {
    const list = (rawComments ?? []) as CommentRow[];
    const tops: CommentRow[] = [];
    const replies = new Map<string, CommentRow[]>();
    for (const c of list) {
      if (!c.parentId) {
        tops.push(c);
      } else {
        const arr = replies.get(c.parentId) ?? [];
        arr.push(c);
        replies.set(c.parentId, arr);
      }
    }
    // Top-level newest first; replies oldest first under their parent
    tops.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return { topLevel: tops, repliesByParent: replies };
  }, [rawComments]);

  const totalCount = (rawComments ?? []).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    addMutation.mutate({ trackId, body: body.trim() });
  };

  const handleReplySubmit = (parentId: string) => (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    addMutation.mutate({ trackId, body: replyBody.trim(), parentId });
  };

  return (
    <div className="rounded-2xl bg-[#15151f] p-6">
      <h2 className="text-lg font-bold mb-4">
        Comments {totalCount > 0 && <span className="text-gray-500 font-normal">({totalCount})</span>}
      </h2>

      {/* Top-level composer */}
      {status === 'authenticated' ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts on this track…"
            rows={3}
            maxLength={2000}
            className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition resize-none mb-3"
          />
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={!body.trim() || addMutation.isPending}
              className="rounded-full bg-red-600 hover:bg-red-500 px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50"
            >
              {addMutation.isPending && !replyingTo ? 'Posting…' : 'Post Comment'}
            </button>
            <span className="text-xs text-gray-600">{body.length}/2000</span>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-brand-950/50 rounded-xl text-center">
          <p className="text-gray-400 text-sm">
            <Link href="/auth/login" className="text-red-400 hover:text-red-300 transition font-semibold">
              Sign in
            </Link>{' '}
            to leave a comment
          </p>
        </div>
      )}

      {/* Threaded list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-brand-950/30 animate-pulse" />
          ))}
        </div>
      ) : topLevel.length === 0 ? (
        <p className="text-gray-500 text-center py-6 text-sm">No comments yet. Be the first.</p>
      ) : (
        <div className="space-y-5">
          {topLevel.map((c) => {
            const replies = repliesByParent.get(c.id) ?? [];
            return (
              <div key={c.id}>
                <CommentRow
                  comment={c}
                  currentUserId={currentUserId}
                  isReplying={replyingTo === c.id}
                  onReplyClick={() => {
                    if (status !== 'authenticated') {
                      toast('Sign in to reply', 'error');
                      return;
                    }
                    setReplyingTo(replyingTo === c.id ? null : c.id);
                    setReplyBody('');
                  }}
                  onDelete={() => {
                    if (confirm('Delete this comment?')) deleteMutation.mutate({ id: c.id });
                  }}
                  isDeleting={deleteMutation.isPending && deleteMutation.variables?.id === c.id}
                />

                {/* Reply composer */}
                {replyingTo === c.id && (
                  <form onSubmit={handleReplySubmit(c.id)} className="mt-3 ml-12">
                    <textarea
                      autoFocus
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder={`Reply to ${c.userName ?? 'this comment'}…`}
                      rows={2}
                      maxLength={2000}
                      className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-brand-500 outline-none transition resize-none mb-2"
                    />
                    <div className="flex gap-2 items-center">
                      <button
                        type="submit"
                        disabled={!replyBody.trim() || addMutation.isPending}
                        className="rounded-full bg-red-600 hover:bg-red-500 px-4 py-1.5 text-xs font-bold text-white transition disabled:opacity-50"
                      >
                        {addMutation.isPending && replyingTo === c.id ? 'Posting…' : 'Post Reply'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setReplyingTo(null); setReplyBody(''); }}
                        className="text-xs text-gray-400 hover:text-white px-2"
                      >
                        Cancel
                      </button>
                      <span className="text-xs text-gray-600 ml-auto">{replyBody.length}/2000</span>
                    </div>
                  </form>
                )}

                {/* Replies — indented under the parent */}
                {replies.length > 0 && (
                  <div className="mt-3 ml-12 space-y-3 border-l border-brand-800/20 pl-4">
                    {replies.map((r) => (
                      <CommentRow
                        key={r.id}
                        comment={r}
                        currentUserId={currentUserId}
                        compact
                        onDelete={() => {
                          if (confirm('Delete this reply?')) deleteMutation.mutate({ id: r.id });
                        }}
                        isDeleting={deleteMutation.isPending && deleteMutation.variables?.id === r.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ───────── Single comment row ─────────

function CommentRow({
  comment,
  currentUserId,
  compact = false,
  isReplying,
  onReplyClick,
  onDelete,
  isDeleting,
}: {
  comment: CommentRow;
  currentUserId?: string;
  compact?: boolean;
  isReplying?: boolean;
  onReplyClick?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}) {
  const isMine = currentUserId && comment.userId === currentUserId;

  return (
    <div className="flex gap-3">
      {comment.userAvatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={comment.userAvatar}
          alt=""
          className={`rounded-full object-cover shrink-0 ${compact ? 'w-7 h-7' : 'w-9 h-9'}`}
        />
      ) : (
        <div
          className={`rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-bold shrink-0 ${
            compact ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs'
          }`}
        >
          {comment.userName?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/artist/${comment.userId}`}
            className="font-semibold text-sm hover:text-red-400 transition flex items-center gap-1"
          >
            {comment.userName ?? 'Anonymous'}
            {comment.userVerifiedAt && <VerifiedBadge size="sm" />}
          </Link>
          <span className="text-xs text-gray-600">{timeAgo(new Date(comment.createdAt))}</span>
          {isMine && onDelete && (
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="ml-auto text-xs text-gray-600 hover:text-red-400 transition disabled:opacity-50"
              title="Delete"
            >
              {isDeleting ? '…' : '🗑'}
            </button>
          )}
        </div>
        <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap break-words">{comment.body}</p>
        {onReplyClick && (
          <button
            onClick={onReplyClick}
            className="mt-2 text-xs text-gray-500 hover:text-red-400 transition font-semibold"
          >
            {isReplying ? 'Cancel' : 'Reply'}
          </button>
        )}
      </div>
    </div>
  );
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
