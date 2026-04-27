import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, desc, and, sql, ilike, isNull, inArray } from 'drizzle-orm';
import {
  createRouter,
  createCallerFactory,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from '../../apps/web/lib/trpc/server';
import { notify, fmtCents } from '../../apps/web/lib/services/notifications';
import { db } from '@opynx/db';
import {
  users,
  oauthConnections,
  follows,
  subscriptions,
  subEvents,
  scanLogs,
  attributions,
  commissions,
  payoutBatches,
  tracks,
  trackPlays,
  trackPurchases,
  tips,
  payoutRequests,
  albums,
  albumTracks,
  playlists,
  playlistTracks,
  comments,
  likes,
  reposts,
  events,
  eventSeries,
  venues,
  eventFacilitators,
  ticketTypes,
  tickets,
  listings,
  orders,
  orderItems,
  articles,
  categories,
  articleCategories,
  broadcasts,
  podcasts,
  podcastEpisodes,
  notifications,
  pushSubscriptions,
  verificationApplications,
} from '@opynx/db';

// ─── Auth Router ───
const authRouter = createRouter({
  session: publicProcedure.query(async ({ ctx }) => {
    return ctx.session;
  }),
});

// ─── Users Router ───
const usersRouter = createRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    if (!userId) return null;
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    return user ?? null;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        avatar: z.string().url().optional(),
        locale: z.string().max(10).optional(),
        walletAddress: z.string().optional(),
        bio: z.string().max(500).optional(),
        socialInstagram: z.string().max(200).optional(),
        socialTwitter: z.string().max(200).optional(),
        socialTiktok: z.string().max(200).optional(),
        socialYoutube: z.string().max(200).optional(),
        socialSpotify: z.string().max(200).optional(),
        socialSoundcloud: z.string().max(200).optional(),
        socialWebsite: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, ctx.session.user.id))
        .returning();
      return updated;
    }),

  getByWallet: publicProcedure
    .input(z.object({ walletAddress: z.string() }))
    .query(async ({ input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.walletAddress, input.walletAddress),
      });
      return user ?? null;
    }),

  searchUsers: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      return db
        .select()
        .from(users)
        .where(ilike(users.name, `%${input.query}%`))
        .limit(input.limit);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, input.id),
      });
      return user ?? null;
    }),

  listCreators: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return db
        .select()
        .from(users)
        .where(eq(users.role, 'creator'))
        .orderBy(desc(users.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  follow: protectedProcedure
    .input(z.object({ followeeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Don't allow self-follow
      if (ctx.session.user.id === input.followeeId) return null;
      try {
        const [row] = await db
          .insert(follows)
          .values({ followerId: ctx.session.user.id, followeeId: input.followeeId })
          .onConflictDoNothing()
          .returning();
        return row ?? null;
      } catch {
        return null;
      }
    }),

  unfollow: protectedProcedure
    .input(z.object({ followeeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, ctx.session.user.id),
            eq(follows.followeeId, input.followeeId)
          )
        )
        .returning();
      return deleted ?? null;
    }),

  isFollowing: protectedProcedure
    .input(z.object({ followeeId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const row = await db.query.follows.findFirst({
        where: and(
          eq(follows.followerId, ctx.session.user.id),
          eq(follows.followeeId, input.followeeId)
        ),
      });
      return !!row;
    }),

  toggleFollow: protectedProcedure
    .input(z.object({ artistId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      if (userId === input.artistId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot follow yourself' });

      const existing = await db.query.follows.findFirst({
        where: and(eq(follows.followerId, userId), eq(follows.followeeId, input.artistId)),
      });

      if (existing) {
        await db.delete(follows).where(
          and(eq(follows.followerId, userId), eq(follows.followeeId, input.artistId))
        );
        return { following: false };
      } else {
        await db.insert(follows).values({
          followerId: userId,
          followeeId: input.artistId,
        });
        // Notify the followee — fire-and-forget
        const follower = await db.query.users.findFirst({ where: eq(users.id, userId) });
        void notify({
          userId: input.artistId,
          type: 'follow',
          title: 'New follower',
          body: `${follower?.name ?? 'Someone'} started following you`,
          link: `/artist/${userId}`,
          metadata: { followerId: userId },
        });
        return { following: true };
      }
    }),

  getFollowerCount: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(follows)
        .where(eq(follows.followeeId, input.userId));
      return result[0]?.count ?? 0;
    }),

  /**
   * Followers of the current user (the people who follow ME). Used by
   * /dashboard/fans to show the creator who their actual audience is.
   * Joins users for follower display name + role.
   */
  myFollowers: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [list, totals] = await Promise.all([
        db
          .select({
            followerId: follows.followerId,
            followedAt: follows.createdAt,
            name: users.name,
            avatar: users.avatar,
            role: users.role,
          })
          .from(follows)
          .innerJoin(users, eq(follows.followerId, users.id))
          .where(eq(follows.followeeId, userId))
          .orderBy(desc(follows.createdAt))
          .limit(input.limit)
          .offset(input.offset),
        db
          .select({
            total: sql<number>`COUNT(*)::int`,
            recent: sql<number>`COUNT(CASE WHEN ${follows.createdAt} >= ${thirtyDaysAgo} THEN 1 END)::int`,
          })
          .from(follows)
          .where(eq(follows.followeeId, userId)),
      ]);

      const t = totals[0] ?? { total: 0, recent: 0 };
      return {
        followers: list,
        total: t.total,
        recentLast30Days: t.recent,
      };
    }),

  /**
   * Creators the current user is following. Used by /library "Following" tab.
   * Joins users for display name + avatar + role.
   */
  myFollowing: protectedProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(100).default(50) })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
          role: users.role,
          followedAt: follows.createdAt,
        })
        .from(follows)
        .innerJoin(users, eq(follows.followeeId, users.id))
        .where(eq(follows.followerId, ctx.session.user.id))
        .orderBy(desc(follows.createdAt))
        .limit(limit);
      return rows;
    }),
});

// ─── Subscriptions Router ───
const subscriptionsRouter = createRouter({
  getMySubscription: protectedProcedure.query(async ({ ctx }) => {
    const sub = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, ctx.session.user.id),
        eq(subscriptions.status, 'active')
      ),
    });
    return sub ?? null;
  }),

  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const allSubs = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.session.user.id))
      .orderBy(desc(subscriptions.createdAt));
    return allSubs;
  }),

  cancel: protectedProcedure
    .input(z.object({ subscriptionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(subscriptions)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(
          and(
            eq(subscriptions.id, input.subscriptionId),
            eq(subscriptions.userId, ctx.session.user.id)
          )
        )
        .returning();

      if (updated) {
        await db.insert(subEvents).values({
          subscriptionId: updated.id,
          event: 'cancelled',
        });
      }

      return updated ?? null;
    }),
});

// ─── Attribution Router ───
const attributionRouter = createRouter({
  recordScan: protectedProcedure
    .input(
      z.object({
        qrCodeId: z.string(),
        eventId: z.string().uuid().optional(),
        facilitatorId: z.string().uuid().optional(),
        scanType: z.enum(['ACQUISITION_SCAN', 'RETENTION_SCAN']).default('ACQUISITION_SCAN'),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        accuracy: z.string().optional(),
        geoMatch: z.boolean().default(false),
        geoConfidence: z.enum(['EXACT', 'BUFFER']).optional(),
        totpFallback: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [scanLog] = await db
        .insert(scanLogs)
        .values({
          qrCodeId: input.qrCodeId,
          userId: ctx.session.user.id,
          eventId: input.eventId ?? null,
          facilitatorId: input.facilitatorId ?? null,
          scanType: input.scanType,
          geoMatch: input.geoMatch,
          geoConfidence: input.geoConfidence ?? null,
          totpFallback: input.totpFallback,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          accuracy: input.accuracy ?? null,
        })
        .returning();
      return scanLog;
    }),

  getAttributionChain: protectedProcedure
    .input(z.object({ subscriptionId: z.string().uuid() }))
    .query(async ({ input }) => {
      return db
        .select()
        .from(attributions)
        .where(eq(attributions.subscriptionId, input.subscriptionId));
    }),

  getMyReferrals: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(attributions)
      .where(eq(attributions.facilitatorId, ctx.session.user.id))
      .orderBy(desc(attributions.createdAt));
  }),
});

// ─── Tracks Router ───
const tracksRouter = createRouter({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        userId: z.string().uuid().optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [eq(tracks.status, 'published')];
      if (input.userId) conditions.push(eq(tracks.userId, input.userId));

      const rows = await db
        .select({
          id: tracks.id,
          userId: tracks.userId,
          title: tracks.title,
          slug: tracks.slug,
          genre: tracks.genre,
          bpm: tracks.bpm,
          duration: tracks.duration,
          visibility: tracks.visibility,
          status: tracks.status,
          playCount: tracks.playCount,
          price: tracks.price,
          createdAt: tracks.createdAt,
          artistName: users.name,
          coverUrl: tracks.coverUrl,
          rawAudioUrl: sql<string | null>`COALESCE(${tracks.audioUrl320}, ${tracks.audioUrl128})`,
        })
        .from(tracks)
        .leftJoin(users, eq(tracks.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(tracks.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      // Rewrite audioUrl through the same-origin proxy (eliminates iOS Safari
      // cross-origin/CORS quirks). Direct CDN URL is hidden from clients.
      return rows.map(({ rawAudioUrl, ...r }) => ({
        ...r,
        audioUrl: rawAudioUrl ? `/api/media/track/${r.id}` : null,
      }));
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const rows = await db
        .select({
          id: tracks.id,
          userId: tracks.userId,
          title: tracks.title,
          slug: tracks.slug,
          genre: tracks.genre,
          bpm: tracks.bpm,
          duration: tracks.duration,
          visibility: tracks.visibility,
          status: tracks.status,
          playCount: tracks.playCount,
          price: tracks.price,
          createdAt: tracks.createdAt,
          updatedAt: tracks.updatedAt,
          artistName: users.name,
          // For the verified ✓ badge next to the byline on /track/[id]
          artistVerifiedAt: users.verifiedAt,
          coverUrl: tracks.coverUrl,
          rawAudioUrl: sql<string | null>`COALESCE(${tracks.audioUrl320}, ${tracks.audioUrl128})`,
        })
        .from(tracks)
        .leftJoin(users, eq(tracks.userId, users.id))
        .where(eq(tracks.id, input.id))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      const { rawAudioUrl, ...rest } = row;
      return {
        ...rest,
        audioUrl: rawAudioUrl ? `/api/media/track/${row.id}` : null,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        slug: z.string().min(1).max(200),
        genre: z.string().optional(),
        bpm: z.number().int().min(1).max(999).optional(),
        duration: z.number().int().optional(),
        visibility: z.enum(['public', 'private', 'unlisted', 'subscribers_only']).default('public'),
        price: z.number().int().min(0).optional(),
        audioUrl: z.string().url().optional(),
        coverUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [track] = await db
        .insert(tracks)
        .values({
          userId: ctx.session.user.id,
          title: input.title,
          slug: input.slug,
          genre: input.genre ?? null,
          bpm: input.bpm ?? null,
          duration: input.duration ?? null,
          visibility: input.visibility,
          price: input.price ?? null,
          // Mirror to both quality tiers so the player COALESCE finds it
          audioUrl128: input.audioUrl ?? null,
          audioUrl320: input.audioUrl ?? null,
          coverUrl: input.coverUrl ?? null,
          status: 'published',
        })
        .returning();
      return track;
    }),

  upload: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        slug: z.string().min(1).max(200),
        genre: z.string().optional(),
        bpm: z.number().int().min(1).max(999).optional(),
        license: z.string().optional(),
        visibility: z.enum(['public', 'private', 'unlisted', 'subscribers_only']).default('public'),
        // Real URLs from UploadThing or paste-URL fallback
        audioUrl: z.string().url().optional(),
        coverUrl: z.string().url().optional(),
        duration: z.number().int().min(0).optional(),
        // Legacy field kept for backwards compatibility with old form callers
        originalFileKey: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [track] = await db
        .insert(tracks)
        .values({
          userId: ctx.session.user.id,
          title: input.title,
          slug: input.slug,
          genre: input.genre ?? null,
          bpm: input.bpm ?? null,
          license: input.license ?? null,
          visibility: input.visibility,
          // Track is "published" the moment we have a playable URL.
          status: input.audioUrl ? 'published' : 'uploading',
          originalFileKey: input.originalFileKey ?? input.audioUrl ?? null,
          // Mirror the URL into all three quality tiers until a transcode
          // pipeline exists. Player reads audioUrl320 first, falls back to 128.
          audioUrl128: input.audioUrl ?? null,
          audioUrl320: input.audioUrl ?? null,
          coverUrl: input.coverUrl ?? null,
          duration: input.duration ?? null,
        })
        .returning();
      return track;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        genre: z.string().optional(),
        bpm: z.number().int().min(1).max(999).optional(),
        duration: z.number().int().min(0).optional(),
        price: z.number().int().min(0).nullable().optional(),
        visibility: z.enum(['public', 'private', 'unlisted', 'subscribers_only']).optional(),
        audioUrl: z.string().url().optional(),
        coverUrl: z.string().url().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, audioUrl, ...rest } = input;
      // Mirror audioUrl into both quality tiers when provided
      const patch: Record<string, unknown> = {
        ...rest,
        updatedAt: new Date(),
      };
      if (audioUrl) {
        patch.audioUrl128 = audioUrl;
        patch.audioUrl320 = audioUrl;
      }
      const [updated] = await db
        .update(tracks)
        .set(patch)
        .where(and(eq(tracks.id, id), eq(tracks.userId, ctx.session.user.id)))
        .returning();
      return updated ?? null;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(tracks)
        .where(and(eq(tracks.id, input.id), eq(tracks.userId, ctx.session.user.id)))
        .returning();
      return deleted ?? null;
    }),

  /**
   * Recent listening history for the current user. Deduplicates by track
   * (one row per track, latest play wins) so the History tab shows recent
   * unique tracks rather than the same track repeated. Same shape as
   * tracks.list so /library can reuse the row component.
   *
   * Two-step: GROUP BY trackId for latest play timestamp per track, then
   * fetch track + artist metadata for those ids. Cheap given the
   * (user_id, played_at) index covers step 1.
   */
  history: protectedProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(100).default(50) })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const userId = ctx.session.user.id;

      const recent = await db
        .select({
          trackId: trackPlays.trackId,
          playedAt: sql<Date>`MAX(${trackPlays.playedAt})`.as('played_at'),
        })
        .from(trackPlays)
        .where(eq(trackPlays.userId, userId))
        .groupBy(trackPlays.trackId)
        .orderBy(sql`MAX(${trackPlays.playedAt}) DESC`)
        .limit(limit);

      if (recent.length === 0) return [];

      const trackIds = recent.map((r) => r.trackId);
      const trackRows = await db
        .select({
          id: tracks.id,
          userId: tracks.userId,
          title: tracks.title,
          slug: tracks.slug,
          genre: tracks.genre,
          bpm: tracks.bpm,
          duration: tracks.duration,
          visibility: tracks.visibility,
          status: tracks.status,
          playCount: tracks.playCount,
          price: tracks.price,
          createdAt: tracks.createdAt,
          artistName: users.name,
          coverUrl: tracks.coverUrl,
        })
        .from(tracks)
        .leftJoin(users, eq(tracks.userId, users.id))
        .where(inArray(tracks.id, trackIds));

      // Stitch played_at back in, preserve recent[] ordering (latest first).
      const byId = new Map(trackRows.map((t) => [t.id, t]));
      return recent
        .map((r) => {
          const t = byId.get(r.trackId);
          if (!t) return null;
          return {
            ...t,
            audioUrl: `/api/media/track/${t.id}`,
            playedAt: r.playedAt,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);
    }),
});

