import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Kakao from 'next-auth/providers/kakao'
import { prisma } from './db'
import bcrypt from 'bcryptjs'
import { authConfig } from './auth.config'

const providers = [
  Credentials({
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null

      try {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.passwordHash) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      } catch (error) {
        console.error('Auth authorize error:', error)
        return null
      }
    }
  }),
]

// 카카오 로그인 (환경변수 있을 때만 활성화)
if (process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET) {
  providers.push(
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
    }) as any
  )
}

// 네이버 로그인 (환경변수 있을 때만 활성화)
if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
  providers.push({
    id: 'naver',
    name: 'Naver',
    type: 'oauth',
    authorization: {
      url: 'https://nid.naver.com/oauth2.0/authorize',
      params: { response_type: 'code' },
    },
    token: 'https://nid.naver.com/oauth2.0/token',
    userinfo: 'https://openapi.naver.com/v1/nid/me',
    clientId: process.env.NAVER_CLIENT_ID,
    clientSecret: process.env.NAVER_CLIENT_SECRET,
    profile(profile: any) {
      const resp = profile.response || {}
      return {
        id: resp.id,
        name: resp.name || resp.nickname || '',
        email: resp.email || '',
        image: resp.profile_image || null,
      }
    },
  } as any)
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      // Credentials — 기본 허용
      if (account?.provider === 'credentials') return true

      // OAuth (카카오/네이버) — DB에 유저 없으면 자동 생성
      if (account?.provider === 'kakao' || account?.provider === 'naver') {
        try {
          const email = user.email
          if (!email) return false

          const existingUser = await prisma.user.findUnique({ where: { email } })
          if (!existingUser) {
            const displayName = user.name || email.split('@')[0]
            const newUser = await prisma.user.create({
              data: {
                email,
                name: displayName,
                role: 'buyer',
                passwordHash: null,
              }
            })
            await prisma.buyer.create({
              data: {
                userId: newUser.id,
                nickname: displayName,
              }
            })
          }
          return true
        } catch (error) {
          console.error('OAuth signIn callback error:', error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, account }) {
      // Credentials 로그인
      if (user && account?.provider === 'credentials') {
        token.role = (user as any).role
        token.userId = user.id
      }

      // OAuth 로그인 — DB에서 role/userId 조회
      if (account && (account.provider === 'kakao' || account.provider === 'naver')) {
        try {
          const email = token.email
          if (email) {
            const dbUser = await prisma.user.findUnique({ where: { email } })
            if (dbUser) {
              token.role = dbUser.role
              token.userId = dbUser.id
            }
          }
        } catch (error) {
          console.error('OAuth jwt callback error:', error)
        }
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
})
