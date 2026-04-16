import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-helpers';

async function getBrand(userId: string) {
  return prisma.brand.findFirst({
    where: { userId },
    select: { id: true },
  });
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'brand_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const brand = await getBrand(authUser.id);
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  }

  const { name, description } = await request.json();

  if (!name || typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 50) {
    return NextResponse.json({ error: '그룹명은 1~50자로 입력해주세요' }, { status: 400 });
  }

  const count = await prisma.creatorGroup.count({ where: { brandId: brand.id } });
  if (count >= 20) {
    return NextResponse.json({ error: '그룹은 최대 20개까지 생성 가능합니다' }, { status: 400 });
  }

  const group = await prisma.creatorGroup.create({
    data: {
      brandId: brand.id,
      name: name.trim(),
      description: description?.trim() || null,
    },
  });

  return NextResponse.json(group, { status: 201 });
}

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'brand_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const brand = await getBrand(authUser.id);
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  }

  const groups = await prisma.creatorGroup.findMany({
    where: { brandId: brand.id },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ groups });
}
