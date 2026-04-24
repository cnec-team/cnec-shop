'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PartnershipAssistant({ creatorName, creatorId }: { creatorName: string; creatorId: string }) {
  return (
    <div className="relative rounded-xl bg-gradient-to-br from-[#0f1a3d] to-[#1a2d5c] p-5 overflow-hidden">
      <Sparkles className="absolute top-4 right-4 w-5 h-5 text-white/40" />
      <h3 className="text-base font-bold text-white mb-2">파트너십 제안 도우미</h3>
      <p className="text-sm text-white/80 mb-4">
        {creatorName} 님과의 협업 메시지를 AI가 1초 만에 초안까지 작성해드려요.
      </p>
      <Button asChild size="sm" className="rounded-lg gap-1.5 bg-white text-blue-900 hover:bg-white/90">
        <Link href={`/brand/creators/${creatorId}?action=propose`}>
          초안 만들기
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  )
}
