import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { uploadFile, getPublicUrl } from '@/lib/storage'
import Papa from 'papaparse'

export const maxDuration = 300

interface ImportResult {
  total: number
  success: number
  failed: number
  skipped: number
  errors: { username: string; error: string }[]
}

function calcTier(followers: number): string {
  if (followers >= 1_000_000) return 'MEGA'
  if (followers >= 100_000) return 'MACRO'
  if (followers >= 10_000) return 'MICRO'
  if (followers >= 1_000) return 'NANO'
  return 'UNDER_1K'
}

/**
 * Loads the CSV text. Supports two modes:
 * 1) JSON body { r2Key } — CSV was uploaded directly to R2 (avoids Vercel 4.5MB limit)
 * 2) FormData with `file` field — legacy small-file path (<4.5MB)
 */
async function loadCsvText(request: NextRequest): Promise<{ text: string } | { error: string; status: number }> {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}))
    const r2Key: string | undefined = body.r2Key
    if (!r2Key) return { error: 'r2Key가 필요합니다', status: 400 }

    const url = getPublicUrl(r2Key)
    const res = await fetch(url)
    if (!res.ok) {
      return { error: `R2에서 CSV 다운로드 실패 (${res.status})`, status: 500 }
    }
    const text = await res.text()
    return { text }
  }

  // Legacy FormData path
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return { error: 'CSV 파일을 선택해주세요', status: 400 }
  if (!file.name.endsWith('.csv')) return { error: 'CSV 파일만 업로드 가능합니다', status: 400 }
  const text = await file.text()
  return { text }
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const loaded = await loadCsvText(request)
    if ('error' in loaded) {
      return NextResponse.json({ error: loaded.error }, { status: loaded.status })
    }

    const { data, errors } = Papa.parse<Record<string, string>>(loaded.text, {
      header: true,
      skipEmptyLines: true,
    })

    if (errors.length > 0 && data.length === 0) {
      return NextResponse.json({ error: 'CSV 파싱 오류', details: errors.slice(0, 5) }, { status: 400 })
    }

    const results: ImportResult = { total: data.length, success: 0, failed: 0, skipped: 0, errors: [] }

    for (const row of data) {
      const username = row['username']?.trim()
      if (!username) {
        results.skipped++
        continue
      }

      try {
        const followersCount = parseInt(row['followersCount']) || 0
        const followsCount = parseInt(row['followsCount']) || 0
        const postsCount = parseInt(row['postsCount']) || 0

        // 참여율 계산
        let totalEngagement = 0
        let engagementPostCount = 0
        for (let i = 0; i <= 11; i++) {
          const likes = parseInt(row[`latestPosts/${i}/likesCount`]) || 0
          const comments = parseInt(row[`latestPosts/${i}/commentsCount`]) || 0
          if (likes > 0 || comments > 0) {
            totalEngagement += likes + comments
            engagementPostCount++
          }
        }
        const engagementRate =
          followersCount > 0 && engagementPostCount > 0
            ? (totalEngagement / engagementPostCount / followersCount) * 100
            : 0

        const tier = calcTier(followersCount)

        // R2 프로필사진 업로드
        let profileImageR2Url: string | undefined
        const profilePicUrl = row['profilePicUrlHD'] || row['profilePicUrl']
        if (profilePicUrl) {
          try {
            const imgRes = await fetch(profilePicUrl, { signal: AbortSignal.timeout(10000) })
            if (imgRes.ok) {
              const buffer = Buffer.from(await imgRes.arrayBuffer())
              profileImageR2Url = await uploadFile(`creators/${username}/profile.jpg`, buffer, 'image/jpeg')
            }
          } catch {
            // 프로필사진 실패해도 계속
          }
        }

        // 게시물 썸네일 R2 업로드 (최대 6개)
        const thumbnails: string[] = []
        for (let i = 0; i <= 5; i++) {
          const displayUrl = row[`latestPosts/${i}/displayUrl`]
          if (displayUrl) {
            try {
              const imgRes = await fetch(displayUrl, { signal: AbortSignal.timeout(10000) })
              if (imgRes.ok) {
                const buf = Buffer.from(await imgRes.arrayBuffer())
                const url = await uploadFile(`creators/${username}/post${i}.jpg`, buf, 'image/jpeg')
                thumbnails.push(url)
              }
            } catch {
              // 개별 썸네일 실패해도 계속
            }
          }
        }

        // Creator 찾기 또는 생성
        let creator = await prisma.creator.findFirst({
          where: { instagramHandle: username },
        })

        if (!creator) {
          const user = await prisma.user.create({
            data: {
              email: `${username}@instagram.placeholder`,
              name: row['fullName'] || username,
              role: 'creator',
              status: 'active',
            },
          })
          creator = await prisma.creator.create({
            data: {
              userId: user.id,
              instagramHandle: username,
              displayName: row['fullName'] || username,
              status: 'ACTIVE',
            },
          })
        }

        await prisma.creator.update({
          where: { id: creator.id },
          data: {
            igFollowers: followersCount || null,
            igFollowing: followsCount || null,
            igPostsCount: postsCount || null,
            igBio: row['biography'] || null,
            igCategory: row['businessCategoryName'] || null,
            igVerified: row['verified'] === 'true' || row['isVerified'] === 'true',
            igExternalUrl: row['externalUrl'] || null,
            igIsBusinessAccount: row['isBusinessAccount'] === 'true',
            igEngagementRate: engagementRate > 0 ? Number(engagementRate.toFixed(2)) : null,
            igTier: tier,
            ...(profileImageR2Url ? { igProfileImageR2Url: profileImageR2Url } : {}),
            ...(thumbnails.length > 0 ? { igRecentPostThumbnails: thumbnails } : {}),
            igDataImportedAt: new Date(),
            ...(!creator.displayName && row['fullName'] ? { displayName: row['fullName'] } : {}),
          },
        })

        results.success++
      } catch (err) {
        results.failed++
        results.errors.push({
          username,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return NextResponse.json(results)
  } catch (err) {
    console.error('[import/instagram] fatal error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '임포트 실패' },
      { status: 500 }
    )
  }
}
