'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { AdminBreadcrumb } from '@/components/admin/admin-breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  User,
  MoreVertical,
  Ban,
  CheckCircle,
  UserCog,
  AlertTriangle,
  Construction,
  Star,
  Megaphone,
  Banknote,
} from 'lucide-react'
import { SuspendModal } from '@/components/admin/modals/suspend-modal'
import { ReactivateModal } from '@/components/admin/modals/reactivate-modal'
import { suspendCreator, reactivateCreator } from '@/lib/actions/admin-creators'

type CreatorDetailData = Awaited<ReturnType<typeof import('@/lib/actions/admin-creators').getAdminCreatorDetailV2>>

function formatKrw(amount: number) {
  return '₩' + amount.toLocaleString()
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'SUSPENDED') return <Badge variant="destructive">정지</Badge>
  return <Badge className="bg-emerald-100 text-emerald-700">활성</Badge>
}

export function CreatorDetailClient({ data }: { data: CreatorDetailData }) {
  const router = useRouter()
  const { creator, kpi, participations, settlements } = data
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [reactivateOpen, setReactivateOpen] = useState(false)

  return (
    <div className="space-y-6">
      <AdminBreadcrumb items={[
        { href: '/admin', label: '어드민' },
        { href: '/admin/creators', label: '크리에이터 관리' },
        { label: creator.name },
      ]} />

      {/* 정지 배너 */}
      {creator.suspendedAt && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">이 크리에이터는 정지 상태예요</p>
            <p className="mt-0.5 text-xs text-red-600">
              사유: {creator.suspendedReason || '없음'}
              {' · '}
              정지일: {new Date(creator.suspendedAt).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-stone-100">
            {creator.profileImageUrl ? (
              <Image src={creator.profileImageUrl} alt={creator.name} width={56} height={56} className="rounded-full object-cover" />
            ) : (
              <User className="h-7 w-7 text-stone-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-stone-900">{creator.name}</h1>
              <StatusBadge status={creator.status} />
              {creator.isPartner && <Badge className="bg-blue-100 text-blue-700">파트너</Badge>}
            </div>
            <div className="flex items-center gap-2 text-sm text-stone-500">
              {creator.instagramHandle && <span>@{creator.instagramHandle}</span>}
              {creator.followers && <span>· 팔로워 {creator.followers.toLocaleString()}</span>}
              {creator.reliabilityScore !== null && (
                <span className="flex items-center gap-0.5">
                  · <Star className="h-3.5 w-3.5 text-amber-400" />
                  {(creator.reliabilityScore * 100).toFixed(0)}점
                </span>
              )}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon"><MoreVertical className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {creator.suspendedAt ? (
              <DropdownMenuItem onClick={() => setReactivateOpen(true)} className="text-emerald-600">
                <CheckCircle className="mr-2 h-4 w-4" />정지 해제
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => setSuspendOpen(true)} className="text-red-600">
                <Ban className="mr-2 h-4 w-4" />강제 정지
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="text-stone-400">
              <UserCog className="mr-2 h-4 w-4" />Impersonate
              <Badge variant="secondary" className="ml-2 text-[10px]">PR 7</Badge>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 탭 */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="campaigns">참여 캠페인</TabsTrigger>
          <TabsTrigger value="settlements">정산</TabsTrigger>
          <TabsTrigger value="activity">활동 로그</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-xs text-stone-500">이번 달 매출 기여</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{formatKrw(kpi.monthRevenue)}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-xs text-stone-500">총 주문 수</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{kpi.totalOrders}건</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-xs text-stone-500">참여 캠페인</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{kpi.participationCount}개</p>
            </div>
          </div>

          {/* 신뢰도 상세 */}
          {(creator.totalTrials !== null || creator.completedPayments !== null) && (
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-xs text-stone-500">신뢰도 지표</p>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span>체험 신청: {creator.totalTrials ?? 0}건</span>
                <span>결제 완료: {creator.completedPayments ?? 0}건</span>
                {creator.reliabilityScore !== null && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-400" />
                    {(creator.reliabilityScore * 100).toFixed(0)}점
                  </span>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6">
          {participations.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone-400">참여 캠페인이 없어요</p>
          ) : (
            <div className="space-y-2">
              {participations.map(p => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4">
                  <Megaphone className="h-5 w-5 text-stone-400" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{p.campaign?.title || '캠페인'}</p>
                    <p className="text-xs text-stone-400">{p.campaign?.type} · {p.campaign?.status}</p>
                  </div>
                  <Badge variant="secondary">{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settlements" className="mt-6">
          {settlements.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone-400">정산 내역이 없어요</p>
          ) : (
            <div className="space-y-2">
              {settlements.map(s => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4">
                  <Banknote className="h-5 w-5 text-stone-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.period || '기간 없음'}</p>
                    <p className="text-xs text-stone-400">{s.status}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{formatKrw(s.netAmount)}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
            <Construction className="h-8 w-8 text-stone-300" />
            <p className="text-sm text-stone-400">활동 로그는 PR 7에서 활성화돼요</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* 모달 */}
      <SuspendModal
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        targetName={creator.name}
        targetType="creator"
        onConfirm={async (p) => {
          await suspendCreator({ creatorId: creator.id, reason: p.reason })
          router.refresh()
        }}
      />
      <ReactivateModal
        open={reactivateOpen}
        onOpenChange={setReactivateOpen}
        targetName={creator.name}
        targetType="creator"
        currentReason={creator.suspendedReason}
        onConfirm={async (p) => {
          await reactivateCreator({ creatorId: creator.id, reason: p.reason })
          router.refresh()
        }}
      />
    </div>
  )
}
