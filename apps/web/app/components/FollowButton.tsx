'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import { useToast } from './Toast';

interface FollowButtonProps {
  artistId: string;
  artistName?: string;
}

export function FollowButton({ artistId, artistName }: FollowButtonProps) {
  const { status } = useSession();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: isFollowing, isLoading } = trpc.users.isFollowing.useQuery(
    { followeeId: artistId },
    { enabled: status === 'authenticated' }
  );

  const followMutation = trpc.users.follow.useMutation({
    onMutate: async () => {
      await utils.users.isFollowing.cancel({ followeeId: artistId });
      const previous = utils.users.isFollowing.getData({ followeeId: artistId });
      utils.users.isFollowing.setData({ followeeId: artistId }, true);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        utils.users.isFollowing.setData({ followeeId: artistId }, context.previous);
      }
      toast('Failed to follow. Please try again.');
    },
    onSuccess: () => {
      toast(`Following ${artistName ?? 'artist'}`);
    },
    onSettled: () => {
      utils.users.isFollowing.invalidate({ followeeId: artistId });
      utils.users.getFollowerCount.invalidate({ userId: artistId });
    },
  });

  const unfollowMutation = trpc.users.unfollow.useMutation({
    onMutate: async () => {
      await utils.users.isFollowing.cancel({ followeeId: artistId });
      const previous = utils.users.isFollowing.getData({ followeeId: artistId });
      utils.users.isFollowing.setData({ followeeId: artistId }, false);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        utils.users.isFollowing.setData({ followeeId: artistId }, context.previous);
      }
      toast('Failed to unfollow. Please try again.');
    },
    onSuccess: () => {
      toast(`Unfollowed ${artistName ?? 'artist'}`);
    },
    onSettled: () => {
      utils.users.isFollowing.invalidate({ followeeId: artistId });
      utils.users.getFollowerCount.invalidate({ userId: artistId });
    },
  });

  if (status !== 'authenticated') {
    return (
      <a
        href="/auth/login"
        className="inline-flex items-center gap-2 rounded-full border border-brand-500 px-5 py-2 text-sm font-semibold text-brand-400 transition hover:bg-brand-600/10"
      >
        Follow
      </a>
    );
  }

  if (isLoading) {
    return (
      <button disabled className="inline-flex items-center gap-2 rounded-full border border-brand-800/30 px-5 py-2 text-sm font-semibold text-gray-500">
        ...
      </button>
    );
  }

  if (isFollowing) {
    return (
      <button
        onClick={() => unfollowMutation.mutate({ followeeId: artistId })}
        disabled={unfollowMutation.isPending}
        className="inline-flex items-center gap-2 rounded-full bg-brand-600/20 border border-brand-500/30 px-5 py-2 text-sm font-semibold text-brand-400 transition hover:bg-red-600/20 hover:border-red-500/30 hover:text-red-400 group"
      >
        <span className="group-hover:hidden">Following</span>
        <span className="hidden group-hover:inline">Unfollow</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => followMutation.mutate({ followeeId: artistId })}
      disabled={followMutation.isPending}
      className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-500"
    >
      Follow
    </button>
  );
}
