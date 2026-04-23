'use client'

import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RestrictedModeBannerProps {
  restrictedUntil: string | null
  status: 'RESTRICTED' | 'DEACTIVATED'
}

export function RestrictedModeBanner({ restrictedUntil, status }: RestrictedModeBannerProps) {
  const router = useRouter()

  const daysLeft = restrictedUntil
    ? Math.max(0, Math.ceil(
        (new Date(restrictedUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ))
    : 0

  const content = status === 'DEACTIVATED'
    ? {
        title: '계정이 비활성화됐어요',
        subtitle: '결제하면 모든 데이터가 복구되고 즉시 사용할 수 있어요',
      }
    : {
        title: '체험 기간이 끝났어요',
        subtitle: `${daysLeft}일 후 계정이 비활성화됩니다. 지금 결제하면 데이터를 그대로 유지할 수 있어요`,
      }

  return (
    <div className="sticky top-0 z-50 bg-red-600 text-white">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold">{content.title}</div>
          <div className="text-xs text-white/90 mt-0.5 hidden sm:block">{content.subtitle}</div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => router.push('/brand/billing/checkout?purpose=STANDARD_SUBSCRIPTION')}
          className="bg-white text-red-600 hover:bg-red-50 font-bold flex-shrink-0"
        >
          결제하고 계속 사용
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </div>
  )
}
