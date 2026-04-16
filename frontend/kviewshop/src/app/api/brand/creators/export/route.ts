import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import * as XLSX from 'xlsx'

const columnMap: Record<string, { header: string; key: string }> = {
  username: { header: '인스타그램', key: 'instagramHandle' },
  fullName: { header: '이름', key: 'displayName' },
  followers: { header: '팔로워', key: 'igFollowers' },
  following: { header: '팔로잉', key: 'igFollowing' },
  engagement: { header: '참여율(%)', key: 'igEngagementRate' },
  posts: { header: '게시물', key: 'igPostsCount' },
  category: { header: '카테고리', key: 'igCategory' },
  verified: { header: '인증', key: 'igVerified' },
  bio: { header: '바이오', key: 'igBio' },
  externalUrl: { header: '외부링크', key: 'igExternalUrl' },
}

const defaultColumns = ['username', 'fullName', 'followers', 'engagement', 'category']

export async function GET(request: NextRequest) {
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

  const sp = request.nextUrl.searchParams
  const idsParam = sp.get('ids') || ''
  const ids = idsParam ? idsParam.split(',').filter(Boolean) : []
  const columnsParam = sp.get('columns') || ''
  const selectedColumns = columnsParam
    ? columnsParam.split(',').filter(c => columnMap[c])
    : defaultColumns
  const groupId = sp.get('groupId') || undefined

  let creatorIds: string[] | undefined = ids.length > 0 ? ids : undefined

  if (groupId) {
    const members = await prisma.creatorGroupMember.findMany({
      where: { groupId },
      select: { creatorId: true },
    })
    creatorIds = members.map(m => m.creatorId)
  }

  const creators = await prisma.creator.findMany({
    where: {
      igFollowers: { not: null },
      ...(creatorIds ? { id: { in: creatorIds } } : {}),
    },
    orderBy: { igFollowers: 'desc' },
  })

  const headers = selectedColumns.map(c => columnMap[c].header)
  const data = creators.map(creator => {
    const row: Record<string, string | number | boolean | null> = {}
    for (const col of selectedColumns) {
      const { header, key } = columnMap[col]
      const value = (creator as Record<string, unknown>)[key]
      if (key === 'igEngagementRate') {
        row[header] = value ? Number(value) : null
      } else if (key === 'igVerified') {
        row[header] = value ? 'O' : 'X'
      } else {
        row[header] = value as string | number | null
      }
    }
    return row
  })

  const ws = XLSX.utils.json_to_sheet(data, { header: headers })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '크리에이터')
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer

  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="creators_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  })
}
