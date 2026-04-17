import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-helpers';

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'brand_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const brand = await prisma.brand.findFirst({
    where: { userId: authUser.id },
    select: {
      brandInstagramHandle: true,
      brandInstagramHandleStatus: true,
      brandInstagramHandleVerifiedAt: true,
      brandInstagramDailySentCount: true,
    },
  });

  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  }

  return NextResponse.json({
    brandInstagramHandle: brand.brandInstagramHandle,
    brandInstagramHandleStatus: brand.brandInstagramHandleStatus,
    brandInstagramHandleVerifiedAt:
      brand.brandInstagramHandleVerifiedAt?.toISOString() ?? null,
    brandInstagramDailySentCount: brand.brandInstagramDailySentCount,
  });
}

export async function PATCH(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'brand_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const brand = await prisma.brand.findFirst({
    where: { userId: authUser.id },
    select: { id: true },
  });

  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  }

  const body = await request.json();
  const handle = typeof body.brandInstagramHandle === 'string'
    ? body.brandInstagramHandle.trim().replace(/^@/, '')
    : null;

  if (!handle) {
    return NextResponse.json(
      { error: '인스타그램 핸들을 입력해주세요' },
      { status: 400 }
    );
  }

  const updated = await prisma.brand.update({
    where: { id: brand.id },
    data: {
      brandInstagramHandle: handle,
      brandInstagramHandleStatus: 'PENDING',
    },
    select: {
      brandInstagramHandle: true,
      brandInstagramHandleStatus: true,
      brandInstagramHandleVerifiedAt: true,
      brandInstagramDailySentCount: true,
    },
  });

  return NextResponse.json({
    brandInstagramHandle: updated.brandInstagramHandle,
    brandInstagramHandleStatus: updated.brandInstagramHandleStatus,
    brandInstagramHandleVerifiedAt:
      updated.brandInstagramHandleVerifiedAt?.toISOString() ?? null,
    brandInstagramDailySentCount: updated.brandInstagramDailySentCount,
  });
}
