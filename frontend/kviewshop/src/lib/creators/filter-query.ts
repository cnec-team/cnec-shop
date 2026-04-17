import type { CreatorFilters } from './filter-types'
import type { Prisma } from '@/generated/prisma/client'

export function buildCreatorFilterWhere(
  filters: CreatorFilters,
  brandId: string,
): Prisma.CreatorWhereInput {
  const and: Prisma.CreatorWhereInput[] = []

  // Followers range
  if (filters.followersMin !== undefined || filters.followersMax !== undefined) {
    const cond: Prisma.IntNullableFilter = {}
    if (filters.followersMin !== undefined) cond.gte = filters.followersMin
    if (filters.followersMax !== undefined) cond.lte = filters.followersMax
    and.push({ igFollowers: cond })
  }

  // Following range
  if (filters.followingMin !== undefined || filters.followingMax !== undefined) {
    const cond: Prisma.IntNullableFilter = {}
    if (filters.followingMin !== undefined) cond.gte = filters.followingMin
    if (filters.followingMax !== undefined) cond.lte = filters.followingMax
    and.push({ igFollowing: cond })
  }

  // Posts count range
  if (filters.postsCountMin !== undefined || filters.postsCountMax !== undefined) {
    const cond: Prisma.IntNullableFilter = {}
    if (filters.postsCountMin !== undefined) cond.gte = filters.postsCountMin
    if (filters.postsCountMax !== undefined) cond.lte = filters.postsCountMax
    and.push({ igPostsCount: cond })
  }

  // Account types
  if (filters.accountTypes && filters.accountTypes.length > 0) {
    const or: Prisma.CreatorWhereInput[] = []
    if (filters.accountTypes.includes('BUSINESS')) {
      or.push({ igIsBusinessAccount: true })
    }
    if (filters.accountTypes.includes('PERSONAL')) {
      or.push({ igIsBusinessAccount: false })
    }
    if (filters.accountTypes.includes('VERIFIED')) {
      or.push({ igVerified: true })
    }
    if (or.length > 0) {
      and.push({ OR: or })
    }
  }

  // Last post within days
  if (filters.lastPostWithinDays) {
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - filters.lastPostWithinDays)
    and.push({
      OR: [
        { igLastPostAt: { gte: threshold } },
        { igLastUploadDate: { gte: threshold.toISOString().split('T')[0] } },
      ],
    })
  }

  // Engagement rate range
  if (filters.erMin !== undefined || filters.erMax !== undefined) {
    const cond: Prisma.DecimalNullableFilter = {}
    if (filters.erMin !== undefined) cond.gte = filters.erMin
    if (filters.erMax !== undefined) cond.lte = filters.erMax
    and.push({ igEngagementRate: cond })
  }

  // Avg feed likes range
  if (filters.avgFeedLikesMin !== undefined || filters.avgFeedLikesMax !== undefined) {
    const cond: Prisma.IntNullableFilter = {}
    if (filters.avgFeedLikesMin !== undefined) cond.gte = filters.avgFeedLikesMin
    if (filters.avgFeedLikesMax !== undefined) cond.lte = filters.avgFeedLikesMax
    and.push({
      OR: [
        { igAvgFeedLikes: cond },
        { igAvgLikes: cond },
      ],
    })
  }

  // Avg feed comments range
  if (filters.avgFeedCommentsMin !== undefined || filters.avgFeedCommentsMax !== undefined) {
    const cond: Prisma.IntNullableFilter = {}
    if (filters.avgFeedCommentsMin !== undefined) cond.gte = filters.avgFeedCommentsMin
    if (filters.avgFeedCommentsMax !== undefined) cond.lte = filters.avgFeedCommentsMax
    and.push({
      OR: [
        { igAvgFeedComments: cond },
        { igAvgComments: cond },
      ],
    })
  }

  // Avg reel views range
  if (filters.avgReelViewsMin !== undefined || filters.avgReelViewsMax !== undefined) {
    const cond: Prisma.IntNullableFilter = {}
    if (filters.avgReelViewsMin !== undefined) cond.gte = filters.avgReelViewsMin
    if (filters.avgReelViewsMax !== undefined) cond.lte = filters.avgReelViewsMax
    and.push({
      OR: [
        { igAvgReelViews: cond },
        { igAvgVideoViews: cond },
      ],
    })
  }

  // Avg reel likes range
  if (filters.avgReelLikesMin !== undefined || filters.avgReelLikesMax !== undefined) {
    const cond: Prisma.IntNullableFilter = {}
    if (filters.avgReelLikesMin !== undefined) cond.gte = filters.avgReelLikesMin
    if (filters.avgReelLikesMax !== undefined) cond.lte = filters.avgReelLikesMax
    and.push({
      OR: [
        { igAvgReelLikes: cond },
        { igAvgVideoLikes: cond },
      ],
    })
  }

  // Estimated reach range
  if (filters.estimatedReachMin !== undefined || filters.estimatedReachMax !== undefined) {
    const cond: Prisma.IntNullableFilter = {}
    if (filters.estimatedReachMin !== undefined) cond.gte = filters.estimatedReachMin
    if (filters.estimatedReachMax !== undefined) cond.lte = filters.estimatedReachMax
    and.push({
      OR: [
        { igEstimatedReach: cond },
        { igAvgReach: cond },
      ],
    })
  }

  // Categories
  if (filters.categories && filters.categories.length > 0) {
    and.push({
      OR: filters.categories.map(cat => ({
        igCategory: { contains: cat, mode: 'insensitive' as const },
      })),
    })
  }

  // Include keywords (bio search)
  if (filters.includeKeywords && filters.includeKeywords.filter(Boolean).length > 0) {
    const keywords = filters.includeKeywords.filter(Boolean)
    const mode = filters.includeKeywordsMode || 'OR'
    const kwConditions = keywords.map(kw => ({
      igBio: { contains: kw, mode: 'insensitive' as const },
    }))
    if (mode === 'AND') {
      and.push(...kwConditions)
    } else {
      and.push({ OR: kwConditions })
    }
  }

  // Exclude keywords
  if (filters.excludeKeywords && filters.excludeKeywords.filter(Boolean).length > 0) {
    for (const kw of filters.excludeKeywords.filter(Boolean)) {
      and.push({
        NOT: { igBio: { contains: kw, mode: 'insensitive' as const } },
      })
    }
  }

  // Languages
  if (filters.languages && filters.languages.length > 0) {
    and.push({
      OR: filters.languages.flatMap(lang => [
        { igLanguage: { equals: lang, mode: 'insensitive' as const } },
        { igPrimaryLanguage: { equals: lang, mode: 'insensitive' as const } },
      ]),
    })
  }

  // Valid followers range
  if (filters.validFollowersMin !== undefined || filters.validFollowersMax !== undefined) {
    const cond: Prisma.IntNullableFilter = {}
    if (filters.validFollowersMin !== undefined) cond.gte = filters.validFollowersMin
    if (filters.validFollowersMax !== undefined) cond.lte = filters.validFollowersMax
    and.push({
      OR: [
        { igValidFollowers: cond },
        { igFollowersEffective: cond },
      ],
    })
  }

  // CNEC status
  if (filters.cnecStatus && filters.cnecStatus !== 'ALL') {
    and.push({ cnecJoinStatus: filters.cnecStatus })
  }

  // Has email
  if (filters.hasEmail) {
    and.push({ hasBrandEmail: true })
  }

  // Has phone
  if (filters.hasPhone) {
    and.push({ hasPhone: true })
  }

  // Has IG username
  if (filters.hasIgUsername) {
    and.push({ igUsername: { not: null } })
  }

  // Estimated CPR range
  if (filters.estimatedCprMin !== undefined || filters.estimatedCprMax !== undefined) {
    const intCond: Prisma.IntNullableFilter = {}
    const decCond: Prisma.DecimalNullableFilter = {}
    if (filters.estimatedCprMin !== undefined) {
      intCond.gte = filters.estimatedCprMin
      decCond.gte = filters.estimatedCprMin
    }
    if (filters.estimatedCprMax !== undefined) {
      intCond.lte = filters.estimatedCprMax
      decCond.lte = filters.estimatedCprMax
    }
    and.push({
      OR: [
        { igEstimatedCPR: intCond },
        { igEstimatedCPRDecimal: decCond },
      ],
    })
  }

  // Estimated ad fee range
  if (filters.estimatedAdFeeMin !== undefined || filters.estimatedAdFeeMax !== undefined) {
    const intCond: Prisma.IntNullableFilter = {}
    const decCond: Prisma.DecimalNullableFilter = {}
    if (filters.estimatedAdFeeMin !== undefined) {
      intCond.gte = filters.estimatedAdFeeMin
      decCond.gte = filters.estimatedAdFeeMin
    }
    if (filters.estimatedAdFeeMax !== undefined) {
      intCond.lte = filters.estimatedAdFeeMax
      decCond.lte = filters.estimatedAdFeeMax
    }
    and.push({
      OR: [
        { igEstimatedAdCost: intCond },
        { igEstimatedAdFee: decCond },
      ],
    })
  }

  // Group membership
  if (filters.groupIds && filters.groupIds.length > 0) {
    and.push({
      groupMemberships: {
        some: {
          groupId: { in: filters.groupIds },
          group: { brandId },
        },
      },
    })
  }

  // Previous proposal status
  if (filters.previousProposalStatus === 'PROPOSED') {
    and.push({
      receivedProposals: {
        some: { brandId },
      },
    })
  } else if (filters.previousProposalStatus === 'NEVER') {
    and.push({
      receivedProposals: {
        none: { brandId },
      },
    })
  }

  // Campaign participation count
  if (filters.campaignParticipation) {
    switch (filters.campaignParticipation) {
      case '0':
        and.push({ campaignParticipations: { none: {} } })
        break
      case '1-2':
        // Has participations but we filter by count in application layer
        // Using some + none pattern as approximation
        and.push({ campaignParticipations: { some: {} } })
        break
      case '3-5':
        and.push({ campaignParticipations: { some: {} } })
        break
      case '5plus':
        and.push({ campaignParticipations: { some: {} } })
        break
    }
  }

  const where: Prisma.CreatorWhereInput = {
    igFollowers: { not: null },
  }

  if (and.length > 0) {
    where.AND = and
  }

  return where
}

export function buildCreatorFilterOrderBy(
  filters: CreatorFilters,
): Prisma.CreatorOrderByWithRelationInput {
  switch (filters.sortBy) {
    case 'followers_desc':
      return { igFollowers: 'desc' }
    case 'followers_asc':
      return { igFollowers: 'asc' }
    case 'er_desc':
      return { igEngagementRate: 'desc' }
    case 'recent_post_desc':
      return { igLastPostAt: 'desc' }
    case 'avg_likes_desc':
      return { igAvgFeedLikes: 'desc' }
    case 'cpr_asc':
      return { igEstimatedCPRDecimal: 'asc' }
    case 'acceptance_rate_desc':
      return { igEngagementRate: 'desc' } // fallback, acceptance rate is computed
    default:
      return { igFollowers: 'desc' }
  }
}
