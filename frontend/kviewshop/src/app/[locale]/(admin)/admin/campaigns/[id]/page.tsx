import { getCampaignForceDetail } from '@/lib/actions/admin-campaigns-force'
import { CampaignDetailClient } from './campaign-detail-client'

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaign = await getCampaignForceDetail(id)
  return <CampaignDetailClient campaign={campaign} />
}
