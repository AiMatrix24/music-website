import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, desc, and, sql, ilike } from 'drizzle-orm';
import {
  createRouter,
  createCallerFactory,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from '../../apps/web/lib/trpc/server';
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
  trackPurchases,
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
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
        status: z.enum(['draft', 'published', 'active', 'completed', 'cancelled']).optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];
      if (input.status) conditions.push(eq(events.status, input.status));

      return db
        .select({
          id: events.id,
          hostId: events.hostId,
          title: events.title,
          startDate: events.startDate,
          endDate: events.endDate,
          venueId: events.venueId,
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
          startDate: events.startDate,
          endDate: events.endDate,
          venueId: events.venueId,
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
        startDate: z.string().datetime(),
        endDate: z.string().datetime().optional(),
        venueId: z.string().uuid().optional(),
        countryCode: z.string().max(2).optional(),
        timezone: z.string().optional(),
        capacity: z.number().int().min(1).optional(),
        coverUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [event] = await db
        .insert(events)
        .values({
          hostId: ctx.session.user.id,
          title: input.title,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : new Date(new Date(input.startDate).getTime() + 3 * 60 * 60 * 1000),
          venueId: input.venueId ?? null,
          countryCode: input.countryCode ?? null,
          timezone: input.timezone ?? null,
          capacity: input.capacity ?? null,
          coverUrl: input.coverUrl ?? null,
          status: 'draft',
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
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);

export {
  createRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
};
