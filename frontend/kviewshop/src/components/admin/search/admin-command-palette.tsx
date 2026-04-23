'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Building2,
  User,
  ShoppingCart,
  Megaphone,
  Activity,
  Search,
  Construction,
} from 'lucide-react'
import { searchAdmin } from '@/lib/actions/admin-search'
import { Badge } from '@/components/ui/badge'

type SearchResults = Awaited<ReturnType<typeof searchAdmin>>

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text}</>
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="font-bold text-stone-900">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export function AdminCommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)

  // 디바운스 검색
  useEffect(() => {
    if (!query || query.length < 1) {
      setResults(null)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchAdmin(query)
        setResults(data)
      } catch {
        setResults(null)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // 모달 닫힐 때 초기화
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults(null)
    }
  }, [open])

  const navigate = useCallback(
    (href: string) => {
      onOpenChange(false)
      router.push(href)
    },
    [router, onOpenChange]
  )

  const hasResults =
    results &&
    (results.brands.length > 0 ||
      results.creators.length > 0 ||
      results.orders.length > 0 ||
      results.campaigns.length > 0)

  const statusBadge = (status: string) => {
    if (status === 'SUSPENDED' || status === 'suspended') {
      return (
        <Badge variant="secondary" className="ml-2 text-[10px] bg-stone-200 text-stone-500">
          정지
        </Badge>
      )
    }
    if (status === 'PENDING' || status === 'pending') {
      return (
        <Badge variant="secondary" className="ml-2 text-[10px] bg-amber-100 text-amber-700">
          대기
        </Badge>
      )
    }
    if (status === 'CANCELLED') {
      return (
        <Badge variant="secondary" className="ml-2 text-[10px] bg-red-100 text-red-600">
          취소
        </Badge>
      )
    }
    return null
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="통합 검색"
      description="브랜드, 크리에이터, 주문, 캠페인을 검색합니다"
      showCloseButton={false}
    >
      <CommandInput
        placeholder="브랜드, 크리에이터, 주문, 캠페인 검색"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[400px]">
        {/* 빈 입력 → 빠른 액션 */}
        {!query && (
          <CommandGroup heading="빠른 액션">
            <CommandItem onSelect={() => navigate('/admin/campaigns')}>
              <Megaphone className="mr-2 h-4 w-4 text-stone-500" />
              <span>캠페인 검색</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/activity')}>
              <Activity className="mr-2 h-4 w-4 text-stone-500" />
              <span>활동 로그 보기</span>
            </CommandItem>
            <CommandItem disabled>
              <Search className="mr-2 h-4 w-4 text-stone-300" />
              <span className="text-stone-400">공지 발송</span>
              <Badge variant="secondary" className="ml-2 text-[10px] bg-stone-100 text-stone-400">
                준비 중
              </Badge>
            </CommandItem>
            <CommandItem disabled>
              <Construction className="mr-2 h-4 w-4 text-stone-300" />
              <span className="text-stone-400">감사 로그</span>
              <Badge variant="secondary" className="ml-2 text-[10px] bg-stone-100 text-stone-400">
                준비 중
              </Badge>
            </CommandItem>
          </CommandGroup>
        )}

        {/* 로딩 */}
        {query && loading && (
          <div className="py-6 text-center text-sm text-stone-400">검색 중...</div>
        )}

        {/* 검색 결과 없음 */}
        {query && !loading && results && !hasResults && (
          <CommandEmpty>
            <div className="text-sm text-stone-500">검색 결과가 없어요</div>
            <div className="mt-1 text-xs text-stone-400">다른 키워드로 시도해보세요</div>
          </CommandEmpty>
        )}

        {/* 브랜드 */}
        {results && results.brands.length > 0 && (
          <>
            <CommandGroup heading="브랜드">
              {results.brands.map((b) => (
                <CommandItem
                  key={b.id}
                  value={`brand-${b.id}`}
                  onSelect={() => navigate(`/admin/brands`)}
                  className={b.status === 'SUSPENDED' ? 'opacity-60' : ''}
                >
                  <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-stone-100 mr-2">
                    {b.logoUrl ? (
                      <Image src={b.logoUrl} alt="" width={24} height={24} className="rounded-full object-cover" />
                    ) : (
                      <Building2 className="h-3 w-3 text-stone-400" />
                    )}
                  </div>
                  <span className="flex-1">
                    <HighlightMatch text={b.name} query={query} />
                  </span>
                  {b.businessNumber && (
                    <span className="text-xs text-stone-400 mr-1">
                      <HighlightMatch text={b.businessNumber} query={query} />
                    </span>
                  )}
                  {statusBadge(b.status)}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* 크리에이터 */}
        {results && results.creators.length > 0 && (
          <>
            <CommandGroup heading="크리에이터">
              {results.creators.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`creator-${c.id}`}
                  onSelect={() => navigate(`/admin/creators`)}
                  className={c.status === 'SUSPENDED' || c.status === 'suspended' ? 'opacity-60' : ''}
                >
                  <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-stone-100 mr-2">
                    {c.profileImageUrl ? (
                      <Image src={c.profileImageUrl} alt="" width={24} height={24} className="rounded-full object-cover" />
                    ) : (
                      <User className="h-3 w-3 text-stone-400" />
                    )}
                  </div>
                  <span className="flex-1">
                    <HighlightMatch text={c.name} query={query} />
                  </span>
                  {c.instagramHandle && (
                    <span className="text-xs text-stone-400 mr-1">@{c.instagramHandle}</span>
                  )}
                  {statusBadge(c.status)}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* 주문 */}
        {results && results.orders.length > 0 && (
          <>
            <CommandGroup heading="주문">
              {results.orders.map((o) => (
                <CommandItem
                  key={o.id}
                  value={`order-${o.id}`}
                  onSelect={() => navigate(`/admin/orders`)}
                >
                  <ShoppingCart className="mr-2 h-4 w-4 text-stone-400" />
                  <span className="flex-1">
                    <HighlightMatch text={o.orderNumber || o.id.slice(0, 8)} query={query} />
                    {o.buyerName && (
                      <span className="ml-2 text-xs text-stone-400">{o.buyerName}</span>
                    )}
                  </span>
                  <span className="text-xs tabular-nums text-stone-500">
                    ₩{o.totalAmount.toLocaleString()}
                  </span>
                  {statusBadge(o.status)}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* 캠페인 */}
        {results && results.campaigns.length > 0 && (
          <CommandGroup heading="캠페인">
            {results.campaigns.map((c) => (
              <CommandItem
                key={c.id}
                value={`campaign-${c.id}`}
                onSelect={() => navigate(`/admin/campaigns`)}
              >
                <Megaphone className="mr-2 h-4 w-4 text-stone-400" />
                <span className="flex-1">
                  <HighlightMatch text={c.name} query={query} />
                </span>
                <span className="text-xs text-stone-400 mr-1">{c.brandName}</span>
                {statusBadge(c.status)}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
