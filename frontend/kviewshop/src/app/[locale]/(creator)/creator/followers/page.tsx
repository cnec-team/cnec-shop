'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Users, TrendingUp, Loader2, UserCheck } from 'lucide-react'
import { getMyFollowers, getFollowerStats } from '@/lib/actions/follow'
import { getCreatorSession } from '@/lib/actions/creator'
import { Skeleton } from '@/components/ui/skeleton'

interface Follower {
  id: string
  userId: string
  name: string
  followedAt: Date
}

export default function CreatorFollowersPage() {
  const params = useParams()
  const locale = params.locale as string

  const [creator, setCreator] = useState<{ id: string } | null>(null)
  const [followers, setFollowers] = useState<Follower[]>([])
  const [total, setTotal] = useState(0)
  const [recentCount, setRecentCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        const creatorData = await getCreatorSession()
        if (!creatorData) return
        setCreator(creatorData as any)

        const [followersData, statsData] = await Promise.all([
          getMyFollowers(creatorData.id, 1, 50),
          getFollowerStats(creatorData.id),
        ])

        setFollowers(followersData.followers as Follower[])
        setTotal(statsData.total)
        setRecentCount(statsData.recentNew)
      } catch (error) {
        console.error('팔로워 데이터 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">내 팔로워</h1>
        <p className="text-sm text-muted-foreground mt-1">
          팔로워에게 새 공구 시작 시 알림이 자동 발송돼요
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="bg-gray-100 rounded-xl w-8 h-8 flex items-center justify-center mb-2">
            <Users className="h-4 w-4 text-gray-600" />
          </div>
          <p className="text-2xl font-bold">{total.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">총 팔로워</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="bg-emerald-50 rounded-xl w-8 h-8 flex items-center justify-center mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold">
            +{recentCount.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">최근 7일 신규</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-start gap-3">
        <UserCheck className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-900">공�� 시작 자동 알림</p>
          <p className="text-xs text-blue-700 mt-0.5">
            캠페인이 시작되면 팔로워에게 카카오 알림톡이 자동으로 발송돼요.
            별도 설정 없이 자동으로 작동합니다.
          </p>
        </div>
      </div>

      {/* Follower List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">
            팔로워 목록
            <span className="text-gray-400 font-normal ml-1">{total}</span>
          </h2>
        </div>

        {followers.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="h-10 w-10 mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">아��� 팔로워가 없어요</p>
            <p className="text-xs text-gray-300 mt-1">
              내 샵 링크를 인스타에 공유하면 팔로워가 늘어나요
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {followers.map((follower) => (
              <div key={follower.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{follower.name}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {formatDate(follower.followedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
