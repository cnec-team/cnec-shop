import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id || id.length < 2) {
    return NextResponse.json({ available: false })
  }

  try {
    const existing = await prisma.creator.findUnique({
      where: { shopId: id },
      select: { id: true },
    })

    return NextResponse.json({ available: !existing })
  } catch (error) {
    console.error('check-shop-id error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', available: false },
      { status: 500 }
    )
  }
}
