import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET() {
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

  const presets = await prisma.creatorFilterPreset.findMany({
    where: { brandId: brand.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(presets)
}

export async function POST(request: NextRequest) {
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

  const body = await request.json() as {
    name?: string
    filters?: Record<string, unknown> & object
    isDefault?: boolean
  }

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return NextResponse.json({ error: '프리셋 이름을 입력해주세요.' }, { status: 400 })
  }

  if (!body.filters || typeof body.filters !== 'object') {
    return NextResponse.json({ error: '필터 데이터가 필요합니다.' }, { status: 400 })
  }

  // Limit 20 presets per brand
  const existingCount = await prisma.creatorFilterPreset.count({
    where: { brandId: brand.id },
  })
  if (existingCount >= 20) {
    return NextResponse.json(
      { error: '프리셋은 최대 20개까지 저장할 수 있습니다.' },
      { status: 400 },
    )
  }

  // If setting as default, unset existing defaults
  if (body.isDefault) {
    await prisma.creatorFilterPreset.updateMany({
      where: { brandId: brand.id, isDefault: true },
      data: { isDefault: false },
    })
  }

  const preset = await prisma.creatorFilterPreset.create({
    data: {
      brandId: brand.id,
      name: body.name.trim(),
      filters: body.filters as unknown as Record<string, string | number | boolean>,
      isDefault: body.isDefault ?? false,
    },
  })

  return NextResponse.json(preset, { status: 201 })
}
