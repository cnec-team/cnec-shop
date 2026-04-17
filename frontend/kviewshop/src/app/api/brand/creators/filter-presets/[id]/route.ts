import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'brand_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const brand = await prisma.brand.findFirst({
    where: { userId: authUser.id },
    select: { id: true },
  })
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
  }

  const { id } = await params

  const preset = await prisma.creatorFilterPreset.findUnique({
    where: { id },
    select: { brandId: true },
  })

  if (!preset) {
    return NextResponse.json({ error: '프리셋을 찾을 수 없습니다.' }, { status: 404 })
  }

  if (preset.brandId !== brand.id) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  await prisma.creatorFilterPreset.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
