import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    // 0. Cookie 확인
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const sessionCookie = allCookies.find(
      (c) => c.name.includes('session-token') || c.name.includes('authjs'),
    )

    // 1. Auth check
    const session = await auth()

    if (!session) {
      return NextResponse.json({
        step: 'auth',
        error: 'session is null',
        hasSessionCookie: !!sessionCookie,
        sessionCookieName: sessionCookie?.name ?? null,
        cookieNames: allCookies.map((c) => c.name),
      })
    }

    if (!session.user) {
      return NextResponse.json({
        step: 'auth',
        error: 'session.user is null',
        sessionKeys: Object.keys(session),
      })
    }

    const userId = session.user.id
    const email = session.user.email
    const role = (session.user as any).role

    if (!userId) {
      // userId 누락 → email로 복구 시도
      let recoveredUserId: string | null = null
      if (email) {
        const dbUser = await prisma.user.findUnique({ where: { email } })
        if (dbUser) recoveredUserId = dbUser.id
      }
      return NextResponse.json({
        step: 'auth',
        error: 'session.user.id is undefined',
        email,
        role,
        userKeys: Object.keys(session.user),
        recoveredUserId,
      })
    }

    // 2. Creator check
    const creator = await prisma.creator.findFirst({
      where: { userId },
    })
    if (!creator) {
      const dbUser = await prisma.user.findUnique({ where: { id: userId } })
      return NextResponse.json({
        step: 'creator',
        error: 'No creator for this user',
        userId,
        email,
        role,
        dbUserExists: !!dbUser,
        dbUserRole: dbUser?.role,
      })
    }

    // 3. Products
    const productCount = await prisma.product.count({
      where: { status: 'ACTIVE', isActive: true, allowCreatorPick: true },
    })
    const trialCount = await prisma.product.count({
      where: { allowTrial: true, isActive: true, status: 'ACTIVE' },
    })

    return NextResponse.json({
      ok: true,
      userId,
      email,
      role,
      creatorId: creator.id,
      creatorUsername: creator.username,
      productCount,
      trialCount,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 5),
      },
      { status: 500 },
    )
  }
}
