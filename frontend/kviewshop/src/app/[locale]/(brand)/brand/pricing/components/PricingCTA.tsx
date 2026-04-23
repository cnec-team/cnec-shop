'use client'

import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function PricingCTA() {
  function handleStart() {
    console.log('[Pricing CTA] Bottom CTA clicked')
    toast.info('체험 시작 준비 중입니다 (다음 PR에서 결제 연동 예정)')
  }

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-primary/10">
      <div className="mx-auto max-w-3xl px-4 md:px-6 text-center">
        <h2 className="text-2xl md:text-[32px] font-bold tracking-[-0.02em]">
          3일 무료로 지금 바로 시작하세요
        </h2>
        <p className="mt-3 text-muted-foreground">
          카드 등록 없이 모든 기능을 써볼 수 있어요
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={handleStart}
            size="lg"
            className="h-14 px-8 text-base font-semibold rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            지금 시작하기
          </Button>
          <button
            onClick={() => {
              console.log('[Pricing CTA] Contact sales')
              toast.info('세일즈팀 문의 준비 중입니다 (다음 PR에서 연동 예정)')
            }}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg px-4 py-2"
          >
            세일즈팀에 문의하기
          </button>
        </div>
      </div>
    </section>
  )
}
