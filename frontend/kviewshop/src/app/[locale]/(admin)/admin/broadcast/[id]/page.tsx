'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AdminBreadcrumb } from '@/components/admin/admin-breadcrumb'
import {
  Bell, Mail, MessageSquare, Clock, AlertTriangle, Ban,
  MoreHorizontal, ChevronLeft, Play, Trash2, Pencil,
  Send, Users, CheckCircle2, XCircle, SkipForward, Loader2,
} from 'lucide-react'
import {
  getBroadcastDetail,
  cancelBroadcast,
  sendBroadcast,
  deleteBroadcast,
} from '@/lib/actions/admin-broadcast'
import { toast } from 'sonner'

// ==================== Types ====================

interface Broadcast {
  id: string
  title: string
  type: string
  status: string
  channels: string[]
  targetType: string
  totalCount: number
  sentCount: number
  failedCount: number
  lastError: string | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  scheduledAt: string | null
  content?: {
    inApp?: { title?: string; body?: string }
    email?: { subject?: string; html?: string }
    kakao?: { templateId?: string; variables?: Record<string, string> }
  }
}

interface FailureEntry {
  userId: string
  error: string
}

interface AuditEntry {
  id: string
  action: string
  reason: string | null
  createdAt: string
}

// ==================== Constants ====================

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  DRAFT: { label: '임시저장', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  SCHEDULED: { label: '예약', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  SENDING: { label: '발송중', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  COMPLETED: { label: '완료', className: 'bg-green-100 text-green-800 border-green-200' },
  FAILED: { label: '실패', className: 'bg-red-100 text-red-800 border-red-200' },
  CANCELLED: { label: '취소', className: 'bg-gray-100 text-gray-500 border-gray-200' },
}

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  INFORMATIONAL: { label: '정보성', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  PROMOTIONAL: { label: '광고성', className: 'bg-orange-50 text-orange-700 border-orange-200' },
}

const TARGET_LABELS: Record<string, string> = {
  ALL: '전체 회원',
  CREATORS: '크리에이터',
  BRANDS: '브랜드',
  BUYERS: '구매자',
  CUSTOM: '커스텀 대상',
}

const CHANNEL_INFO: Record<string, { label: string; icon: typeof Bell }> = {
  IN_APP: { label: '인앱', icon: Bell },
  EMAIL: { label: '이메일', icon: Mail },
  KAKAO: { label: '알림톡', icon: MessageSquare },
}

const ACTION_LABELS: Record<string, string> = {
  BROADCAST_CREATED: '공지 생성',
  BROADCAST_UPDATED: '공지 수정',
  BROADCAST_SCHEDULED: '발송 예약',
  BROADCAST_STARTED: '발송 시작',
  BROADCAST_COMPLETED: '발송 완료',
  BROADCAST_FAILED: '발송 실패',
  BROADCAST_CANCELLED: '발송 취소',
  BROADCAST_RETRY: '재시도',
  BROADCAST_DELETED: '삭제',
}

// ==================== Helpers ====================

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start || !end) return '-'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 0) return '-'
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}초`
  const min = Math.floor(sec / 60)
  const remainSec = sec % 60
  if (min < 60) return `${min}분 ${remainSec}초`
  const hr = Math.floor(min / 60)
  const remainMin = min % 60
  return `${hr}시간 ${remainMin}분`
}

function ChannelIcon({ channel }: { channel: string }) {
  const info = CHANNEL_INFO[channel]
  if (!info) return null
  const Icon = info.icon
  return <Icon className="h-4 w-4" />
}

// ==================== Page ====================

export default function BroadcastDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [broadcast, setBroadcast] = useState<Broadcast | null>(null)
  const [stats, setStats] = useState<Record<string, number>>({})
  const [recentFailures, setRecentFailures] = useState<FailureEntry[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [cancelOpen, setCancelOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [retrying, setRetrying] = useState(false)

  // Auto-refresh ref
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const data = await getBroadcastDetail(id)
      setBroadcast(data.broadcast as unknown as Broadcast)
      setStats((data.stats ?? {}) as Record<string, number>)
      setRecentFailures((data.recentFailures ?? []) as unknown as FailureEntry[])
      setAuditLogs((data.auditLogs ?? []) as unknown as AuditEntry[])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '공지 상세를 불러오지 못했어요')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-refresh when SENDING
  useEffect(() => {
    if (broadcast?.status === 'SENDING') {
      intervalRef.current = setInterval(() => {
        fetchData()
      }, 10000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [broadcast?.status, fetchData])

  // Handlers
  const handleRetry = async () => {
    if (!broadcast) return
    setRetrying(true)
    try {
      const idempotencyKey = `retry-${broadcast.id}-${Date.now()}`
      await sendBroadcast(broadcast.id, idempotencyKey)
      toast.success('재발송을 시작했어요')
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '재발송에 실패했어요')
    } finally {
      setRetrying(false)
    }
  }

  const handleDelete = async () => {
    if (!broadcast) return
    try {
      await deleteBroadcast(broadcast.id)
      toast.success('공지가 삭제되었어요')
      router.push('/ko/admin/broadcast')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제에 실패했어요')
    }
  }

  if (loading) return <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
  if (!broadcast) return <div className="text-center py-12 text-muted-foreground">공지를 찾을 수 없어요</div>

  const statusInfo = STATUS_BADGE[broadcast.status] ?? STATUS_BADGE.DRAFT
  const typeInfo = TYPE_BADGE[broadcast.type] ?? TYPE_BADGE.INFORMATIONAL
  const progressPercent = broadcast.totalCount > 0
    ? Math.round((broadcast.sentCount / broadcast.totalCount) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <AdminBreadcrumb items={[
        { href: '/admin', label: '어드민' },
        { href: '/admin/broadcast', label: '공지 발송' },
        { label: broadcast.title },
      ]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/ko/admin/broadcast')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{broadcast.title}</h1>
          <Badge variant="outline" className={typeInfo.className}>{typeInfo.label}</Badge>
          <Badge variant="outline" className={statusInfo.className}>{statusInfo.label}</Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreHorizontal className="mr-2 h-4 w-4" />
              액션
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {broadcast.status === 'DRAFT' && (
              <>
                <DropdownMenuItem onClick={() => router.push(`/ko/admin/broadcast/new?edit=${broadcast.id}`)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  편집
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </DropdownMenuItem>
              </>
            )}
            {broadcast.status === 'SCHEDULED' && (
              <DropdownMenuItem onClick={() => setCancelOpen(true)} className="text-red-600">
                <Ban className="mr-2 h-4 w-4" />
                예약 취소
              </DropdownMenuItem>
            )}
            {broadcast.status === 'SENDING' && (
              <DropdownMenuItem onClick={() => setCancelOpen(true)} className="text-red-600">
                <Ban className="mr-2 h-4 w-4" />
                발송 중단
              </DropdownMenuItem>
            )}
            {broadcast.status === 'FAILED' && (
              <DropdownMenuItem onClick={handleRetry} disabled={retrying}>
                <Play className="mr-2 h-4 w-4" />
                재시도
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status Banners */}
      {broadcast.status === 'SENDING' && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Loader2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0 animate-spin" />
          <div className="flex-1">
            <p className="font-medium text-blue-800">발송이 진행 중이에요</p>
            <div className="flex items-center gap-3 mt-2">
              <Progress value={progressPercent} className="flex-1 h-2" />
              <span className="text-sm font-medium text-blue-700 tabular-nums">{progressPercent}%</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {broadcast.sentCount.toLocaleString()} / {broadcast.totalCount.toLocaleString()}건 완료 (10초마다 자동 새로고침)
            </p>
          </div>
        </div>
      )}
      {broadcast.status === 'FAILED' && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-red-800">발송에 실패했어요</p>
            {broadcast.lastError && (
              <p className="text-sm text-red-700 mt-1">{broadcast.lastError}</p>
            )}
          </div>
        </div>
      )}
      {broadcast.status === 'CANCELLED' && (
        <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <Ban className="h-5 w-5 text-gray-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-gray-700">발송이 취소되었어요</p>
            {broadcast.lastError && (
              <p className="text-sm text-gray-600 mt-1">{broadcast.lastError}</p>
            )}
          </div>
        </div>
      )}

      {/* Main content: 2-column layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left - Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Broadcast info card */}
          <Card>
            <CardHeader>
              <CardTitle>발송 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">제목</dt>
                  <dd className="font-medium mt-1">{broadcast.title}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">유형</dt>
                  <dd className="mt-1">
                    <Badge variant="outline" className={typeInfo.className}>{typeInfo.label}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">발송 채널</dt>
                  <dd className="mt-1 flex items-center gap-2">
                    {broadcast.channels.map(ch => {
                      const info = CHANNEL_INFO[ch]
                      if (!info) return null
                      return (
                        <span key={ch} className="inline-flex items-center gap-1 text-sm">
                          <ChannelIcon channel={ch} />
                          {info.label}
                        </span>
                      )
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">발송 대상</dt>
                  <dd className="font-medium mt-1 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {TARGET_LABELS[broadcast.targetType] ?? broadcast.targetType}
                    <span className="text-muted-foreground">({broadcast.totalCount.toLocaleString()}명)</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">생성일</dt>
                  <dd className="font-medium mt-1">{formatDateTime(broadcast.createdAt)}</dd>
                </div>
                {broadcast.scheduledAt && (
                  <div>
                    <dt className="text-sm text-muted-foreground">예약 발송일</dt>
                    <dd className="font-medium mt-1">{formatDateTime(broadcast.scheduledAt)}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-muted-foreground">발송 시작</dt>
                  <dd className="font-medium mt-1">{formatDateTime(broadcast.startedAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">발송 완료</dt>
                  <dd className="font-medium mt-1">{formatDateTime(broadcast.completedAt)}</dd>
                </div>
                {broadcast.startedAt && broadcast.completedAt && (
                  <div>
                    <dt className="text-sm text-muted-foreground">소요 시간</dt>
                    <dd className="font-medium mt-1">
                      {formatDuration(broadcast.startedAt, broadcast.completedAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Content preview card */}
          <Card>
            <CardHeader>
              <CardTitle>콘텐츠 미리보기</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={broadcast.channels[0] ?? 'IN_APP'}>
                <TabsList>
                  {broadcast.channels.includes('IN_APP') && (
                    <TabsTrigger value="IN_APP" className="gap-1.5">
                      <Bell className="h-3.5 w-3.5" />
                      인앱
                    </TabsTrigger>
                  )}
                  {broadcast.channels.includes('EMAIL') && (
                    <TabsTrigger value="EMAIL" className="gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      이메일
                    </TabsTrigger>
                  )}
                  {broadcast.channels.includes('KAKAO') && (
                    <TabsTrigger value="KAKAO" className="gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      알림톡
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="IN_APP" className="mt-4">
                  {broadcast.content?.inApp ? (
                    <div className="border rounded-lg p-4 max-w-sm mx-auto bg-white">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Bell className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{broadcast.content.inApp.title ?? broadcast.title}</p>
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {broadcast.content.inApp.body ?? '-'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">방금 전</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">인앱 콘텐츠가 없어요</p>
                  )}
                </TabsContent>

                <TabsContent value="EMAIL" className="mt-4">
                  {broadcast.content?.email ? (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted px-4 py-2 border-b">
                        <p className="text-sm font-medium">
                          제목: {broadcast.content.email.subject ?? broadcast.title}
                        </p>
                      </div>
                      <div
                        className="p-4 max-h-[400px] overflow-y-auto prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: broadcast.content.email.html ?? '' }}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">이메일 콘텐츠가 없어요</p>
                  )}
                </TabsContent>

                <TabsContent value="KAKAO" className="mt-4">
                  {broadcast.content?.kakao ? (
                    <div className="border rounded-lg p-4 max-w-sm mx-auto bg-yellow-50">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="h-4 w-4 text-yellow-700" />
                        <span className="text-sm font-medium text-yellow-800">알림톡</span>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-sm">
                        <p className="text-xs text-muted-foreground mb-2">
                          템플릿 ID: {broadcast.content.kakao.templateId ?? '-'}
                        </p>
                        {broadcast.content.kakao.variables && Object.keys(broadcast.content.kakao.variables).length > 0 && (
                          <div className="space-y-1 mt-2">
                            <p className="text-xs font-medium text-muted-foreground">변수:</p>
                            {Object.entries(broadcast.content.kakao.variables).map(([key, val]) => (
                              <p key={key} className="text-xs">
                                <span className="text-muted-foreground">{'#{' + key + '}'}</span>
                                <span className="mx-1">=</span>
                                <span>{val}</span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">알림톡 콘텐츠가 없어요</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Progress card (SENDING only) */}
          {broadcast.status === 'SENDING' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  발송 진행률
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Progress value={progressPercent} className="flex-1 h-3" />
                    <span className="text-lg font-bold tabular-nums text-primary">{progressPercent}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-green-50">
                      <p className="text-2xl font-bold tabular-nums text-green-700">{broadcast.sentCount.toLocaleString()}</p>
                      <p className="text-xs text-green-600 mt-1">발송 완료</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50">
                      <p className="text-2xl font-bold tabular-nums text-red-700">{broadcast.failedCount.toLocaleString()}</p>
                      <p className="text-xs text-red-600 mt-1">실패</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50">
                      <p className="text-2xl font-bold tabular-nums text-gray-700">
                        {(broadcast.totalCount - broadcast.sentCount - broadcast.failedCount).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">대기</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Channel stats card */}
          {Object.keys(stats).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>채널별 발송 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>상태</TableHead>
                      <TableHead className="text-right">건수</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(stats).map(([key, count]) => {
                      const iconMap: Record<string, { icon: typeof CheckCircle2; color: string }> = {
                        SENT: { icon: CheckCircle2, color: 'text-green-600' },
                        FAILED: { icon: XCircle, color: 'text-red-600' },
                        SKIPPED: { icon: SkipForward, color: 'text-gray-500' },
                        PENDING: { icon: Clock, color: 'text-yellow-600' },
                      }
                      const info = iconMap[key]
                      const Icon = info?.icon ?? Clock
                      const color = info?.color ?? 'text-muted-foreground'
                      const labelMap: Record<string, string> = {
                        SENT: '발송 성공',
                        FAILED: '발송 실패',
                        SKIPPED: '건너뜀',
                        PENDING: '대기중',
                      }
                      return (
                        <TableRow key={key}>
                          <TableCell>
                            <span className={`inline-flex items-center gap-2 ${color}`}>
                              <Icon className="h-4 w-4" />
                              {labelMap[key] ?? key}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold tabular-nums">
                            {count.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Actions card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">현재 상태</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant="outline" className={`${statusInfo.className} text-base px-3 py-1`}>
                {statusInfo.label}
              </Badge>
              <div className="space-y-2 pt-2">
                {broadcast.status === 'DRAFT' && (
                  <>
                    <Button
                      className="w-full"
                      onClick={() => router.push(`/ko/admin/broadcast/new?edit=${broadcast.id}`)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      편집
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 hover:text-red-700"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      삭제
                    </Button>
                  </>
                )}
                {broadcast.status === 'SCHEDULED' && (
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700"
                    onClick={() => setCancelOpen(true)}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    예약 취소
                  </Button>
                )}
                {broadcast.status === 'SENDING' && (
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700"
                    onClick={() => setCancelOpen(true)}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    발송 중단
                  </Button>
                )}
                {broadcast.status === 'FAILED' && (
                  <Button
                    className="w-full"
                    onClick={handleRetry}
                    disabled={retrying}
                  >
                    {retrying ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    {retrying ? '재시도 중...' : '재시도'}
                  </Button>
                )}
                {broadcast.status === 'COMPLETED' && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    발송이 완료되어 추가 액션이 없어요
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent failures */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                최근 실패 ({recentFailures.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentFailures.length === 0 ? (
                <p className="text-sm text-muted-foreground">실패 기록이 없어요</p>
              ) : (
                <div className="space-y-3 max-h-[320px] overflow-y-auto">
                  {recentFailures.slice(0, 10).map((f, idx) => (
                    <div key={idx} className="border-l-2 border-red-200 pl-3 py-1">
                      <p className="text-xs font-mono text-muted-foreground">{f.userId}</p>
                      <p className="text-sm text-red-700 mt-0.5">{f.error}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit history */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">액션 히스토리</CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">기록이 없어요</p>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map(log => (
                    <div key={log.id} className="border-l-2 pl-3 py-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm font-medium mt-0.5">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </p>
                      {log.reason && (
                        <p className="text-xs text-muted-foreground mt-0.5">{log.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========== Modals ========== */}

      {/* Cancel Modal */}
      <CancelModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        broadcastId={broadcast.id}
        broadcastStatus={broadcast.status}
        onSuccess={() => {
          setCancelOpen(false)
          fetchData()
        }}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>공지 삭제</DialogTitle>
            <DialogDescription>
              이 공지를 삭제하면 되돌릴 수 없어요. 정말 삭제할까요?
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>삭제된 공지는 복구할 수 없어요</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>취소</Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==================== Cancel Modal ====================

function CancelModal({
  open,
  onOpenChange,
  broadcastId,
  broadcastStatus,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  broadcastId: string
  broadcastStatus: string
  onSuccess: () => void
}) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setReason('')
    }
  }, [open])

  const actionLabel = broadcastStatus === 'SCHEDULED' ? '예약 취소' : '발송 중단'

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await cancelBroadcast(broadcastId, reason)
      toast.success(broadcastStatus === 'SCHEDULED' ? '예약이 취소되었어요' : '발송이 중단되었어요')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${actionLabel}에 실패했어요`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionLabel}</DialogTitle>
          <DialogDescription>
            {broadcastStatus === 'SCHEDULED'
              ? '예약된 발송을 취소합니다. 취소 사유를 입력해주세요.'
              : '진행 중인 발송을 중단합니다. 이미 발송된 건은 취소되지 않아요.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{broadcastStatus === 'SENDING'
              ? '이미 발송된 알림은 되돌릴 수 없어요'
              : '취소하면 되돌릴 수 없어요'}</p>
          </div>
          <div>
            <label className="text-sm font-medium">취소 사유</label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="취소 사유를 입력해주세요"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>닫기</Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={reason.trim().length === 0 || submitting}
          >
            {submitting ? '처리 중...' : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
