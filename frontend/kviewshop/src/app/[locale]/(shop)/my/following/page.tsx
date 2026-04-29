'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Users, Heart, Loader2, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { SafeImage } from '@/components/common/SafeImage'
import { getMyFollowingCreators, toggleFollow } from '@/lib/actions/follow'
import { useUser } from '@/lib/hooks/use-user'

interface FollowingCreator {
  id: string
  username: string | null
  shopId: string | null
  displayName: string | null
  profileImageUrl: string | null
  instagramHandle: string | null
  followerCount: number
  followedAt: Date | undefined
}

export default function MyFollowingPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const { user, isLoading: isUserLoading } = useUser()

  const [creators, setCreators] = useState<FollowingCreator[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null)

  useEffect(() => {
    if (isUserLoading) return
    if (!user) {
      router.push(`/${locale}/buyer/login?returnUrl=${encodeURIComponent(`/${locale}/my/following`)}`)
      return
    }
    loadData()
  }, [isUserLoading, user])

  const loadData = async () => {
    try {
      const result = await getMyFollowingCreators(1, 50)
      setCreators(result.creators as FollowingCreator[])
      setTotal(result.total)
    } catch {
      toast.error('팔로우 목록을 불러오지 못했어요')
    } finally {
      setLoading(false)
    }
  }

  const handleUnfollow = async (creatorId: string) => {
    setUnfollowingId(creatorId)
    try {
      const result = await toggleFollow(creatorId)
      if (result.success && !result.isFollowing) {
        setCreators((prev) => prev.filter((c) => c.id !== creatorId))
        setTotal((prev) => prev - 1)
        toast.success('팔로우를 취소했어요')
      }
    } catch {
      toast.error('오류가 발생했습니다')
    } finally {
      setUnfollowingId(null)
    }
  }

  if (isUserLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center h-12 px-4">
          <button onClick={() => router.back()} className="mr-3">
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900">팔로우</h1>
          <span className="ml-2 text-sm text-gray-400">{total}</span>
        </div>
      </div>

      {/* Empty state */}
      {creators.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <Users className="h-12 w-12 text-gray-200 mb-4" />
          <h2 className="text-base font-bold text-gray-900 mb-2">
            아직 팔로우한 크리에이터가 없어요
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            크리에이터를 팔로우하면 새 공구 알림을 받을 수 있어요
          </p>
          <Link
            href={`/${locale}/creators`}
            className="inline-flex items-center justify-center h-10 px-6 bg-gray-900 text-white rounded-full text-sm font-semibold"
          >
            크리에이터 둘러보기
          </Link>
        </div>
      )}

      {/* Creator list */}
      <div className="divide-y divide-gray-50">
        {creators.map((creator) => {
          const shopSlug = creator.shopId || creator.username || ''
          return (
            <div key={creator.id} className="flex items-center gap-3 px-4 py-3">
              <Link href={`/${locale}/${shopSlug}`} className="shrink-0">
                <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden">
                  {creator.profileImageUrl ? (
                    <SafeImage
                      src={creator.profileImageUrl}
                      alt={creator.displayName || ''}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                </div>
              </Link>

              <Link href={`/${locale}/${shopSlug}`} className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {creator.displayName || creator.username || '크리에이터'}
                </p>
                <p className="text-xs text-gray-400">
                  팔로워 {creator.followerCount.toLocaleString()}명
                  {creator.instagramHandle && ` · @${creator.instagramHandle}`}
                </p>
              </Link>

              <button
                onClick={() => handleUnfollow(creator.id)}
                disabled={unfollowingId === creator.id}
                className="shrink-0 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-full hover:bg-gray-50 disabled:opacity-50"
              >
                {unfollowingId === creator.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  '팔로잉'
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
