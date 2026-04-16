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

  const { name, type, subject, body, commissionRate, isDefault } = await request.json();

  if (!name || !type || !body) {
    return NextResponse.json({ error: '필수 항목을 입력해주세요' }, { status: 400 });
  }

  if (!['GONGGU', 'CREATOR_PICK'].includes(type)) {
    return NextResponse.json({ error: '유효하지 않은 제안 유형입니다' }, { status: 400 });
  }

  if (isDefault) {
    await prisma.proposalTemplate.updateMany({
      where: { brandId: brand.id, type, isDefault: true },
      data: { isDefault: false },
    });
  }

  const template = await prisma.proposalTemplate.create({
    data: {
      brandId: brand.id,
      name: name.trim(),
      type,
      subject: subject?.trim() || null,
      body: body.trim(),
      commissionRate: commissionRate ? Number(commissionRate) : null,
      isDefault: isDefault || false,
    },
  });

  return NextResponse.json({
    ...template,
    commissionRate: template.commissionRate ? Number(template.commissionRate) : null,
  }, { status: 201 });
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

  const templates = await prisma.proposalTemplate.findMany({
    where: { brandId: brand.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  const result = templates.map((t) => ({
    ...t,
    commissionRate: t.commissionRate ? Number(t.commissionRate) : null,
  }));

  return NextResponse.json({ templates: result });
}
