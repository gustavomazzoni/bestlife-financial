import NextAuth, { NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import EmailProvider from 'next-auth/providers/email';
import { prisma } from '@/lib/db';

// reference: https://medium.com/@kamilmatejuk/how-to-setup-nextauth-v5-on-the-next-js-frontend-with-app-router-and-custom-forms-2ac408ba973d
// Session/JWT type augmentations are in src/types/next-auth.d.ts

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      // Magic Links
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      from: process.env.SMTP_FROM,
    }),
    // CredentialsProvider({
    //   id: "LoginEmailPassword",
    //   name: "LoginEmailPassword",
    //   credentials: credentials,
    //   authorize: async (credentials) => authorizeCredentialsProvider(credentials, "/api/login"),
    // }),
    // CredentialsProvider({
    //   id: "RegisterEmailPassword",
    //   name: "RegisterEmailPassword",
    //   credentials: credentials,
    //   authorize: async (credentials) => authorizeCredentialsProvider(credentials, "/api/register"),
    // }),
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    //   authorization: {
    //     params: {
    //       prompt: "consent",
    //       access_type: "offline",
    //       response_type: "code",
    //     },
    //   },
    // }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/verify-request',
    error: '/error',
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.id = user.id;
        // Check DB on initial sign-in
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { dreamLifestyleCost: true },
        });
        token.onboardingCompleted = !!dbUser?.dreamLifestyleCost;
      }
      if (trigger === 'update') {
        if (session?.user?.onboardingCompleted !== undefined) {
          // Value passed directly from the server-side update — no DB round-trip needed
          token.onboardingCompleted = session.user.onboardingCompleted;
        } else if (token.onboardingCompleted === false) {
          // Fallback: re-check DB (used by legacy client-side update())
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { dreamLifestyleCost: true },
          });
          token.onboardingCompleted = !!dbUser?.dreamLifestyleCost;
        }
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          onboardingCompleted: !!token.onboardingCompleted,
        },
      };
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

export const { handlers, auth, signIn, signOut, unstable_update } =
  NextAuth(authOptions);
