/**
 * Apify Instagram Profile Scraper 결과 임포트
 *
 * data/imports/apify_batch1.json + apify_batch2.json을 읽어
 * 기존 Creator 보강 / 신규 User+Creator 생성.
 *
 * Usage: npx tsx scripts/import-apify-profiles.ts
 */

import 'dotenv/config'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

// Apify Instagram Profile Scraper 기본 응답
type ApifyProfile = {
  username?: string | null
  fullName?: string | null
  biography?: string | null
  followersCount?: number | null
  followsCount?: number | null
  postsCount?: number | null
  highlightReelCount?: number | null
  igtvVideoCount?: number | null
  profilePicUrl?: string | null
}

function loadBatch(filename: string): ApifyProfile[] {
  const p = path.resolve(`data/imports/${filename}`)
  if (!fs.existsSync(p)) {
    console.warn(`WARN: ${filename} 없음 -- 스킵`)
    return []
  }
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

function truncate(s: string | null, max: number): string | null {
  if (s === null) return null
  const arr = Array.from(s)
  return arr.length <= max ? s : arr.slice(0, max).join('')
}

function calcTier(followers: number | null): string {
  if (followers === null) return 'UNDER_1K'
  if (followers >= 1_000_000) return 'MEGA'
  if (followers >= 100_000) return 'MACRO'
  if (followers >= 10_000) return 'MICRO'
  if (followers >= 1_000) return 'NANO'
  return 'UNDER_1K'
}

async function main() {
  const batch1 = loadBatch('apify_batch1.json')
  const batch2 = loadBatch('apify_batch2.json')

  // username lowercase 기준 dedup, 2차가 더 최신이므로 우선
  const merged = new Map<string, ApifyProfile>()
  for (const p of batch1) {
    if (p.username) merged.set(p.username.trim().toLowerCase(), p)
  }
  for (const p of batch2) {
    if (p.username) merged.set(p.username.trim().toLowerCase(), p)
  }

  const profiles = Array.from(merged.values())
  console.log(`Apify 통합: 1차 ${batch1.length} + 2차 ${batch2.length} -> ${profiles.length}명 (중복 제거)`)

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  let updated = 0
  let created = 0
  let skipped = 0
  let errors = 0
  const errorSamples: string[] = []
  const DATA_SOURCE = 'apify_cnec_2026-04-19'
  const now = new Date()

  for (const p of profiles) {
    if (!p.username) continue
    const handle = p.username.trim().toLowerCase()

    // followersCount가 null이면 Apify 실패한 프로필
    const isFailed = p.followersCount === null || p.followersCount === undefined

    try {
      // instagramHandle 또는 igUsername으로 기존 Creator 탐색
      const existing = await prisma.creator.findFirst({
        where: {
          OR: [
            { instagramHandle: { equals: handle, mode: 'insensitive' } },
            { igUsername: { equals: handle, mode: 'insensitive' } },
          ],
        },
        select: { id: true, igDataSource: true, igFollowers: true },
      })

      if (existing) {
        if (isFailed) {
          skipped++
          continue
        }

        // 기존 Creator 보강
        const updateData: Record<string, unknown> = {
          igLastSyncedAt: now,
        }

        if (p.biography !== undefined && p.biography !== null) updateData.igBio = p.biography
        if (p.fullName !== undefined && p.fullName !== null) updateData.igFullName = p.fullName
        if (p.postsCount !== undefined && p.postsCount !== null) updateData.igPostsCount = p.postsCount
        if (p.followsCount !== undefined && p.followsCount !== null) updateData.igFollowing = p.followsCount
        if (p.profilePicUrl) updateData.igProfilePicUrl = p.profilePicUrl

        // igFollowers는 피처링 값이 없을 때만 덮어씀
        if (!existing.igFollowers && p.followersCount) {
          updateData.igFollowers = p.followersCount
        }

        await prisma.creator.update({
          where: { id: existing.id },
          data: updateData,
        })
        updated++
      } else {
        if (isFailed) {
          // 신규인데 실패면 최소 정보로 User+Creator 생성
          const email = `${handle}.${randomUUID().slice(0, 4)}@ig.placeholder`
          const user = await prisma.user.create({
            data: { email, name: handle, role: 'creator', status: 'active' },
          })
          await prisma.creator.create({
            data: {
              userId: user.id,
              username: handle,
              displayName: truncate(handle, 50),
              instagramHandle: handle,
              igUsername: handle,
              instagram: `https://instagram.com/${handle}`,
              igDataSource: DATA_SOURCE,
              igDataImportedAt: now,
              status: 'ACTIVE',
            },
          })
          created++
          continue
        }

        // 신규 Creator 생성 (피처링에 없던 사람)
        const displayName = truncate(p.fullName ?? handle, 50)
        const name100 = truncate(p.fullName ?? handle, 100) ?? handle
        const tier = calcTier(p.followersCount ?? null)

        // User 생성 (이메일 충돌 시 placeholder 변형)
        let email = `${handle}@ig.placeholder`
        let user
        try {
          user = await prisma.user.create({
            data: { email, name: name100, role: 'creator', status: 'active' },
          })
        } catch (e) {
          const err = e as { code?: string }
          if (err?.code !== 'P2002') throw e
          email = `${handle}.${randomUUID().slice(0, 4)}@ig.placeholder`
          user = await prisma.user.create({
            data: { email, name: name100, role: 'creator', status: 'active' },
          })
        }

        // Creator 생성 (username 충돌 시 suffix)
        let username = handle
        try {
          await prisma.creator.create({
            data: {
              userId: user.id,
              username,
              displayName,
              instagramHandle: handle,
              igUsername: handle,
              instagram: `https://instagram.com/${handle}`,
              igFullName: p.fullName ?? null,
              igBio: p.biography ?? null,
              igFollowers: p.followersCount ?? null,
              igFollowing: p.followsCount ?? null,
              igPostsCount: p.postsCount ?? null,
              igProfilePicUrl: p.profilePicUrl ?? null,
              igTier: tier,
              igDataSource: DATA_SOURCE,
              igDataImportedAt: now,
              igLastSyncedAt: now,
              status: 'ACTIVE',
            },
          })
        } catch (e) {
          const err = e as { code?: string }
          if (err?.code !== 'P2002') throw e
          username = `${handle}_${randomUUID().slice(0, 4)}`
          await prisma.creator.create({
            data: {
              userId: user.id,
              username,
              displayName,
              instagramHandle: handle,
              igUsername: handle,
              instagram: `https://instagram.com/${handle}`,
              igFullName: p.fullName ?? null,
              igBio: p.biography ?? null,
              igFollowers: p.followersCount ?? null,
              igFollowing: p.followsCount ?? null,
              igPostsCount: p.postsCount ?? null,
              igProfilePicUrl: p.profilePicUrl ?? null,
              igTier: tier,
              igDataSource: DATA_SOURCE,
              igDataImportedAt: now,
              igLastSyncedAt: now,
              status: 'ACTIVE',
            },
          })
        }

        created++
      }
    } catch (e: unknown) {
      errors++
      if (errorSamples.length < 10) {
        const msg = e instanceof Error ? e.message : String(e)
        errorSamples.push(`${handle}: ${msg.slice(0, 150)}`)
      }
    }

    const done = updated + created + skipped + errors
    if (done % 300 === 0) {
      console.log(`  진행: ${done}/${profiles.length}`)
    }
  }

  console.log(`\n=== Apify 임포트 완료 ===`)
  console.log(`기존 Creator 보강: ${updated}명`)
  console.log(`신규 Creator 생성: ${created}명`)
  console.log(`실패 레코드 스킵: ${skipped}명 (Apify 실패, 기존 유지)`)
  console.log(`오류: ${errors}건`)
  if (errorSamples.length > 0) {
    console.log(`\n오류 샘플:`)
    errorSamples.forEach(s => console.log(`  ${s}`))
  }

  await prisma.$disconnect()
  await pool.end()
}

main().catch(err => {
  console.error('임포트 스크립트 에러:', err)
  process.exit(1)
})
