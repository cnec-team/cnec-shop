/**
 * 크리에이터 프로필 이미지 R2 업로드 스크립트
 *
 * ig_profile_pic_url(Meta CDN) → Cloudflare R2로 복사 후
 * ig_profile_image_r2_url에 R2 URL 저장.
 *
 * 필수 환경변수:
 *   DATABASE_URL, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
 *   R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, NEXT_PUBLIC_R2_PUBLIC_URL
 *
 * Usage: npx tsx scripts/upload-profile-images-r2.ts
 */

import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// ── 환경변수 검증 ───────────────────────────────────────────────

const REQUIRED_VARS = [
  'DATABASE_URL',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'NEXT_PUBLIC_R2_PUBLIC_URL',
] as const

function checkEnv(): void {
  const missing = REQUIRED_VARS.filter(v => !process.env[v])
  if (missing.length > 0) {
    console.error(`[ERROR] 필수 환경변수 누락: ${missing.join(', ')}`)
    console.error('Cloudflare 대시보드에서 확인 후 .env.local에 입력하세요.')
    process.exit(1)
  }
}

// ── R2 클라이언트 ────────────────────────────────────────────────

function createR2(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

const BUCKET = () => process.env.R2_BUCKET_NAME!
const PUBLIC_URL = () => process.env.NEXT_PUBLIC_R2_PUBLIC_URL!

// ── 이미지 다운로드 + 업로드 ─────────────────────────────────────

const FETCH_TIMEOUT = 10_000
const CONCURRENCY = 10
const REPORT_EVERY = 100

interface UploadResult {
  username: string
  status: 'ok' | 'fetch_fail' | 'upload_fail'
  r2Url?: string
}

async function downloadAndUpload(
  r2: S3Client,
  igUsername: string,
  srcUrl: string,
): Promise<UploadResult> {
  // 1) fetch from Meta CDN
  let res: Response
  try {
    res = await fetch(srcUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT) })
  } catch {
    return { username: igUsername, status: 'fetch_fail' }
  }
  if (!res.ok) {
    return { username: igUsername, status: 'fetch_fail' }
  }

  // 2) upload to R2
  try {
    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    const key = `creators/${igUsername}/profile.jpg`

    await r2.send(new PutObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }))

    const r2Url = `${PUBLIC_URL()}/${key}`
    return { username: igUsername, status: 'ok', r2Url }
  } catch {
    return { username: igUsername, status: 'upload_fail' }
  }
}

// ── 메인 ─────────────────────────────────────────────────────────

async function main() {
  checkEnv()

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })
  const r2 = createR2()

  // ig_profile_pic_url 있고 ig_profile_image_r2_url 없는 크리에이터
  const creators = await prisma.creator.findMany({
    where: {
      igProfilePicUrl: { not: null },
      igProfileImageR2Url: null,
    },
    select: {
      id: true,
      igUsername: true,
      igProfilePicUrl: true,
    },
  })

  console.log(`[INFO] 업로드 대상: ${creators.length}명`)

  let ok = 0
  let fetchFail = 0
  let uploadFail = 0

  for (let i = 0; i < creators.length; i += CONCURRENCY) {
    const chunk = creators.slice(i, i + CONCURRENCY)

    const results = await Promise.allSettled(
      chunk.map(c =>
        downloadAndUpload(r2, c.igUsername!, c.igProfilePicUrl!)
      )
    )

    // DB 업데이트 (성공한 것만)
    for (let j = 0; j < results.length; j++) {
      const r = results[j]
      if (r.status === 'rejected') {
        uploadFail++
        continue
      }
      const val = r.value
      if (val.status === 'ok' && val.r2Url) {
        try {
          await prisma.creator.update({
            where: { id: chunk[j].id },
            data: { igProfileImageR2Url: val.r2Url },
          })
          ok++
        } catch {
          uploadFail++
        }
      } else if (val.status === 'fetch_fail') {
        fetchFail++
      } else {
        uploadFail++
      }
    }

    const done = Math.min(i + CONCURRENCY, creators.length)
    if (done % REPORT_EVERY < CONCURRENCY || done === creators.length) {
      console.log(`${done}/${creators.length} processed... (ok=${ok} fetchFail=${fetchFail} uploadFail=${uploadFail})`)
    }
  }

  console.log('\n=== 업로드 완료 ===')
  console.log(`대상:      ${creators.length}`)
  console.log(`성공:      ${ok}`)
  console.log(`fetch실패: ${fetchFail} (Meta CDN 만료/403)`)
  console.log(`upload실패: ${uploadFail}`)

  await prisma.$disconnect()
  await pool.end()
}

main().catch(err => {
  console.error('스크립트 에러:', err)
  process.exit(1)
})
