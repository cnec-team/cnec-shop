import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-helpers';

async function getBrandAndGroup(userId: string, groupId: string) {
  const brand = await prisma.brand.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!brand) return { error: 'Brand not found', status: 404 } as const;

  const group = await prisma.creatorGroup.findUnique({ where: { id: groupId } });
  if (!group || group.brandId !== brand.id) {
    return { error: 'Group not found', status: 404 } as const;
  }

  return { brand, group } as const;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'brand_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const result = await getBrandAndGroup(authUser.id, id);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'recent';
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));
  const skip = (page - 1) * limit;

  const searchFilter = search
    ? {
        creator: {
          OR: [
            { instagramHandle: { contains: search, mode: 'insensitive' as const } },
            { displayName: { contains: search, mode: 'insensitive' as const } },
          ],
        },
      }
    : {};

  const orderBy =
    sort === 'followers'
      ? { creator: { igFollowers: 'desc' as const } }
      : sort === 'engagement'
        ? { creator: { igEngagementRate: 'desc' as const } }
        : { addedAt: 'desc' as const };

  const group = await prisma.creatorGroup.findUnique({
    where: { id },
    include: {
      members: {
        where: searchFilter,
        include: {
          creator: {
            select: {
              id: true,
              instagramHandle: true,
              displayName: true,
              igFollowers: true,
              igEngagementRate: true,
              igCategory: true,
              igVerified: true,
              igProfileImageR2Url: true,
              igProfilePicUrl: true,
              igRecentPostThumbnails: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      },
      _count: { select: { members: true } },
    },
  });

  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  const members = group.members.map((m) => ({
    ...m,
    creator: {
      ...m.creator,
      igFollowers: m.creator.igFollowers ? Number(m.creator.igFollowers) : null,
      igEngagementRate: m.creator.igEngagementRate ? Number(m.creator.igEngagementRate) : null,
    },
  }));

  return NextResponse.json({
    ...group,
    members,
    pagination: { page, limit, total: group._count.members },
  });
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
  const result = await getBrandAndGroup(authUser.id, id);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { name, description } = await request.json();

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 50)) {
    return NextResponse.json({ error: '그룹명은 1~50자로 입력해주세요' }, { status: 400 });
  }

  const data: Record<string, string | null> = {};
  if (name !== undefined) data.name = name.trim();
  if (description !== undefined) data.description = description?.trim() || null;

  const updated = await prisma.creatorGroup.update({ where: { id }, data });
  return NextResponse.json(updated);
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
  const result = await getBrandAndGroup(authUser.id, id);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await prisma.creatorGroup.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
