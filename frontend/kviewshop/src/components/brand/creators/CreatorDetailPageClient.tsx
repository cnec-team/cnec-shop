'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { DetailHeader } from './detail/DetailHeader'
import { DetailKpiRow } from './detail/DetailKpiRow'
import { AiMatchReport } from './detail/AiMatchReport'
import { QuickInfoCard } from './detail/QuickInfoCard'
import { ContentPerformance } from './detail/ContentPerformance'
import { AudienceInsights } from './detail/AudienceInsights'
import { EstimatedCostCard } from './detail/EstimatedCostCard'
import { PartnershipAssistant } from './detail/PartnershipAssistant'
import { CampaignHistory } from './detail/CampaignHistory'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { InviteModal } from '@/components/brand/InviteModal'
import { GroupSaveDialog } from '@/components/brand/GroupSaveDialog'
import { ArrowLeft, BookmarkPlus } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function CreatorDetailPageClient({ creatorId }: { creatorId: string }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('performance')
  const [proposalModal, setProposalModal] = useState<{
    open: boolean
    type: 'GONGGU' | 'PRODUCT_PICK'
  }>({ open: false, type: 'GONGGU' })
  const [groupDialog, setGroupDialog] = useState(false)

  const { data, isLoading } = useSWR(
    `/api/brand/creators/${creatorId}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-8 space-y-6">
        <Skeleton className="h-[180px] rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[280px] rounded-xl" />
      </div>
    )
  }

  if (!data.creator) {
    return (
      <div className="text-center py-16">
        <p className="text-stone-500">크리에이터를 찾을 수 없습니다</p>
        <Button variant="link" onClick={() => router.back()}>뒤로 가기</Button>
      </div>
    )
  }

  const { creator, matchScore, contentPerformance, audienceInsights, campaigns } = data
  const creatorName = creator.displayName || creator.instagramHandle || creator.igUsername || ''

  return (
    <div className="min-h-screen bg-stone-50/50">
      <div className="mx-auto max-w-[1200px] px-6 py-8 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> 크리에이터 탐색
        </Button>

        {/* 상단 헤더 */}
        <DetailHeader
          creator={creator}
          matchScore={matchScore.totalScore}
          onOpenProposal={() => setProposalModal({ open: true, type: 'GONGGU' })}
        />

        {/* KPI 4개 */}
        <DetailKpiRow creator={creator} expectedReach={matchScore.expectedReach} />

        {/* 좌: AI 리포트 / 우: 빠른 정보 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AiMatchReport matchScore={matchScore} />
          </div>
          <div>
            <QuickInfoCard creator={creator} />
          </div>
        </div>

        {/* 탭 영역 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent border-b border-stone-200 w-full justify-start rounded-none h-auto p-0 gap-2">
            <TabsTrigger value="performance" className="rounded-md data-[state=active]:bg-stone-100 data-[state=active]:shadow-none px-4 py-2">
              콘텐츠 성과
            </TabsTrigger>
            <TabsTrigger value="audience" className="rounded-md data-[state=active]:bg-stone-100 px-4 py-2">
              팔로워 인사이트
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-md data-[state=active]:bg-stone-100 px-4 py-2">
              캠페인 이력
            </TabsTrigger>
            <TabsTrigger value="memo" className="rounded-md data-[state=active]:bg-stone-100 px-4 py-2">
              메모
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6 mt-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <ContentPerformance data={contentPerformance} />
                <AudienceInsights data={audienceInsights} />
                <EstimatedCostCard matchScore={matchScore} tier={creator.igTier} />
              </div>
              <div className="space-y-6">
                <PartnershipAssistant
                  creatorName={creatorName}
                  creatorId={creatorId}
                  canSendDM={creator.canSendDM}
                  canSendEmail={creator.canSendEmail}
                  canSendAlimtalk={creator.canSendAlimtalk}
                />
              </div>
            </div>
            <CampaignHistory history={campaigns} creatorName={creatorName} creatorId={creatorId} />
          </TabsContent>

          <TabsContent value="audience" className="mt-5">
            <AudienceInsights data={audienceInsights} />
          </TabsContent>

          <TabsContent value="history" className="mt-5">
            <CampaignHistory history={campaigns} creatorName={creatorName} creatorId={creatorId} />
          </TabsContent>

          <TabsContent value="memo" className="mt-5">
            <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-500">
              브랜드 내부 메모 기능은 곧 추가돼요
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 하단 여백 (고정 바가 콘텐츠를 가리지 않도록) */}
      <div className="h-20" />

      {/* 하단 고정 액션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-stone-200 p-4 flex gap-3 justify-end z-30">
        <Button
          size="lg"
          className="gap-1.5"
          onClick={() => setProposalModal({ open: true, type: 'GONGGU' })}
        >
          공동구매 제안
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => setProposalModal({ open: true, type: 'PRODUCT_PICK' })}
        >
          상품 추천
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => setGroupDialog(true)}
        >
          <BookmarkPlus className="h-4 w-4 mr-1" /> 그룹에 저장
        </Button>
      </div>

      <InviteModal
        open={proposalModal.open}
        onOpenChange={open => setProposalModal(prev => ({ ...prev, open }))}
        mode="single"
        creatorIds={[creatorId]}
        defaultType={proposalModal.type}
        onSuccess={() => {}}
      />

      <GroupSaveDialog
        open={groupDialog}
        onOpenChange={setGroupDialog}
        creatorIds={[creatorId]}
        onSuccess={() => {}}
      />
    </div>
  )
}
