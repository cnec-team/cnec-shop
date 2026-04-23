import { getAdminBrandDetailV2 } from '@/lib/actions/admin-brands'
import { BrandDetailClient } from './brand-detail-client'

export default async function BrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getAdminBrandDetailV2(id)
  return <BrandDetailClient data={data} />
}
