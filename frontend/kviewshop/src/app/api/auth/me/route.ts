import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let brand = null
    let creator = null
    let buyer = null

    if (user.role === 'brand_admin') {
      brand = await prisma.brand.findUnique({ where: { userId } })
    } else if (user.role === 'creator') {
      creator = await prisma.creator.findUnique({ where: { userId } })
    } else if (user.role === 'buyer') {
      buyer = await prisma.buyer.findUnique({ where: { userId } })
    }

    return NextResponse.json({ user, brand, creator, buyer })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
