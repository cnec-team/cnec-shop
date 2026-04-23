'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PartnershipAssistant({ creatorName, creatorId }: { creatorName: string; creatorId: string }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-blue-500" />
        <h3 className="text-base font-semibold text-stone-900">파트너십 제안 도우미</h3>
      </div>
      <p className="text-sm text-stone-600 mb-4">
        {creatorName} 님과의 협업 메시지를 AI가 1초 만에 초안까지 작성해드려요.
      </p>
      <Button asChild size="sm" className="rounded-lg gap-1.5">
        <Link href={`/brand/creators/${creatorId}?action=propose`}>
          초안 만들기
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  )
}
