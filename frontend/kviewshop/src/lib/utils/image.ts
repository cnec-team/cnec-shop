/**
 * 크리에이터 프로필 이미지 URL 결정.
 * R2 URL이 있으면 직접 사용, 없으면 Instagram CDN URL을 프록시 경유.
 */
export function getCreatorProfileImage(creator: {
  igProfileImageR2Url?: string | null
  igProfilePicUrl?: string | null
  profileImageUrl?: string | null
  profileImage?: string | null
}): string | undefined {
  // R2 URL은 자체 호스팅이므로 직접 사용
  if (creator.igProfileImageR2Url) return creator.igProfileImageR2Url

  // Instagram CDN URL은 프록시 경유 (브라우저 호환성 보장)
  const cdnUrl = creator.igProfilePicUrl
  if (cdnUrl) return `/api/proxy/image?url=${encodeURIComponent(cdnUrl)}`

  // 기타 프로필 이미지
  if (creator.profileImageUrl) return creator.profileImageUrl
  if (creator.profileImage) return creator.profileImage

  return undefined
}