// ─── Albums Router ───
const albumsRouter = createRouter({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
        userId: z.string().uuid().optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];
      if (input.userId) conditions.push(eq(albums.userId, input.userId));

      return db
        .select()
        .from(albums)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(albums.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const album = await db.query.albums.findFirst({
        where: eq(albums.id, input.id),
      });
      return album ?? null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        slug: z.string().min(1).max(200),
        coverUrl: z.string().url().optional(),
        releaseDate: z.string().datetime().optional(),
        price: z.number().int().min(0).optional(),
        visibility: z.enum(['public', 'private', 'unlisted', 'subscribers_only']).default('public'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [album] = await db
        .insert(albums)
        .values({
          userId: ctx.session.user.id,
          title: input.title,
          slug: input.slug,
          coverUrl: input.coverUrl ?? null,
          releaseDate: input.releaseDate ? new Date(input.releaseDate) : null,
          price: input.price ?? null,
          visibility: input.visibility,
        })
        .returning();
      return album;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        coverUrl: z.string().url().optional(),
        visibility: z.enum(['public', 'private', 'unlisted', 'subscribers_only']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await db
        .update(albums)
        .set(data)
        .where(and(eq(albums.id, id), eq(albums.userId, ctx.session.user.id)))
        .returning();
      return updated ?? null;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(albums)
        .where(and(eq(albums.id, input.id), eq(albums.userId, ctx.session.user.id)))
        .returning();
      return deleted ?? null;
    }),

  getTracks: publicProcedure
    .input(z.object({ albumId: z.string().uuid() }))
    .query(async ({ input }) => {
      return db
        .select({ track: tracks, position: albumTracks.position })
        .from(albumTracks)
        .innerJoin(tracks, eq(albumTracks.trackId, tracks.id))
        .where(eq(albumTracks.albumId, input.albumId))
        .orderBy(albumTracks.position);
    }),
});

// ─── Playlists Router ───
const playlistsRouter = createRouter({
  list: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];
      if (input.userId) conditions.push(eq(playlists.userId, input.userId));

      return db
        .select()
        .from(playlists)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(playlists.createdAt))
        .limit(input.limit);
    }),

  /**
   * Playlists owned by the current authenticated user. Used by /library
   * "Playlists" tab and the AddToPlaylistModal so the user only sees their
   * own playlists (the public `list` procedure returns everyone's).
   */
  listMine: protectedProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(100).default(50) })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      return db
        .select()
        .from(playlists)
        .where(eq(playlists.userId, ctx.session.user.id))
        .orderBy(desc(playlists.createdAt))
        .limit(limit);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const playlist = await db.query.playlists.findFirst({
        where: eq(playlists.id, input.id),
      });
      return playlist ?? null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        visibility: z.enum(['public', 'private', 'unlisted', 'subscribers_only']).default('public'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [playlist] = await db
        .insert(playlists)
        .values({
          userId: ctx.session.user.id,
          title: input.title,
          description: input.description ?? null,
          visibility: input.visibility,
        })
        .returning();
      return playlist;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await db
        .update(playlists)
        .set(data)
        .where(and(eq(playlists.id, id), eq(playlists.userId, ctx.session.user.id)))
        .returning();
      return updated ?? null;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(playlists)
        .where(and(eq(playlists.id, input.id), eq(playlists.userId, ctx.session.user.id)))
        .returning();
      return deleted ?? null;
    }),

  addTrack: protectedProcedure
    .input(
      z.object({
        playlistId: z.string().uuid(),
        trackId: z.string().uuid(),
        position: z.number().int().min(0),
      })
    )
    .mutation(async ({ input }) => {
      const [entry] = await db
        .insert(playlistTracks)
        .values({
          playlistId: input.playlistId,
          trackId: input.trackId,
          position: input.position,
        })
        .returning();
      return entry;
    }),

  getTracks: publicProcedure
    .input(z.object({ playlistId: z.string().uuid() }))
    .query(async ({ input }) => {
      return db
        .select({ track: tracks, position: playlistTracks.position })
        .from(playlistTracks)
        .innerJoin(tracks, eq(playlistTracks.trackId, tracks.id))
        .where(eq(playlistTracks.playlistId, input.playlistId))
        .orderBy(playlistTracks.position);
    }),

  removeTrack: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [deleted] = await db
        .delete(playlistTracks)
        .where(eq(playlistTracks.id, input.id))
        .returning();
      return deleted ?? null;
    }),
});

// ─── Events Router ───
const eventsRouter = createRouter({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z.enum(['draft', 'published', 'active', 'completed', 'cancelled']).optional(),
        // Optional filter: only return events hosted by this user. Powers
        // the /dashboard/promo-qr "tag with an event" picker.
        hostId: z.string().uuid().optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];
      if (input.status) conditions.push(eq(events.status, input.status));
      if (input.hostId) conditions.push(eq(events.hostId, input.hostId));

      return db
        .select({
          id: events.id,
          hostId: events.hostId,
          title: events.title,
          description: events.description,
          coverUrl: events.coverUrl,
          startDate: events.startDate,
          endDate: events.endDate,
          venueId: events.venueId,
          venueName: events.venueName,
          venueCity: events.venueCity,
          venueAddress: events.venueAddress,
          venueLat: events.venueLat,
          venueLng: events.venueLng,
          geofenceRadiusMeters: events.geofenceRadiusMeters,
          geofenceEnforced: events.geofenceEnforced,
          countryCode: events.countryCode,
          timezone: events.timezone,
          status: events.status,
          capacity: events.capacity,
          createdAt: events.createdAt,
          hostName: users.name,
        })
        .from(events)
        .leftJoin(users, eq(events.hostId, users.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(events.startDate))
        .limit(input.limit)
        .offset(input.offset);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const rows = await db
        .select({
          id: events.id,
          hostId: events.hostId,
          title: events.title,
          description: events.description,
          coverUrl: events.coverUrl,
          startDate: events.startDate,
          endDate: events.endDate,
          venueId: events.venueId,
          venueName: events.venueName,
          venueCity: events.venueCity,
          venueAddress: events.venueAddress,
          venueLat: events.venueLat,
          venueLng: events.venueLng,
          geofenceRadiusMeters: events.geofenceRadiusMeters,
          geofenceEnforced: events.geofenceEnforced,
          countryCode: events.countryCode,
          timezone: events.timezone,
          status: events.status,
          capacity: events.capacity,
          createdAt: events.createdAt,
          hostName: users.name,
        })
        .from(events)
        .leftJoin(users, eq(events.hostId, users.id))
        .where(eq(events.id, input.id))
        .limit(1);
      return rows[0] ?? null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(50000).optional(),
        coverUrl: z.string().url().optional(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime().optional(),
        venueId: z.string().uuid().optional(),
        venueName: z.string().max(200).optional(),
        venueCity: z.string().max(100).optional(),
        venueAddress: z.string().max(300).optional(),
        // Geofencing — captured via browser geolocation at create time
        venueLat: z.number().min(-90).max(90).optional(),
        venueLng: z.number().min(-180).max(180).optional(),
        geofenceRadiusMeters: z.number().int().min(20).max(5000).optional(),
        geofenceEnforced: z.boolean().optional(),
        countryCode: z.string().max(2).optional(),
        timezone: z.string().optional(),
        capacity: z.number().int().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [event] = await db
        .insert(events)
        .values({
          hostId: ctx.session.user.id,
          title: input.title,
          description: input.description ?? null,
          coverUrl: input.coverUrl ?? null,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : new Date(new Date(input.startDate).getTime() + 3 * 60 * 60 * 1000),
          venueId: input.venueId ?? null,
          venueName: input.venueName ?? null,
          venueCity: input.venueCity ?? null,
          venueAddress: input.venueAddress ?? null,
          venueLat: input.venueLat ?? null,
          venueLng: input.venueLng ?? null,
          geofenceRadiusMeters: input.geofenceRadiusMeters ?? 100,
          geofenceEnforced: input.geofenceEnforced ?? false,
          countryCode: input.countryCode ?? null,
          timezone: input.timezone ?? null,
          capacity: input.capacity ?? null,
          // Default to 'published' — the create-event UI is a one-shot "set up
          // everything and publish" flow, and users expect the "Publish Event"
          // button to actually make the event visible. If a drafts-first flow
          // is added later, pass status: 'draft' from the mutation input.
          status: 'published',
        })
        .returning();
      return event;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        status: z.enum(['draft', 'published', 'active', 'completed', 'cancelled']).optional(),
        capacity: z.number().int().min(1).optional(),
        coverUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await db
        .update(events)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(events.id, id), eq(events.hostId, ctx.session.user.id)))
        .returning();
      return updated ?? null;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(events)
        .where(and(eq(events.id, input.id), eq(events.hostId, ctx.session.user.id)))
        .returning();
      return deleted ?? null;
    }),

  getMyEvents: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(events)
      .where(eq(events.hostId, ctx.session.user.id))
      .orderBy(desc(events.startDate));
  }),

  getTickets: publicProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ input }) => {
      return db
        .select()
        .from(ticketTypes)
        .where(eq(ticketTypes.eventId, input.eventId));
    }),
});

