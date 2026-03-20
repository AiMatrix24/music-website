import {
  createRouter,
  createCallerFactory,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from '../../apps/web/lib/trpc/server';

// ─── Sub-router stubs ───
// Each sub-router will be implemented in its own file under packages/api/routers/

const authRouter = createRouter({
  // placeholder: login, logout, session, register, verifyEmail
});

const usersRouter = createRouter({
  // placeholder: getProfile, updateProfile, getByWallet, searchUsers
});

const subscriptionsRouter = createRouter({
  // placeholder: getMySubscription, subscribe, cancel, upgrade, getStatus
});

const attributionRouter = createRouter({
  // placeholder: recordScan, getAttributionChain, getMyReferrals
});

const tracksRouter = createRouter({
  // placeholder: list, getById, upload, update, delete, stream, search
});

const albumsRouter = createRouter({
  // placeholder: list, getById, create, update, delete, getTracks
});

const playlistsRouter = createRouter({
  // placeholder: list, getById, create, update, delete, addTrack, removeTrack
});

const eventsRouter = createRouter({
  // placeholder: list, getById, create, update, delete, getTickets
});

const ticketsRouter = createRouter({
  // placeholder: purchase, getMyTickets, validate, transfer
});

const marketplaceRouter = createRouter({
  // placeholder: listItems, getItem, createListing, purchase, getMyListings
});

const articlesRouter = createRouter({
  // placeholder: list, getById, create, update, delete, publish
});

const bookingsRouter = createRouter({
  // placeholder: request, approve, reject, getMyBookings, getAvailability
});

const uploadRouter = createRouter({
  // placeholder: getPresignedUrl, confirmUpload, getUploadStatus
});

const adminRouter = createRouter({
  // placeholder: getDashboard, getUsers, getPayouts, getCommissions, runPayout
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
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);

export {
  createRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
};
