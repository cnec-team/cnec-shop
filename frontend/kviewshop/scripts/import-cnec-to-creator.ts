/**
 * CNEC 회원통합 엑셀 -> Creator DB 매칭 임포트
 *
 * '한국_통합 (SNS있음)' 시트의 인스타 핸들로 기존 Creator를 찾아
 * 협업 이력 / 전화번호 / 신뢰도 등을 주입합니다.
 *
 * Usage: npx tsx scripts/import-cnec-to-creator.ts
 */

import 'dotenv/config'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import * as xlsx from 'xlsx'
import path from 'path'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

function extractHandle(url: unknown): string | null {
  if (!url) return null
  const s = String(url).trim().toLowerCase()
  if (!s || s === 'nan' || s === 'null' || s === 'undefined') return null
  const m = s.match(/instagram\.com\/([^/?\s#]+)/)
  let h = m ? m[1] : (s.startsWith('@') ? s.slice(1) : s)
  h = h.split('?')[0].split('/')[0].split('#')[0].trim()
  if (!/^[a-z0-9._]+$/.test(h)) return null
  if (h.length < 1 || h.length > 30) return null
  if (h.startsWith('.') || h.endsWith('.') || h.includes('..')) return null
  return h
}

function parseIntSafe(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0
  const n = Number(String(v).replace(/,/g, '').trim())
  return Number.isFinite(n) ? Math.round(n) : 0
}

function parseYN(v: unknown): boolean {
  return String(v ?? '').trim().toUpperCase() === 'Y'
}

function parseDateSafe(v: unknown): Date | undefined {
  if (!v) return undefined
  if (v instanceof Date) return v
  const s = String(v).trim()
  if (!s || s === 'nan') return undefined
  const d = new Date(s)
  return isNaN(d.getTime()) ? undefined : d
}

function cleanString(v: unknown, maxLen = 100): string | null {
  if (!v) return null
  const s = String(v).trim()
  if (!s || s === 'nan' || s === 'null') return null
  return s.slice(0, maxLen)
}

async function main() {
  const filePath = path.resolve('data/imports/CNEC_회원통합_FINAL_v2.xlsx')
  const wb = xlsx.readFile(filePath)

  const SHEET_NAME = '한국_통합 (SNS있음)'
  if (!wb.SheetNames.includes(SHEET_NAME)) {
    throw new Error(`시트 "${SHEET_NAME}" 없음. 실제 시트: ${wb.SheetNames.join(', ')}`)
  }

  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[SHEET_NAME])
  console.log(`CNEC ${SHEET_NAME}: ${rows.length}명 처리 시작`)

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  let matched = 0
  let notMatchedNoHandle = 0
  let notMatchedNoCreator = 0
  let noNameOrEmail = 0
  let errors = 0
  const notMatchedSamples: string[] = []
  const errorSamples: string[] = []

  for (const r of rows) {
    const name = cleanString(r['이름'])
    const email1 = cleanString(r['이메일1'])
    if (!name && !email1) {
      noNameOrEmail++
      continue
    }

    // 인스타1/2/3 중 매칭 시도
    const handles: string[] = []
    for (const col of ['인스타1', '인스타2', '인스타3']) {
      const h = extractHandle(r[col])
      if (h && !handles.includes(h)) handles.push(h)
    }

    if (handles.length === 0) {
      notMatchedNoHandle++
      continue
    }

    let creator: { id: string } | null = null
    for (const h of handles) {
      creator = await prisma.creator.findFirst({
        where: {
          OR: [
            { instagramHandle: { equals: h, mode: 'insensitive' } },
            { igUsername: { equals: h, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      })
      if (creator) break
    }

    if (!creator) {
      notMatchedNoCreator++
      if (notMatchedSamples.length < 10) {
        notMatchedSamples.push(`${name ?? '이름없음'} (@${handles[0]})`)
      }
      continue
    }

    try {
      const totalTrials = parseIntSafe(r['진행횟수(MAX)'])
      const completedPayments = parseIntSafe(r['입금완료건수'])
      const reliability = totalTrials > 0 ? completedPayments / totalTrials : null

      const updateData: Record<string, unknown> = {
        cnecIsPartner: true,
        cnecRealName: name ? name.slice(0, 50) : null,
        cnecEmail1: email1?.toLowerCase() ?? null,
        cnecEmail2: cleanString(r['이메일2'])?.toLowerCase() ?? null,
        cnecEmail3: cleanString(r['이메일3'])?.toLowerCase() ?? null,
        cnecPhone: cleanString(r['핸드폰번호'], 30),
        cnecPhoneSource: cleanString(r['번호출처'], 30),
        cnecVerificationStatus: cleanString(r['계정상태'], 20) || null,
        cnecSourceOldDb: parseYN(r['구DB']),
        cnecSourceSupabase: parseYN(r['Supabase']),
        cnecSourceLegacy: parseYN(r['이력DB']),
        cnecOldDbMemberNo: parseIntSafe(r['구DB회원번호']) || null,
        cnecOldDbJoinedAt: parseDateSafe(r['구DB가입일']),
        cnecSupabaseCreatedAt: parseDateSafe(r['SB생성일']),
        cnecTotalTrials: totalTrials,
        cnecCompletedRegistrations: parseIntSafe(r['등록완료건수']),
        cnecCompletedPayments: completedPayments,
        cnecApplicationsSb: parseIntSafe(r['지원수(SB)']),
        cnecSelectionsSb: parseIntSafe(r['선정수(SB)']),
        cnecCurrentSelection: parseIntSafe(r['이번선정']),
        cnecReliabilityScore: reliability,
      }

      await prisma.creator.update({
        where: { id: creator.id },
        data: updateData,
      })
      matched++
    } catch (e: unknown) {
      errors++
      if (errorSamples.length < 10) {
        const msg = e instanceof Error ? e.message : String(e)
        errorSamples.push(`${name ?? '?'} (@${handles[0]}): ${msg.slice(0, 150)}`)
      }
    }

    const done = matched + notMatchedNoHandle + notMatchedNoCreator + noNameOrEmail + errors
    if (done % 500 === 0) {
      console.log(`  진행: ${done}/${rows.length}`)
    }
  }

  console.log(`\n=== CNEC 매칭 완료 ===`)
  console.log(`매칭 + 병합 성공: ${matched}명`)
  console.log(`이름/이메일 없음 스킵: ${noNameOrEmail}명`)
  console.log(`매칭 실패 (유효 인스타 핸들 없음): ${notMatchedNoHandle}명`)
  console.log(`매칭 실패 (Creator DB에 없음): ${notMatchedNoCreator}명`)
  console.log(`오류: ${errors}건`)
  if (notMatchedSamples.length > 0) {
    console.log(`\nCreator 미존재 샘플:`)
    notMatchedSamples.forEach(s => console.log(`  ${s}`))
  }
  if (errorSamples.length > 0) {
    console.log(`\n오류 샘플:`)
    errorSamples.forEach(s => console.log(`  ${s}`))
  }

  await prisma.$disconnect()
  await pool.end()
}

main().catch(err => {
  console.error('CNEC 임포트 에러:', err)
  process.exit(1)
})
