import { getOrderForceDetail } from '@/lib/actions/admin-orders-force'
import { OrderDetailClient } from './order-detail-client'

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrderForceDetail(id)
  return <OrderDetailClient order={order} />
}
