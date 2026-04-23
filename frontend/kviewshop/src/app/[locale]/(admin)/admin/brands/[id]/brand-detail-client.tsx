'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
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
  Building2,
  MoreVertical,
  Ban,
  CheckCircle,
  Percent,
  UserCog,
  AlertTriangle,
  Construction,
  ShoppingCart,
  Megaphone,
  Banknote,
} from 'lucide-react'
import { SuspendModal } from '@/components/admin/modals/suspend-modal'
import { ReactivateModal } from '@/components/admin/modals/reactivate-modal'
import { CommissionModal } from '@/components/admin/modals/commission-modal'
import { suspendBrand, reactivateBrand, updateBrandCommissionRate } from '@/lib/actions/admin-brands'

type BrandDetailData = Awaited<ReturnType<typeof import('@/lib/actions/admin-brands').getAdminBrandDetailV2>>

function formatKrw(amount: number) {
  return '₩' + amount.toLocaleString()
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'SUSPENDED') return <Badge variant="destructive">정지</Badge>
  if (status === 'APPROVED' || status === 'ACTIVE') return <Badge className="bg-emerald-100 text-emerald-700">활성</Badge>
  return <Badge variant="secondary">심사 중</Badge>
}

export function BrandDetailClient({ data }: { data: BrandDetailData }) {
  const router = useRouter()
  const { brand, kpi, campaigns, products, settlements } = data
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [reactivateOpen, setReactivateOpen] = useState(false)
  const [commissionOpen, setCommissionOpen] = useState(false)

  const status = brand.suspendedAt ? 'SUSPENDED' : brand.approved ? 'APPROVED' : 'PENDING'

  return (
    <div className="space-y-6">
      <AdminBreadcrumb items={[
        { href: '/admin', label: '어드민' },
        { href: '/admin/brands', label: '브랜드 관리' },
        { label: brand.name },
      ]} />

      {/* 정지 배너 */}
      {brand.suspendedAt && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">이 브랜드는 정지 상태예요</p>
            <p className="mt-0.5 text-xs text-red-600">
              사유: {brand.suspendedReason || '없음'}
              {' · '}
              정지일: {new Date(brand.suspendedAt).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-stone-100">
            {brand.logoUrl ? (
              <Image src={brand.logoUrl} alt={brand.name} width={56} height={56} className="rounded-xl object-cover" />
            ) : (
              <Building2 className="h-7 w-7 text-stone-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-stone-900">{brand.name}</h1>
              <StatusBadge status={status} />
            </div>
            <p className="text-sm text-stone-500">{brand.businessNumber || '사업자번호 없음'}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon"><MoreVertical className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setCommissionOpen(true)}>
              <Percent className="mr-2 h-4 w-4" />수수료율 조정
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {brand.suspendedAt ? (
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
          <TabsTrigger value="campaigns">캠페인</TabsTrigger>
          <TabsTrigger value="products">상품</TabsTrigger>
          <TabsTrigger value="settlements">정산</TabsTrigger>
          <TabsTrigger value="activity">활동 로그</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* KPI */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-xs text-stone-500">이번 달 GMV</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{formatKrw(kpi.monthGmv)}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-xs text-stone-500">주문 수</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{kpi.totalOrders}건</p>
              <p className="mt-0.5 text-xs text-stone-400">평균 {formatKrw(kpi.avgOrderValue)}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-xs text-stone-500">활성 캠페인</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{kpi.activeCampaigns}개</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-xs text-stone-500">대기 정산</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{kpi.pendingSettlements}건</p>
            </div>
          </div>

          {/* 수수료 */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-stone-500">크리에이터 수수료율</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{brand.commissionRate}%</p>
                {brand.isCustomRate && (
                  <Badge className="mt-1 bg-amber-100 text-amber-700">커스텀 수수료율</Badge>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setCommissionOpen(true)}>
                <Percent className="mr-1.5 h-3.5 w-3.5" />조정
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6">
          {campaigns.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone-400">캠페인이 없어요</p>
          ) : (
            <div className="space-y-2">
              {campaigns.map(c => (
                <Link key={c.id} href={`/admin/campaigns`} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 transition-colors hover:bg-stone-50">
                  <Megaphone className="h-5 w-5 text-stone-400" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-stone-400">{c.type} · {c.status}</p>
                  </div>
                  <Badge variant="secondary">{c.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          {products.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone-400">상품이 없어요</p>
          ) : (
            <div className="space-y-2">
              {products.map(p => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4">
                  <ShoppingCart className="h-5 w-5 text-stone-400" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-stone-400">재고 {p.stock} · {p.status}</p>
                  </div>
                  {p.salePrice && <span className="text-sm tabular-nums">{formatKrw(p.salePrice)}</span>}
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
        targetName={brand.name}
        targetType="brand"
        activeCampaigns={kpi.activeCampaigns}
        onConfirm={async (p) => {
          await suspendBrand({ brandId: brand.id, reason: p.reason, autoStopCampaigns: p.autoStopCampaigns })
          router.refresh()
        }}
      />
      <ReactivateModal
        open={reactivateOpen}
        onOpenChange={setReactivateOpen}
        targetName={brand.name}
        targetType="brand"
        currentReason={brand.suspendedReason}
        onConfirm={async (p) => {
          await reactivateBrand({ brandId: brand.id, reason: p.reason })
          router.refresh()
        }}
      />
      <CommissionModal
        open={commissionOpen}
        onOpenChange={setCommissionOpen}
        brandName={brand.name}
        currentRate={brand.commissionRate}
        onConfirm={async (p) => {
          await updateBrandCommissionRate({ brandId: brand.id, newRate: p.newRate, reason: p.reason })
          router.refresh()
        }}
      />
    </div>
  )
}
