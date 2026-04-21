import { getAuthUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { ProposalSettingsForm } from './ProposalSettingsForm'

export default async function CreatorProposalSettingsPage() {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'creator') {
    redirect('/login')
  }

  const creator = await prisma.creator.findUnique({
    where: { userId: authUser.id },
    select: {
      acceptingProposals: true,
      monthlyProposalLimit: true,
      currentMonthProposals: true,
    },
  })

  if (!creator) redirect('/login')

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">제안 받기 설정</h1>
      <ProposalSettingsForm initialData={creator} />
    </div>
  )
}
