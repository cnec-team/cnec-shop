'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User,
  BadgeCheck,
  ExternalLink,
  ArrowLeft,
  BookmarkPlus,
  Loader2,
} from 'lucide-react'
import { formatFollowerCount } from '@/lib/utils/format'
import { InviteModal } from '@/components/brand/InviteModal'
import { GroupSaveDialog } from '@/components/brand/GroupSaveDialog'
import { getCreatorProfileImage } from '@/lib/utils/image'
import type { CreatorWithIg } from '@/components/brand/types'

interface CampaignHistory {
  id: string
  title: string
  startAt: string | null
  endAt: string | null
  status: string
  totalSales: number
  orders: number
}

export default function CreatorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [creator, setCreator] = useState<CreatorWithIg | null>(null)
  const [campaigns, setCampaigns] = useState<CampaignHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [proposalModal, setProposalModal] = useState<{
    open: boolean
    type: 'GONGGU' | 'PRODUCT_PICK'
  }>({ open: false, type: 'GONGGU' })
  const [groupDialog, setGroupDialog] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/brand/creators/${id}`)
      if (res.ok) {
        const data = await res.json()
        setCreator(data.creator)
        setCampaigns(data.campaigns)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-start gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!creator) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">크리에이터를 찾을 수 없습니다</p>
        <Button variant="link" onClick={() => router.back()}>뒤로 가기</Button>
      </div>
    )
  }

  const thumbnails = (creator.igRecentPostThumbnails ?? []) as string[]

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> 돌아가기
      </Button>

      {/* 프로필 헤더 */}
      <div className="flex items-start gap-6 mb-8">
        <Avatar className="h-24 w-24">
          <AvatarImage src={getCreatorProfileImage(creator)} />
          <AvatarFallback className="text-2xl"><User /></AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{creator.displayName}</h1>
            {creator.igVerified && <BadgeCheck className="h-5 w-5 text-blue-500" />}
            {creator.igTier && (
              <Badge variant="secondary" className="text-xs">{creator.igTier}</Badge>
            )}
          </div>
          <p className="text-muted-foreground">@{creator.instagramHandle}</p>
          {creator.igCategory && (
            <Badge variant="outline" className="mt-1 text-xs">{creator.igCategory}</Badge>
          )}
          {creator.igBio && <p className="mt-2 text-sm">{creator.igBio}</p>}
          {creator.igExternalUrl && (
            <a
              href={creator.igExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" /> {creator.igExternalUrl}
            </a>
          )}
        </div>
      </div>

      {/* 지표 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{formatFollowerCount(creator.igFollowers ?? 0)}</p>
            <p className="text-xs text-muted-foreground">팔로워</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{formatFollowerCount(creator.igFollowing ?? 0)}</p>
            <p className="text-xs text-muted-foreground">팔로잉</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{formatFollowerCount(creator.igPostsCount ?? 0)}</p>
            <p className="text-xs text-muted-foreground">게시물</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{creator.igEngagementRate?.toFixed(1) ?? '-'}%</p>
            <p className="text-xs text-muted-foreground">참여율</p>
          </CardContent>
        </Card>
      </div>

      {/* 최근 콘텐츠 */}
      {thumbnails.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">최근 콘텐츠</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {thumbnails.map((url, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 크넥 캠페인 이력 */}
      <div className="mb-24">
        <h2 className="text-lg font-semibold mb-3">크넥 캠페인 이력</h2>
        {campaigns.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>캠페인</TableHead>
                <TableHead>기간</TableHead>
                <TableHead className="text-right">매출</TableHead>
                <TableHead className="text-right">주문수</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{c.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.startAt ? new Date(c.startAt).toLocaleDateString('ko-KR') : '-'}
                    {' ~ '}
                    {c.endAt ? new Date(c.endAt).toLocaleDateString('ko-KR') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {c.totalSales > 0 ? `₩${c.totalSales.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">{c.orders}건</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground border rounded-lg">
            아직 크넥 캠페인 이력이 없습니다
          </div>
        )}
      </div>

      {/* 하단 고정 액션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex gap-3 justify-end z-30">
        <Button onClick={() => setProposalModal({ open: true, type: 'GONGGU' })}>
          공구 초대
        </Button>
        <Button variant="outline" onClick={() => setProposalModal({ open: true, type: 'PRODUCT_PICK' })}>
          상품 추천
        </Button>
        <Button variant="outline" onClick={() => setGroupDialog(true)}>
          <BookmarkPlus className="h-4 w-4 mr-1" /> 그룹에 저장
        </Button>
      </div>

      <InviteModal
        open={proposalModal.open}
        onOpenChange={open => setProposalModal(prev => ({ ...prev, open }))}
        mode="single"
        creatorIds={[id]}
        defaultType={proposalModal.type}
        onSuccess={fetchData}
      />

      <GroupSaveDialog
        open={groupDialog}
        onOpenChange={setGroupDialog}
        creatorIds={[id]}
        onSuccess={() => {}}
      />
    </div>
  )
}
