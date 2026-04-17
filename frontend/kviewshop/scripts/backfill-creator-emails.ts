import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { extractEmailFromBio } from '../src/lib/apify/transformer'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const creators = await prisma.creator.findMany({
    where: { igBio: { not: null }, brandContactEmail: null },
    select: { id: true, igBio: true },
  })
  console.log(`[INFO] 대상: ${creators.length}명`)

  let found = 0
  for (const c of creators) {
    const email = extractEmailFromBio(c.igBio!)
    if (email) {
      await prisma.creator.update({
        where: { id: c.id },
        data: { hasBrandEmail: true, brandContactEmail: email },
      })
      found++
    }
    if (found > 0 && found % 500 === 0) {
      console.log(`진행: ${found}/${creators.length}`)
    }
  }
  console.log(`[DONE] 이메일 추출: ${found}/${creators.length}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
