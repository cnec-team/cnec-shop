export interface CreatorFilters {
  followersMin?: number
  followersMax?: number
  followingMin?: number
  followingMax?: number
  postsCountMin?: number
  postsCountMax?: number
  accountTypes?: ('BUSINESS' | 'PERSONAL' | 'VERIFIED')[]
  lastPostWithinDays?: 7 | 30 | 90 | 180
  erMin?: number
  erMax?: number
  avgFeedLikesMin?: number
  avgFeedLikesMax?: number
  avgFeedCommentsMin?: number
  avgFeedCommentsMax?: number
  avgReelViewsMin?: number
  avgReelViewsMax?: number
  avgReelLikesMin?: number
  avgReelLikesMax?: number
  estimatedReachMin?: number
  estimatedReachMax?: number
  categories?: string[]
  includeKeywords?: string[]
  includeKeywordsMode?: 'OR' | 'AND'
  excludeKeywords?: string[]
  languages?: ('ko' | 'en' | 'ja')[]
  audienceFemaleMin?: number
  audienceMaleMin?: number
  audienceAgeGroups?: ('10s' | '20s' | '30s' | '40plus')[]
  validFollowersMin?: number
  validFollowersMax?: number
  cnecStatus?: 'ALL' | 'VERIFIED' | 'NOT_JOINED'
  previousProposalStatus?: 'ALL' | 'PROPOSED' | 'NEVER'
  campaignParticipation?: '0' | '1-2' | '3-5' | '5plus'
  acceptanceRateMin?: number
  estimatedCprMin?: number
  estimatedCprMax?: number
  estimatedAdFeeMin?: number
  estimatedAdFeeMax?: number
  groupIds?: string[]
  hasEmail?: boolean
  hasPhone?: boolean
  hasIgUsername?: boolean
  sortBy?:
    | 'followers_desc'
    | 'followers_asc'
    | 'er_desc'
    | 'recent_post_desc'
    | 'avg_likes_desc'
    | 'cpr_asc'
    | 'acceptance_rate_desc'
  page?: number
  pageSize?: number
}

const NUM_KEYS: (keyof CreatorFilters)[] = [
  'followersMin', 'followersMax', 'followingMin', 'followingMax',
  'postsCountMin', 'postsCountMax', 'erMin', 'erMax',
  'avgFeedLikesMin', 'avgFeedLikesMax', 'avgFeedCommentsMin', 'avgFeedCommentsMax',
  'avgReelViewsMin', 'avgReelViewsMax', 'avgReelLikesMin', 'avgReelLikesMax',
  'estimatedReachMin', 'estimatedReachMax', 'validFollowersMin', 'validFollowersMax',
  'acceptanceRateMin', 'estimatedCprMin', 'estimatedCprMax',
  'estimatedAdFeeMin', 'estimatedAdFeeMax', 'audienceFemaleMin', 'audienceMaleMin',
  'page', 'pageSize',
]

const ARRAY_STR_KEYS: (keyof CreatorFilters)[] = [
  'categories', 'includeKeywords', 'excludeKeywords', 'groupIds',
]

export function filtersToSearchParams(filters: CreatorFilters): URLSearchParams {
  const sp = new URLSearchParams()

  for (const key of NUM_KEYS) {
    const val = filters[key]
    if (val !== undefined && val !== null) {
      sp.set(key, String(val))
    }
  }

  for (const key of ARRAY_STR_KEYS) {
    const arr = filters[key] as string[] | undefined
    if (arr && arr.length > 0) {
      sp.set(key, arr.join(','))
    }
  }

  if (filters.accountTypes && filters.accountTypes.length > 0) {
    sp.set('accountTypes', filters.accountTypes.join(','))
  }
  if (filters.lastPostWithinDays) {
    sp.set('lastPostWithinDays', String(filters.lastPostWithinDays))
  }
  if (filters.includeKeywordsMode && filters.includeKeywordsMode !== 'OR') {
    sp.set('includeKeywordsMode', filters.includeKeywordsMode)
  }
  if (filters.languages && filters.languages.length > 0) {
    sp.set('languages', filters.languages.join(','))
  }
  if (filters.audienceAgeGroups && filters.audienceAgeGroups.length > 0) {
    sp.set('audienceAgeGroups', filters.audienceAgeGroups.join(','))
  }
  if (filters.cnecStatus && filters.cnecStatus !== 'ALL') {
    sp.set('cnecStatus', filters.cnecStatus)
  }
  if (filters.previousProposalStatus && filters.previousProposalStatus !== 'ALL') {
    sp.set('previousProposalStatus', filters.previousProposalStatus)
  }
  if (filters.campaignParticipation) {
    sp.set('campaignParticipation', filters.campaignParticipation)
  }
  if (filters.hasEmail) sp.set('hasEmail', 'true')
  if (filters.hasPhone) sp.set('hasPhone', 'true')
  if (filters.hasIgUsername) sp.set('hasIgUsername', 'true')
  if (filters.sortBy) sp.set('sortBy', filters.sortBy)

  return sp
}