// ─── Tickets Router ───
const ticketsRouter = createRouter({
  purchase: protectedProcedure
    .input(
      z.object({
        ticketTypeId: z.string().uuid(),
        eventId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Look up the ticket type to determine whether payment is required
      const ticketType = await db.query.ticketTypes.findFirst({
        where: eq(ticketTypes.id, input.ticketTypeId),
      });
      if (!ticketType) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket type not found' });
      }
      if (ticketType.eventId !== input.eventId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Ticket type does not belong to this event' });
      }

      // Atomic inventory decrement — guards against overselling under concurrent
      // purchases. This runs BEFORE payment; if the user abandons checkout the
      // `sold` count stays incremented (ticket stays 'pending'), and the
      // NOWPayments webhook releases inventory on failed/expired payments.
      const result = await db.execute(
        sql`UPDATE ticket_types SET sold = sold + 1 WHERE id = ${input.ticketTypeId} AND (quantity IS NULL OR sold < quantity)`
      );
      const rowsAffected = Number(
        (result as any).rowCount ?? (result as any).count ?? result.length ?? 0
      );
      if (rowsAffected === 0) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Tickets are sold out' });
      }

      const isFree = ticketType.price === 0;
      const qrToken = `opynx_ticket_${Date.now()}_${ctx.session.user.id}`;

      const [ticket] = await db
        .insert(tickets)
        .values({
          ticketTypeId: input.ticketTypeId,
          attendeeId: ctx.session.user.id,
          eventId: input.eventId,
          qrToken,
          // Free tickets skip payment; paid tickets wait for webhook confirmation
          status: isFree ? 'valid' : 'pending',
        })
        .returning();

      // Free ticket: done
      if (isFree) {
        return { ticket, paymentUrl: null };
      }

      // Paid ticket: create NOWPayments charge. If this fails we release inventory.
      const apiKey = process.env.NOWPAYMENTS_API_KEY;
      if (!apiKey) {
        // Roll back: release inventory + delete the pending ticket
        await db.delete(tickets).where(eq(tickets.id, ticket.id));
        await db.execute(
          sql`UPDATE ticket_types SET sold = GREATEST(sold - 1, 0) WHERE id = ${input.ticketTypeId}`
        );
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Payment not configured' });
      }

      try {
        const priceUsd = ticketType.price / 100;
        const response = await fetch('https://api.nowpayments.io/v1/payment', {
          method: 'POST',
          headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            price_amount: priceUsd,
            price_currency: 'usd',
            pay_currency: 'usdcmatic',
            // IMPORTANT: order_id encodes the PENDING ticket's UUID. The
            // webhook at /api/webhooks/nowpayments parses this to find and
            // activate the ticket.
            order_id: `ticket_${ticket.id}`,
            order_description: `OPYNX ticket: ${ticketType.name} — $${priceUsd.toFixed(2)}`,
            ipn_callback_url: 'https://opynx.com/api/webhooks/nowpayments',
            success_url: `https://opynx.com/tickets/confirmation?ticketId=${ticket.id}`,
            cancel_url: `https://opynx.com/tickets/${input.eventId}?cancelled=true`,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.payment_id) {
          // Roll back on NOWPayments failure
          await db.delete(tickets).where(eq(tickets.id, ticket.id));
          await db.execute(
            sql`UPDATE ticket_types SET sold = GREATEST(sold - 1, 0) WHERE id = ${input.ticketTypeId}`
          );
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Payment creation failed',
          });
        }

        return {
          ticket,
          paymentUrl: `https://nowpayments.io/payment/?iid=${data.payment_id}`,
        };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        // Roll back on network error
        await db.delete(tickets).where(eq(tickets.id, ticket.id));
        await db.execute(
          sql`UPDATE ticket_types SET sold = GREATEST(sold - 1, 0) WHERE id = ${input.ticketTypeId}`
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Payment service unavailable',
        });
      }
    }),

  getMyTickets: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select({ ticket: tickets, event: events })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .where(eq(tickets.attendeeId, ctx.session.user.id))
      .orderBy(desc(events.startDate));
  }),

  createTicketType: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        name: z.string().min(1).max(100),
        tier: z.enum(['free', 'early_bird', 'general', 'vip']).default('general'),
        price: z.number().int().min(0),
        quantity: z.number().int().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user owns the event
      const event = await db.query.events.findFirst({
        where: and(eq(events.id, input.eventId), eq(events.hostId, ctx.session.user.id)),
      });
      if (!event) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your event' });

      const [ticketType] = await db
        .insert(ticketTypes)
        .values({
          eventId: input.eventId,
          name: input.name,
          tier: input.tier,
          price: input.price,
          quantity: input.quantity,
          sold: 0,
        })
        .returning();
      return ticketType;
    }),

  getTicketTypes: publicProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ input }) => {
      return db
        .select()
        .from(ticketTypes)
        .where(eq(ticketTypes.eventId, input.eventId))
        .orderBy(ticketTypes.price);
    }),

  getEventSales: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify the user owns this event
      const event = await db.query.events.findFirst({
        where: and(eq(events.id, input.eventId), eq(events.hostId, ctx.session.user.id)),
      });
      if (!event) return null;

      const types = await db
        .select()
        .from(ticketTypes)
        .where(eq(ticketTypes.eventId, input.eventId));

      const soldTickets = await db
        .select({
          id: tickets.id,
          ticketTypeId: tickets.ticketTypeId,
          status: tickets.status,
          createdAt: tickets.createdAt,
          attendeeName: users.name,
          attendeeEmail: users.email,
        })
        .from(tickets)
        .leftJoin(users, eq(tickets.attendeeId, users.id))
        .where(eq(tickets.eventId, input.eventId))
        .orderBy(desc(tickets.createdAt));

      const totalRevenue = types.reduce((sum, t) => sum + (t.sold ?? 0) * t.price, 0);
      const totalSold = types.reduce((sum, t) => sum + (t.sold ?? 0), 0);
      const totalCapacity = types.reduce((sum, t) => sum + (t.quantity ?? 0), 0);

      return {
        event,
        ticketTypes: types,
        soldTickets,
        totalRevenue,
        totalSold,
        totalCapacity,
      };
    }),

  validate: publicProcedure
    .input(z.object({ qrToken: z.string() }))
    .query(async ({ input }) => {
      const ticket = await db.query.tickets.findFirst({
        where: eq(tickets.qrToken, input.qrToken),
      });
      if (!ticket) return { valid: false, ticket: null };
      return { valid: ticket.status === 'valid', ticket };
    }),

  /**
   * Check in a ticket at the venue. Validates the QR token, confirms the
   * scanner is the event host, optionally enforces geofence (scanner must be
   * within `geofenceRadiusMeters` of the venue) AND time window (event start
   * − 2h through end + 1h) when `event.geofenceEnforced=true`. Flips ticket
   * status valid → used with a checkedIn timestamp. Idempotent on already-
   * used tickets: returns the original check-in time instead of erroring.
   */
  checkIn: protectedProcedure
    .input(
      z.object({
        qrToken: z.string().min(1),
        // Optional GPS — required when event.geofenceEnforced=true.
        // Captured via browser navigator.geolocation on the scanner device.
        scannerLat: z.number().min(-90).max(90).optional(),
        scannerLng: z.number().min(-180).max(180).optional(),
        scannerAccuracyMeters: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ticket = await db.query.tickets.findFirst({
        where: eq(tickets.qrToken, input.qrToken),
      });
      if (!ticket) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found — invalid QR' });
      }

      // Authorize: only the event host can check tickets in
      const event = await db.query.events.findFirst({ where: eq(events.id, ticket.eventId) });
      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
      }
      if (event.hostId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the event host can check tickets in',
        });
      }

      // Status checks
      if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Ticket is ${ticket.status}, not valid for entry`,
        });
      }
      if (ticket.status === 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Ticket payment not confirmed yet',
        });
      }

      // Geofence + time window enforcement (when host opted in)
      let geoDistanceMeters: number | null = null;
      let geoConfidence: 'high' | 'medium' | 'low' | null = null;
      if (event.geofenceEnforced) {
        // Time window: start − 2h through end + 1h
        const now = Date.now();
        const startMs = event.startDate.getTime();
        const endMs = event.endDate.getTime();
        const windowStart = startMs - 2 * 60 * 60 * 1000;
        const windowEnd = endMs + 60 * 60 * 1000;
        if (now < windowStart) {
          const minsUntil = Math.round((windowStart - now) / 60000);
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Check-in opens ${minsUntil} min from now (event starts ${event.startDate.toLocaleString()})`,
          });
        }
        if (now > windowEnd) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Check-in window closed (event ended ${event.endDate.toLocaleString()})`,
          });
        }

        // GPS check — only if venue location was captured at create time
        if (event.venueLat != null && event.venueLng != null) {
          if (input.scannerLat == null || input.scannerLng == null) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'GPS location required — enable location access in your browser and retry',
            });
          }
          // Inline Haversine — keeps the mutation self-contained
          const R = 6371000; // meters
          const lat1 = (event.venueLat * Math.PI) / 180;
          const lat2 = (input.scannerLat * Math.PI) / 180;
          const dLat = ((input.scannerLat - event.venueLat) * Math.PI) / 180;
          const dLng = ((input.scannerLng - event.venueLng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          geoDistanceMeters = Math.round(R * c);
          const radius = event.geofenceRadiusMeters ?? 100;
          // Allow scanner GPS accuracy slack — if reported accuracy is e.g.
          // 50m, treat the user as in-range if they're within radius+50m.
          const slack = Math.min(input.scannerAccuracyMeters ?? 0, 200);
          if (geoDistanceMeters > radius + slack) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `You're ${geoDistanceMeters}m from the venue (max ${radius}m). Scan from the venue.`,
            });
          }
          geoConfidence =
            geoDistanceMeters <= radius * 0.5 ? 'high'
            : geoDistanceMeters <= radius ? 'medium'
            : 'low';
        }
      }

      // Idempotent on re-scan of already-used ticket
      if (ticket.status === 'used') {
        return {
          alreadyCheckedIn: true,
          ticket,
          event,
          checkedIn: ticket.checkedIn,
          geoDistanceMeters,
          geoConfidence,
        };
      }

      // Flip to used
      const [updated] = await db
        .update(tickets)
        .set({ status: 'used', checkedIn: new Date() })
        .where(eq(tickets.id, ticket.id))
        .returning();

      return {
        alreadyCheckedIn: false,
        ticket: updated,
        event,
        checkedIn: updated.checkedIn,
        geoDistanceMeters,
        geoConfidence,
      };
    }),
});

