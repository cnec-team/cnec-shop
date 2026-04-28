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
        const email = (credentials.email as string).trim().toLowerCase()
        const password = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email },
          include: { buyer: { select: { id: true, failedLoginCount: true, lockedUntil: true } } },
        })

        if (!user || !user.passwordHash) return null

        // 5회 실패 잠금 체크 (buyer만)
        if (user.buyer) {
          if (user.buyer.lockedUntil && user.buyer.lockedUntil > new Date()) {
            throw new Error('account_locked')
          }
        }

        const isValid = await bcrypt.compare(password, user.passwordHash)

        if (!isValid) {
          // buyer인 경우 실패 카운트 증가
          if (user.buyer) {
            const newCount = (user.buyer.failedLoginCount || 0) + 1
            await prisma.buyer.update({
              where: { id: user.buyer.id },
              data: {
                failedLoginCount: newCount,
                lockedUntil: newCount >= 5
                  ? new Date(Date.now() + 5 * 60 * 1000)
                  : null,
              },
            })
          }
          return null
        }

        // 성공 시 카운터 리셋
        if (user.buyer && user.buyer.failedLoginCount > 0) {
          await prisma.buyer.update({
            where: { id: user.buyer.id },
            data: { failedLoginCount: 0, lockedUntil: null },
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'account_locked') {
          throw error
        }
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
} else {
  console.warn('[auth] KAKAO_CLIENT_ID 없음 - 카카오 로그인 비활성화')
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
} else {
  console.warn('[auth] NAVER_CLIENT_ID 없음 - 네이버 로그인 비활성화')
}

// Apple 로그인 (환경변수 있을 때만 활성화)
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_PRIVATE_KEY) {
  const Apple = require('next-auth/providers/apple').default
  providers.push(
    Apple({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: {
        appleId: process.env.APPLE_CLIENT_ID,
        teamId: process.env.APPLE_TEAM_ID!,
        privateKey: process.env.APPLE_PRIVATE_KEY,
        keyId: process.env.APPLE_KEY_ID!,
      } as any,
    }) as any
  )
} else {
  console.warn('[auth] APPLE_CLIENT_ID 없음 - 애플 로그인 비활성화')
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      // Credentials — 기본 허용
      if (account?.provider === 'credentials') return true

      // OAuth (카카오/네이버/애플) — DB에 유저 없으면 자동 생성 + 3000P
      const isSocial = account?.provider && ['kakao', 'naver', 'apple'].includes(account.provider)
      if (!isSocial || !account) return true

      try {
        const providerKey = `${account.provider}:${account.providerAccountId}`

        // === 크리에이터 소셜 가입 처리 ===
        let signupRole: string | null = null
        let signupVerificationToken: string | null = null
        try {
          const { cookies } = await import('next/headers')
          const cookieStore = await cookies()
          signupRole = cookieStore.get('signup_role')?.value ?? null
          signupVerificationToken = cookieStore.get('signup_verification_token')?.value ?? null
        } catch {}

        if (signupRole === 'creator') {
          const creatorEmail = user.email ?? `${account.provider}_${account.providerAccountId}@cnecshop.local`

          // 이메일 중복 체크
          const existingEmail = await prisma.user.findUnique({ where: { email: creatorEmail } })
          if (existingEmail) {
            try {
              const { cookies } = await import('next/headers')
              const cookieStore = await cookies()
              cookieStore.delete('signup_role')
              cookieStore.delete('signup_verification_token')
            } catch {}
            return '/signup?role=creator&error=email_exists'
          }

          if (signupVerificationToken) {
            // 기존 플로우: 본인인증 토큰이 있는 경우 (phone/CI 포함)
            const { jwtVerify } = await import('jose')
            const jwtSecret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')
            let verifiedCI: string | null = null
            let verifiedPhone: string | null = null
            let verifiedName: string | null = null

            try {
              const { payload } = await jwtVerify(signupVerificationToken, jwtSecret)
              if (payload.type === 'identity_verification' || payload.type === 'phone_verification') {
                verifiedCI = (payload.ci as string) || null
                verifiedPhone = payload.phone as string
                verifiedName = (payload.name as string) || null
              }
            } catch {
              return '/signup?role=creator&error=verification_expired'
            }

            if (!verifiedPhone) {
              return '/signup?role=creator&error=verification_required'
            }

            // CI 중복 체크
            if (verifiedCI) {
              const existingCI = await prisma.user.findUnique({ where: { ci: verifiedCI } })
              if (existingCI) {
                return '/signup?role=creator&error=already_registered'
              }
            }

            const now = new Date()
            const displayName = verifiedName || user.name || creatorEmail.split('@')[0]
            const isIdentityVerified = !!verifiedCI

            const newUser = await prisma.user.create({
              data: {
                email: creatorEmail,
                name: displayName,
                role: 'creator',
                passwordHash: null,
                phone: verifiedPhone,
                ci: verifiedCI,
                phoneVerifiedAt: isIdentityVerified ? now : null,
                phoneReachable: true,
                phoneReachableAt: now,
              }
            })

            await prisma.creator.create({
              data: {
                userId: newUser.id,
                displayName,
                status: 'PENDING',
                submittedAt: now,
                themeColor: '#1a1a1a',
              }
            })
          } else {
            // 새 플로우: 본인인증 없이 소셜 가입 (프로필 완성 후 본인인증)
            const now = new Date()
            const displayName = user.name || creatorEmail.split('@')[0]

            const newUser = await prisma.user.create({
              data: {
                email: creatorEmail,
                name: displayName,
                role: 'creator',
                passwordHash: null,
              }
            })

            await prisma.creator.create({
              data: {
                userId: newUser.id,
                displayName,
                status: 'PENDING',
                submittedAt: now,
                themeColor: '#1a1a1a',
              }
            })
          }

          // 가입 쿠키 정리
          try {
            const { cookies } = await import('next/headers')
            const cookieStore = await cookies()
            cookieStore.delete('signup_role')
            cookieStore.delete('signup_verification_token')
          } catch {}

          return true
        }

        // 이메일 없는 카카오 fallback
        const effectiveEmail = user.email
          ?? `${account.provider}_${account.providerAccountId}@cnecshop.local`

        // last_shop_id 쿠키 읽기 + reserved 값 필터링
        const RESERVED_SHOP_IDS = [
          'admin', 'brand', 'creator', 'buyer', 'login', 'signup', 'auth',
          'terms', 'privacy', 'policies', 'help', 'about', 'faq', 'contact',
          'no-shop-context', 'auth-error', 'error', '404', '500', 'not-found',
          'order-complete', 'payment', 'me', 'cart', 'checkout', 'orders', 'order',
          'products', 'creators', 'content', 'sitemap', 'og',
        ]
        let lastShopId: string | null = null
        try {
          const { cookies } = await import('next/headers')
          const cookieStore = await cookies()
          const raw = cookieStore.get('last_shop_id')?.value ?? null
          lastShopId = raw && !RESERVED_SHOP_IDS.includes(raw) ? raw : null
        } catch {}

        // 기존 유저 검색: socialProviderId 우선, 이메일 fallback
        let existingUser = await prisma.user.findFirst({
          where: {
            buyer: { socialProviderId: providerKey },
          },
          include: { buyer: true },
        })

        if (!existingUser && user.email) {
          existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { buyer: true },
          })
        }

        // 이메일 없는 소셜 로그인 fallback (카카오 등 — 크리에이터 재로그인 포함)
        if (!existingUser && !user.email) {
          existingUser = await prisma.user.findUnique({
            where: { email: effectiveEmail },
            include: { buyer: true },
          })
        }

        if (existingUser) {
          // 기존 유저: 소셜 정보 병합 (아직 없으면)
          if (existingUser.buyer && !existingUser.buyer.socialProvider) {
            await prisma.buyer.update({
              where: { id: existingUser.buyer.id },
              data: {
                socialProvider: account.provider,
                socialProviderId: providerKey,
              },
            })
          }

          // buyer가 없는 경우 (creator/brand 계정) 생성
          if (!existingUser.buyer && existingUser.role === 'buyer') {
            await prisma.buyer.create({
              data: {
                userId: existingUser.id,
                nickname: existingUser.name || '회원',
                socialProvider: account.provider,
                socialProviderId: providerKey,
              },
            })
          }
        } else {
          // 신규 유저 자동 생성
          const displayName = user.name || effectiveEmail.split('@')[0]
          const newUser = await prisma.user.create({
            data: {
              email: effectiveEmail,
              name: displayName,
              role: 'buyer',
              passwordHash: null,
            }
          })

          const newBuyer = await prisma.buyer.create({
            data: {
              userId: newUser.id,
              nickname: displayName,
              socialProvider: account.provider,
              socialProviderId: providerKey,
              pointsBalance: 3000,
              totalPointsEarned: 3000,
              tier: 'ROOKIE',
              createdVia: account.provider.toUpperCase(),
              createdAtShopId: lastShopId,
            },
          })

          // 3000P 기록
          await prisma.pointsHistory.create({
            data: {
              buyerId: newBuyer.id,
              amount: 3000,
              balanceAfter: 3000,
              type: 'signup_bonus',
              description: '가입 축하 포인트',
            },
          })

          // 신규 가입 쿠키
          try {
            const { cookies } = await import('next/headers')
            const cookieStore = await cookies()
            cookieStore.set('welcome_new_signup', '1', {
              maxAge: 300,
              sameSite: 'lax',
              path: '/',
            })
          } catch {}
        }

        return true
      } catch (error) {
        console.error('OAuth signIn callback error:', error)
        return false
      }
    },
    async jwt({ token, user, account }) {
      // Credentials 로그인
      if (user && account?.provider === 'credentials') {
        token.role = (user as any).role
        token.userId = user.id
      }

      // OAuth 로그인 — DB에서 role/userId 조회
      if (account && account.provider !== 'credentials') {
        try {
          const email = token.email
          if (email) {
            const dbUser = await prisma.user.findUnique({ where: { email } })
            if (dbUser) {
              token.role = dbUser.role
              token.userId = dbUser.id
            }
          }

          // 이메일 없는 카카오 fallback
          if (!email && account.providerAccountId) {
            const fallbackEmail = `${account.provider}_${account.providerAccountId}@cnecshop.local`
            const dbUser = await prisma.user.findUnique({ where: { email: fallbackEmail } })
            if (dbUser) {
              token.role = dbUser.role
              token.userId = dbUser.id
              token.email = fallbackEmail
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
  events: {
    async signIn({ user }) {
      // buyer 카트 sync (비회원 → 회원)
      if ((user as any).role !== 'buyer') return
      try {
        const buyer = await prisma.buyer.findUnique({
          where: { userId: (user as any).id || user.id },
          select: { id: true },
        })
        if (buyer) {
          const { syncGuestCartToUser } = await import('@/lib/actions/cart')
          await syncGuestCartToUser(buyer.id)
        }
      } catch (e) {
        console.error('[auth] cart sync failed', e)
      }
    },
  },
})
