'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { ViewToggle } from './ViewToggle'
import { CreatorFilter } from './CreatorFilter'
import { CreatorCard } from './CreatorCard'
import { CreatorTableRow } from './CreatorTableRow'
import { BulkActionBar } from './BulkActionBar'
import { InviteModal } from './InviteModal'
import { GroupSaveDialog } from './GroupSaveDialog'
import { ExportColumnsDialog } from './ExportColumnsDialog'
import type { CreatorWithIg } from './types'

function CreatorExplorerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [creators, setCreators] = useState<CreatorWithIg[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
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
  const [exportDialog, setExportDialog] = useState<{
    open: boolean
    creatorIds: string[]
  }>({ open: false, creatorIds: [] })

  const fetchCreators = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(searchParams.toString())
      if (!params.has('page')) params.set('page', '1')
      const res = await fetch(`/api/brand/creators?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setCreators(data.creators)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        setCurrentPage(data.page)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    fetchCreators()
  }, [fetchCreators])

  const handleViewChange = (v: 'card' | 'list') => {
    setViewMode(v)
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', v)
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
      setSelectedIds(new Set(creators.map(c => c.id)))
    }
  }

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`?${params.toString()}`)
  }

  const allSelected = creators.length > 0 && selectedIds.size === creators.length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">크리에이터 탐색</h1>
        <ViewToggle value={viewMode} onChange={handleViewChange} />
      </div>

      <CreatorFilter />

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
        onExport={() =>
          setExportDialog({ open: true, creatorIds: [...selectedIds] })
        }
        onClearSelection={() => setSelectedIds(new Set())}
      />

      <p className="text-sm text-muted-foreground mb-3">
        총 {total.toLocaleString()}명의 크리에이터
      </p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : creators.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">조건에 맞는 크리에이터가 없어요</p>
          <Button
            variant="link"
            onClick={() => {
              const view = searchParams.get('view')
              router.push(view ? `?view=${view}` : '?')
            }}
          >
            필터를 조금 풀어볼까요?
          </Button>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creators.map(c => (
            <CreatorCard
              key={c.id}
              creator={c}
              isSelected={selectedIds.has(c.id)}
              onSelect={toggleSelect}
              onPropose={(id, type) =>
                setProposalModal({ open: true, mode: 'single', creatorIds: [id], defaultType: type })
              }
              onSaveToGroup={id =>
                setGroupDialog({ open: true, creatorIds: [id] })
              }
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
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
              {creators.map(c => (
                <CreatorTableRow
                  key={c.id}
                  creator={c}
                  isSelected={selectedIds.has(c.id)}
                  onSelect={toggleSelect}
                  onPropose={(id, type) =>
                    setProposalModal({ open: true, mode: 'single', creatorIds: [id], defaultType: type })
                  }
                  onSaveToGroup={id =>
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
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let page: number
            if (totalPages <= 5) {
              page = i + 1
            } else if (currentPage <= 3) {
              page = i + 1
            } else if (currentPage >= totalPages - 2) {
              page = totalPages - 4 + i
            } else {
              page = currentPage - 2 + i
            }
            return (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => goToPage(page)}
              >
                {page}
              </Button>
            )
          })}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <InviteModal
        open={proposalModal.open}
        onOpenChange={open => setProposalModal(prev => ({ ...prev, open }))}
        mode={proposalModal.mode}
        creatorIds={proposalModal.creatorIds}
        defaultType={proposalModal.defaultType}
        onSuccess={() => {
          setSelectedIds(new Set())
          fetchCreators()
        }}
      />

      <GroupSaveDialog
        open={groupDialog.open}
        onOpenChange={open => setGroupDialog(prev => ({ ...prev, open }))}
        creatorIds={groupDialog.creatorIds}
        onSuccess={() => setSelectedIds(new Set())}
      />

      <ExportColumnsDialog
        open={exportDialog.open}
        onOpenChange={open => setExportDialog(prev => ({ ...prev, open }))}
        creatorIds={exportDialog.creatorIds}
      />
    </div>
  )
}

export function CreatorExplorerList() {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <CreatorExplorerContent />
    </Suspense>
  )
}
