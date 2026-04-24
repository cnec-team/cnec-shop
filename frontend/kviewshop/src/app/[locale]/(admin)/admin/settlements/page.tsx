'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Clock, CircleDollarSign, Pause, Ban, Download, Search, ChevronLeft, ChevronRight, Receipt, X,
} from 'lucide-react'
import { formatCurrency } from '@/lib/i18n/config'
import {
  getAdminSettlementList,
  getSettlementSummary,
  getSettlementBrands,
  getAdminSettlementsForExport,
  bulkHoldSettlements,
} from '@/lib/actions/admin-settlements'
import { toast } from 'sonner'

// ==================== Status Helpers ====================

const STATUS_TABS = [
  { value: 'all', label: '전체' },
  { value: 'PENDING', label: '지급대기' },
  { value: 'HOLD', label: '보류' },
  { value: 'PAID', label: '지급완료' },
  { value: 'CANCELLED', label: '취소' },
] as const

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING: { label: '지급대기', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  PAID: { label: '지급완료', className: 'bg-green-100 text-green-800 border-green-200' },
  HOLD: { label: '보류', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  CANCELLED: { label: '취소', className: 'bg-gray-100 text-gray-600 border-gray-200' },
}

function getStatusBadge(status: string) {
  const s = STATUS_BADGE[status] ?? STATUS_BADGE['PENDING']
  return <Badge variant="outline" className={s.className}>{s.label}</Badge>
}

function getRecipientName(settlement: SettlementRow): string {
  return settlement.user?.brand?.brandName
    ?? settlement.user?.creator?.displayName
    ?? settlement.user?.creator?.username
    ?? settlement.user?.name
    ?? '-'
}

function getRecipientLogo(settlement: SettlementRow): string | null {
  return settlement.user?.brand?.logoUrl ?? null
}

// ==================== Types ====================

interface SettlementRow {
  id: string
  status: string
  netAmount: unknown
  totalSales: unknown
  grossCommission: unknown
  periodStart: string | null
  periodEnd: string | null
  paidAt: string | null
  createdAt: string
  user?: {
    id: string
    name: string | null
    role: string | null
    brand?: { id: string; brandName: string | null; logoUrl: string | null } | null
    creator?: { id: string; displayName: string | null; username: string | null } | null
  } | null
}

interface Summary {
  pending: { count: number; amount: number }
  hold: { count: number; amount: number }
  paidThisMonth: { count: number; amount: number }
  cancelledThisMonth: number
}

// ==================== Page ====================

export default function AdminSettlementsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State
  const [loading, setLoading] = useState(true)
  const [settlements, setSettlements] = useState<SettlementRow[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [brands, setBrands] = useState<{ userId: string; brandName: string | null }[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkHoldOpen, setBulkHoldOpen] = useState(false)
  const [bulkReason, setBulkReason] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  // Filters from URL
  const statusFilter = (searchParams.get('status') as string) || 'all'
  const brandFilter = searchParams.get('brand') || 'all'
  const sortFilter = (searchParams.get('sort') as string) || 'createdAt'
  const searchQuery = searchParams.get('q') || ''
  const periodPreset = searchParams.get('period') || 'all'
  const pageNum = parseInt(searchParams.get('page') || '1', 10)

  // Period range calculation
  const periodRange = useMemo(() => {
    const now = new Date()
    if (periodPreset === 'thisMonth') {
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
      }
    }
    if (periodPreset === 'lastMonth') {
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10),
        end: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10),
      }
    }
    return { start: undefined, end: undefined }
  }, [periodPreset])

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v && v !== 'all' && v !== '1' && v !== '') {
        params.set(k, v)
      } else {
        params.delete(k)
      }
    })
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  // Fetch data
  useEffect(() => {
    let cancelled = false
    async function fetch() {
      setLoading(true)
      try {
        const [listRes, summaryRes] = await Promise.all([
          getAdminSettlementList({
            status: statusFilter as 'all' | 'PENDING' | 'PAID' | 'HOLD' | 'CANCELLED',
            brandId: brandFilter !== 'all' ? brandFilter : undefined,
            sort: sortFilter as 'createdAt' | 'amount' | 'brandName',
            q: searchQuery || undefined,
            periodStart: periodRange.start,
            periodEnd: periodRange.end,
            page: pageNum,
            pageSize: 20,
          }),
          getSettlementSummary(),
        ])
        if (cancelled) return
        setSettlements(listRes.items as unknown as SettlementRow[])
        setTotal(listRes.total)
        setTotalPages(listRes.totalPages)
        setSummary(summaryRes)
      } catch (err) {
        console.error(err)
        toast.error('정산 목록을 불러오지 못했어요')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [statusFilter, brandFilter, sortFilter, searchQuery, pageNum, periodRange.start, periodRange.end])

  // Fetch brands once
  useEffect(() => {
    getSettlementBrands().then(setBrands).catch(() => {})
  }, [])

  // Selection
  const allSelected = settlements.length > 0 && settlements.every(s => selected.has(s.id))
  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(settlements.map(s => s.id)))
    }
  }
  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  // CSV Export
  const handleCSV = async () => {
    try {
      const data = await getAdminSettlementsForExport({
        status: statusFilter as 'all' | 'PENDING' | 'PAID' | 'HOLD' | 'CANCELLED',
        brandId: brandFilter !== 'all' ? brandFilter : undefined,
        q: searchQuery || undefined,
        periodStart: periodRange.start,
        periodEnd: periodRange.end,
      })
      if (data.length === 0) { toast.error('내보낼 데이터가 없어요'); return }

      const headers = ['정산ID', '브랜드명', '대상기간 시작', '대상기간 종료', 'GMV', '수수료', '정산액', '상태', '지급일시', '메모']
      const rows = data.map(s => [
        s.id, s.recipientName, s.periodStart, s.periodEnd,
        s.totalSales.toString(), s.grossCommission.toString(), s.netAmount.toString(),
        s.status, s.paidAt, s.paidMemo,
      ])
      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `정산내역_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV 파일이 다운로드됐어요')
    } catch {
      toast.error('CSV 다운로드에 실패했어요')
    }
  }

  // Bulk hold
  const handleBulkHold = async () => {
    if (bulkReason.length < 20) { toast.error('사유는 최소 20자 이상 입력해주세요'); return }
    setBulkLoading(true)
    try {
      const res = await bulkHoldSettlements({ settlementIds: Array.from(selected), reason: bulkReason })
      if (res.failed.length === 0) {
        toast.success(`${res.success.length}건 모두 보류되었어요`)
      } else if (res.success.length > 0) {
        toast.warning(`${res.success.length}건 성공 / ${res.failed.length}건 실패`)
      } else {
        toast.error('보류에 실패했어요')
      }
      setBulkHoldOpen(false)
      setBulkReason('')
      setSelected(new Set())
      // refresh
      updateParams({ _t: Date.now().toString() })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했어요')
    } finally {
      setBulkLoading(false)
    }
  }

  // Pending-only selection filter
  const selectedPendingIds = useMemo(
    () => Array.from(selected).filter(id => {
      const s = settlements.find(x => x.id === id)
      return s?.status === 'PENDING'
    }),
    [selected, settlements]
  )

  // Search
  const [searchInput, setSearchInput] = useState(searchQuery)
  const handleSearch = () => updateParams({ q: searchInput, page: '1' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">정산 관리</h1>
          <p className="text-muted-foreground">정산 지급/보류/취소를 관리합니다</p>
        </div>
        <Button variant="outline" onClick={handleCSV}>
          <Download className="mr-2 h-4 w-4" />
          CSV 다운로드
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">지급 대기</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-blue-600">
                {formatCurrency(summary.pending.amount, 'KRW')}
              </div>
              <p className="text-xs text-muted-foreground">{summary.pending.count}건</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">보류</CardTitle>
              <Pause className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-orange-600">
                {formatCurrency(summary.hold.amount, 'KRW')}
              </div>
              <p className="text-xs text-muted-foreground">{summary.hold.count}건</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">이번 달 지급 완료</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-green-600">
                {formatCurrency(summary.paidThisMonth.amount, 'KRW')}
              </div>
              <p className="text-xs text-muted-foreground">{summary.paidThisMonth.count}건</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">이번 달 취소</CardTitle>
              <Ban className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{summary.cancelledThisMonth}건</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Status tabs */}
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map(tab => (
                <Button
                  key={tab.value}
                  variant={statusFilter === tab.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateParams({ status: tab.value, page: '1' })}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Other filters */}
            <div className="flex flex-wrap gap-3">
              <Select value={brandFilter} onValueChange={v => updateParams({ brand: v, page: '1' })}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="브랜드 전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">브랜드 전체</SelectItem>
                  {brands.map(b => (
                    <SelectItem key={b.userId} value={b.userId}>{b.brandName ?? '이름 없음'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={periodPreset} onValueChange={v => updateParams({ period: v, page: '1' })}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="기간 전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">기간 전체</SelectItem>
                  <SelectItem value="thisMonth">이번 달</SelectItem>
                  <SelectItem value="lastMonth">지난 달</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortFilter} onValueChange={v => updateParams({ sort: v })}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">최신순</SelectItem>
                  <SelectItem value="amount">금액순</SelectItem>
                  <SelectItem value="brandName">브랜드명순</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Input
                  placeholder="브랜드명 / 정산 ID 검색"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-[250px]"
                />
                <Button variant="outline" size="icon" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk action toolbar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selected.size}건 선택됨</span>
          {selectedPendingIds.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setBulkHoldOpen(true)}>
              <Pause className="mr-1 h-3 w-3" />
              일괄 보류 ({selectedPendingIds.length}건)
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            <X className="mr-1 h-3 w-3" />
            선택 해제
          </Button>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
          ) : settlements.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                {statusFilter === 'all' ? '아직 정산 내역이 없어요' : '조건에 맞는 정산이 없어요'}
              </p>
              {statusFilter !== 'all' && (
                <Button variant="link" className="mt-2" onClick={() => updateParams({ status: 'all', page: '1' })}>
                  필터 초기화
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                      </TableHead>
                      <TableHead>정산 ID</TableHead>
                      <TableHead>브랜드</TableHead>
                      <TableHead>대상 기간</TableHead>
                      <TableHead className="text-right">정산액</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>생성일</TableHead>
                      <TableHead className="text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlements.map(s => (
                      <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/ko/admin/settlements/${s.id}`)}>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleOne(s.id)} />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{s.id.slice(-8)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRecipientLogo(s) && (
                              <img src={getRecipientLogo(s)!} alt="" className="h-6 w-6 rounded-full object-cover" />
                            )}
                            <span className="font-medium">{getRecipientName(s)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {s.periodStart && s.periodEnd
                            ? `${new Date(s.periodStart).toLocaleDateString('ko-KR')} ~ ${new Date(s.periodEnd).toLocaleDateString('ko-KR')}`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums">
                          {formatCurrency(Number(s.netAmount), 'KRW')}
                        </TableCell>
                        <TableCell>{getStatusBadge(s.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(s.createdAt).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); router.push(`/ko/admin/settlements/${s.id}`) }}>
                            상세
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y">
                {settlements.map(s => (
                  <div
                    key={s.id}
                    className="p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/ko/admin/settlements/${s.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getRecipientLogo(s) && (
                          <img src={getRecipientLogo(s)!} alt="" className="h-5 w-5 rounded-full object-cover" />
                        )}
                        <span className="font-medium text-sm">{getRecipientName(s)}</span>
                      </div>
                      {getStatusBadge(s.status)}
                    </div>
                    <div className="text-xl font-bold tabular-nums mb-1">
                      {formatCurrency(Number(s.netAmount), 'KRW')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.periodStart && s.periodEnd
                        ? `${new Date(s.periodStart).toLocaleDateString('ko-KR')} ~ ${new Date(s.periodEnd).toLocaleDateString('ko-KR')}`
                        : '-'}
                      {' / '}
                      {new Date(s.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 p-4 border-t">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={pageNum <= 1}
                    onClick={() => updateParams({ page: String(pageNum - 1) })}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {pageNum} / {totalPages} ({total}건)
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={pageNum >= totalPages}
                    onClick={() => updateParams({ page: String(pageNum + 1) })}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Bulk Hold Modal */}
      <Dialog open={bulkHoldOpen} onOpenChange={setBulkHoldOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPendingIds.length}건 일괄 보류</DialogTitle>
            <DialogDescription>선택된 PENDING 정산을 일괄 보류합니다</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-40 overflow-y-auto space-y-1 rounded border p-3">
              {selectedPendingIds.map(id => {
                const s = settlements.find(x => x.id === id)
                return s ? (
                  <div key={id} className="flex justify-between text-sm">
                    <span>{getRecipientName(s)}</span>
                    <span className="font-bold tabular-nums">{formatCurrency(Number(s.netAmount), 'KRW')}</span>
                  </div>
                ) : null
              })}
            </div>
            <div>
              <label className="text-sm font-medium">보류 사유 (최소 20자)</label>
              <Textarea
                value={bulkReason}
                onChange={e => setBulkReason(e.target.value)}
                placeholder="모든 선택된 정산에 동일한 사유가 적용됩니다"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">{bulkReason.length}/20자</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkHoldOpen(false)}>취소</Button>
            <Button
              onClick={handleBulkHold}
              disabled={bulkReason.length < 20 || bulkLoading}
            >
              {bulkLoading ? '처리 중...' : '보류 실행'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
