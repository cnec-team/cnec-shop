'use client'

import { useRouter } from 'next/navigation'
import { TrendingUp, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UsageWarningBannerProps {
  type: 'CAMPAIGN' | 'MESSAGE' | 'TRIAL_ENDING'
  used: number
  limit: number
  daysLeft?: number
}

export function UsageWarningBanner({ type, used, limit, daysLeft }: UsageWarningBannerProps) {
  const router = useRouter()
  const percentage = limit > 0 ? (used / limit) * 100 : 0

  if (type !== 'TRIAL_ENDING' && percentage < 80) return null
  if (type === 'TRIAL_ENDING' && (daysLeft === undefined || daysLeft > 1)) return null

  const content = getBannerContent(type, used, limit, daysLeft)

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
        <TrendingUp className="w-5 h-5 text-amber-700" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-slate-900">{content.title}</div>
        <div className="text-xs text-slate-600 mt-0.5">{content.subtitle}</div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => router.push('/brand/billing/checkout?purpose=PRO_SUBSCRIPTION&cycle=MONTHLY')}
        className="text-primary hover:text-primary hover:bg-primary/5 font-semibold flex-shrink-0"
      >
        프로 보기
        <ArrowRight className="w-3 h-3 ml-1" />
      </Button>
    </div>
  )
}

function getBannerContent(
  type: UsageWarningBannerProps['type'],
  used: number,
  limit: number,
  daysLeft?: number,
): { title: string; subtitle: string } {
  switch (type) {
    case 'CAMPAIGN':
      return {
        title: `공구 ${used}/${limit}개 사용 중 — ${limit - used}개 남았어요`,
        subtitle: '자주 공구를 여시면 프로 플랜이 더 경제적이에요',
      }
    case 'MESSAGE':
      return {
        title: `메시지 ${used}/${limit}건 사용 중 — ${limit - used}건 남았어요`,
        subtitle: '프로 플랜은 월 500건 포함 + 초과분 건당 ₩700이에요',
      }
    case 'TRIAL_ENDING':
      return {
        title: `체험 종료 ${daysLeft ?? 0}일 남았어요`,
        subtitle: '체험이 끝나면 30일간 제한 모드로 전환돼요. 미리 결제하면 중단 없이 사용할 수 있어요',
      }
  }
}
