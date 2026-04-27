/**
 * 크리에이터 연락처·파트너·이메일 데이터 통합 동기화
 *
 * 1) igBio에서 이메일 추출 → cnecEmail1 + brandContactEmail + hasBrandEmail
 * 2) 협업 이력(cnecCompletedPayments > 0)이 있으면 cnecIsPartner = true
 * 3) cnecPhone이 있으면 hasPhone = true, phoneForAlimtalk 동기화
 * 4) 이메일이 cnecEmail1/2/3에만 있고 brandContactEmail에 없으면 동기화
 *
 * Usage: npx tsx scripts/sync-creator-contact-data.ts
 */

import 'dotenv/config'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const EMAIL_REGEX = /[\w.+-]+@[\w-]+\.[\w.-]+/g

function extractEmailsFromBio(bio: string): string[] {
  const matches = bio.match(EMAIL_REGEX)
  if (!matches) return []
  return [...new Set(matches.map(e => e.toLowerCase()))]
}

interface SyncResult {
  bioEmailExtracted: number
  cnecEmailSynced: number
  brandEmailSynced: number
  partnerMarked: number
  phoneSynced: number
  alimtalkPhoneSynced: number
  total: number
  details: string[]
}

async function main() {
  console.log('=== 크리에이터 연락처 데이터 통합 동기화 시작 ===\n')

  const result: SyncResult = {
    bioEmailExtracted: 0,
    cnecEmailSynced: 0,
    brandEmailSynced: 0,
    partnerMarked: 0,
    phoneSynced: 0,
    alimtalkPhoneSynced: 0,
    total: 0,
    details: [],
  }

  // 모든 크리에이터 가져오기
  const creators = await prisma.creator.findMany({
    select: {
      id: true,
      displayName: true,
      instagramHandle: true,
      igUsername: true,
      igBio: true,
      cnecEmail1: true,
      cnecEmail2: true,
      cnecEmail3: true,
      brandContactEmail: true,
      hasBrandEmail: true,
      cnecPhone: true,
      phoneForAlimtalk: true,
      hasPhone: true,
      cnecVerificationStatus: true,
      cnecIsPartner: true,
      cnecCompletedPayments: true,
      cnecTotalTrials: true,
    },
  })

  result.total = creators.length
  console.log(`[INFO] 전체 크리에이터: ${creators.length}명\n`)

  let updateCount = 0

  for (const c of creators) {
    const updates: Record<string, unknown> = {}
    const name = c.displayName || c.instagramHandle || c.igUsername || c.id.slice(0, 8)

    // ─── 1. igBio에서 이메일 추출 ───
    if (c.igBio) {
      const bioEmails = extractEmailsFromBio(c.igBio)
      if (bioEmails.length > 0) {
        const firstEmail = bioEmails[0]

        // cnecEmail1이 비어있으면 바이오 이메일로 채우기
        if (!c.cnecEmail1) {
          updates.cnecEmail1 = firstEmail
          result.cnecEmailSynced++
        }

        // brandContactEmail이 비어있으면 채우기
        if (!c.brandContactEmail) {
          updates.brandContactEmail = firstEmail
          updates.hasBrandEmail = true
          result.brandEmailSynced++
        }

        // cnecEmail2/3도 바이오에 여러 이메일이 있으면 채우기
        if (bioEmails.length > 1 && !c.cnecEmail2) {
          updates.cnecEmail2 = bioEmails[1]
        }

        result.bioEmailExtracted++
      }
    }

    // ─── 2. cnecEmail이 있는데 brandContactEmail이 없으면 동기화 ───
    if (!c.brandContactEmail && !updates.brandContactEmail) {
      const fallbackEmail = c.cnecEmail1 || c.cnecEmail2 || c.cnecEmail3
      if (fallbackEmail) {
        updates.brandContactEmail = fallbackEmail
        updates.hasBrandEmail = true
        result.brandEmailSynced++
      }
    }

    // ─── 3. 협업 이력 있으면 파트너 마킹 ───
    if (!c.cnecIsPartner && (c.cnecCompletedPayments ?? 0) > 0) {
      updates.cnecIsPartner = true
      result.partnerMarked++
    }

    // ─── 4. cnecPhone이 있으면 hasPhone + phoneForAlimtalk 동기화 ───
    if (c.cnecPhone && c.cnecPhone.trim()) {
      if (!c.hasPhone) {
        updates.hasPhone = true
        result.phoneSynced++
      }
      if (!c.phoneForAlimtalk) {
        updates.phoneForAlimtalk = c.cnecPhone.trim()
        result.alimtalkPhoneSynced++
      }
    }

    // ─── 업데이트 실행 ───
    if (Object.keys(updates).length > 0) {
      await prisma.creator.update({
        where: { id: c.id },
        data: updates,
      })
      updateCount++

      const actions = Object.keys(updates).join(', ')
      result.details.push(`@${name}: ${actions}`)

      if (updateCount % 200 === 0) {
        console.log(`  진행: ${updateCount}명 업데이트...`)
      }
    }
  }

  // ─── 결과 리포트 ───
  console.log('\n=== 동기화 결과 ===')
  console.log(`전체 크리에이터: ${result.total}명`)
  console.log(`업데이트된 크리에이터: ${updateCount}명`)
  console.log('')
  console.log(`[이메일]`)
  console.log(`  바이오에서 이메일 추출: ${result.bioEmailExtracted}명`)
  console.log(`  cnecEmail1 채움: ${result.cnecEmailSynced}명`)
  console.log(`  brandContactEmail 채움: ${result.brandEmailSynced}명`)
  console.log('')
  console.log(`[파트너]`)
  console.log(`  크넥 파트너 마킹: ${result.partnerMarked}명`)
  console.log('')
  console.log(`[전화번호]`)
  console.log(`  hasPhone 활성화: ${result.phoneSynced}명`)
  console.log(`  알림톡 전화번호 동기화: ${result.alimtalkPhoneSynced}명`)

  if (result.details.length <= 50) {
    console.log('\n--- 상세 변경 목록 ---')
    result.details.forEach(d => console.log(`  ${d}`))
  } else {
    console.log(`\n(상세 목록 생략: ${result.details.length}건)`)
    console.log('처음 20건:')
    result.details.slice(0, 20).forEach(d => console.log(`  ${d}`))
  }

  console.log('\n=== 완료 ===')
}

main()
  .catch(err => {
    console.error('오류 발생:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
