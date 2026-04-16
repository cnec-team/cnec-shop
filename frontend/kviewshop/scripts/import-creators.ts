/**
 * 크리에이터 임포트 스크립트 — Featuring + Apify 통합
 *
 * Featuring 엑셀(featuring_KR_final.xlsx)을 읽어
 * 개인 크리에이터만 User + Creator로 등록/갱신합니다.
 *
 * Usage: npx tsx scripts/import-creators.ts
 *
 * 파일 위치:
 *   ~/Desktop/cnec-shop/data/featuring_KR_final.xlsx
 *   (없으면 ~/Downloads 에서 자동 복사)
 */

import 'dotenv/config'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import * as XLSX from 'xlsx'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

// ── 경로 / 파일 ─────────────────────────────────────────────────

const HOME = os.homedir()
const DATA_DIR = path.join(HOME, 'Desktop/cnec-shop/data')
const DL_DIR = path.join(HOME, 'Downloads')
const XLSX_NAME = 'featuring_KR_final.xlsx'

function ensureDataFile(): string {
  const target = path.join(DATA_DIR, XLSX_NAME)
  if (fs.existsSync(target)) return target

  fs.mkdirSync(DATA_DIR, { recursive: true })
  const src = path.join(DL_DIR, XLSX_NAME)
  if (!fs.existsSync(src)) {
    throw new Error(`엑셀 파일을 찾을 수 없습니다: ${target} 또는 ${src}`)
  }
  fs.copyFileSync(src, target)
  console.log(`[INFO] ${src} → ${target} 복사 완료`)
  return target
}

// ── 타입 / 유틸 ─────────────────────────────────────────────────

type Cell = string | number | boolean | null | undefined

function asStr(v: Cell): string | null {
  if (v === undefined || v === null) return null
  const s = String(v).trim()
  return s.length === 0 ? null : s
}

function asInt(v: Cell): number | null {
  if (v === undefined || v === null || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v) : null
  const n = Number(String(v).replace(/[,\s]/g, ''))
  return Number.isFinite(n) ? Math.round(n) : null
}

function asFloat(v: Cell): number | null {
  if (v === undefined || v === null || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const n = Number(String(v).replace(/[,\s%]/g, ''))
  return Number.isFinite(n) ? n : null
}

function calcTier(followers: number | null): string {
  if (followers === null) return 'UNDER_1K'
  if (followers >= 1_000_000) return 'MEGA'
  if (followers >= 100_000) return 'MACRO'
  if (followers >= 10_000) return 'MICRO'
  if (followers >= 1_000) return 'NANO'
  return 'UNDER_1K'
}

// ── 엑셀 파싱 ──────────────────────────────────────────────────

interface ParsedRow {
  igUsername: string
  igFullName: string | null
  accountType: string | null
  igCategory: string | null
  igLastUploadDate: string | null
  igLanguage: string | null
  igAudienceGender: string | null
  igAudienceAge: string | null
  igFollowers: number | null
  igFollowersEffective: number | null
  igEngagementRate: number | null
  igAvgReach: number | null
  igAvgLikes: number | null
  igAvgVideoViews: number | null
  igAvgVideoLikes: number | null
  igAvgComments: number | null
  igEstimatedCPR: number | null
  igEstimatedAdCost: number | null
  igEmail: string | null
  igProfilePicUrl: string | null
}

function parseXlsx(xlsxPath: string): ParsedRow[] {
  const wb = XLSX.readFile(xlsxPath)
  // 첫 시트가 "전체 (한국어)"
  const sheetName = wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, raw: true, defval: null })

  // 헤더: 4번째 행 (0-indexed row 3)
  const header = (rows[3] ?? []) as Cell[]

  // 이메일/프로필이미지 컬럼을 동적으로 탐색 (마지막 2열)
  let emailIdx = -1
  let picIdx = -1
  for (let c = 0; c < header.length; c++) {
    const h = asStr(header[c]) ?? ''
    if (h.includes('이메일') && h.toLowerCase().includes('apify')) emailIdx = c
    if (h.includes('프로필이미지') && h.toLowerCase().includes('apify')) picIdx = c
  }
  if (emailIdx < 0 || picIdx < 0) {
    throw new Error(`이메일/프로필이미지 컬럼을 찾을 수 없습니다. (email=${emailIdx}, pic=${picIdx})`)
  }

  const parsed: ParsedRow[] = []
  for (let i = 4; i < rows.length; i++) {
    const r = rows[i]
    if (!r || r.length === 0) continue
    const username = asStr(r[0])
    if (!username) continue

    parsed.push({
      igUsername: username,
      igFullName: asStr(r[1]),
      accountType: asStr(r[2]),
      igCategory: asStr(r[4]),
      igLastUploadDate: asStr(r[5]),
      igLanguage: asStr(r[9]),
      igAudienceGender: asStr(r[15]),
      igAudienceAge: asStr(r[16]),
      igFollowers: asInt(r[19]),
      igFollowersEffective: asInt(r[20]),
      igEngagementRate: asFloat(r[21]),
      igAvgReach: asInt(r[22]),
      igAvgLikes: asInt(r[23]),
      igAvgVideoViews: asInt(r[24]),
      igAvgVideoLikes: asInt(r[25]),
      igAvgComments: asInt(r[26]),
      igEstimatedCPR: asInt(r[27]),
      igEstimatedAdCost: asInt(r[28]),
      igEmail: asStr(r[emailIdx]),
      igProfilePicUrl: asStr(r[picIdx]),
    })
  }

  return parsed
}

