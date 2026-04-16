/**
 * Instagram 데이터 임포트 스크립트
 * Apify에서 수집한 CSV 데이터를 파싱하여 Creator DB에 upsert하고
 * 프로필/게시물 이미지를 R2에 업로드합니다.
 *
 * Usage: npx tsx scripts/import-instagram-data.ts --csv ./data/apify-profiles.csv
 */

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { parse } from 'papaparse'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// ── Types ──────────────────────────────────────────────────────

interface ApifyRow {
  username: string
  fullName: string
  followersCount: string
  followsCount: string
  postsCount: string
  biography: string
  externalUrl: string
  isVerified: string
  isBusinessAccount: string
  businessCategoryName: string
  profilePicUrlHD: string
  profilePicUrl: string
  [key: string]: string
}

interface PostData {
  likesCount: number
  commentsCount: number
  displayUrl: string
}

// ── CLI Args ───────────────────────────────────────────────────

function getCsvPath(): string {
  const idx = process.argv.indexOf('--csv')
  if (idx === -1 || !process.argv[idx + 1]) {
    console.error('Usage: npx tsx scripts/import-instagram-data.ts --csv ./data/apify-profiles.csv')
    process.exit(1)
  }
  return path.resolve(process.argv[idx + 1])
}

// ── R2 Client ──────────────────────────────────────────────────

function createR2Client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.warn('[WARN] R2 환경변수 미설정 — 이미지 업로드 스킵')
    return null
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
}

function getR2Bucket(): string {
  return process.env.R2_BUCKET_NAME ?? ''
}

function getR2PublicUrl(): string {
  return process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ''
}

async function uploadToR2(
  r2: S3Client,
  key: string,
  imageUrl: string
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return null

    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get('content-type') ?? 'image/jpeg'

    await r2.send(
      new PutObjectCommand({
        Bucket: getR2Bucket(),
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    )

    return `${getR2PublicUrl()}/${key}`
  } catch {
    return null
  }
}

// ── Helpers ────────────────────────────────────────────────────

function parseBool(val: string): boolean {
  return val === 'true' || val === 'True' || val === '1'
}

function parseLatestPosts(row: ApifyRow): PostData[] {
  const posts: PostData[] = []
  for (let i = 0; i <= 11; i++) {
    const likes = row[`latestPosts/${i}/likesCount`]
    const comments = row[`latestPosts/${i}/commentsCount`]
    const displayUrl = row[`latestPosts/${i}/displayUrl`]
    if (likes !== undefined && likes !== '') {
      posts.push({
        likesCount: parseInt(likes, 10) || 0,
        commentsCount: parseInt(comments, 10) || 0,
        displayUrl: displayUrl ?? '',
      })
    }
  }
  return posts
}

function calcEngagementRate(posts: PostData[], followers: number): number {
  if (followers === 0 || posts.length === 0) return 0
  const totalEngagement = posts.reduce(
    (sum, p) => sum + p.likesCount + p.commentsCount,
    0
  )
  return (totalEngagement / followers) * 100
}

function calcTier(followers: number): string {
  if (followers >= 1_000_000) return 'MEGA'
  if (followers >= 100_000) return 'MACRO'
  if (followers >= 10_000) return 'MICRO'
  if (followers >= 1_000) return 'NANO'
  return 'UNDER_1K'
}

function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return String(count)
}

// ── Main ───────────────────────────────────────────────────────

async function main() {
  const csvPath = getCsvPath()

  if (!fs.existsSync(csvPath)) {
    console.error(`파일을 찾을 수 없습니다: ${csvPath}`)
    process.exit(1)
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const { data: rows, errors } = parse<ApifyRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  })

  if (errors.length > 0) {
    console.warn(`[WARN] CSV 파싱 경고 ${errors.length}건`)
  }

  console.log(`CSV 로드 완료: ${rows.length}명`)

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })
  const r2 = createR2Client()

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const username = row.username?.trim()

    if (!username) {
      failCount++
      continue
    }

    try {
      const followers = parseInt(row.followersCount, 10) || 0
      const following = parseInt(row.followsCount, 10) || 0
      const postsCount = parseInt(row.postsCount, 10) || 0
      const posts = parseLatestPosts(row)
      const engagementRate = calcEngagementRate(posts, followers)
      const tier = calcTier(followers)

      // Find or create creator
      let creator = await prisma.creator.findFirst({
        where: { instagramHandle: username },
      })

      if (!creator) {
        const placeholderEmail = `${username}@instagram.placeholder`

        const user = await prisma.user.create({
          data: {
            email: placeholderEmail,
            name: row.fullName || username,
            role: 'creator',
          },
        })

        creator = await prisma.creator.create({
          data: {
            userId: user.id,
            instagramHandle: username,
            displayName: row.fullName || username,
          },
        })
      }

      // Profile image to R2
      let profileR2Url: string | null = null
      if (r2) {
        const profilePicUrl = row.profilePicUrlHD || row.profilePicUrl
        if (profilePicUrl) {
          profileR2Url = await uploadToR2(
            r2,
            `creators/${creator.id}/profile.jpg`,
            profilePicUrl
          )
        }
      }

      // Post thumbnails to R2 (first 6)
      const thumbnailUrls: string[] = []
      if (r2) {
        const thumbPosts = posts.slice(0, 6)
        for (let n = 0; n < thumbPosts.length; n++) {
          const post = thumbPosts[n]
          if (!post.displayUrl) continue
          const url = await uploadToR2(
            r2,
            `creators/${creator.id}/post${n}.jpg`,
            post.displayUrl
          )
          if (url) {
            thumbnailUrls.push(url)
          }
        }
      }

      // Upsert creator with IG data
      await prisma.creator.update({
        where: { id: creator.id },
        data: {
          igFollowers: followers,
          igFollowing: following,
          igPostsCount: postsCount,
          igBio: row.biography || null,
          igCategory: row.businessCategoryName || null,
          igVerified: parseBool(row.isVerified),
          igExternalUrl: row.externalUrl || null,
          igIsBusinessAccount: parseBool(row.isBusinessAccount),
          igEngagementRate: Number(engagementRate.toFixed(2)),
          igDataImportedAt: new Date(),
          igProfileImageR2Url: profileR2Url,
          igTier: tier,
          igRecentPostThumbnails: thumbnailUrls.length > 0 ? thumbnailUrls : undefined,
        },
      })

      successCount++
      console.log(
        `[${i + 1}/${rows.length}] @${username} - ${formatFollowers(followers)} followers - ER ${engagementRate.toFixed(1)}%`
      )
    } catch (err) {
      failCount++
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[${i + 1}/${rows.length}] @${username} 실패: ${message}`)
    }
  }

  console.log(
    `\n임포트 완료: ${rows.length}명 중 ${successCount} 성공, ${failCount} 실패`
  )

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('임포트 스크립트 에러:', err)
  process.exit(1)
})
