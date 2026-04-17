import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-helpers';
import * as XLSX from 'xlsx';

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
              igUsername: true,
              email: true,
              phone: true,
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

  const rows = group.members.map((m, idx) => ({
    '번호': idx + 1,
    '크리에이터명': m.creator.displayName || '',
    '@username': m.creator.instagramHandle ? `@${m.creator.instagramHandle}` : '',
    '팔로워': m.creator.igFollowers ? Number(m.creator.igFollowers) : 0,
    'ER': m.creator.igEngagementRate ? Number(m.creator.igEngagementRate) : 0,
    '카테고리': m.creator.igCategory || '',
    '이메일': m.creator.email || '',
    '전화': m.creator.phone || '',
    'IG아이디': m.creator.igUsername || '',
    '메모': m.memo || '',
    '추가일': m.addedAt.toISOString().slice(0, 10),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },   // 번호
    { wch: 18 },  // 크리에이터명
    { wch: 20 },  // @username
    { wch: 10 },  // 팔로워
    { wch: 8 },   // ER
    { wch: 14 },  // 카테고리
    { wch: 24 },  // 이메일
    { wch: 16 },  // 전화
    { wch: 20 },  // IG아이디
    { wch: 20 },  // 메모
    { wch: 12 },  // 추가일
  ];

  XLSX.utils.book_append_sheet(wb, ws, '크리에이터');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const filename = `${group.name}_크리에이터_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
