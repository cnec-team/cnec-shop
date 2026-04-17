import type { ApifyProfileData } from './client'

export function extractEmailFromBio(bio: string): string | null {
  const match = bio.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)
  return match ? match[0].toLowerCase() : null
}

export function calculateER(avgLikes: number, avgComments: number, followers: number): number {
  if (followers === 0) return 0
  return ((avgLikes + avgComments) / followers) * 100
}

export function estimateValidFollowers(followers: number, er: number): number {
  const ratio = er > 3 ? 0.9 : er > 1 ? 0.7 : 0.5
  return Math.round(followers * ratio)
}

export function estimateReach(followers: number, er: number): number {
  const reachRate = er > 5 ? 0.35 : er > 3 ? 0.25 : er > 1 ? 0.15 : 0.08
  return Math.round(followers * reachRate)
}

export function detectPrimaryLanguage(bio: string, captions: string[]): 'ko' | 'en' | 'ja' {
  const text = bio + ' ' + captions.join(' ')
  const hangul = (text.match(/[가-힣]/g) || []).length
  const hiragana = (text.match(/[ぁ-んァ-ン]/g) || []).length
  const total = text.length || 1
  if (hangul / total > 0.3) return 'ko'
  if (hiragana / total > 0.1) return 'ja'
  return 'en'
}

function determineTier(followers: number): string {
  if (followers >= 1_000_000) return 'MEGA'
  if (followers >= 100_000) return 'MACRO'
  if (followers >= 10_000) return 'MICRO'
  return 'NANO'
}

export function estimateCPR(followers: number, er: number, tier: string): number {
  const baseCpr = tier === 'MEGA' ? 15000 : tier === 'MACRO' ? 8000 : tier === 'MICRO' ? 3000 : 1500
  const erBonus = er > 5 ? 0.7 : er > 3 ? 0.85 : 1.0
  return Math.round(baseCpr * erBonus)
}

export function estimateAdFee(followers: number, tier: string): number {
  if (tier === 'MEGA') return Math.round(followers * 0.01)
  if (tier === 'MACRO') return Math.round(followers * 0.02)
  if (tier === 'MICRO') return Math.round(followers * 0.03)
  return Math.round(followers * 0.05)
}

export function appendHistoricalStat(
  existing: Array<{ date: string; followers: number; er: number }>,
  newStat: { date: string; followers: number; er: number },
): Array<{ date: string; followers: number; er: number }> {
  return [...existing, newStat].slice(-24)
}

export function apifyToCreatorFields(raw: ApifyProfileData) {
  const posts = raw.latestPosts ?? []
  const avgLikes = posts.length > 0
    ? posts.reduce((sum, p) => sum + (p.likesCount ?? 0), 0) / posts.length
    : 0
  const avgComments = posts.length > 0
    ? posts.reduce((sum, p) => sum + (p.commentsCount ?? 0), 0) / posts.length
    : 0
  const er = calculateER(avgLikes, avgComments, raw.followersCount)
  const tier = determineTier(raw.followersCount)
  const captions = posts.map(p => p.caption ?? '').filter(Boolean)
  const bioEmail = extractEmailFromBio(raw.biography ?? '')
  const thumbnails = posts.slice(0, 6).map(p => p.displayUrl).filter(Boolean)

  return {
    displayName: raw.fullName || raw.username,
    igBio: raw.biography || null,
    igFollowers: raw.followersCount,
    igFollowing: raw.followsCount,
    igPostsCount: raw.postsCount,
    igVerified: raw.isVerified,
    igProfilePicUrl: raw.profilePicUrlHD || raw.profilePicUrl || null,
    igExternalUrl: raw.externalUrl || null,
    igEngagementRate: parseFloat(er.toFixed(2)),
    igTier: tier,
    igCategory: null, // Apify doesn't provide category
    igRecentPostThumbnails: thumbnails,
    igAvgLikes: Math.round(avgLikes),
    igAvgComments: Math.round(avgComments),
    igEstimatedReach: estimateReach(raw.followersCount, er),
    igEstimatedValidFollowers: estimateValidFollowers(raw.followersCount, er),
    igEstimatedCPRDecimal: estimateCPR(raw.followersCount, er, tier),
    igEstimatedAdFee: estimateAdFee(raw.followersCount, tier),
    igPrimaryLanguage: detectPrimaryLanguage(raw.biography ?? '', captions),
    // Email backfill
    ...(bioEmail ? { hasBrandEmail: true, brandContactEmail: bioEmail } : {}),
    // Sync metadata
    igLastSyncedAt: new Date(),
    igSyncStatus: 'SUCCESS' as const,
  }
}
