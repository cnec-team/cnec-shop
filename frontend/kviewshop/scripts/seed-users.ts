import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Test accounts to create
const testAccounts = [
  {
    email: 'admin@kviewshop.com',
    password: 'admin123!@#',
    name: 'Super Admin',
    role: 'super_admin' as const,
  },
  {
    email: 'brand@kviewshop.com',
    password: 'brand123!@#',
    name: 'Test Brand',
    role: 'brand_admin' as const,
    brandData: {
      companyName: 'Beauty Lab Korea',
      companyNameEn: 'Beauty Lab Korea',
      companyNameJp: 'ビューティーラボコリア',
      businessNumber: '123-45-67890',
      description: '프리미엄 K-뷰티 브랜드',
      descriptionEn: 'Premium K-Beauty Brand',
      descriptionJp: 'プレミアムK-ビューティーブランド',
      approved: true,
      creatorCommissionRate: 25,
    },
  },
  {
    email: 'creator@kviewshop.com',
    password: 'creator123!@#',
    name: 'Sakura Beauty',
    role: 'creator' as const,
    creatorData: {
      username: 'sakura_beauty',
      displayName: 'Sakura Beauty',
      bio: '일본에서 활동하는 K-뷰티 크리에이터입니다.',
      bioEn: 'K-Beauty creator based in Japan.',
      bioJp: '日本で活動するK-ビューティークリエイターです。',
      themeColor: '#d4af37',
      country: 'JP',
      socialLinks: {
        instagram: 'https://instagram.com/sakura_beauty',
        youtube: 'https://youtube.com/@sakura_beauty',
        tiktok: 'https://tiktok.com/@sakura_beauty',
      },
    },
  },
]

async function seedUsers() {
  console.log('🌱 Starting user seed...\n')

  for (const account of testAccounts) {
    console.log(`Creating ${account.role}: ${account.email}`)

    try {
      const passwordHash = await bcrypt.hash(account.password, 12)

      // Upsert user
      const user = await prisma.user.upsert({
        where: { email: account.email },
        update: { name: account.name, role: account.role, passwordHash },
        create: {
          email: account.email,
          name: account.name,
          role: account.role,
          passwordHash,
        },
      })

      console.log(`  ✅ User created/updated: ${user.id}`)

      // Create role-specific records
      if (account.role === 'brand_admin' && 'brandData' in account) {
        await prisma.brand.upsert({
          where: { userId: user.id },
          update: account.brandData,
          create: {
            userId: user.id,
            ...account.brandData,
          },
        })
        console.log(`  ✅ Brand record created`)
      }

      if (account.role === 'creator' && 'creatorData' in account) {
        await prisma.creator.upsert({
          where: { userId: user.id },
          update: account.creatorData,
          create: {
            userId: user.id,
            ...account.creatorData,
          },
        })
        console.log(`  ✅ Creator record created`)
      }
    } catch (error) {
      console.error(`  ❌ Error creating ${account.email}:`, error)
    }

    console.log('')
  }

  console.log('\n✨ Seed complete!\n')
  console.log('='.repeat(50))
  console.log('Test Accounts:')
  console.log('='.repeat(50))
  testAccounts.forEach((acc) => {
    console.log(`\n[${acc.role.toUpperCase()}]`)
    console.log(`  Email: ${acc.email}`)
    console.log(`  Password: ${acc.password}`)
  })
  console.log('\n' + '='.repeat(50))

  await prisma.$disconnect()
}

// Run the seed
seedUsers().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
