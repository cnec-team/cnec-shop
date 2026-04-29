'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

/**
 * 팔로우 토글 (팔로우/언팔로우)
 */
export async function toggleFollow(creatorId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: '로그인이 필요합니다', isFollowing: false }
  }

  const userId = session.user.id

  try {
    const existing = await prisma.follow.findUnique({
      where: { userId_creatorId: { userId, creatorId } },
    })

    if (existing) {
      await prisma.follow.delete({
        where: { id: existing.id },
      })
      return { success: true, isFollowing: false }
    } else {
      await prisma.follow.create({
        data: { userId, creatorId },
      })
      return { success: true, isFollowing: true }
    }
  } catch (error) {
    console.error('팔로우 토글 실패:', error)
    return { success: false, error: '팔로우 처리 중 오류가 발생했습니다', isFollowing: false }
  }
}

/**
 * 팔로우 상태 + 팔로워 수 한 번에 조회 (크리에이터 샵용)
 */
export async function getFollowInfo(creatorId: string) {
  const session = await auth()

  const [followerCount, follow] = await Promise.all([
    prisma.follow.count({ where: { creatorId } }),
    session?.user?.id
      ? prisma.follow.findUnique({
          where: { userId_creatorId: { userId: session.user.id, creatorId } },
        })
      : null,
  ])

  return {
    isFollowing: !!follow,
    followerCount,
  }
}

/**
 * 내가 팔로우한 크리에이터 목록 (마이페이지용)
 */
export async function getMyFollowingCreators(page: number = 1, limit: number = 20) {
  const session = await auth()
  if (!session?.user?.id) return { creators: [], total: 0 }

  const userId = session.user.id
  const skip = (page - 1) * limit

  const [follows, total] = await Promise.all([
    prisma.follow.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.follow.count({ where: { userId } }),
  ])

  if (follows.length === 0) return { creators: [], total }

  const creatorIds = follows.map((f) => f.creatorId)
  const creators = await prisma.creator.findMany({
    where: { id: { in: creatorIds } },
    select: {
      id: true,
      username: true,
      shopId: true,
      displayName: true,
      profileImageUrl: true,
      instagramHandle: true,
    },
  })

  // 각 크리에이터의 팔로워 수도 조회
  const followerCounts = await prisma.follow.groupBy({
    by: ['creatorId'],
    where: { creatorId: { in: creatorIds } },
    _count: true,
  })
  const countMap = new Map(followerCounts.map((fc) => [fc.creatorId, fc._count]))

  const creatorsWithMeta = creators.map((c) => ({
    ...c,
    followerCount: countMap.get(c.id) ?? 0,
    followedAt: follows.find((f) => f.creatorId === c.id)?.createdAt,
  }))

  // 팔로우 순서대로 정렬 (최신순)
  creatorsWithMeta.sort((a, b) => {
    const aTime = a.followedAt?.getTime() ?? 0
    const bTime = b.followedAt?.getTime() ?? 0
    return bTime - aTime
  })

  return { creators: creatorsWithMeta, total }
}

/**
 * 내 팔로워 목록 (크리에이터 어드민용)
 */
export async function getMyFollowers(creatorId: string, page: number = 1, limit: number = 20) {
  const session = await auth()
  if (!session?.user?.id) return { followers: [], total: 0, recentCount: 0 }

  // 본인 크리에이터인지 확인
  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    select: { userId: true },
  })
  if (!creator || creator.userId !== session.user.id) {
    return { followers: [], total: 0, recentCount: 0 }
  }

  const skip = (page - 1) * limit
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [follows, total, recentCount] = await Promise.all([
    prisma.follow.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.follow.count({ where: { creatorId } }),
    prisma.follow.count({
      where: { creatorId, createdAt: { gte: sevenDaysAgo } },
    }),
  ])

  if (follows.length === 0) return { followers: [], total, recentCount }

  const userIds = follows.map((f) => f.userId)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  })
  const userMap = new Map(users.map((u) => [u.id, u]))

  const followers = follows.map((f) => ({
    id: f.id,
    userId: f.userId,
    name: userMap.get(f.userId)?.name ?? '회원',
    followedAt: f.createdAt,
  }))

  return { followers, total, recentCount }
}

/**
 * 크리에이터 팔로워 수 (대시보드 카드용)
 */
export async function getFollowerStats(creatorId: string) {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [total, recentNew] = await Promise.all([
    prisma.follow.count({ where: { creatorId } }),
    prisma.follow.count({
      where: { creatorId, createdAt: { gte: sevenDaysAgo } },
    }),
  ])

  return { total, recentNew }
}
