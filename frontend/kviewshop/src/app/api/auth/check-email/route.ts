import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const limited = await rateLimit(`check-email:${ip}`, 10, 60)
  if (limited) {
    return NextResponse.json({ error: 'too_many_requests' }, { status: 429 })
  }

  const body = await req.json()
  const email = body?.email?.trim().toLowerCase()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      buyer: {
        select: { socialProvider: true },
      },
    },
  })

  return NextResponse.json({
    exists: !!user,
    name: user?.name ?? null,
    hasSocial: !!user?.buyer?.socialProvider,
    socialProvider: user?.buyer?.socialProvider ?? null,
  })
}
