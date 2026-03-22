import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import TwitterProvider from 'next-auth/providers/twitter';
import TwitchProvider from 'next-auth/providers/twitch';
import { db, users, oauthConnections, subscriptions } from '@opynx/db';
import { eq, and } from 'drizzle-orm';

export const authConfig: NextAuthConfig = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID ?? '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? '',
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID ?? '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET ?? '',
      version: '2.0',
    }),
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID ?? '',
      clientSecret: process.env.TWITCH_CLIENT_SECRET ?? '',
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/auth/login',
    signOut: '/auth/signout',
    error: '/auth/error',
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? 'free';
      }
      if (account) {
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      if (!account) return true;

      try {
        const email = user.email ?? (profile as { email?: string })?.email;
        const name = user.name ?? (profile as { name?: string })?.name;
        const avatar = user.image ?? (profile as { image?: string })?.image;

        // Check if OAuth connection already exists
        const existingConnection = await db.query.oauthConnections.findFirst({
          where: and(
            eq(oauthConnections.provider, account.provider),
            eq(oauthConnections.providerAccountId, account.providerAccountId)
          ),
        });

        if (existingConnection) {
          // Update tokens on existing connection
          await db
            .update(oauthConnections)
            .set({
              accessToken: account.access_token ?? null,
              refreshToken: account.refresh_token ?? null,
              expiresAt: account.expires_at
                ? new Date(account.expires_at * 1000)
                : null,
            })
            .where(eq(oauthConnections.id, existingConnection.id));

          // Set user ID for JWT
          user.id = existingConnection.userId;
          const dbUser = await db.query.users.findFirst({
            where: eq(users.id, existingConnection.userId),
          });
          if (dbUser) {
            (user as { role?: string }).role = dbUser.role;
          }
          return true;
        }

        // Check if user with same email exists
        let dbUser = email
          ? await db.query.users.findFirst({
              where: eq(users.email, email),
            })
          : null;

        if (!dbUser) {
          // Create new user
          const [newUser] = await db
            .insert(users)
            .values({
              email: email ?? null,
              name: name ?? null,
              avatar: avatar ?? null,
              role: 'free',
            })
            .returning();
          dbUser = newUser;

          // Create default free subscription
          await db.insert(subscriptions).values({
            userId: dbUser.id,
            tier: 'free',
            status: 'active',
          });
        }

        // Link OAuth connection
        await db.insert(oauthConnections).values({
          userId: dbUser.id,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          accessToken: account.access_token ?? null,
          refreshToken: account.refresh_token ?? null,
          expiresAt: account.expires_at
            ? new Date(account.expires_at * 1000)
            : null,
        });

        user.id = dbUser.id;
        (user as { role?: string }).role = dbUser.role;
      } catch (error) {
        console.error('[Auth] Sign-in error:', error);
        return false;
      }

      return true;
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);

export type { Session } from 'next-auth';