// ── 임포트 로직 ─────────────────────────────────────────────────

const DATA_SOURCE = 'featuring_apify_2026-04-16'
const BATCH = 50
const CONCURRENCY = 10

// displayName VARCHAR(50), username 특수문자 보존용 안전 트렁케이트
function truncate(s: string | null, max: number): string | null {
  if (s === null) return null
  // Array.from으로 코드포인트 기준 자르기 (Surrogate pair 보존)
  const arr = Array.from(s)
  return arr.length <= max ? s : arr.slice(0, max).join('')
}

interface Stats {
  total: number
  individual: number
  skipped: number
  created: number
  updated: number
  withEmail: number
  withPic: number
  failed: number
  tier: Record<string, number>
}

async function processRow(
  row: ParsedRow,
  existingMap: Map<string, string>,
  prisma: PrismaClient,
  stats: Stats
): Promise<void> {
  try {
    const tier = calcTier(row.igFollowers)
    stats.tier[tier] = (stats.tier[tier] ?? 0) + 1
    if (row.igEmail) stats.withEmail++
    if (row.igProfilePicUrl) stats.withPic++

    const displayName = truncate(row.igFullName ?? row.igUsername, 50)
    const name100 = truncate(row.igFullName ?? row.igUsername, 100) ?? row.igUsername

    const igData = {
      igUsername: row.igUsername,
      igFullName: row.igFullName,
      igFollowers: row.igFollowers,
      igFollowersEffective: row.igFollowersEffective,
      igEngagementRate: row.igEngagementRate,
      igCategory: row.igCategory,
      igLanguage: row.igLanguage,
      igAvgReach: row.igAvgReach,
      igAvgLikes: row.igAvgLikes,
      igAvgVideoViews: row.igAvgVideoViews,
      igAvgVideoLikes: row.igAvgVideoLikes,
      igAvgComments: row.igAvgComments,
      igAudienceGender: row.igAudienceGender,
      igAudienceAge: row.igAudienceAge,
      igEstimatedCPR: row.igEstimatedCPR,
      igEstimatedAdCost: row.igEstimatedAdCost,
      igProfilePicUrl: row.igProfilePicUrl,
      igEmail: row.igEmail,
      igTier: tier,
      igLastUploadDate: row.igLastUploadDate,
      igDataImportedAt: new Date(),
      igDataSource: DATA_SOURCE,
    }

    const existingId = existingMap.get(row.igUsername)
    if (existingId) {
      await prisma.creator.update({ where: { id: existingId }, data: igData })
      stats.updated++
      return
    }

    // 신규 User 생성 (이메일 충돌 시 placeholder 변형으로 재시도)
    let email = row.igEmail ?? `${row.igUsername}@ig.placeholder`
    let user
    try {
      user = await prisma.user.create({
        data: {
          email,
          name: name100,
          role: 'creator',
          status: 'active',
        },
      })
    } catch (e) {
      const err = e as { code?: string }
      if (err?.code !== 'P2002') throw e
      email = `${row.igUsername}.${randomUUID().slice(0, 4)}@ig.placeholder`
      user = await prisma.user.create({
        data: {
          email,
          name: name100,
          role: 'creator',
          status: 'active',
        },
      })
    }

    // Creator 생성 (username 충돌 시 suffix로 재시도)
    let username = row.igUsername
    try {
      await prisma.creator.create({
        data: {
          userId: user.id,
          username,
          displayName,
          instagramHandle: row.igUsername,
          instagram: `https://instagram.com/${row.igUsername}`,
          ...igData,
        },
      })
    } catch (e) {
      const err = e as { code?: string }
      if (err?.code !== 'P2002') throw e
      username = `${row.igUsername}_${randomUUID().slice(0, 4)}`
      await prisma.creator.create({
        data: {
          userId: user.id,
          username,
          displayName,
          instagramHandle: row.igUsername,
          instagram: `https://instagram.com/${row.igUsername}`,
          ...igData,
        },
      })
    }

    stats.created++
  } catch (err) {
    stats.failed++
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[FAIL] @${row.igUsername}: ${msg}`)
  }
}

async function main() {
  const xlsxPath = ensureDataFile()
  console.log(`[INFO] 엑셀 로드: ${xlsxPath}`)

  const rows = parseXlsx(xlsxPath)
  const individuals = rows.filter(r => r.accountType === '개인')
  const skipped = rows.length - individuals.length

  console.log(`[INFO] 전체: ${rows.length}명 · 개인: ${individuals.length}명 · 스킵(공식/기업): ${skipped}명`)

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  const stats: Stats = {
    total: rows.length,
    individual: individuals.length,
    skipped,
    created: 0,
    updated: 0,
    withEmail: 0,
    withPic: 0,
    failed: 0,
    tier: { UNDER_1K: 0, NANO: 0, MICRO: 0, MACRO: 0, MEGA: 0 },
  }

  // 배치 단위로 기존 Creator를 선조회 → per-row 처리는 tx 없이 직접 실행
  for (let i = 0; i < individuals.length; i += BATCH) {
    const chunk = individuals.slice(i, i + BATCH)
    const usernames = chunk.map(r => r.igUsername)

    // 기존 레코드 일괄 조회 (igUsername 또는 instagramHandle 매칭)
    const existingList = await prisma.creator.findMany({
      where: {
        OR: [
          { igUsername: { in: usernames } },
          { instagramHandle: { in: usernames } },
        ],
      },
      select: { id: true, igUsername: true, instagramHandle: true },
    })
    const existingMap = new Map<string, string>()
    for (const e of existingList) {
      if (e.igUsername) existingMap.set(e.igUsername, e.id)
      if (e.instagramHandle && !existingMap.has(e.instagramHandle)) {
        existingMap.set(e.instagramHandle, e.id)
      }
    }

    // 병렬 처리 (CONCURRENCY 단위)
    for (let j = 0; j < chunk.length; j += CONCURRENCY) {
      const slice = chunk.slice(j, j + CONCURRENCY)
      await Promise.all(slice.map(row => processRow(row, existingMap, prisma, stats)))
    }

    const done = Math.min(i + BATCH, individuals.length)
    console.log(`${done}/${individuals.length} imported...`)
  }

  console.log('\n=== 임포트 완료 ===')
  console.log(`피처링 전체:       ${stats.total}`)
  console.log(`개인 크리에이터:   ${stats.individual}`)
  console.log(`공식/기업 스킵:    ${stats.skipped}`)
  console.log(`신규 생성:         ${stats.created}`)
  console.log(`업데이트:          ${stats.updated}`)
  console.log(`이메일 있는:       ${stats.withEmail}`)
  console.log(`프로필이미지 있는: ${stats.withPic}`)
  console.log(`실패:              ${stats.failed}`)
  console.log('\n티어별 분포:')
  console.log(`  Under1K: ${stats.tier.UNDER_1K ?? 0}`)
  console.log(`  Nano:    ${stats.tier.NANO ?? 0}`)
  console.log(`  Micro:   ${stats.tier.MICRO ?? 0}`)
  console.log(`  Macro:   ${stats.tier.MACRO ?? 0}`)
  console.log(`  Mega:    ${stats.tier.MEGA ?? 0}`)

  await prisma.$disconnect()
  await pool.end()
}

main().catch(err => {
  console.error('임포트 스크립트 에러:', err)
  process.exit(1)
})
