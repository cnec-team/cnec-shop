'use client'

import { useParams } from 'next/navigation'
import { CreatorDetailPageClient } from '@/components/brand/creators/CreatorDetailPageClient'

export default function CreatorDetailPage() {
  const params = useParams()
  const id = params.id as string
  return <CreatorDetailPageClient creatorId={id} />
}
