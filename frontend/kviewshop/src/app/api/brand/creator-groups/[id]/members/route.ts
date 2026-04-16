import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'brand_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: groupId } = await params;

  const brand = await prisma.brand.findFirst({
    where: { userId: authUser.id },
    select: { id: true },
  });
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  }

  const group = await prisma.creatorGroup.findUnique({ where: { id: groupId } });
  if (!group || group.brandId !== brand.id) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  const { creatorIds } = await request.json();
  if (!Array.isArray(creatorIds) || creatorIds.length === 0) {
    return NextResponse.json({ error: '추가할 크리에이터를 선택해주세요' }, { status: 400 });
  }

  const currentCount = await prisma.creatorGroupMember.count({ where: { groupId } });
  if (currentCount + creatorIds.length > 500) {
    return NextResponse.json({ error: '그룹당 최대 500명까지 추가 가능합니다' }, { status: 400 });
  }

  const existing = await prisma.creatorGroupMember.findMany({
    where: { groupId, creatorId: { in: creatorIds } },
    select: { creatorId: true },
  });
  const existingIds = new Set(existing.map((e) => e.creatorId));
  const newIds = creatorIds.filter((cid: string) => !existingIds.has(cid));

  if (newIds.length > 0) {
    await prisma.creatorGroupMember.createMany({
      data: newIds.map((creatorId: string) => ({ groupId, creatorId })),
    });
  }

  return NextResponse.json({ added: newIds.length, skipped: existingIds.size });
}
