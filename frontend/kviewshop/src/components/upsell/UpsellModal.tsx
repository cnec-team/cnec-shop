'use client'

import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowRight, Crown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUpsellModal } from '@/lib/store/upsell'
import type { UpsellContext } from '@/lib/pricing/v3/errors'

export function UpsellModal() {
  const { isOpen, context, close } = useUpsellModal()
  const router = useRouter()

  if (!context) return null

  const content = getUpsellContent(context)

  function handleUpgrade() {
    close()
    if (context?.suggestedPlan === 'PRO') {
      router.push('/brand/billing/checkout?purpose=PRO_SUBSCRIPTION&cycle=MONTHLY')
    } else {
      router.push('/brand/billing/checkout?purpose=STANDARD_SUBSCRIPTION')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) close() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {content.title}
          </DialogTitle>
          <DialogDescription className="text-slate-600 leading-relaxed pt-2">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        {content.benefits && (
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 my-2">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">
                프로 플랜 혜택
              </span>
            </div>
            <ul className="space-y-2">
              {content.benefits.map((b, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-primary mt-0.5">-</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="ghost" onClick={close} className="sm:w-auto">
            {content.cancelLabel}
          </Button>
          <Button onClick={handleUpgrade} className="sm:w-auto">
            {content.upgradeLabel}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function getUpsellContent(context: UpsellContext): {
  title: string
  description: string
  cancelLabel: string
  upgradeLabel: string
  benefits?: string[]
} {
  switch (context.reason) {
    case 'CAMPAIGN_LIMIT_REACHED':
      return {
        title: '이번 달 공구를 모두 사용했어요',
        description: `스탠다드는 월 ${context.limit ?? 3}개까지 공구를 열 수 있어요. 프로로 업그레이드하면 무제한으로 열 수 있고, 수수료도 2%p 할인돼요.`,
        cancelLabel: '다음 달까지 기다리기',
        upgradeLabel: '프로로 업그레이드',
        benefits: [
          '공구 캠페인 무제한',
          '크넥샵 수수료 10% → 8% (2%p 할인)',
          '메시지 월 500건 포함',
          '상세 조회 무제한',
        ],
      }
    case 'MESSAGE_LIMIT_REACHED':
      return {
        title: '이번 달 메시지를 모두 보냈어요',
        description: `스탠다드는 월 ${context.limit ?? 100}건까지 메시지를 보낼 수 있어요. 프로는 월 500건이 포함되고 초과분은 건당 ₩700이에요.`,
        cancelLabel: '다음 달까지 기다리기',
        upgradeLabel: '프로로 업그레이드',
        benefits: [
          '메시지 월 500건 포함',
          '초과분 건당 ₩700 (스탠다드는 불가)',
          '공구 캠페인 무제한',
          '크넥샵 수수료 2%p 할인',
        ],
      }
    case 'DETAIL_VIEW_LIMIT_REACHED':
      return {
        title: '상세 조회 횟수가 많으시네요',
        description: `이번 달 ${context.used ?? 0}회 조회하셨어요. 프로로 업그레이드하면 무제한으로 조회할 수 있어요.`,
        cancelLabel: '건당 ₩100으로 계속',
        upgradeLabel: '프로로 업그레이드',
        benefits: [
          '상세 조회 무제한',
          '크리에이터 검색 무제한',
          '공구 캠페인 무제한',
        ],
      }
    case 'TRIAL_ENDED_NEED_SUBSCRIPTION':
    case 'RESTRICTED_MODE':
      return {
        title: '구독 결제가 필요해요',
        description: '체험 기간이 끝났어요. 지금 결제하면 데이터를 그대로 유지하면서 계속 사용할 수 있어요.',
        cancelLabel: '나중에',
        upgradeLabel: '스탠다드로 시작하기',
      }
  }
}
