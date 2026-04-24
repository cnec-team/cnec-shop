'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { HeroHeader } from './HeroHeader'
import { KpiCards } from './KpiCards'
import { CreatorMatchGrid } from './CreatorMatchGrid'
import { MatchSortDropdown } from './MatchSortDropdown'
import { ViewToggle } from '@/components/brand/ViewToggle'
import { CreatorFilter } from '@/components/brand/CreatorFilter'
import { BulkActionBar } from '@/components/brand/BulkActionBar'
import { InviteModal } from '@/components/brand/InviteModal'
import { GroupSaveDialog } from '@/components/brand/GroupSaveDialog'
import { CreatorTableRow } from '@/components/brand/CreatorTableRow'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useUpsellModal } from '@/lib/store/upsell'
import { toast } from 'sonner'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (res.status === 402) {
    const d = await res.json()
    if (d?.upsell) {
      const err = new Error('UPSELL_REQUIRED') as Error & { upsell: unknown; message402: string }
      err.upsell = d.upsell
      err.message402 = d.message ?? ''
      throw err
    }
  }
  if (!res.ok) throw new Error('API 요청 실패')
  return res.json()
}

function CreatorExplorerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'card' | 'list'>(
    (searchParams.get('view') as 'card' | 'list') || 'card'
  )
  const [proposalModal, setProposalModal] = useState<{
    open: boolean
    mode: 'single' | 'bulk'
    creatorIds: string[]
    defaultType?: 'GONGGU' | 'PRODUCT_PICK'
  }>({ open: false, mode: 'single', creatorIds: [] })
  const [groupDialog, setGroupDialog] = useState<{
    open: boolean
    creatorIds: string[]
  }>({ open: false, creatorIds: [] })

  // Sort 상태는 URL에서 관리
  const sort = searchParams.get('sort') || 'matchScore'
  const page = parseInt(searchParams.get('page') || '1', 10)

  // 기존 필터 파라미터를 그대로 활용
  const qs = searchParams.toString()

  // sort가 없으면 matchScore 기본값 추가
  const apiUrl = qs.includes('sort=')
    ? `/api/brand/creators?${qs}`
    : `/api/brand/creators?${qs}${qs ? '&' : ''}sort=matchScore`

  const { open: openUpsell } = useUpsellModal()

  const { data, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    onError: (err: Error & { upsell?: unknown; message402?: string }) => {
      if (err?.upsell) {
        openUpsell(err.upsell as import('@/lib/pricing/v3/errors').UpsellContext)
        if (err.message402) toast.error(err.message402)
      }
    },
  })

  const creators = data?.creators ?? []
  const total = data?.total ?? 0
  const totalAll = data?.totalAll ?? 0
  const totalPages = data?.totalPages ?? 0
  const kpi = data?.kpi ?? { avgMatchScore: 0, recentUpdatedCount: 0, avgEr: 0 }

  const handleViewChange = (v: 'card' | 'list') => {
    setViewMode(v)
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', v)
    router.push(`?${params.toString()}`)
  }

  const handleSortChange = (v: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', v)
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === creators.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(creators.map((c: any) => c.id)))
    }
  }

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`?${params.toString()}`)
  }

  const resetFilters = () => {
    const view = searchParams.get('view')
    router.push(view ? `?view=${view}&sort=matchScore` : '?sort=matchScore')
  }

  const allSelected = creators.length > 0 && selectedIds.size === creators.length

  return (
    <div className="min-h-screen bg-white">
      {/* 히어로 + KPI */}
      <section className="border-b border-stone-200">
        <div className="mx-auto max-w-[1400px] px-6 py-8">
          <HeroHeader totalCreatorCount={totalAll} onRefresh={() => mutate()} />
          <div className="mt-6">
            <KpiCards
              avgMatchScore={kpi.avgMatchScore}
              recentUpdatedCount={kpi.recentUpdatedCount}
              avgEr={kpi.avgEr}
            />
          </div>
        </div>
      </section>

      {/* 필터 */}
      <section className="border-b border-stone-200 bg-stone-50/50">
        <div className="mx-auto max-w-[1400px] px-6 py-4">
          <CreatorFilter />
        </div>
      </section>

      {/* 결과 */}
      <section>
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          {/* 벌크 액션바 */}
          <BulkActionBar
            selectedCount={selectedIds.size}
            onProposeBulk={() =>
              setProposalModal({ open: true, mode: 'bulk', creatorIds: [...selectedIds] })
            }
            onProductPickBulk={() =>
              setProposalModal({ open: true, mode: 'bulk', creatorIds: [...selectedIds], defaultType: 'PRODUCT_PICK' })
            }
            onAddToGroup={() =>
              setGroupDialog({ open: true, creatorIds: [...selectedIds] })
            }
            onClearSelection={() => setSelectedIds(new Set())}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm text-stone-600 tabular-nums">
              총{' '}
              <span className="font-semibold text-stone-900">{total.toLocaleString()}</span>
              명 중{' '}
              <span className="font-semibold text-stone-900">{creators.length}</span>
              명 표시
            </p>
            <div className="flex items-center gap-2">
              <ViewToggle value={viewMode} onChange={handleViewChange} />
              <MatchSortDropdown value={sort} onChange={handleSortChange} />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-[380px] rounded-xl" />
              ))}
            </div>
          ) : viewMode === 'card' ? (
            <CreatorMatchGrid
              creators={creators}
              totalAllCount={totalAll}
              totalFilteredCount={total}
              selectedIds={[...selectedIds]}
              onToggleSelect={toggleSelect}
              onResetFilters={resetFilters}
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-stone-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                    </TableHead>
                    <TableHead>계정</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>CNEC</TableHead>
                    <TableHead className="text-right">협업</TableHead>
                    <TableHead>발송</TableHead>
                    <TableHead className="text-right">팔로워</TableHead>
                    <TableHead className="text-right">ER</TableHead>
                    <TableHead className="text-right">게시물</TableHead>
                    <TableHead>액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creators.map((c: any) => (
                    <CreatorTableRow
                      key={c.id}
                      creator={c}
                      isSelected={selectedIds.has(c.id)}
                      onSelect={toggleSelect}
                      onPropose={(id: string, type: 'GONGGU' | 'PRODUCT_PICK') =>
                        setProposalModal({ open: true, mode: 'single', creatorIds: [id], defaultType: type })
                      }
                      onSaveToGroup={(id: string) =>
                        setGroupDialog({ open: true, creatorIds: [id] })
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p: number
                if (totalPages <= 5) p = i + 1
                else if (page <= 3) p = i + 1
                else if (page >= totalPages - 2) p = totalPages - 4 + i
                else p = page - 2 + i
                return (
                  <Button key={p} variant={page === p ? 'default' : 'outline'} size="sm" onClick={() => goToPage(p)}>
                    {p}
                  </Button>
                )
              })}
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      <InviteModal
        open={proposalModal.open}
        onOpenChange={open => setProposalModal(prev => ({ ...prev, open }))}
        mode={proposalModal.mode}
        creatorIds={proposalModal.creatorIds}
        defaultType={proposalModal.defaultType}
        onSuccess={() => {
          setSelectedIds(new Set())
          mutate()
        }}
      />

      <GroupSaveDialog
        open={groupDialog.open}
        onOpenChange={open => setGroupDialog(prev => ({ ...prev, open }))}
        creatorIds={groupDialog.creatorIds}
        onSuccess={() => setSelectedIds(new Set())}
      />
    </div>
  )
}

export function CreatorExplorerPageClient() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-[1400px] px-6 py-8 space-y-4">
        <Skeleton className="h-8 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-[380px] rounded-xl" />
          ))}
        </div>
      </div>
    }>
      <CreatorExplorerContent />
    </Suspense>
  )
}
