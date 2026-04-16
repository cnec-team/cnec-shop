import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'brand_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const brand = await prisma.brand.findFirst({
    where: { userId: authUser.id },
    select: { id: true },
  });
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  }

  const group = await prisma.creatorGroup.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          creator: {
            select: {
              instagramHandle: true,
              displayName: true,
              igFollowers: true,
              igEngagementRate: true,
              igCategory: true,
              igVerified: true,
            },
          },
        },
        orderBy: { addedAt: 'desc' },
      },
    },
  });

  if (!group || group.brandId !== brand.id) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  const headers = ['인스타그램', '이름', '팔로워', '참여율(%)', '카테고리', '인증', '메모'];
  const rows = group.members.map((m) => [
    m.creator.instagramHandle || '',
    m.creator.displayName || '',
    String(m.creator.igFollowers ? Number(m.creator.igFollowers) : 0),
    m.creator.igEngagementRate ? Number(m.creator.igEngagementRate).toFixed(2) : '0',
    m.creator.igCategory || '',
    m.creator.igVerified ? 'Y' : 'N',
    m.memo || '',
  ]);

  const escapeCSV = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  const BOM = '\uFEFF';
  const filename = `${group.name}_크리에이터_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(BOM + csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
