'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import {
  Plus, Search, ChevronLeft, ChevronRight, Megaphone, Bell, Mail, MessageSquare,
} from 'lucide-react'
import { getBroadcastList } from '@/lib/actions/admin-broadcast'
import { toast } from 'sonner'

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  DRAFT: { label: '임시저장', className: 'bg-gray-100 text-gray-700' },
  SCHEDULED: { label: '예약', className: 'bg-blue-100 text-blue-800' },
  SENDING: { label: '발송중', className: 'bg-yellow-100 text-yellow-800' },
  COMPLETED: { label: '완료', className: 'bg-green-100 text-green-800' },
  FAILED: { label: '실패', className: 'bg-red-100 text-red-800' },
  CANCELLED: { label: '취소', className: 'bg-gray-100 text-gray-500' },
}

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  INFORMATIONAL: { label: '정보성', className: 'bg-blue-50 text-blue-700' },
  PROMOTIONAL: { label: '광고성', className: 'bg-orange-50 text-orange-700' },
}

function ChannelIcons({ channels }: { channels: string[] }) {
  return (
    <div className="flex gap-1">
      {channels.includes('IN_APP') && <Bell className="h-3.5 w-3.5 text-muted-foreground" />}
      {channels.includes('EMAIL') && <Mail className="h-3.5 w-3.5 text-muted-foreground" />}
      {channels.includes('KAKAO') && <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />}
    </div>
  )
}

interface BroadcastRow {
  id: string
  title: string
  type: string
  channels: string[]
  totalCount: number
  sentCount: number
  failedCount: number
  status: string
  createdAt: string
  startedAt: string | null
}

export default function BroadcastListPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<BroadcastRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const statusFilter = searchParams.get('status') || 'all'
  const typeFilter = searchParams.get('type') || 'all'
  const searchQuery = searchParams.get('q') || ''
  const pageNum = parseInt(searchParams.get('page') || '1', 10)
  const [searchInput, setSearchInput] = useState(searchQuery)

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v && v !== 'all' && v !== '1' && v !== '') params.set(k, v)
      else params.delete(k)
    })
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  useEffect(() => {
    let cancelled = false
    async function fetch() {
      setLoading(true)
      try {
        const res = await getBroadcastList({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          q: searchQuery || undefined,
          page: pageNum,
        })
        if (cancelled) return
        setItems(res.items as unknown as BroadcastRow[])
        setTotal(res.total)
        setTotalPages(res.totalPages)
      } catch {
        toast.error('공지 목록을 불러오지 못했어요')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [statusFilter, typeFilter, searchQuery, pageNum])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">공지 발송</h1>
          <p className="text-muted-foreground">인앱 + 이메일 + 알림톡으로 공지를 일괄 발송합니다</p>
        </div>
        <Button onClick={() => router.push('/ko/admin/broadcast/new')}>
          <Plus className="mr-2 h-4 w-4" />
          새 공지 작성
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Select value={statusFilter} onValueChange={v => updateParams({ status: v, page: '1' })}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="상태 전체" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">상태 전체</SelectItem>
                <SelectItem value="DRAFT">임시저장</SelectItem>
                <SelectItem value="SCHEDULED">예약</SelectItem>
                <SelectItem value="SENDING">발송중</SelectItem>
                <SelectItem value="COMPLETED">완료</SelectItem>
                <SelectItem value="FAILED">실패</SelectItem>
                <SelectItem value="CANCELLED">취소</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={v => updateParams({ type: v, page: '1' })}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="유형 전체" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">유형 전체</SelectItem>
                <SelectItem value="INFORMATIONAL">정보성</SelectItem>
                <SelectItem value="PROMOTIONAL">광고성</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input placeholder="제목 검색" value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && updateParams({ q: searchInput, page: '1' })} className="w-[200px]" />
              <Button variant="outline" size="icon" onClick={() => updateParams({ q: searchInput, page: '1' })}><Search className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">{statusFilter === 'all' ? '아직 발송한 공지가 없어요' : '조건에 맞는 공지가 없어요'}</p>
              {statusFilter === 'all' && <Button className="mt-3" onClick={() => router.push('/ko/admin/broadcast/new')}>첫 공지 작성하기</Button>}
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>제목</TableHead>
                      <TableHead>유형</TableHead>
                      <TableHead>채널</TableHead>
                      <TableHead className="text-right">대상</TableHead>
                      <TableHead className="text-right">성공/실패</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>발송일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(b => {
                      const st = STATUS_BADGE[b.status] ?? STATUS_BADGE.DRAFT
                      const tp = TYPE_BADGE[b.type] ?? TYPE_BADGE.INFORMATIONAL
                      return (
                        <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/ko/admin/broadcast/${b.id}`)}>
                          <TableCell className="font-medium max-w-[250px] truncate">{b.title}</TableCell>
                          <TableCell><Badge variant="outline" className={tp.className}>{tp.label}</Badge></TableCell>
                          <TableCell><ChannelIcons channels={b.channels} /></TableCell>
                          <TableCell className="text-right tabular-nums">{b.totalCount.toLocaleString()}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {b.status === 'SENDING' ? (
                              <div className="flex items-center gap-2 justify-end">
                                <Progress value={b.totalCount ? (b.sentCount / b.totalCount) * 100 : 0} className="w-16 h-2" />
                                <span className="text-xs">{b.totalCount ? Math.round((b.sentCount / b.totalCount) * 100) : 0}%</span>
                              </div>
                            ) : b.totalCount > 0 ? `${b.sentCount.toLocaleString()} / ${b.failedCount.toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell><Badge variant="outline" className={st.className}>{st.label}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{b.startedAt ? new Date(b.startedAt).toLocaleDateString('ko-KR') : new Date(b.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden divide-y">
                {items.map(b => {
                  const st = STATUS_BADGE[b.status] ?? STATUS_BADGE.DRAFT
                  const tp = TYPE_BADGE[b.type] ?? TYPE_BADGE.INFORMATIONAL
                  return (
                    <div key={b.id} className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/ko/admin/broadcast/${b.id}`)}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm truncate max-w-[200px]">{b.title}</span>
                        <Badge variant="outline" className={st.className}>{st.label}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className={`${tp.className} text-xs`}>{tp.label}</Badge>
                        <ChannelIcons channels={b.channels} />
                        <span>{b.totalCount.toLocaleString()}명</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 p-4 border-t">
                  <Button variant="outline" size="icon" disabled={pageNum <= 1} onClick={() => updateParams({ page: String(pageNum - 1) })}><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="text-sm text-muted-foreground">{pageNum} / {totalPages} ({total}건)</span>
                  <Button variant="outline" size="icon" disabled={pageNum >= totalPages} onClick={() => updateParams({ page: String(pageNum + 1) })}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
