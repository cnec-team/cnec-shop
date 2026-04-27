/**
 * 프로필 이미지 URL을 안전하게 반환
 * - R2 URL: 직접 사용 (안정적)
 * - IG CDN (fbcdn): 프록시 경유 (만료 방지)
 * - 기타: 직접 사용
 */
export function getSafeProfileImageUrl(
  r2Url: string | null | undefined,
  igPicUrl: string | null | undefined,
  profileImage?: string | null,
  profileImageUrl?: string | null,
): string | null {
  // R2 URL 우선 (안정적)
  if (r2Url) return r2Url

  // 크넥샵 업로드 이미지
  if (profileImageUrl) return profileImageUrl
  if (profileImage) return profileImage

  // IG CDN URL → 프록시 경유
  if (igPicUrl) {
    if (igPicUrl.includes('fbcdn.net') || igPicUrl.includes('cdninstagram.com')) {
      return `/api/proxy/image?url=${encodeURIComponent(igPicUrl)}`
    }
    return igPicUrl
  }

  return null
}
