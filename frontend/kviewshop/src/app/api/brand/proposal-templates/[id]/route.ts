import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-helpers';

async function verifyOwnership(userId: string, templateId: string) {
  const brand = await prisma.brand.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!brand) return null;

  const template = await prisma.proposalTemplate.findUnique({ where: { id: templateId } });
  if (!template || template.brandId !== brand.id) return null;

  return { brand, template };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'brand_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const result = await verifyOwnership(authUser.id, id);
  if (!result) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const { name, type, subject, body, commissionRate, isDefault } = await request.json();

  const effectiveType = type || result.template.type;

  if (isDefault) {
    await prisma.proposalTemplate.updateMany({
      where: { brandId: result.brand.id, type: effectiveType, isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name.trim();
  if (type !== undefined) data.type = type;
  if (subject !== undefined) data.subject = subject?.trim() || null;
  if (body !== undefined) data.body = body.trim();
  if (commissionRate !== undefined) data.commissionRate = commissionRate ? Number(commissionRate) : null;
  if (isDefault !== undefined) data.isDefault = isDefault;

  const updated = await prisma.proposalTemplate.update({ where: { id }, data });

  return NextResponse.json({
    ...updated,
    commissionRate: updated.commissionRate ? Number(updated.commissionRate) : null,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'brand_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const result = await verifyOwnership(authUser.id, id);
  if (!result) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  await prisma.proposalTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