// ─── Marketplace Router ───
const marketplaceRouter = createRouter({
  listItems: publicProcedure
    .input(
      z.object({
        category: z.enum(['physical_music', 'used_gear', 'services', 'merch']).optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const conditions = [sql`${listings.status} = 'active'`];
      if (input.category) conditions.push(eq(listings.category, input.category));

      return db
        .select({
          id: listings.id,
          sellerId: listings.sellerId,
          title: listings.title,
          description: listings.description,
          category: listings.category,
          price: listings.price,
          currency: listings.currency,
          stock: listings.stock,
          status: listings.status,
          createdAt: listings.createdAt,
          sellerName: users.name,
        })
        .from(listings)
        .leftJoin(users, eq(listings.sellerId, users.id))
        .where(and(...conditions))
        .orderBy(desc(listings.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  getItem: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const rows = await db
        .select({
          id: listings.id,
          sellerId: listings.sellerId,
          title: listings.title,
          description: listings.description,
          category: listings.category,
          price: listings.price,
          currency: listings.currency,
          stock: listings.stock,
          status: listings.status,
          createdAt: listings.createdAt,
          sellerName: users.name,
        })
        .from(listings)
        .leftJoin(users, eq(listings.sellerId, users.id))
        .where(eq(listings.id, input.id))
        .limit(1);
      return rows[0] ?? null;
    }),

  /**
   * Purchase a marketplace listing. Creates a pending order + NOWPayments charge.
   * Webhook flips 'pending' → 'paid' on payment.finished. Seller handles shipping
   * out-of-band for now (MVP).
   */
  buy: protectedProcedure
    .input(
      z.object({
        listingId: z.string().uuid(),
        quantity: z.number().int().min(1).max(10).default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const buyerId = ctx.session.user.id;

      const listing = await db.query.listings.findFirst({
        where: eq(listings.id, input.listingId),
      });
      if (!listing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
      }
      if (listing.status !== 'active') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Listing is not available' });
      }
      if (listing.sellerId === buyerId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot buy your own listing' });
      }
      if (listing.stock !== null && listing.stock < input.quantity) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Insufficient stock' });
      }

      const apiKey = process.env.NOWPAYMENTS_API_KEY;
      if (!apiKey) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Payment not configured' });
      }

      const unitPrice = listing.price;
      const subtotal = unitPrice * input.quantity;
      // Platform commission: 15% flat for marketplace (consistent with track
      // sales). Seller sees 85%.
      const commissionCents = Math.floor(subtotal * 0.15);

      // Atomic stock decrement (guards against concurrent purchases)
      const stockResult = await db.execute(
        sql`UPDATE listings SET stock = stock - ${input.quantity} WHERE id = ${input.listingId} AND (stock IS NULL OR stock >= ${input.quantity}) AND status = 'active'`
      );
      const affected = Number(
        (stockResult as any).rowCount ?? (stockResult as any).count ?? stockResult.length ?? 0
      );
      if (affected === 0) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Out of stock' });
      }

      // Create pending order
      const [order] = await db
        .insert(orders)
        .values({
          buyerId,
          sellerId: listing.sellerId,
          totalAmount: subtotal,
          commission: commissionCents,
          paymentMethod: 'nowpayments',
          status: 'pending',
        })
        .returning();

      await db.insert(orderItems).values({
        orderId: order.id,
        listingId: listing.id,
        quantity: input.quantity,
        unitPrice,
      });

      try {
        const priceUsd = subtotal / 100;
        const response = await fetch('https://api.nowpayments.io/v1/payment', {
          method: 'POST',
          headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            price_amount: priceUsd,
            price_currency: 'usd',
            pay_currency: 'usdcmatic',
            order_id: `merch_${order.id}`,
            order_description: `OPYNX marketplace: ${listing.title} x${input.quantity} — $${priceUsd.toFixed(2)}`,
            ipn_callback_url: 'https://opynx.com/api/webhooks/nowpayments',
            success_url: `https://opynx.com/marketplace/${listing.id}?purchased=true`,
            cancel_url: `https://opynx.com/marketplace/${listing.id}?cancelled=true`,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.payment_id) {
          // Roll back stock + order
          await db.delete(orderItems).where(eq(orderItems.orderId, order.id));
          await db.delete(orders).where(eq(orders.id, order.id));
          await db.execute(
            sql`UPDATE listings SET stock = stock + ${input.quantity} WHERE id = ${input.listingId}`
          );
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Payment creation failed',
          });
        }

        await db
          .update(orders)
          .set({ paymentId: String(data.payment_id) })
          .where(eq(orders.id, order.id));

        return {
          order,
          paymentUrl: `https://nowpayments.io/payment/?iid=${data.payment_id}`,
        };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        // Roll back on any other error
        await db.delete(orderItems).where(eq(orderItems.orderId, order.id));
        await db.delete(orders).where(eq(orders.id, order.id));
        await db.execute(
          sql`UPDATE listings SET stock = stock + ${input.quantity} WHERE id = ${input.listingId}`
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Payment service unavailable',
        });
      }
    }),

  /** List the current user's own orders (purchases they've made) */
  myOrders: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select({
        order: orders,
        listingTitle: listings.title,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .leftJoin(listings, eq(listings.id, orderItems.listingId))
      .where(eq(orders.buyerId, ctx.session.user.id))
      .orderBy(desc(orders.createdAt));
  }),

  /** List the current user's incoming sales (where they're the seller) */
  mySales: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select({
        order: orders,
        listingTitle: listings.title,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .leftJoin(listings, eq(listings.id, orderItems.listingId))
      .where(eq(orders.sellerId, ctx.session.user.id))
      .orderBy(desc(orders.createdAt));
  }),

  createListing: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        category: z.enum(['physical_music', 'used_gear', 'services', 'merch']),
        price: z.number().int().min(0),
        currency: z.string().max(3).default('USD'),
        imageUrls: z.array(z.string().url()).max(10).optional(),
        stock: z.number().int().min(1).default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [listing] = await db
        .insert(listings)
        .values({
          sellerId: ctx.session.user.id,
          title: input.title,
          description: input.description ?? null,
          category: input.category,
          price: input.price,
          currency: input.currency,
          imageUrls: input.imageUrls ?? null,
          stock: input.stock,
          status: 'active',
        })
        .returning();
      return listing;
    }),

  getMyListings: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(listings)
      .where(eq(listings.sellerId, ctx.session.user.id))
      .orderBy(desc(listings.createdAt));
  }),
});

// ─── Articles Router ───
const articlesRouter = createRouter({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
        status: z.enum(['draft', 'private', 'listed', 'public']).optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];
      if (input.status) {
        conditions.push(eq(articles.status, input.status));
      } else {
        conditions.push(eq(articles.status, 'public'));
      }

      return db
        .select()
        .from(articles)
        .where(and(...conditions))
        .orderBy(desc(articles.publishedAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const article = await db.query.articles.findFirst({
        where: eq(articles.id, input.id),
      });
      return article ?? null;
    }),

  // Public-facing article URL is /articles/[slug] — needs slug lookup. Joins
  // users for the author display name shown on the detail page byline.
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ input }) => {
      const [row] = await db
        .select({
          id: articles.id,
          authorId: articles.authorId,
          title: articles.title,
          slug: articles.slug,
          body: articles.body,
          excerpt: articles.excerpt,
          coverUrl: articles.coverUrl,
          status: articles.status,
          publishedAt: articles.publishedAt,
          createdAt: articles.createdAt,
          updatedAt: articles.updatedAt,
          authorName: users.name,
          authorAvatar: users.avatar,
        })
        .from(articles)
        .leftJoin(users, eq(articles.authorId, users.id))
        .where(eq(articles.slug, input.slug))
        .limit(1);
      return row ?? null;
    }),

  // Author's own articles (drafts + published) for the dashboard editor.
  // Public list endpoint above only returns 'public' rows.
  listMine: protectedProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(100).default(50) })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      return db
        .select()
        .from(articles)
        .where(eq(articles.authorId, ctx.session.user.id))
        .orderBy(desc(articles.updatedAt))
        .limit(limit);
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        slug: z.string().min(1).max(200),
        body: z.any().optional(),
        excerpt: z.string().max(500).optional(),
        coverUrl: z.string().url().optional(),
        contentLocale: z.string().max(10).default('en'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [article] = await db
        .insert(articles)
        .values({
          authorId: ctx.session.user.id,
          title: input.title,
          slug: input.slug,
          body: input.body ?? null,
          excerpt: input.excerpt ?? null,
          coverUrl: input.coverUrl ?? null,
          contentLocale: input.contentLocale,
          status: 'draft',
        })
        .returning();
      return article;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        body: z.any().optional(),
        excerpt: z.string().max(500).optional(),
        coverUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await db
        .update(articles)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(articles.id, id), eq(articles.authorId, ctx.session.user.id)))
        .returning();
      return updated ?? null;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(articles)
        .where(and(eq(articles.id, input.id), eq(articles.authorId, ctx.session.user.id)))
        .returning();
      return deleted ?? null;
    }),

  publish: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [published] = await db
        .update(articles)
        .set({
          status: 'public',
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(articles.id, input.id), eq(articles.authorId, ctx.session.user.id)))
        .returning();
      return published ?? null;
    }),
});

// ─── Bookings Router ───
const bookingsRouter = createRouter({
  getMyBookings: protectedProcedure.query(async ({ ctx }) => {
    // Bookings are derived from events where the user is host or facilitator
    const hostedEvents = await db
      .select()
      .from(events)
      .where(eq(events.hostId, ctx.session.user.id))
      .orderBy(desc(events.startDate));
    return hostedEvents;
  }),
});

// ─── Upload Router ───
const uploadRouter = createRouter({
  getPresignedUrl: protectedProcedure
    .input(
      z.object({
        filename: z.string().min(1),
        contentType: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const key = `uploads/${ctx.session.user.id}/${Date.now()}-${input.filename}`;
      // In production, generate a real presigned URL via S3/MinIO SDK
      // For now, return the key for local dev
      return {
        url: `${process.env.AWS_S3_ENDPOINT ?? 'http://localhost:9000'}/${process.env.AWS_S3_BUCKET ?? 'opynx-media'}/${key}`,
        key,
        fields: {},
      };
    }),

  getUploadStatus: protectedProcedure
    .input(z.object({ trackId: z.string().uuid() }))
    .query(async ({ input }) => {
      const track = await db.query.tracks.findFirst({
        where: eq(tracks.id, input.trackId),
      });
      return { status: track?.status ?? 'unknown' };
    }),
});

// ─── Admin Router ───
const adminRouter = createRouter({
  getDashboard: adminProcedure.query(async () => {
    const [userCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const [subCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));
    const [trackCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tracks);
    const [eventCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(events);

    return {
      totalUsers: Number(userCount.count),
      activeSubscriptions: Number(subCount.count),
      totalTracks: Number(trackCount.count),
      totalEvents: Number(eventCount.count),
    };
  }),

  getUsers: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        role: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];
      if (input.role) conditions.push(sql`${users.role} = ${input.role}`);

      return db
        .select()
        .from(users)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(users.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  getPayouts: adminProcedure
    .input(z.object({ month: z.string().optional() }))
    .query(async ({ input }) => {
      const conditions = [];
      if (input.month) conditions.push(eq(payoutBatches.month, input.month));

      return db
        .select()
        .from(payoutBatches)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(payoutBatches.createdAt));
    }),

  getCommissions: adminProcedure
    .input(
      z.object({
        status: z.enum(['pending', 'approved', 'processing', 'paid', 'held', 'clawed_back']).optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];
      if (input.status) conditions.push(eq(commissions.status, input.status));

      return db
        .select()
        .from(commissions)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(commissions.createdAt))
        .limit(input.limit);
    }),
});