export function searchParamsToFilters(sp: URLSearchParams): CreatorFilters {
  const f: CreatorFilters = {}

  for (const key of NUM_KEYS) {
    const raw = sp.get(key)
    if (raw) {
      const num = parseFloat(raw)
      if (!isNaN(num)) {
        ;(f as Record<string, number>)[key] = num
      }
    }
  }

  for (const key of ARRAY_STR_KEYS) {
    const raw = sp.get(key)
    if (raw) {
      ;(f as Record<string, string[]>)[key] = raw.split(',').filter(Boolean)
    }
  }

  const accountTypes = sp.get('accountTypes')
  if (accountTypes) {
    f.accountTypes = accountTypes.split(',').filter(Boolean) as CreatorFilters['accountTypes']
  }

  const lastPost = sp.get('lastPostWithinDays')
  if (lastPost) {
    const n = parseInt(lastPost, 10)
    if ([7, 30, 90, 180].includes(n)) {
      f.lastPostWithinDays = n as 7 | 30 | 90 | 180
    }
  }

  const kwMode = sp.get('includeKeywordsMode')
  if (kwMode === 'AND') f.includeKeywordsMode = 'AND'

  const langs = sp.get('languages')
  if (langs) {
    f.languages = langs.split(',').filter(Boolean) as CreatorFilters['languages']
  }

  const ageGroups = sp.get('audienceAgeGroups')
  if (ageGroups) {
    f.audienceAgeGroups = ageGroups.split(',').filter(Boolean) as CreatorFilters['audienceAgeGroups']
  }

  const cnec = sp.get('cnecStatus')
  if (cnec === 'VERIFIED' || cnec === 'NOT_JOINED') f.cnecStatus = cnec

  const proposal = sp.get('previousProposalStatus')
  if (proposal === 'PROPOSED' || proposal === 'NEVER') f.previousProposalStatus = proposal

  const camp = sp.get('campaignParticipation')
  if (camp === '0' || camp === '1-2' || camp === '3-5' || camp === '5plus') {
    f.campaignParticipation = camp
  }

  if (sp.get('hasEmail') === 'true') f.hasEmail = true
  if (sp.get('hasPhone') === 'true') f.hasPhone = true
  if (sp.get('hasIgUsername') === 'true') f.hasIgUsername = true

  const sortBy = sp.get('sortBy')
  if (sortBy) {
    f.sortBy = sortBy as CreatorFilters['sortBy']
  }

  return f
}

export function countActiveFilters(filters: CreatorFilters): number {
  let count = 0

  if (filters.followersMin !== undefined || filters.followersMax !== undefined) count++
  if (filters.followingMin !== undefined || filters.followingMax !== undefined) count++
  if (filters.postsCountMin !== undefined || filters.postsCountMax !== undefined) count++
  if (filters.accountTypes && filters.accountTypes.length > 0) count++
  if (filters.lastPostWithinDays) count++
  if (filters.erMin !== undefined || filters.erMax !== undefined) count++
  if (filters.avgFeedLikesMin !== undefined || filters.avgFeedLikesMax !== undefined) count++
  if (filters.avgFeedCommentsMin !== undefined || filters.avgFeedCommentsMax !== undefined) count++
  if (filters.avgReelViewsMin !== undefined || filters.avgReelViewsMax !== undefined) count++
  if (filters.avgReelLikesMin !== undefined || filters.avgReelLikesMax !== undefined) count++
  if (filters.estimatedReachMin !== undefined || filters.estimatedReachMax !== undefined) count++
  if (filters.categories && filters.categories.length > 0) count++
  if (filters.includeKeywords && filters.includeKeywords.filter(Boolean).length > 0) count++
  if (filters.excludeKeywords && filters.excludeKeywords.filter(Boolean).length > 0) count++
  if (filters.languages && filters.languages.length > 0) count++
  if (filters.audienceFemaleMin !== undefined) count++
  if (filters.audienceMaleMin !== undefined) count++
  if (filters.audienceAgeGroups && filters.audienceAgeGroups.length > 0) count++
  if (filters.validFollowersMin !== undefined || filters.validFollowersMax !== undefined) count++
  if (filters.cnecStatus && filters.cnecStatus !== 'ALL') count++
  if (filters.previousProposalStatus && filters.previousProposalStatus !== 'ALL') count++
  if (filters.campaignParticipation) count++
  if (filters.acceptanceRateMin !== undefined) count++
  if (filters.estimatedCprMin !== undefined || filters.estimatedCprMax !== undefined) count++
  if (filters.estimatedAdFeeMin !== undefined || filters.estimatedAdFeeMax !== undefined) count++
  if (filters.groupIds && filters.groupIds.length > 0) count++
  if (filters.hasEmail) count++
  if (filters.hasPhone) count++
  if (filters.hasIgUsername) count++

  return count
}
