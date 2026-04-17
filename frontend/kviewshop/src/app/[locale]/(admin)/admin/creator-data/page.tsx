'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Upload, User, BadgeCheck, MoreHorizontal, Pencil, Trash2,
  ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react'
import { formatFollowerCount } from '@/lib/utils/format'
import { toast } from 'sonner'

interface CreatorRow {
  id: string
  instagramHandle: string | null
  displayName: string | null
  igFollowers: number | null
  igFollowing: number | null
  igPostsCount: number | null
  igEngagementRate: number | null
  igCategory: string | null
  igVerified: boolean
  igTier: string | null
  igBio: string | null
  igExternalUrl: string | null
  igIsBusinessAccount: boolean
  igProfileImageR2Url: string | null
  igProfilePicUrl: string | null
  profileImageUrl: string | null
  profileImage: string | null
  igDataImportedAt: string | null
}

interface Stats {
  totalWithIg: number
  totalWithoutIg: number
  lastImportAt: string | null
}

interface TierCount {
  tier: string
  count: number
}

const TIER_COLORS: Record<string, string> = {
  MEGA: '#7c3aed',
  MACRO: '#2563eb',
  MICRO: '#059669',
  NANO: '#d97706',
  UNDER_1K: '#9ca3af',
}

export default function AdminCreatorDataPage() {
  const router = useRouter()
  const [creators, setCreators] = useState<CreatorRow[]>([])
  const [stats, setStats] = useState<Stats>({ totalWithIg: 0, totalWithoutIg: 0, lastImportAt: null })
  const [tierDistribution, setTierDistribution] = useState<TierCount[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [dataFilter, setDataFilter] = useState('all')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [editModal, setEditModal] = useState<{ open: boolean; creator: CreatorRow | null }>({ open: false, creator: null })
  const [editData, setEditData] = useState({
    igCategory: '', igFollowers: '', igEngagementRate: '', igTier: '', igVerified: false, igBio: '',
  })
  const [saving, setSaving] = useState(false)
  const [resetConfirm, setResetConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null })

  const fetchCreators = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (tierFilter !== 'all') params.set('tier', tierFilter)
    if (dataFilter !== 'all') params.set('hasIgData', dataFilter)
    params.set('page', String(page))
    params.set('limit', '50')

    try {
      const res = await fetch(`/api/admin/creators?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCreators(data.creators)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        setStats(data.stats)
        setTierDistribution(data.tierDistribution)
      }
    } catch {
      toast.error('데이터를 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }, [search, tierFilter, dataFilter, page])

  useEffect(() => { fetchCreators() }, [fetchCreators])

  const handleSearchChange = (val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(val)
      setPage(1)
    }, 300)
  }

  const openEditModal = (c: CreatorRow) => {
    setEditData({
      igCategory: c.igCategory || '',
      igFollowers: c.igFollowers != null ? String(c.igFollowers) : '',
      igEngagementRate: c.igEngagementRate != null ? String(c.igEngagementRate) : '',
      igTier: c.igTier || '',
      igVerified: c.igVerified,
      igBio: c.igBio || '',
    })
    setEditModal({ open: true, creator: c })
  }

  const handleSaveEdit = async () => {
    if (!editModal.creator) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/creators/${editModal.creator.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          igCategory: editData.igCategory || null,
          igFollowers: editData.igFollowers ? parseInt(editData.igFollowers) : null,
          igEngagementRate: editData.igEngagementRate ? parseFloat(editData.igEngagementRate) : null,
          igTier: editData.igTier || null,
          igVerified: editData.igVerified,
          igBio: editData.igBio || null,
        }),
      })
      if (res.ok) {
        toast.success('저장했습니다')
        setEditModal({ open: false, creator: null })
        fetchCreators()
      } else {
        const data = await res.json()
        toast.error(data.error || '저장 실패')
      }
    } catch {
      toast.error('저장 중 오류가 발생했습니다')
    } finally {
      setSaving(false)
    }
  }

  const confirmReset = async () => {
    if (!resetConfirm.id) return
    try {
      const res = await fetch(`/api/admin/creators/${resetConfirm.id}/ig-data`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('IG 데이터를 초기화했습니다')
        setResetConfirm({ open: false, id: null })
        fetchCreators()
      } else {
        toast.error('초기화 실패')
      }
    } catch {
      toast.error('초기화 중 오류가 발생했습니다')
    }
  }

  const totalTierCount = tierDistribution.reduce((s, t) => s + t.count, 0)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">크리에이터 데이터 관리</h1>
        <Button onClick={() => router.push('creator-data/import')}>
          <Upload className="h-4 w-4 mr-1" /> 데이터 임포트
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{stats.totalWithIg}</p>
          <p className="text-xs text-muted-foreground">IG 데이터 보유</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{stats.totalWithoutIg}</p>
          <p className="text-xs text-muted-foreground">IG 데이터 없음</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{stats.totalWithIg + stats.totalWithoutIg}</p>
          <p className="text-xs text-muted-foreground">전체 크리에이터</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-sm font-medium">
            {stats.lastImportAt ? new Date(stats.lastImportAt).toLocaleDateString('ko-KR') : '-'}
          </p>
          <p className="text-xs text-muted-foreground">마지막 임포트</p>
        </CardContent></Card>
      </div>

      {/* 티어 분포 */}
      {totalTierCount > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">팔로워 티어 분포</h3>
            <div className="flex gap-1 h-8 rounded overflow-hidden">
              {tierDistribution.filter(t => t.count > 0).map(t => (
                <div
                  key={t.tier}
                  className="flex items-center justify-center min-w-[40px]"
                  style={{
                    flex: t.count,
                    backgroundColor: TIER_COLORS[t.tier] || '#9ca3af',
                  }}
                >
                  <span className="text-[10px] text-white font-medium px-1 truncate">
                    {t.tier} ({t.count})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 필터 */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <Input
          placeholder="핸들/이름 검색..."
          defaultValue={search}
          onChange={e => handleSearchChange(e.target.value)}
          className="max-w-xs"
        />
        <Select value={tierFilter} onValueChange={v => { setTierFilter(v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="전체 티어" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 티어</SelectItem>
            <SelectItem value="MEGA">Mega (1M+)</SelectItem>
            <SelectItem value="MACRO">Macro (100K+)</SelectItem>
            <SelectItem value="MICRO">Micro (10K+)</SelectItem>
            <SelectItem value="NANO">Nano (1K+)</SelectItem>
            <SelectItem value="UNDER_1K">Under 1K</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dataFilter} onValueChange={v => { setDataFilter(v); setPage(1) }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="전체" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="true">IG 데이터 있음</SelectItem>
            <SelectItem value="false">IG 데이터 없음</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground mb-2">총 {total.toLocaleString()}명</p>

      {/* 테이블 */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : creators.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>조건에 맞는 크리에이터가 없습니다</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>크리에이터</TableHead>
                <TableHead className="text-right">팔로워</TableHead>
                <TableHead className="text-right">참여율</TableHead>
                <TableHead>티어</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>임포트일</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {creators.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={c.igProfileImageR2Url || c.igProfilePicUrl || c.profileImageUrl || c.profileImage || undefined} />
                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">
                            {c.instagramHandle ? `@${c.instagramHandle}` : c.displayName || '이름 없음'}
                          </span>
                          {c.igVerified && <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />}
                        </div>
                        {c.instagramHandle && c.displayName && (
                          <span className="text-xs text-muted-foreground">{c.displayName}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {c.igFollowers != null ? formatFollowerCount(c.igFollowers) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {c.igEngagementRate != null ? `${c.igEngagementRate.toFixed(1)}%` : '-'}
                  </TableCell>
                  <TableCell>
                    {c.igTier ? (
                      <Badge variant="secondary" className="text-xs">{c.igTier}</Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-xs max-w-[120px] truncate">
                    {c.igCategory || '-'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {c.igDataImportedAt ? new Date(c.igDataImportedAt).toLocaleDateString('ko-KR') : '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditModal(c)}>
                          <Pencil className="h-4 w-4 mr-2" /> 데이터 수정
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setResetConfirm({ open: true, id: c.id })}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> IG 데이터 초기화
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* 수정 모달 */}
      <Dialog open={editModal.open} onOpenChange={open => { if (!open) setEditModal({ open: false, creator: null }) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              크리에이터 데이터 수정
              {editModal.creator?.instagramHandle && ` — @${editModal.creator.instagramHandle}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>카테고리</Label>
              <Input value={editData.igCategory} onChange={e => setEditData(d => ({ ...d, igCategory: e.target.value }))} />
            </div>
            <div>
              <Label>팔로워 수</Label>
              <Input type="number" value={editData.igFollowers} onChange={e => setEditData(d => ({ ...d, igFollowers: e.target.value }))} />
            </div>
            <div>
              <Label>참여율 (%)</Label>
              <Input type="number" step="0.1" value={editData.igEngagementRate} onChange={e => setEditData(d => ({ ...d, igEngagementRate: e.target.value }))} />
            </div>
            <div>
              <Label>티어</Label>
              <Select value={editData.igTier} onValueChange={v => setEditData(d => ({ ...d, igTier: v }))}>
                <SelectTrigger><SelectValue placeholder="선택..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEGA">Mega</SelectItem>
                  <SelectItem value="MACRO">Macro</SelectItem>
                  <SelectItem value="MICRO">Micro</SelectItem>
                  <SelectItem value="NANO">Nano</SelectItem>
                  <SelectItem value="UNDER_1K">Under 1K</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editData.igVerified} onCheckedChange={v => setEditData(d => ({ ...d, igVerified: v }))} />
              <Label>인증 계정</Label>
            </div>
            <div>
              <Label>바이오</Label>
              <Textarea value={editData.igBio} onChange={e => setEditData(d => ({ ...d, igBio: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IG 데이터 초기화 확인 */}
      <AlertDialog open={resetConfirm.open} onOpenChange={open => { if (!open) setResetConfirm({ open: false, id: null }) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>IG 데이터를 초기화하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 크리에이터의 인스타그램 데이터(팔로워, 참여율, 프로필사진 등)가 모두 삭제됩니다.
              크리에이터 계정 자체는 유지됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              초기화
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
