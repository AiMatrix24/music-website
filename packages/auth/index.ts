import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import TwitterProvider from 'next-auth/providers/twitter';
import TwitchProvider from 'next-auth/providers/twitch';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db, users, oauthConnections, subscriptions } from '@opynx/db';
import { eq, and } from 'drizzle-orm';

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      id: 'email-login',
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        if (!email) return null;

        // Find or create user by email
        let user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user) {
          const [newUser] = await db
            .insert(users)
            .values({
              email,
              name: email.split('@')[0],
              role: 'free',
            })
            .returning();
          user = newUser;

          // Create default subscription
          await db.insert(subscriptions).values({
            userId: user.id,
            tier: 'free',
            status: 'active',
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          role: user.role,
        };
      },
    }),
    CredentialsProvider({
      id: 'phone-login',
      name: 'Phone',
      credentials: {
        phone: { label: 'Phone', type: 'tel', placeholder: '+1 (555) 123-4567' },
      },
      async authorize(credentials) {
        const phone = credentials?.phone as string;
        if (!phone) return null;

        // Normalize phone — use as email placeholder for DB
        const phoneEmail = `${phone.replace(/\D/g, '')}@phone.opynx.dev`;

        let user = await db.query.users.findFirst({
          where: eq(users.email, phoneEmail),
        });

        if (!user) {
          const [newUser] = await db
            .insert(users)
            .values({
              email: phoneEmail,
              name: `User ${phone.slice(-4)}`,
              role: 'free',
            })
            .returning();
          user = newUser;

          await db.insert(subscriptions).values({
            userId: user.id,
            tier: 'free',
            status: 'active',
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          role: user.role,
        };
      },
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID ?? '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://opynx.com'}/api/auth/callback/discord`,
        },
      },
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID ?? '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://opynx.com'}/api/auth/callback/twitter`,
        },
      },
    }),
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID ?? '',
      clientSecret: process.env.TWITCH_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://opynx.com'}/api/auth/callback/twitch`,
        },
      },
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
      // Initial sign-in — capture role + identity from the verifier callback
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? 'free';
        token.roleCheckedAt = Date.now();
      }
      if (account) {
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }

      // Re-fetch role from DB at most every 60 seconds. Without this, an
      // admin promoting a user (or revoking their access) wouldn't take
      // effect until the user signed out + back in. 60s is the sweet spot:
      // role changes propagate fast enough to be useful, but we're not
      // hitting the DB on every page paint.
      const ROLE_TTL_MS = 60 * 1000;
      const lastChecked = (token.roleCheckedAt as number | undefined) ?? 0;
      if (token.id && Date.now() - lastChecked > ROLE_TTL_MS) {
        try {
          const fresh = await db.query.users.findFirst({
            where: eq(users.id, token.id as string),
            columns: { role: true, avatar: true },
          });
          if (fresh) {
            token.role = fresh.role;
            token.picture = fresh.avatar ?? null;
          }
          // If the user was deleted we leave the cached role alone — the
          // next protected procedure will fail naturally and the user can
          // re-authenticate. Logging them out from inside this callback is
          // surprisingly hard in NextAuth.
          token.roleCheckedAt = Date.now();
        } catch (err) {
          // DB hiccup — keep the cached role rather than logging the user
          // out. They'll get the fresh value on the next successful refresh.
          console.error('[auth.jwt] role refresh failed:', err);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        // Explicit — NextAuth v5 sometimes drops token.picture from session.user.image
        // when a custom session callback is present.
        session.user.image = (token.picture as string | null | undefined) ?? null;
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
