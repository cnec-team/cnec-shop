import 'dotenv/config';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

type ApifyProfile = {
  username?: string | null;
  fullName?: string | null;
  biography?: string | null;
  followersCount?: number | null;
  followsCount?: number | null;
  postsCount?: number | null;
  highlightReelCount?: number | null;
  igtvVideoCount?: number | null;
  profilePicUrl?: string | null;
};

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const filePath = path.resolve('data/imports/apify_batch3_featuring.json');
  if (!fs.existsSync(filePath)) {
    throw new Error('apify_batch3_featuring.json 없음');
  }

  const profiles: ApifyProfile[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`Apify 배치 3: ${profiles.length}명 처리 시작`);

  let updated = 0;
  let created = 0;
  let skippedFailed = 0;
  let errors = 0;
  const errorSamples: string[] = [];
  const DATA_SOURCE = 'apify_featuring_enrich_2026-04-19';
  const now = new Date();

  for (const p of profiles) {
    if (!p.username) continue;
    const handle = p.username.trim().toLowerCase();
    const isFailed = p.followersCount === null || p.followersCount === undefined;

    try {
      const existing = await prisma.creator.findFirst({
        where: { instagramHandle: { equals: handle, mode: 'insensitive' } },
        select: { id: true, igDataSource: true, igFollowers: true },
      });

      if (existing) {
        if (isFailed) {
          skippedFailed++;
          continue;
        }

        // 기존 Creator 보강 — 피처링 핵심 지표(igFollowers/ER/광고비 등)는 보존
        const updateData: Record<string, unknown> = {
          igLastSyncedAt: now,
        };

        if (p.biography !== undefined && p.biography !== null) updateData.igBio = p.biography;
        if (p.fullName !== undefined && p.fullName !== null) updateData.igFullName = p.fullName;
        if (p.postsCount !== undefined && p.postsCount !== null) updateData.igPostsCount = p.postsCount;
        if (p.followsCount !== undefined && p.followsCount !== null) updateData.igFollowing = p.followsCount;
        if (p.profilePicUrl) updateData.igProfilePicUrl = p.profilePicUrl;

        // igFollowers는 피처링 값 없을 때만 보강
        if (!existing.igFollowers && p.followersCount) {
          updateData.igFollowers = p.followersCount;
        }

        await prisma.creator.update({
          where: { id: existing.id },
          data: updateData,
        });
        updated++;
      } else {
        if (isFailed) {
          await prisma.creator.create({
            data: {
              instagramHandle: handle,
              igUsername: handle,
              displayName: handle,
              igDataSource: DATA_SOURCE,
              igDataImportedAt: now,
              status: 'ACTIVE',
            } as any,
          });
          created++;
          continue;
        }

        await prisma.creator.create({
          data: {
            instagramHandle: handle,
            igUsername: handle,
            igFullName: p.fullName ?? null,
            displayName: p.fullName ?? handle,
            igBio: p.biography ?? null,
            igFollowers: p.followersCount ?? null,
            igFollowing: p.followsCount ?? null,
            igPostsCount: p.postsCount ?? null,
            igProfilePicUrl: p.profilePicUrl ?? null,
            igDataSource: DATA_SOURCE,
            igDataImportedAt: now,
            igLastSyncedAt: now,
            status: 'ACTIVE',
          } as any,
        });
        created++;
      }
    } catch (e: any) {
      errors++;
      if (errorSamples.length < 10) {
        errorSamples.push(`${handle}: ${String(e?.message || e).slice(0, 150)}`);
      }
    }

    const done = updated + created + skippedFailed + errors;
    if (done % 500 === 0) {
      console.log(`  진행: ${done}/${profiles.length}`);
    }
  }

  console.log(`\n=== Apify 배치 3 임포트 완료 ===`);
  console.log(`기존 Creator 보강: ${updated}명`);
  console.log(`신규 Creator 생성: ${created}명`);
  console.log(`Apify 실패 스킵: ${skippedFailed}명`);
  console.log(`오류: ${errors}건`);
  if (errorSamples.length > 0) {
    console.log(`\n오류 샘플:`);
    errorSamples.forEach(s => console.log(`  ${s}`));
  }

  await prisma.$disconnect();
  await pool.end();
}

main()
  .catch(e => { console.error(e); process.exit(1); });
