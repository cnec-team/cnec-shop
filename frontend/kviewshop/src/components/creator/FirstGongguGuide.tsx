'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Send,
  ShoppingBag,
  Megaphone,
  Check,
  ChevronRight,
  Rocket,
  Loader2,
} from 'lucide-react'
import { getFirstGongguProgress } from '@/lib/actions/creator'

interface Step {
  key: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  cta: string
  completed: boolean
}

interface FirstGongguGuideProps {
  creatorId: string
  locale: string
}

export function FirstGongguGuide({ creatorId, locale }: FirstGongguGuideProps) {
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)
  const [allDone, setAllDone] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const progress = await getFirstGongguProgress(creatorId)
        const stepData: Step[] = [
          {
            key: 'find',
            label: '공구할 캠페인 찾기',
            description: '마음에 드는 제품을 골라보세요',
            icon: Search,
            href: `/${locale}/creator/campaigns/gonggu`,
            cta: '캠페인 둘러보기',
            completed: progress.hasParticipation,
          },
          {
            key: 'apply',
            label: '공구 참여 신청하기',
            description: '신청 후 브랜드 승인을 기다려요',
            icon: Send,
            href: `/${locale}/creator/campaigns/gonggu`,
            cta: '참여 신청하기',
            completed: progress.hasApproval,
          },
          {
            key: 'add',
            label: '내 샵에 상품 추가하기',
            description: '승인 후 샵에 상품을 추가해요',
            icon: ShoppingBag,
            href: `/${locale}/creator/shop/products`,
            cta: '상품 추가하기',
            completed: progress.hasShopItem,
          },
          {
            key: 'launch',
            label: '공구 오픈! 팔로워에게 알리기',
            description: '팔로워에게 알림이 자동 발송돼요',
            icon: Megaphone,
            href: `/${locale}/creator/shop`,
            cta: '내 샵 확인하기',
            completed: progress.hasFirstSale,
          },
        ]
        setSteps(stepData)
        setAllDone(stepData.every((s) => s.completed))
      } catch {
        // silent fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [creatorId, locale])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
      </div>
    )
  }

  if (allDone || steps.length === 0) return null

  const completedCount = steps.filter((s) => s.completed).length
  const progress = Math.round((completedCount / steps.length) * 100)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Rocket className="h-4 w-4 text-violet-600" />
          <h3 className="text-sm font-bold text-gray-900">첫 공구 가이드</h3>
        </div>
        <p className="text-xs text-gray-400">4단계만 따라하면 첫 매출이 시작돼요</p>

        {/* Progress bar */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-500">{completedCount}/{steps.length}</span>
        </div>
      </div>

      {/* Steps */}
      <div className="px-5 pb-5 space-y-2">
        {steps.map((step, idx) => {
          const Icon = step.icon
          const isNext = !step.completed && steps.slice(0, idx).every((s) => s.completed)

          return (
            <div
              key={step.key}
              className={`rounded-xl p-3 transition-colors ${
                step.completed
                  ? 'bg-gray-50'
                  : isNext
                  ? 'bg-violet-50 border border-violet-100'
                  : 'bg-gray-50 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  step.completed
                    ? 'bg-emerald-100'
                    : isNext
                    ? 'bg-violet-100'
                    : 'bg-gray-200'
                }`}>
                  {step.completed ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Icon className={`h-3.5 w-3.5 ${isNext ? 'text-violet-600' : 'text-gray-400'}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    step.completed ? 'text-gray-400 line-through' : 'text-gray-900'
                  }`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                </div>
                {isNext && (
                  <Link
                    href={step.href}
                    className="shrink-0 flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700"
                  >
                    {step.cta}
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
