'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BillingCycleToggle } from './BillingCycleToggle'
import type { ResolvedPlan } from '@/lib/pricing/v3/plan-resolver'

interface Props {
  currentPlan: ResolvedPlan
}

export function PricingCards({ currentPlan }: Props) {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string ?? 'ko'
  const [billingCycle, setBillingCycle] = useState<'QUARTERLY' | 'ANNUAL'>('QUARTERLY')

  const isCurrentTrial = currentPlan.version === 'v3' && currentPlan.planV3 === 'TRIAL'
  const isCurrentStandard = currentPlan.version === 'v3' && currentPlan.planV3 === 'STANDARD'
  const isCurrentPro = currentPlan.version === 'v3' && currentPlan.planV3 === 'PRO'

  return (
    <div className="mb-16">
      <div className="grid md:grid-cols-3 gap-6">
        {/* 체험 */}
        <Card className="p-8 flex flex-col">
          <h3 className="text-xl font-semibold mb-2">체험</h3>
          <p className="text-sm text-muted-foreground mb-6">3일 동안 써보기</p>
          <div className="mb-6">
            <span className="text-4xl font-bold">₩0</span>
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            <FeatureItem>공동구매 1번 열기</FeatureItem>
            <FeatureItem>메시지 10번 보내기</FeatureItem>
            <FeatureItem>크리에이터 일 30명 보기</FeatureItem>
            <FeatureItem>상세정보 30번 열어보기</FeatureItem>
          </ul>
          <p className="text-xs text-muted-foreground mb-4">카드 등록 없이 시작</p>
          <Button variant="outline" disabled={isCurrentTrial}>
            {isCurrentTrial ? '사용 중' : '체험 신청하기'}
          </Button>
        </Card>

        {/* 스탠다드 (강조) */}
        <Card className="p-8 flex flex-col border-2 border-primary relative">
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">가장 인기</Badge>
          <h3 className="text-xl font-semibold mb-2">스탠다드</h3>
          <p className="text-sm text-muted-foreground mb-6">쓴 만큼만 결제</p>
          <div className="mb-6">
            <span className="text-4xl font-bold">매달 ₩0</span>
            <span className="text-sm text-muted-foreground"> + 사용분</span>
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            <FeatureItem>공동구매 1번 ₩50,000</FeatureItem>
            <FeatureItem>메시지 1건 ₩700</FeatureItem>
            <FeatureItem>크리에이터 일 100명 보기</FeatureItem>
            <FeatureItem>상세정보 매달 100번 무료</FeatureItem>
            <FeatureItem>캠페인 성과 리포트</FeatureItem>
            <FeatureItem>크넥샵 수수료 10%</FeatureItem>
          </ul>
          <p className="text-xs text-muted-foreground mb-4">약정 없음, 언제든 그만두기</p>
          <Button
            disabled={isCurrentStandard}
            onClick={() => !isCurrentStandard && router.push(`/${locale}/brand/billing/charge`)}
          >
            {isCurrentStandard ? '사용 중' : '스탠다드로 시작하기'}
          </Button>
        </Card>

        {/* 프로 */}
        <Card className="p-8 flex flex-col">
          <h3 className="text-xl font-semibold mb-2">프로</h3>
          <p className="text-sm text-muted-foreground mb-6">매달 공동구매 여는 브랜드를 위해</p>
          <BillingCycleToggle value={billingCycle} onChange={setBillingCycle} />
          <div className="mb-6 mt-4">
            {billingCycle === 'QUARTERLY' ? (
              <>
                <div className="text-4xl font-bold">3개월 ₩990,000</div>
                <div className="text-sm text-muted-foreground">한 달 ₩330,000</div>
              </>
            ) : (
              <>
                <div className="text-4xl font-bold">1년 ₩3,168,000</div>
                <div className="text-sm text-muted-foreground">
                  <span className="line-through">₩3,960,000</span> 20% 할인 · 한 달 ₩264,000
                </div>
              </>
            )}
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            <FeatureItem>공동구매 무제한</FeatureItem>
            <FeatureItem>메시지 매달 500건 무료</FeatureItem>
            <FeatureItem>크리에이터 무제한 보기</FeatureItem>
            <FeatureItem>상세정보 무제한 열기</FeatureItem>
            <FeatureItem>피부 타입 매칭 AI</FeatureItem>
            <FeatureItem>인스타 DM 자동 발송</FeatureItem>
            <FeatureItem>캠페인 참여자 엑셀</FeatureItem>
            <FeatureItem><strong>크넥샵 수수료 8%</strong> (2%p 할인)</FeatureItem>
          </ul>
          <Button
            variant="outline"
            disabled={isCurrentPro}
            onClick={() => !isCurrentPro && router.push(`/${locale}/brand/billing/checkout?purpose=PRO_SUBSCRIPTION&cycle=${billingCycle}`)}
          >
            {isCurrentPro ? '사용 중' : '프로로 시작하기'}
          </Button>
        </Card>
      </div>
    </div>
  )
}

function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <span>{children}</span>
    </li>
  )
}
