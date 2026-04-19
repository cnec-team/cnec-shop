export interface CreatorWithIg {
  id: string
  userId: string
  instagramHandle: string | null
  displayName: string | null
  igFollowers: number | null
  igFollowing: number | null
  igPostsCount: number | null
  igBio: string | null
  igCategory: string | null
  igVerified: boolean
  igExternalUrl: string | null
  igIsBusinessAccount: boolean
  igEngagementRate: number | null
  igDataImportedAt: string | null
  igProfileImageR2Url: string | null
  igProfilePicUrl: string | null
  igTier: string | null
  igRecentPostThumbnails: unknown
  profileImageUrl: string | null
  profileImage: string | null
  cnecIsPartner: boolean
  cnecReliabilityScore: number | null
  cnecTotalTrials: number
  cnecCompletedPayments: number
  hasPhone: boolean
  phoneForAlimtalk: string | null
}