// ─── Comments Router ───
const commentsRouter = createRouter({
  list: publicProcedure
    .input(
      z.object({
        trackId: z.string().uuid(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      return db
        .select({
          id: comments.id,
          userId: comments.userId,
          trackId: comments.trackId,
          body: comments.body,
          timestampMs: comments.timestampMs,
          parentId: comments.parentId,
          createdAt: comments.createdAt,
          userName: users.name,
          userAvatar: users.avatar,
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.trackId, input.trackId))
        .orderBy(desc(comments.createdAt))
        .limit(input.limit);
    }),

  add: protectedProcedure
    .input(
      z.object({
        trackId: z.string().uuid(),
        body: z.string().min(1).max(2000),
        timestampMs: z.number().int().min(0).optional(),
        parentId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [comment] = await db
        .insert(comments)
        .values({
          userId: ctx.session.user.id,
          trackId: input.trackId,
          body: input.body,
          timestampMs: input.timestampMs ?? null,
          parentId: input.parentId ?? null,
        })
        .returning();
      return comment;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(comments)
        .where(
          and(eq(comments.id, input.id), eq(comments.userId, ctx.session.user.id))
        )
        .returning();
      return deleted ?? null;
    }),
});

// ─── Broadcasts Router ───
const broadcastsRouter = createRouter({
  list: publicProcedure
    .input(
      z.object({
        artistId: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];
      if (input.artistId) conditions.push(eq(broadcasts.artistId, input.artistId));

      return db
        .select({
          id: broadcasts.id,
          artistId: broadcasts.artistId,
          type: broadcasts.type,
          title: broadcasts.title,
          body: broadcasts.body,
          mediaUrl: broadcasts.mediaUrl,
          subscribersOnly: broadcasts.subscribersOnly,
          publishedAt: broadcasts.publishedAt,
          createdAt: broadcasts.createdAt,
          artistName: users.name,
        })
        .from(broadcasts)
        .leftJoin(users, eq(broadcasts.artistId, users.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(broadcasts.createdAt))
        .limit(input.limit);
    }),

  send: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        body: z.string().min(1).max(5000),
        type: z.enum(['text', 'voice_memo', 'announcement', 'exclusive']).default('text'),
        subscribersOnly: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [broadcast] = await db
        .insert(broadcasts)
        .values({
          artistId: ctx.session.user.id,
          title: input.title,
          body: input.body,
          type: input.type,
          subscribersOnly: input.subscribersOnly,
        })
        .returning();
      return broadcast;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(broadcasts)
        .where(
          and(
            eq(broadcasts.id, input.id),
            eq(broadcasts.artistId, ctx.session.user.id)
          )
        )
        .returning();
      return deleted ?? null;
    }),
});

// ─── Likes Router ───
const likesRouter = createRouter({
  toggleLike: protectedProcedure
    .input(z.object({ trackId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const existing = await db.query.likes.findFirst({
        where: and(eq(likes.userId, userId), eq(likes.trackId, input.trackId)),
      });

      if (existing) {
        await db.delete(likes).where(
          and(eq(likes.userId, userId), eq(likes.trackId, input.trackId))
        );
        return { liked: false };
      } else {
        await db.insert(likes).values({ userId, trackId: input.trackId });
        return { liked: true };
      }
    }),

  isLiked: protectedProcedure
    .input(z.object({ trackId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      if (!userId) return false;
      const existing = await db.query.likes.findFirst({
        where: and(eq(likes.userId, userId), eq(likes.trackId, input.trackId)),
      });
      return !!existing;
    }),

  getLikeCount: publicProcedure
    .input(z.object({ trackId: z.string().uuid() }))
    .query(async ({ input }) => {
      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(likes)
        .where(eq(likes.trackId, input.trackId));
      return result[0]?.count ?? 0;
    }),

  /**
   * Tracks the current user has liked. Returns the same shape as
   * tracks.list so the /library "Liked Tracks" tab can reuse the same
   * row component. audioUrl is rewritten through the same-origin proxy.
   */
  listMine: protectedProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(100).default(50) })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const rows = await db
        .select({
          id: tracks.id,
          userId: tracks.userId,
          title: tracks.title,
          slug: tracks.slug,
          genre: tracks.genre,
          bpm: tracks.bpm,
          duration: tracks.duration,
          visibility: tracks.visibility,
          status: tracks.status,
          playCount: tracks.playCount,
          price: tracks.price,
          createdAt: tracks.createdAt,
          artistName: users.name,
          coverUrl: tracks.coverUrl,
          rawAudioUrl: sql<string | null>`COALESCE(${tracks.audioUrl320}, ${tracks.audioUrl128})`,
          likedAt: likes.createdAt,
        })
        .from(likes)
        .innerJoin(tracks, eq(likes.trackId, tracks.id))
        .leftJoin(users, eq(tracks.userId, users.id))
        .where(eq(likes.userId, ctx.session.user.id))
        .orderBy(desc(likes.createdAt))
        .limit(limit);
      return rows.map(({ rawAudioUrl, ...r }) => ({
        ...r,
        audioUrl: rawAudioUrl ? `/api/media/track/${r.id}` : null,
      }));
    }),
});

// ─── Podcasts Router ───
const podcastsRouter = createRouter({
  list: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(podcasts)
        .where(input.userId ? eq(podcasts.userId, input.userId) : undefined)
        .orderBy(desc(podcasts.createdAt))
        .limit(input.limit);

      // Attach episode counts
      const withEpisodes = await Promise.all(
        rows.map(async (show) => {
          const episodes = await db
            .select()
            .from(podcastEpisodes)
            .where(eq(podcastEpisodes.podcastId, show.id))
            .orderBy(desc(podcastEpisodes.createdAt));
          const totalPlays = episodes.reduce((sum, ep) => sum + (ep.downloadCount ?? 0), 0);
          return { ...show, episodes, episodeCount: episodes.length, totalPlays };
        })
      );
      return withEpisodes;
    }),

  getMine: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select()
      .from(podcasts)
      .where(eq(podcasts.userId, ctx.session.user.id))
      .orderBy(desc(podcasts.createdAt));
    const withEpisodes = await Promise.all(
      rows.map(async (show) => {
        const episodes = await db
          .select()
          .from(podcastEpisodes)
          .where(eq(podcastEpisodes.podcastId, show.id))
          .orderBy(desc(podcastEpisodes.createdAt));
        return { ...show, episodes, episodeCount: episodes.length };
      })
    );
    return withEpisodes;
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ input }) => {
      const [show] = await db
        .select()
        .from(podcasts)
        .where(eq(podcasts.slug, input.slug))
        .limit(1);
      if (!show) throw new TRPCError({ code: 'NOT_FOUND', message: 'Podcast not found' });
      const episodes = await db
        .select()
        .from(podcastEpisodes)
        .where(and(eq(podcastEpisodes.podcastId, show.id), eq(podcastEpisodes.status, 'published')))
        .orderBy(desc(podcastEpisodes.publishedAt));
      // Rewrite each episode's audioUrl through same-origin proxy (iOS compat)
      const rewritten = episodes.map((ep) => ({
        ...ep,
        audioUrl: ep.audioUrl ? `/api/media/episode/${ep.id}` : null,
      }));
      return { ...show, episodes: rewritten };
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        category: z.string().optional(),
        coverUrl: z.string().url().optional(),
        author: z.string().max(200).optional(),
        ownerEmail: z.string().email().optional(),
        language: z.string().min(2).max(10).default('en'),
        explicit: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slug = input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 100)
        + '-' + Date.now().toString(36);
      const [show] = await db
        .insert(podcasts)
        .values({
          userId: ctx.session.user.id,
          title: input.title,
          slug,
          description: input.description ?? null,
          category: input.category ?? null,
          coverUrl: input.coverUrl ?? null,
          author: input.author ?? null,
          ownerEmail: input.ownerEmail ?? null,
          language: input.language,
          explicit: input.explicit,
          status: 'published',
        })
        .returning();
      return show;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(2000).optional(),
        category: z.string().optional(),
        coverUrl: z.string().url().optional(),
        author: z.string().max(200).optional(),
        ownerEmail: z.string().email().optional(),
        language: z.string().min(2).max(10).optional(),
        explicit: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await db
        .select()
        .from(podcasts)
        .where(eq(podcasts.id, input.id))
        .limit(1);
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });
      if (existing.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      const { id: _, ...patch } = input;
      const [updated] = await db
        .update(podcasts)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(podcasts.id, input.id))
        .returning();
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await db
        .select()
        .from(podcasts)
        .where(eq(podcasts.id, input.id))
        .limit(1);
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });
      if (existing.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      // Episodes cascade-delete via FK constraint (onDelete: 'cascade')
      await db.delete(podcasts).where(eq(podcasts.id, input.id));
      return { ok: true };
    }),
});

// ─── Podcast Episodes Router ───
const podcastEpisodesRouter = createRouter({
  create: protectedProcedure
    .input(
      z.object({
        podcastId: z.string().uuid(),
        title: z.string().min(1).max(300),
        description: z.string().max(50000).optional(),
        coverUrl: z.string().url().optional(),
        audioUrl: z.string().url(),
        duration: z.number().int().min(0).optional(),
        fileSize: z.number().int().min(0).optional(),
        episodeNumber: z.number().int().min(0).optional(),
        seasonNumber: z.number().int().min(0).optional(),
        explicit: z.boolean().default(false),
        episodeType: z.enum(['full', 'trailer', 'bonus']).default('full'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership of the podcast show
      const [show] = await db
        .select()
        .from(podcasts)
        .where(eq(podcasts.id, input.podcastId))
        .limit(1);
      if (!show) throw new TRPCError({ code: 'NOT_FOUND', message: 'Podcast not found' });
      if (show.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      const slug = input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 100)
        + '-' + Date.now().toString(36);
      const [episode] = await db
        .insert(podcastEpisodes)
        .values({
          podcastId: input.podcastId,
          title: input.title,
          slug,
          description: input.description ?? null,
          coverUrl: input.coverUrl ?? null,
          audioUrl: input.audioUrl,
          duration: input.duration ?? null,
          fileSize: input.fileSize ?? null,
          episodeNumber: input.episodeNumber ?? null,
          seasonNumber: input.seasonNumber ?? null,
          explicit: input.explicit,
          episodeType: input.episodeType,
          status: 'published',
          publishedAt: new Date(),
        })
        .returning();
      return episode;
    }),

  getBySlug: publicProcedure
    .input(z.object({ podcastSlug: z.string(), episodeSlug: z.string() }))
    .query(async ({ input }) => {
      const [show] = await db
        .select()
        .from(podcasts)
        .where(eq(podcasts.slug, input.podcastSlug))
        .limit(1);
      if (!show) throw new TRPCError({ code: 'NOT_FOUND', message: 'Podcast not found' });
      const [episode] = await db
        .select()
        .from(podcastEpisodes)
        .where(and(eq(podcastEpisodes.podcastId, show.id), eq(podcastEpisodes.slug, input.episodeSlug)))
        .limit(1);
      if (!episode) throw new TRPCError({ code: 'NOT_FOUND', message: 'Episode not found' });
      // Rewrite audioUrl through same-origin proxy
      return {
        ...episode,
        audioUrl: episode.audioUrl ? `/api/media/episode/${episode.id}` : null,
        podcast: show,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(300).optional(),
        description: z.string().max(50000).optional(),
        coverUrl: z.string().url().optional(),
        audioUrl: z.string().url().optional(),
        duration: z.number().int().min(0).optional(),
        episodeNumber: z.number().int().min(0).optional(),
        seasonNumber: z.number().int().min(0).optional(),
        explicit: z.boolean().optional(),
        episodeType: z.enum(['full', 'trailer', 'bonus']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [episode] = await db
        .select()
        .from(podcastEpisodes)
        .where(eq(podcastEpisodes.id, input.id))
        .limit(1);
      if (!episode) throw new TRPCError({ code: 'NOT_FOUND' });
      const [show] = await db
        .select()
        .from(podcasts)
        .where(eq(podcasts.id, episode.podcastId))
        .limit(1);
      if (!show || show.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      const { id: _, ...patch } = input;
      const [updated] = await db
        .update(podcastEpisodes)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(podcastEpisodes.id, input.id))
        .returning();
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [episode] = await db
        .select()
        .from(podcastEpisodes)
        .where(eq(podcastEpisodes.id, input.id))
        .limit(1);
      if (!episode) throw new TRPCError({ code: 'NOT_FOUND' });
      const [show] = await db
        .select()
        .from(podcasts)
        .where(eq(podcasts.id, episode.podcastId))
        .limit(1);
      if (!show || show.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      await db.delete(podcastEpisodes).where(eq(podcastEpisodes.id, input.id));
      return { ok: true };
    }),

  recordDownload: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await db
        .update(podcastEpisodes)
        .set({ downloadCount: sql`${podcastEpisodes.downloadCount} + 1` })
        .where(eq(podcastEpisodes.id, input.id));
      return { ok: true };
    }),
});

// ─── Track Purchases Router ───
/**
 * Handles one-time paid purchases of individual tracks. Flow mirrors the
 * ticket and subscription fixes: pending row in DB → NOWPayments charge →
 * webhook flips to 'completed' on payment.finished.
 */
const trackPurchasesRouter = createRouter({
  /**
   * Initiate a track purchase. Returns a paymentUrl the client should redirect
   * to. If the user already owns the track (a 'completed' row exists) or has
   * an in-flight 'pending' purchase, returns an error — call myPurchases to
   * see owned tracks.
   */
  buy: protectedProcedure
    .input(z.object({ trackId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Fetch the track — must exist, be published, and have a price
      const track = await db.query.tracks.findFirst({
        where: eq(tracks.id, input.trackId),
      });
      if (!track) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Track not found' });
      }
      if (track.status !== 'published') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Track is not available for purchase' });
      }
      if (!track.price || track.price <= 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This track is free — no purchase needed' });
      }
      if (track.userId === userId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You already own this track (you created it)' });
      }

      // Block double-buy: if a completed purchase already exists, reject.
      const existingCompleted = await db.query.trackPurchases.findFirst({
        where: and(
          eq(trackPurchases.userId, userId),
          eq(trackPurchases.trackId, input.trackId),
          eq(trackPurchases.status, 'completed')
        ),
      });
      if (existingCompleted) {
        throw new TRPCError({ code: 'CONFLICT', message: 'You already own this track' });
      }

      // Block concurrent buy: if a pending purchase exists (younger than 30min),
      // reject to prevent double-charges if the user clicks Buy twice.
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
      const existingPending = await db.query.trackPurchases.findFirst({
        where: and(
          eq(trackPurchases.userId, userId),
          eq(trackPurchases.trackId, input.trackId),
          eq(trackPurchases.status, 'pending')
        ),
      });
      if (existingPending && existingPending.createdAt > thirtyMinAgo) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A purchase is already in progress — finish checkout or try again in 30 minutes',
        });
      }

      const apiKey = process.env.NOWPAYMENTS_API_KEY;
      if (!apiKey) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Payment not configured' });
      }

      // Create pending purchase row — webhook will flip to 'completed'
      const [purchase] = await db
        .insert(trackPurchases)
        .values({
          userId,
          trackId: input.trackId,
          pricePaid: track.price,
          status: 'pending',
        })
        .returning();

      try {
        const priceUsd = track.price / 100;
        const response = await fetch('https://api.nowpayments.io/v1/payment', {
          method: 'POST',
          headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            price_amount: priceUsd,
            price_currency: 'usd',
            pay_currency: 'usdcmatic',
            // order_id format parsed by the webhook at /api/webhooks/nowpayments
            order_id: `trackbuy_${purchase.id}`,
            order_description: `OPYNX track: ${track.title} — $${priceUsd.toFixed(2)}`,
            ipn_callback_url: 'https://opynx.com/api/webhooks/nowpayments',
            success_url: `https://opynx.com/track/${input.trackId}?purchased=true`,
            cancel_url: `https://opynx.com/track/${input.trackId}?cancelled=true`,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.payment_id) {
          // Roll back the pending row
          await db.delete(trackPurchases).where(eq(trackPurchases.id, purchase.id));
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Payment creation failed',
          });
        }

        // Store paymentId for reconciliation
        await db
          .update(trackPurchases)
          .set({ paymentId: String(data.payment_id) })
          .where(eq(trackPurchases.id, purchase.id));

        return {
          purchase,
          paymentUrl: `https://nowpayments.io/payment/?iid=${data.payment_id}`,
        };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        await db.delete(trackPurchases).where(eq(trackPurchases.id, purchase.id));
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Payment service unavailable',
        });
      }
    }),

  /**
   * Check whether the current user has purchased a given track. Returns
   * null if signed-out or not purchased; returns purchase row if completed.
   */
  hasPurchased: publicProcedure
    .input(z.object({ trackId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) return null;
      const purchase = await db.query.trackPurchases.findFirst({
        where: and(
          eq(trackPurchases.userId, userId),
          eq(trackPurchases.trackId, input.trackId),
          eq(trackPurchases.status, 'completed')
        ),
      });
      return purchase ?? null;
    }),

  /**
   * List all completed purchases for the current user, joined with track
   * details for display in a "My Library" or "Owned Tracks" view.
   */
  myPurchases: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return db
      .select({
        purchaseId: trackPurchases.id,
        pricePaid: trackPurchases.pricePaid,
        purchasedAt: trackPurchases.createdAt,
        track: {
          id: tracks.id,
          title: tracks.title,
          slug: tracks.slug,
          genre: tracks.genre,
          duration: tracks.duration,
          coverUrl: tracks.coverUrl,
        },
      })
      .from(trackPurchases)
      .innerJoin(tracks, eq(trackPurchases.trackId, tracks.id))
      .where(and(
        eq(trackPurchases.userId, userId),
        eq(trackPurchases.status, 'completed')
      ))
      .orderBy(desc(trackPurchases.createdAt));
  }),
});

