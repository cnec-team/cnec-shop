import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id || id.length < 2) {
    return NextResponse.json({ available: false })
  }

  const existing = await prisma.creator.findUnique({
    where: { shopId: id },
    select: { id: true },
  })

  return NextResponse.json({ available: !existing })
}
