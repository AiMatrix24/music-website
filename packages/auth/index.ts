import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import TwitterProvider from 'next-auth/providers/twitter';
import TwitchProvider from 'next-auth/providers/twitch';
import CredentialsProvider from 'next-auth/providers/credentials';

/**
 * NextAuth.js v5 configuration for OPYNX.
 *
 * Providers:
 * - Discord: Primary social login for gaming/music community
 * - Twitter: Social identity verification
 * - Twitch: Streaming platform integration
 * - Credentials: Placeholder for wallet-based or email/password auth
 */
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
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // TODO: Implement credential verification against database
        // This is a placeholder — wire up to your user verification logic.
        // For wallet-based auth, consider using SIWE (Sign-In with Ethereum).
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Placeholder: look up user in database and verify password
        // const user = await db.query.users.findFirst({
        //   where: eq(users.email, credentials.email),
        // });
        // if (!user || !await verifyPassword(credentials.password, user.passwordHash)) {
        //   return null;
        // }
        // return { id: user.id, email: user.email, name: user.name, role: user.role };

        return null;
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // On initial sign-in, persist user data into the JWT
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

    async signIn({ user, account }) {
      // TODO: Upsert user in database on sign-in
      // TODO: Link OAuth connection to existing user if email matches
      // TODO: Create initial free subscription for new users
      return true;
    },
  },

  events: {
    async createUser({ user }) {
      // TODO: Create default free subscription for new user
      // TODO: Send welcome email via email queue
      console.log('[Auth] New user created:', user.id);
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