// ─── Tips Router ───
/**
 * Creator support tips. One-time payment from a fan to a creator (one user
 * sending another user money). Same pending → completed flow as tickets,
 * subscriptions, and track purchases. Webhook flips status on payment events.
 */
const tipsRouter = createRouter({
  send: protectedProcedure
    .input(
      z.object({
        recipientUserId: z.string().uuid(),
        amount: z.number().int().min(50).max(50000), // $0.50 to $500 in cents
        trackId: z.string().uuid().optional(),
        message: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tipperUserId = ctx.session.user.id;

      if (tipperUserId === input.recipientUserId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot tip yourself' });
      }

      // Verify recipient exists
      const recipient = await db.query.users.findFirst({
        where: eq(users.id, input.recipientUserId),
      });
      if (!recipient) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Recipient not found' });
      }

      const apiKey = process.env.NOWPAYMENTS_API_KEY;
      if (!apiKey) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Payment not configured' });
      }

      // Create pending tip — webhook activates it
      const [tip] = await db
        .insert(tips)
        .values({
          tipperUserId,
          recipientUserId: input.recipientUserId,
          trackId: input.trackId ?? null,
          amount: input.amount,
          message: input.message?.trim() || null,
          status: 'pending',
        })
        .returning();

      try {
        const priceUsd = input.amount / 100;
        // Successful redirect lands back on the track page if we have one,
        // otherwise on the recipient's creator profile page.
        const successUrl = input.trackId
          ? `https://opynx.com/track/${input.trackId}?tipped=true`
          : `https://opynx.com/artist/${input.recipientUserId}?tipped=true`;
        const cancelUrl = input.trackId
          ? `https://opynx.com/track/${input.trackId}?tipCancelled=true`
          : `https://opynx.com/artist/${input.recipientUserId}?tipCancelled=true`;

        const response = await fetch('https://api.nowpayments.io/v1/payment', {
          method: 'POST',
          headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            price_amount: priceUsd,
            price_currency: 'usd',
            pay_currency: 'usdcmatic',
            // order_id format parsed by webhook: tip_{tipId}
            order_id: `tip_${tip.id}`,
            order_description: `OPYNX tip — $${priceUsd.toFixed(2)} to ${recipient.name ?? recipient.id}`,
            ipn_callback_url: 'https://opynx.com/api/webhooks/nowpayments',
            success_url: successUrl,
            cancel_url: cancelUrl,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.payment_id) {
          await db.delete(tips).where(eq(tips.id, tip.id));
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Payment creation failed' });
        }

        await db
          .update(tips)
          .set({ paymentId: String(data.payment_id) })
          .where(eq(tips.id, tip.id));

        return {
          tip,
          paymentUrl: `https://nowpayments.io/payment/?iid=${data.payment_id}`,
        };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        await db.delete(tips).where(eq(tips.id, tip.id));
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Payment service unavailable',
        });
      }
    }),

  /**
   * List tips received by the current user (creator dashboard view). Returns
   * completed tips only — pending and cancelled don't represent real money.
   */
  received: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select({
        tipId: tips.id,
        amount: tips.amount,
        message: tips.message,
        receivedAt: tips.createdAt,
        trackId: tips.trackId,
        tipperName: users.name,
      })
      .from(tips)
      .leftJoin(users, eq(tips.tipperUserId, users.id))
      .where(and(
        eq(tips.recipientUserId, ctx.session.user.id),
        eq(tips.status, 'completed')
      ))
      .orderBy(desc(tips.createdAt));
  }),

  /**
   * List tips the current user has sent (fan history view).
   */
  sent: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select({
        tipId: tips.id,
        amount: tips.amount,
        message: tips.message,
        sentAt: tips.createdAt,
        trackId: tips.trackId,
        recipientName: users.name,
      })
      .from(tips)
      .leftJoin(users, eq(tips.recipientUserId, users.id))
      .where(and(
        eq(tips.tipperUserId, ctx.session.user.id),
        eq(tips.status, 'completed')
      ))
      .orderBy(desc(tips.createdAt));
  }),
});

// ─── Earnings Router ───
/**
 * Aggregates creator earnings across all active revenue streams. Pulls from
 * persisted payment data: tips received, track purchases of tracks the user
 * owns, ticket sales for events the user hosts, and marketplace order revenue
 * where the user is the seller.
 *
 * Subscription commissions are NOT included yet — the waterfall engine
 * calculates splits but doesn't persist them to the `commissions` table.
 * Flagged as TODO until that's fixed.
 */
