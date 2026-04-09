'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function completeCreatorOnboarding() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const creator = await prisma.creator.findFirst({
    where: { userId: session.user.id },
  })

  if (!creator) throw new Error('Creator not found')

  // Mark onboarding as completed
  await prisma.creator.update({
    where: { id: creator.id },
    data: { onboardingCompleted: true },
  })

  // Award signup points
  const signupPoints = 3000
  const personaPoints = 2000
  const totalPoints = signupPoints + personaPoints

  // Create point records
  await prisma.creatorPoint.createMany({
    data: [
      {
        creatorId: creator.id,
        pointType: 'SIGNUP_BONUS',
        amount: signupPoints,
        balanceAfter: signupPoints,
        description: 'Signup welcome bonus',
      },
      {
        creatorId: creator.id,
        pointType: 'PERSONA_BONUS',
        amount: personaPoints,
        balanceAfter: totalPoints,
        description: 'Persona completion bonus',
      },
    ],
  })

  return { totalPoints }
}

export async function updateCreatorPersona(data: {
  skinType: string
  ageRange: string
  skinConcerns: string[]
  interests: string[]
  personalColor: string
}) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const creator = await prisma.creator.findFirst({
    where: { userId: session.user.id },
  })

  if (!creator) throw new Error('Creator not found')

  return prisma.creator.update({
    where: { id: creator.id },
    data: {
      skinType: data.skinType,
      ageRange: data.ageRange,
      skinConcerns: data.skinConcerns,
      interests: data.interests,
      personalColor: data.personalColor,
    },
  })
}

export async function registerBuyer(data: {
  email: string
  nickname: string
  phone?: string
  locale: string
  marketingConsent: boolean
}) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  // Create buyer profile
  const buyer = await prisma.buyer.create({
    data: {
      userId: session.user.id,
      nickname: data.nickname,
      phone: data.phone || null,
      preferredLanguage: data.locale,
    },
  })

  return buyer
}
