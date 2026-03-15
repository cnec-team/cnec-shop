import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

/**
 * Edge-compatible auth config (no Node.js dependencies like Prisma/bcrypt).
 * Used by middleware. Full authorize logic lives in auth.ts.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      // authorize is handled in auth.ts — this stub satisfies the type
      authorize: () => null,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.userId as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
}