const earningsRouter = createRouter({
  /**
   * Lifetime + 30-day totals broken down by revenue source.
   * All amounts in INTEGER CENTS.
   */
  summary: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Tips received (completed)
    const tipsTotal = await db
      .select({
        lifetime: sql<number>`COALESCE(SUM(${tips.amount}), 0)::int`,
        recent: sql<number>`COALESCE(SUM(CASE WHEN ${tips.createdAt} >= ${thirtyDaysAgo} THEN ${tips.amount} ELSE 0 END), 0)::int`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(tips)
      .where(and(eq(tips.recipientUserId, userId), eq(tips.status, 'completed')));

    // Track purchases (buyer paid for tracks this user owns)
    const trackTotal = await db
      .select({
        lifetime: sql<number>`COALESCE(SUM(${trackPurchases.pricePaid}), 0)::int`,
        recent: sql<number>`COALESCE(SUM(CASE WHEN ${trackPurchases.createdAt} >= ${thirtyDaysAgo} THEN ${trackPurchases.pricePaid} ELSE 0 END), 0)::int`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(trackPurchases)
      .innerJoin(tracks, eq(trackPurchases.trackId, tracks.id))
      .where(and(eq(tracks.userId, userId), eq(trackPurchases.status, 'completed')));

    // Ticket sales (buyer paid for tickets to events this user hosts)
    const ticketTotal = await db
      .select({
        lifetime: sql<number>`COALESCE(SUM(${ticketTypes.price}), 0)::int`,
        recent: sql<number>`COALESCE(SUM(CASE WHEN ${tickets.createdAt} >= ${thirtyDaysAgo} THEN ${ticketTypes.price} ELSE 0 END), 0)::int`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .innerJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
      .where(and(eq(events.hostId, userId), eq(tickets.status, 'valid')));

    // Marketplace orders (user is the seller, payment landed)
    const merchTotal = await db
      .select({
        lifetime: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::int`,
        recent: sql<number>`COALESCE(SUM(CASE WHEN ${orders.createdAt} >= ${thirtyDaysAgo} THEN ${orders.totalAmount} ELSE 0 END), 0)::int`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(orders)
      .where(and(
        eq(orders.sellerId, userId),
        sql`${orders.status} IN ('paid', 'shipped', 'delivered')`
      ));

    // Subscription commissions (creator/facilitator/outlier role, any active status)
    const subTotal = await db
      .select({
        lifetime: sql<number>`COALESCE(SUM(${commissions.amount}), 0)::int`,
        recent: sql<number>`COALESCE(SUM(CASE WHEN ${commissions.createdAt} >= ${thirtyDaysAgo} THEN ${commissions.amount} ELSE 0 END), 0)::int`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(commissions)
      .where(and(
        eq(commissions.recipientId, userId),
        sql`${commissions.status} IN ('pending', 'approved', 'processing', 'paid')`
      ));

    const t = tipsTotal[0] ?? { lifetime: 0, recent: 0, count: 0 };
    const tr = trackTotal[0] ?? { lifetime: 0, recent: 0, count: 0 };
    const tk = ticketTotal[0] ?? { lifetime: 0, recent: 0, count: 0 };
    const m = merchTotal[0] ?? { lifetime: 0, recent: 0, count: 0 };
    const s = subTotal[0] ?? { lifetime: 0, recent: 0, count: 0 };

    return {
      lifetime: t.lifetime + tr.lifetime + tk.lifetime + m.lifetime + s.lifetime,
      thirtyDay: t.recent + tr.recent + tk.recent + m.recent + s.recent,
      bySource: {
        tips: { lifetime: t.lifetime, recent: t.recent, count: t.count },
        tracks: { lifetime: tr.lifetime, recent: tr.recent, count: tr.count },
        tickets: { lifetime: tk.lifetime, recent: tk.recent, count: tk.count },
        marketplace: { lifetime: m.lifetime, recent: m.recent, count: m.count },
        subscriptions: { lifetime: s.lifetime, recent: s.recent, count: s.count },
      },
    };
  }),

  /**
   * Recent transactions (last 30 days, limit 50) across all revenue streams,
   * unioned and sorted by date. For the earnings page's "recent activity" feed.
   */
  recentTransactions: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Five queries in parallel, then merge + sort in app layer (simpler than SQL UNION)
    const [tipRows, trackRows, ticketRows, merchRows, subRows] = await Promise.all([
      db
        .select({
          id: tips.id,
          amount: tips.amount,
          createdAt: tips.createdAt,
          message: tips.message,
        })
        .from(tips)
        .where(and(
          eq(tips.recipientUserId, userId),
          eq(tips.status, 'completed'),
          sql`${tips.createdAt} >= ${thirtyDaysAgo}`
        ))
        .orderBy(desc(tips.createdAt))
        .limit(20),
      db
        .select({
          id: trackPurchases.id,
          amount: trackPurchases.pricePaid,
          createdAt: trackPurchases.createdAt,
          trackTitle: tracks.title,
        })
        .from(trackPurchases)
        .innerJoin(tracks, eq(trackPurchases.trackId, tracks.id))
        .where(and(
          eq(tracks.userId, userId),
          eq(trackPurchases.status, 'completed'),
          sql`${trackPurchases.createdAt} >= ${thirtyDaysAgo}`
        ))
        .orderBy(desc(trackPurchases.createdAt))
        .limit(20),
      db
        .select({
          id: tickets.id,
          amount: ticketTypes.price,
          createdAt: tickets.createdAt,
          eventTitle: events.title,
          ticketTypeName: ticketTypes.name,
        })
        .from(tickets)
        .innerJoin(events, eq(tickets.eventId, events.id))
        .innerJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
        .where(and(
          eq(events.hostId, userId),
          eq(tickets.status, 'valid'),
          sql`${tickets.createdAt} >= ${thirtyDaysAgo}`
        ))
        .orderBy(desc(tickets.createdAt))
        .limit(20),
      db
        .select({
          id: orders.id,
          amount: orders.totalAmount,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(and(
          eq(orders.sellerId, userId),
          sql`${orders.status} IN ('paid', 'shipped', 'delivered')`,
          sql`${orders.createdAt} >= ${thirtyDaysAgo}`
        ))
        .orderBy(desc(orders.createdAt))
        .limit(20),
      db
        .select({
          id: commissions.id,
          amount: commissions.amount,
          createdAt: commissions.createdAt,
          tier: commissions.tier,
        })
        .from(commissions)
        .where(and(
          eq(commissions.recipientId, userId),
          sql`${commissions.status} IN ('pending', 'approved', 'processing', 'paid')`,
          sql`${commissions.createdAt} >= ${thirtyDaysAgo}`
        ))
        .orderBy(desc(commissions.createdAt))
        .limit(20),
    ]);

    const txns = [
      ...tipRows.map((r) => ({
        id: r.id,
        source: 'tip' as const,
        amount: r.amount,
        createdAt: r.createdAt,
        label: r.message ? `Tip: "${r.message.slice(0, 40)}..."` : 'Tip received',
      })),
      ...trackRows.map((r) => ({
        id: r.id,
        source: 'track' as const,
        amount: r.amount,
        createdAt: r.createdAt,
        label: `Track sale: ${r.trackTitle}`,
      })),
      ...ticketRows.map((r) => ({
        id: r.id,
        source: 'ticket' as const,
        amount: r.amount,
        createdAt: r.createdAt,
        label: `Ticket: ${r.eventTitle} (${r.ticketTypeName})`,
      })),
      ...merchRows.map((r) => ({
        id: r.id,
        source: 'marketplace' as const,
        amount: r.amount,
        createdAt: r.createdAt,
        label: 'Marketplace sale',
      })),
      ...subRows.map((r) => ({
        id: r.id,
        source: 'subscription' as const,
        amount: r.amount,
        createdAt: r.createdAt,
        label: `Subscription commission (${r.tier})`,
      })),
    ];

    txns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return txns.slice(0, 50);
  }),
});

// ─── Payouts Router ───
/**
 * Visibility-only payout flow (Option C). Creators see what they're owed,
 * request payouts, and admins manually disburse via MetaMask. The
 * payoutRequests table snapshots amount + wallet at request time so a
 * mid-flight wallet change doesn't redirect a pending payout.
 *
 * NOT IMPLEMENTED YET — when needed:
 * - Automated on-chain disbursement
 * - Stripe Connect / Helio fiat payouts
 * - 1099-NEC tax form generation
 * - Multi-sig admin approval for large payouts
 */
const payoutsRouter = createRouter({
  /**
   * Returns a financial summary for the current user:
   *   - lifetimeEarned: total revenue across all sources (matches earnings.summary)
   *   - totalPaid: sum of all 'paid' payout requests
   *   - inFlight: sum of 'pending' + 'processing' payout requests
   *   - available: lifetimeEarned - totalPaid - inFlight (what creator can request now)
   *   - walletAddress: current setting on user record (for the request form default)
   */
  summary: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Reuse the same aggregation as earningsRouter.summary inline (kept
    // independent so payouts can evolve without touching earnings UI)
    const [tipsAgg, trackAgg, ticketAgg, merchAgg, subAgg, payoutAgg, user] = await Promise.all([
      db
        .select({
          lifetime: sql<number>`COALESCE(SUM(${tips.amount}), 0)::int`,
        })
        .from(tips)
        .where(and(eq(tips.recipientUserId, userId), eq(tips.status, 'completed'))),
      db
        .select({
          lifetime: sql<number>`COALESCE(SUM(${trackPurchases.pricePaid}), 0)::int`,
        })
        .from(trackPurchases)
        .innerJoin(tracks, eq(trackPurchases.trackId, tracks.id))
        .where(and(eq(tracks.userId, userId), eq(trackPurchases.status, 'completed'))),
      db
        .select({
          lifetime: sql<number>`COALESCE(SUM(${ticketTypes.price}), 0)::int`,
        })
        .from(tickets)
        .innerJoin(events, eq(tickets.eventId, events.id))
        .innerJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
        .where(and(eq(events.hostId, userId), eq(tickets.status, 'valid'))),
      db
        .select({
          lifetime: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::int`,
        })
        .from(orders)
        .where(and(
          eq(orders.sellerId, userId),
          sql`${orders.status} IN ('paid', 'shipped', 'delivered')`
        )),
      db
        .select({
          lifetime: sql<number>`COALESCE(SUM(${commissions.amount}), 0)::int`,
        })
        .from(commissions)
        .where(and(
          eq(commissions.recipientId, userId),
          sql`${commissions.status} IN ('pending', 'approved', 'processing', 'paid')`
        )),
      db
        .select({
          paid: sql<number>`COALESCE(SUM(CASE WHEN ${payoutRequests.status} = 'paid' THEN ${payoutRequests.amountCents} ELSE 0 END), 0)::int`,
          inFlight: sql<number>`COALESCE(SUM(CASE WHEN ${payoutRequests.status} IN ('pending', 'processing') THEN ${payoutRequests.amountCents} ELSE 0 END), 0)::int`,
          paidLast30: sql<number>`COALESCE(SUM(CASE WHEN ${payoutRequests.status} = 'paid' AND ${payoutRequests.processedAt} >= ${thirtyDaysAgo} THEN ${payoutRequests.amountCents} ELSE 0 END), 0)::int`,
        })
        .from(payoutRequests)
        .where(eq(payoutRequests.userId, userId)),
      db.query.users.findFirst({ where: eq(users.id, userId) }),
    ]);

    const lifetimeEarned =
      (tipsAgg[0]?.lifetime ?? 0) +
      (trackAgg[0]?.lifetime ?? 0) +
      (ticketAgg[0]?.lifetime ?? 0) +
      (merchAgg[0]?.lifetime ?? 0) +
      (subAgg[0]?.lifetime ?? 0);

    const totalPaid = payoutAgg[0]?.paid ?? 0;
    const inFlight = payoutAgg[0]?.inFlight ?? 0;
    const paidLast30 = payoutAgg[0]?.paidLast30 ?? 0;
    const available = Math.max(0, lifetimeEarned - totalPaid - inFlight);

    return {
      lifetimeEarned,
      totalPaid,
      inFlight,
      available,
      paidLast30,
      walletAddress: user?.walletAddress ?? null,
    };
  }),

  /** Recent payout request history (last 50) */
  history: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.userId, ctx.session.user.id))
      .orderBy(desc(payoutRequests.requestedAt))
      .limit(50);
  }),

  /**
   * Creator requests a payout. Validates:
   *   - User has a wallet address set (errors with friendly message)
   *   - Amount > minimum ($10) and ≤ available balance
   *   - No other pending request currently in flight (one at a time)
   *
   * Snapshots wallet + amount at request time. Admin processes manually.
   */
  request: protectedProcedure
    .input(
      z.object({
        amountCents: z.number().int().min(1000), // $10 minimum
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (!user?.walletAddress) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Set your Polygon wallet address in settings before requesting a payout',
        });
      }
      // Basic Polygon (EVM) address format check — 0x + 40 hex chars
      if (!/^0x[a-fA-F0-9]{40}$/.test(user.walletAddress)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Wallet address looks invalid (must be 0x + 40 hex chars)',
        });
      }

      // Block double-request: only one pending/processing at a time
      const existing = await db.query.payoutRequests.findFirst({
        where: and(
          eq(payoutRequests.userId, userId),
          sql`${payoutRequests.status} IN ('pending', 'processing')`
        ),
      });
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You already have a pending payout request — wait for it to be processed',
        });
      }

      // Compute available balance inline (don't trust client-provided amount)
      // Reuses the same logic as summary; kept here for atomicity at request time.
      const [tipsAgg, trackAgg, ticketAgg, merchAgg, subAgg, payoutAgg] = await Promise.all([
        db
          .select({ lifetime: sql<number>`COALESCE(SUM(${tips.amount}), 0)::int` })
          .from(tips)
          .where(and(eq(tips.recipientUserId, userId), eq(tips.status, 'completed'))),
        db
          .select({ lifetime: sql<number>`COALESCE(SUM(${trackPurchases.pricePaid}), 0)::int` })
          .from(trackPurchases)
          .innerJoin(tracks, eq(trackPurchases.trackId, tracks.id))
          .where(and(eq(tracks.userId, userId), eq(trackPurchases.status, 'completed'))),
        db
          .select({ lifetime: sql<number>`COALESCE(SUM(${ticketTypes.price}), 0)::int` })
          .from(tickets)
          .innerJoin(events, eq(tickets.eventId, events.id))
          .innerJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
          .where(and(eq(events.hostId, userId), eq(tickets.status, 'valid'))),
        db
          .select({ lifetime: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::int` })
          .from(orders)
          .where(and(
            eq(orders.sellerId, userId),
            sql`${orders.status} IN ('paid', 'shipped', 'delivered')`
          )),
        db
          .select({ lifetime: sql<number>`COALESCE(SUM(${commissions.amount}), 0)::int` })
          .from(commissions)
          .where(and(
            eq(commissions.recipientId, userId),
            sql`${commissions.status} IN ('pending', 'approved', 'processing', 'paid')`
          )),
        db
          .select({
            paid: sql<number>`COALESCE(SUM(CASE WHEN ${payoutRequests.status} = 'paid' THEN ${payoutRequests.amountCents} ELSE 0 END), 0)::int`,
            inFlight: sql<number>`COALESCE(SUM(CASE WHEN ${payoutRequests.status} IN ('pending', 'processing') THEN ${payoutRequests.amountCents} ELSE 0 END), 0)::int`,
          })
          .from(payoutRequests)
          .where(eq(payoutRequests.userId, userId)),
      ]);

      const lifetimeEarned =
        (tipsAgg[0]?.lifetime ?? 0) +
        (trackAgg[0]?.lifetime ?? 0) +
        (ticketAgg[0]?.lifetime ?? 0) +
        (merchAgg[0]?.lifetime ?? 0) +
        (subAgg[0]?.lifetime ?? 0);
      const totalPaid = payoutAgg[0]?.paid ?? 0;
      const inFlight = payoutAgg[0]?.inFlight ?? 0;
      const available = Math.max(0, lifetimeEarned - totalPaid - inFlight);

      if (input.amountCents > available) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Requested $${(input.amountCents / 100).toFixed(2)} but only $${(available / 100).toFixed(2)} is available`,
        });
      }

      const [request] = await db
        .insert(payoutRequests)
        .values({
          userId,
          amountCents: input.amountCents,
          walletAddress: user.walletAddress,
          status: 'pending',
        })
        .returning();

      // TODO: notify admin of new payout request (email or Discord webhook)
      console.log(
        `[Payouts] New request: user=${userId} amount=$${(input.amountCents / 100).toFixed(2)} wallet=${user.walletAddress}`
      );

      return request;
    }),

  /**
   * Cancel a pending payout request (creator changes mind before it's processed).
   * Only works on 'pending' status (admin already grabbed it = can't cancel).
   */
  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const req = await db.query.payoutRequests.findFirst({
        where: eq(payoutRequests.id, input.id),
      });
      if (!req) throw new TRPCError({ code: 'NOT_FOUND' });
      if (req.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      if (req.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot cancel — status is ${req.status}`,
        });
      }
      await db
        .update(payoutRequests)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(payoutRequests.id, input.id));
      return { ok: true };
    }),

  // ─── Admin endpoints ───
  // Until a real admin role check exists, these are unprotected against
  // ctx.session.user.role — they currently rely on adminProcedure being
  // gated upstream. If adminProcedure isn't ready, swap to a manual check.

  /** Admin queue — all pending + processing requests across all users */
  adminQueue: adminProcedure.query(async () => {
    return db
      .select({
        request: payoutRequests,
        userName: users.name,
        userEmail: users.email,
      })
      .from(payoutRequests)
      .leftJoin(users, eq(payoutRequests.userId, users.id))
      .where(sql`${payoutRequests.status} IN ('pending', 'processing')`)
      .orderBy(desc(payoutRequests.requestedAt));
  }),

  /** Admin marks a payout as paid (after sending USDC manually) */
  adminMarkPaid: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        txHash: z.string().min(10), // Polygon tx hash
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(payoutRequests)
        .set({
          status: 'paid',
          txHash: input.txHash,
          notes: input.notes ?? null,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payoutRequests.id, input.id))
        .returning();
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
      void notify({
        userId: updated.userId,
        type: 'payout_processed',
        title: 'Payout sent',
        body: `${fmtCents(updated.amountCents)} USDC sent to your wallet`,
        link: '/dashboard/withdraw',
        metadata: { amountCents: updated.amountCents, txHash: input.txHash, payoutId: updated.id },
      });
      return updated;
    }),

  /** Admin rejects a payout (with reason) */
  adminReject: adminProcedure
    .input(z.object({ id: z.string().uuid(), reason: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(payoutRequests)
        .set({
          status: 'rejected',
          notes: input.reason,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payoutRequests.id, input.id))
        .returning();
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
      void notify({
        userId: updated.userId,
        type: 'payout_rejected',
        title: 'Payout request rejected',
        body: `${fmtCents(updated.amountCents)} request was rejected: ${input.reason}`,
        link: '/dashboard/withdraw',
        metadata: { amountCents: updated.amountCents, reason: input.reason, payoutId: updated.id },
      });
      return updated;
    }),
});

// ─── Notifications Router ───
/**
 * In-app bell + /notifications page. Rows are written by webhooks (revenue
 * events) and background jobs (milestones, payouts). Reads are scoped to the
 * authenticated user — there is no admin-wide list endpoint.
 *
 * Pagination: simple `limit` for now; add cursor when a creator hits 100+.
 */
const notificationsRouter = createRouter({
  // Latest notifications for the bell dropdown + full /notifications page.
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).default(50),
          unreadOnly: z.boolean().default(false),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const unreadOnly = input?.unreadOnly ?? false;
      const where = unreadOnly
        ? and(eq(notifications.userId, ctx.session.user.id), isNull(notifications.readAt))
        : eq(notifications.userId, ctx.session.user.id);
      return db
        .select()
        .from(notifications)
        .where(where)
        .orderBy(desc(notifications.createdAt))
        .limit(limit);
    }),

  // Bell badge count. Cheap — uses notif_user_read_idx.
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(eq(notifications.userId, ctx.session.user.id), isNull(notifications.readAt))
      );
    return row?.count ?? 0;
  }),

  // Mark a single notification read. Idempotent — second call is a no-op.
  markRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.session.user.id),
            isNull(notifications.readAt)
          )
        );
      return { ok: true };
    }),

  // Mark all unread for this user as read.
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(eq(notifications.userId, ctx.session.user.id), isNull(notifications.readAt))
      );
    return { ok: true };
  }),
});

// ─── Push Subscriptions Router ───
/**
 * Per-device Web Push subscriptions. The browser hands us a PushSubscription
 * object after the user grants permission; we save it server-side so the
 * notify() helper can fan out to every device the user has opted in on.
 *
 * Subscriptions are unique by `endpoint` — re-subscribing on the same
 * device replaces (UPSERT) instead of duplicating.
 */
const pushSubscriptionsRouter = createRouter({
  /** Save (or replace) a Web Push subscription for the current user + device. */
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        p256dh: z.string().min(1),
        auth: z.string().min(1),
        userAgent: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Endpoint is unique — UPSERT replaces the old keys if the user
      // re-subscribes (keys can rotate, e.g., after browser data clear).
      await db
        .insert(pushSubscriptions)
        .values({
          userId: ctx.session.user.id,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
          userAgent: input.userAgent ?? null,
        })
        .onConflictDoUpdate({
          target: pushSubscriptions.endpoint,
          set: {
            userId: ctx.session.user.id,
            p256dh: input.p256dh,
            auth: input.auth,
            userAgent: input.userAgent ?? null,
          },
        });
      return { ok: true };
    }),

  /** Remove a subscription (on user "disable notifications" toggle). */
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.endpoint, input.endpoint),
            eq(pushSubscriptions.userId, ctx.session.user.id)
          )
        );
      return { ok: true };
    }),

  /** How many devices is the current user subscribed on? Powers the toggle UI. */
  countMine: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, ctx.session.user.id));
    return row?.count ?? 0;
  }),
});

// ─── Verification Router ───
/**
 * Creator verification (Tier B — identity + activity, cosmetic blue ✓ badge).
 *
 * Flow:
 *   1. User submits application via verification.apply (one pending app per
 *      user — second submission while pending is rejected at the procedure
 *      level so the queue stays clean).
 *   2. Admin reviews queue at /admin/verified, calls verification.adminDecide
 *      with status='approved'|'rejected' + a note.
 *   3. On approve: users.verifiedAt = NOW(), notify the user.
 *   4. On reject: just record reason, notify the user (they can reapply).
 *   5. ID photo (idImageKey) gets nulled by a cron 30 days post-decision.
 *
 * Activity gate (≥1 upload OR ≥1 hosted event OR ≥100 plays) is enforced
 * at submit time so applicants without a track record bounce immediately
 * instead of cluttering the admin queue.
 */
const verificationRouter = createRouter({
  /** Submit a new verification application. */
  submit: protectedProcedure
    .input(
      z.object({
        legalName: z.string().min(2).max(200),
        stageName: z.string().max(200).optional(),
        country: z.string().length(2), // ISO 3166-1 alpha-2
        portfolioUrl: z.string().url(),
        pitch: z.string().min(20).max(2000),
        idImageKey: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Reject if already verified
      const me = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (me?.verifiedAt) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You are already verified.' });
      }

      // Reject duplicate pending applications
      const existingPending = await db
        .select({ id: verificationApplications.id })
        .from(verificationApplications)
        .where(
          and(
            eq(verificationApplications.userId, userId),
            eq(verificationApplications.status, 'pending')
          )
        )
        .limit(1);
      if (existingPending.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You already have a pending application. Wait for admin review.',
        });
      }

      // Activity gate (Tier B). Anyone failing this is a tire-kicker.
      const [tracksCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(tracks)
        .where(eq(tracks.userId, userId));
      const [eventsCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(events)
        .where(eq(events.hostId, userId));
      const [playSum] = await db
        .select({ total: sql<number>`COALESCE(SUM(${tracks.playCount}), 0)::int` })
        .from(tracks)
        .where(eq(tracks.userId, userId));

      const meetsActivity =
        (tracksCount?.count ?? 0) >= 1 ||
        (eventsCount?.count ?? 0) >= 1 ||
        (playSum?.total ?? 0) >= 100;
      if (!meetsActivity) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message:
            'Verification requires platform activity: upload at least 1 track, host at least 1 event, or earn 100+ plays first.',
        });
      }

      const [created] = await db
        .insert(verificationApplications)
        .values({
          userId,
          legalName: input.legalName,
          stageName: input.stageName ?? null,
          country: input.country.toUpperCase(),
          portfolioUrl: input.portfolioUrl,
          pitch: input.pitch,
          idImageKey: input.idImageKey,
        })
        .returning();
      return created;
    }),

  /** The current user's most recent application (for the dashboard status panel). */
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await db
      .select()
      .from(verificationApplications)
      .where(eq(verificationApplications.userId, ctx.session.user.id))
      .orderBy(desc(verificationApplications.submittedAt))
      .limit(1);
      return row ?? null;
  }),

  /** Cancel my own pending application (so I can resubmit corrected). */
  cancelMine: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .delete(verificationApplications)
      .where(
        and(
          eq(verificationApplications.userId, ctx.session.user.id),
          eq(verificationApplications.status, 'pending')
        )
      );
    return { ok: true };
  }),

  // ── Admin endpoints ──

  /** All pending applications, oldest first (FIFO review queue). */
  adminQueue: adminProcedure.query(async () => {
    return db
      .select({
        application: verificationApplications,
        userName: users.name,
        userEmail: users.email,
        userAvatar: users.avatar,
      })
      .from(verificationApplications)
      .leftJoin(users, eq(verificationApplications.userId, users.id))
      .where(eq(verificationApplications.status, 'pending'))
      .orderBy(verificationApplications.submittedAt);
  }),

  /** Approve or reject an application. Sets users.verifiedAt on approve. */
  adminDecide: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        decision: z.enum(['approved', 'rejected']),
        reason: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // adminProcedure middleware guarantees session.user exists
      const adminId = ctx.session.user!.id;
      const [updated] = await db
        .update(verificationApplications)
        .set({
          status: input.decision,
          decisionReason: input.reason,
          decidedBy: adminId,
          decidedAt: new Date(),
        })
        .where(eq(verificationApplications.id, input.id))
        .returning();
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });

      if (input.decision === 'approved') {
        await db
          .update(users)
          .set({ verifiedAt: new Date(), updatedAt: new Date() })
          .where(eq(users.id, updated.userId));
      }

      // Fire-and-forget notification (in-app bell + push if subscribed)
      void notify({
        userId: updated.userId,
        type: 'verification_status',
        title: input.decision === 'approved' ? 'You are verified' : 'Verification not approved',
        body:
          input.decision === 'approved'
            ? `Your verified badge is now showing across OPYNX.`
            : `Reason: ${input.reason}`,
        link: '/dashboard/verified',
        metadata: { decision: input.decision, applicationId: updated.id },
      });

      return updated;
    }),
});

// ─── App Router ───
export const appRouter = createRouter({
  auth: authRouter,
  users: usersRouter,
  subscriptions: subscriptionsRouter,
  attribution: attributionRouter,
  tracks: tracksRouter,
  albums: albumsRouter,
  playlists: playlistsRouter,
  events: eventsRouter,
  tickets: ticketsRouter,
  marketplace: marketplaceRouter,
  articles: articlesRouter,
  bookings: bookingsRouter,
  upload: uploadRouter,
  broadcasts: broadcastsRouter,
  comments: commentsRouter,
  likes: likesRouter,
  admin: adminRouter,
  podcasts: podcastsRouter,
  podcastEpisodes: podcastEpisodesRouter,
  trackPurchases: trackPurchasesRouter,
  tips: tipsRouter,
  earnings: earningsRouter,
  payouts: payoutsRouter,
  notifications: notificationsRouter,
  pushSubscriptions: pushSubscriptionsRouter,
  verification: verificationRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);

export {
  createRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
};
