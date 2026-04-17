'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User,
  RefreshCw,
  MessageCircle,
  Loader2,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import { getCreatorProfileImage } from '@/lib/utils/image'

interface DmQueueItem {
  id: string
  status: string
  instagramUsername: string
  messageBody: string
  priority: number
  createdAt: string
  sentAt: string | null
  failReason: string | null
  creator: {
    id: string
    displayName: string | null
    instagramHandle: string | null
    igProfilePicUrl: string | null
    igProfileImageR2Url: string | null
  }
}

export default function DmQueuePage() {
  const [tab, setTab] = useState('PENDING')
  const [items, setItems] = useState<DmQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [todaySentCount, setTodaySentCount] = useState(0)
  const [dailyLimit, setDailyLimit] = useState(50)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/brand/dm-queue?status=${tab}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items)
        setTodaySentCount(data.todaySentCount)
        setDailyLimit(data.dailyLimit)
      }
    } catch {
      toast.error('DM 큐를 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/brand/dm-queue/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success(status === 'SENT' ? 'DM 발송 완료 처리됨' : status === 'PENDING' ? '재시도 등록됨' : '상태 변경됨')
        fetchItems()
      } else {
        toast.error('상태 변경에 실패했습니다')
      }
    } catch {
      toast.error('오류가 발생했습니다')
    } finally {
      setUpdatingId(null)
    }
  }

  const isOverLimit = todaySentCount >= dailyLimit

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">DM 발송 큐</h1>
        <Badge variant={isOverLimit ? 'destructive' : 'secondary'} className="text-sm">
          오늘 발송: {todaySentCount} / {dailyLimit}건
        </Badge>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="PENDING">대기중</TabsTrigger>
          <TabsTrigger value="IN_PROGRESS">진행중</TabsTrigger>
          <TabsTrigger value="SENT">완료</TabsTrigger>
          <TabsTrigger value="FAILED">실패</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))
        ) : items.length > 0 ? (
          items.map(item => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getCreatorProfileImage(item.creator)} />
                  <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      @{item.instagramUsername}
                    </p>
                    <Badge variant="outline" className="text-[10px]">
                      {item.status === 'PENDING' ? '대기' :
                       item.status === 'IN_PROGRESS' ? '진행중' :
                       item.status === 'SENT' ? '완료' : '실패'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {item.messageBody}
                  </p>
                  {item.failReason && (
                    <p className="text-xs text-red-500 mt-1">사유: {item.failReason}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(item.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {item.status === 'PENDING' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(item.id, 'SENT')}
                      disabled={updatingId === item.id}
                    >
                      {updatingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    </Button>
                  )}
                  {item.status === 'FAILED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(item.id, 'PENDING')}
                      disabled={updatingId === item.id}
                    >
                      {updatingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-16">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {tab === 'PENDING' ? '대기 중인 DM이 없습니다' :
               tab === 'IN_PROGRESS' ? '진행 중인 DM이 없습니다' :
               tab === 'SENT' ? '완료된 DM이 없습니다' :
               '실패한 DM이 없습니다'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
