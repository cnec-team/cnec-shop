/**
 * Part B: 크리에이터 신뢰도 데이터 현황 조사
 * 실행: cd frontend/kviewshop && npx tsx scripts/check-reliability-data.ts
 */
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('\n=== 크리에이터 신뢰도 데이터 현황 ===\n')

  // 1. 전체 Creator 수
  const totalCreators = await prisma.creator.count()
  console.log(`1. 전체 Creator 수: ${totalCreators}`)

  // 2. cnecIsPartner=true 수
  const partnerCount = await prisma.creator.count({ where: { cnecIsPartner: true } })
  console.log(`2. cnecIsPartner=true: ${partnerCount}`)

  // 3. cnecTotalTrials > 0 수
  const trialsCount = await prisma.creator.count({ where: { cnecTotalTrials: { gt: 0 } } })
  console.log(`3. cnecTotalTrials > 0: ${trialsCount}`)

  // 4. cnecIsPartner=true AND cnecTotalTrials > 0 (별점 후보)
  const starCandidates = await prisma.creator.count({
    where: { cnecIsPartner: true, cnecTotalTrials: { gt: 0 } },
  })
  console.log(`4. 파트너 + trials > 0 (별점 후보): ${starCandidates}`)

  // 5. cnecCompletedPayments > 0 수
  const completedCount = await prisma.creator.count({
    where: { cnecCompletedPayments: { gt: 0 } },
  })
  console.log(`5. cnecCompletedPayments > 0: ${completedCount}`)

  // 6. cnecReliabilityScore IS NOT NULL 수
  const scoreNotNull = await prisma.creator.count({
    where: { cnecReliabilityScore: { not: null } },
  })
  console.log(`6. cnecReliabilityScore IS NOT NULL: ${scoreNotNull}`)

  // 7. cnecReliabilityScore 최소/최대/평균
  if (scoreNotNull > 0) {
    const stats = await prisma.creator.aggregate({
      _min: { cnecReliabilityScore: true },
      _max: { cnecReliabilityScore: true },
      _avg: { cnecReliabilityScore: true },
      where: { cnecReliabilityScore: { not: null } },
    })
    console.log(`7. 점수 분포: 최소=${Number(stats._min.cnecReliabilityScore)}, 최대=${Number(stats._max.cnecReliabilityScore)}, 평균=${Number(stats._avg.cnecReliabilityScore)?.toFixed(4)}`)
  } else {
    console.log(`7. 점수 분포: 전부 NULL`)
  }

  // 8. cnecPhone 보유 수
  const phoneCount = await prisma.creator.count({
    where: { cnecPhone: { not: null } },
  })
  console.log(`8. cnecPhone 보유: ${phoneCount}`)

  // 9. cnecVerificationStatus 값별 분포
  const verificationDist = await prisma.$queryRaw<Array<{ status: string | null; cnt: bigint }>>`
    SELECT "cnec_verification_status" as status, COUNT(*) as cnt
    FROM "creators"
    GROUP BY "cnec_verification_status"
    ORDER BY cnt DESC
  `
  console.log(`9. cnecVerificationStatus 분포:`)
  for (const row of verificationDist) {
    console.log(`   ${row.status ?? 'NULL'}: ${row.cnt}`)
  }

  // 10. cnecEmail1/2/3 중 하나라도 있는 수
  const emailCount = await prisma.creator.count({
    where: {
      OR: [
        { cnecEmail1: { not: null } },
        { cnecEmail2: { not: null } },
        { cnecEmail3: { not: null } },
      ],
    },
  })
  console.log(`10. 이메일 1개 이상 보유: ${emailCount}`)

  // 11. 샘플 10건 (파트너 우선)
  const samples = await prisma.creator.findMany({
    where: { cnecIsPartner: true },
    orderBy: { cnecTotalTrials: 'desc' },
    take: 10,
    select: {
      instagramHandle: true,
      cnecIsPartner: true,
      cnecTotalTrials: true,
      cnecCompletedPayments: true,
      cnecReliabilityScore: true,
      cnecPhone: true,
      cnecVerificationStatus: true,
      cnecEmail1: true,
      cnecEmail2: true,
      cnecEmail3: true,
    },
  })
  console.log(`\n11. 샘플 10건 (파트너, trials 내림차순):`)
  console.table(
    samples.map(s => ({
      handle: s.instagramHandle,
      trials: s.cnecTotalTrials,
      completed: s.cnecCompletedPayments,
      score: s.cnecReliabilityScore ? Number(s.cnecReliabilityScore) : null,
      phone: s.cnecPhone ? 'Y' : 'N',
      verif: s.cnecVerificationStatus,
      email: [s.cnecEmail1, s.cnecEmail2, s.cnecEmail3].filter(Boolean).length,
    }))
  )
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
