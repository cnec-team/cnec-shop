import { getAdminCreatorDetailV2 } from '@/lib/actions/admin-creators'
import { CreatorDetailClient } from './creator-detail-client'

export default async function CreatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getAdminCreatorDetailV2(id)
  return <CreatorDetailClient data={data} />
}
