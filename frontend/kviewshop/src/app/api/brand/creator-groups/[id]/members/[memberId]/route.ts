import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-helpers';

async function verifyOwnership(userId: string, groupId: string) {
  const brand = await prisma.brand.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!brand) return false;

  const group = await prisma.creatorGroup.findUnique({ where: { id: groupId } });
  return group?.brandId === brand.id;
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'brand_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: groupId, memberId } = await params;

  if (!(await verifyOwnership(authUser.id, groupId))) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  await prisma.creatorGroupMember.delete({ where: { id: memberId } });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'brand_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: groupId, memberId } = await params;

  if (!(await verifyOwnership(authUser.id, groupId))) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  const { memo } = await request.json();
  const updated = await prisma.creatorGroupMember.update({
    where: { id: memberId },
    data: { memo: memo || null },
  });

  return NextResponse.json(updated);
}
