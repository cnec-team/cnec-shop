'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const TIER_OPTIONS = [
  { label: '1K-10K', value: 'NANO' },
  { label: '10K-100K', value: 'MICRO' },
  { label: '100K-1M', value: 'MACRO' },
  { label: '1M+', value: 'MEGA' },
]

const CATEGORY_OPTIONS = [
  'Health/beauty',
  'Digital creator',
  'Beauty, cosmetic & personal care',
  'Blogger',
  'Personal blog',
  'Product/service',
  'Shopping & retail',
  'Art',
  'Fashion designer',
  'Entrepreneur',
]

const SORT_OPTIONS = [
  { label: '팔로워 많은 순', value: 'followers' },
  { label: '참여율 높은 순', value: 'engagement' },
  { label: '최근 추가순', value: 'recent' },
]

export function CreatorFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [expanded, setExpanded] = useState(true)

  const [tier, setTier] = useState(searchParams.get('tier') || '')
  const [categories, setCategories] = useState<string[]>(
    searchParams.get('category')?.split(',').filter(Boolean) || []
  )
  const [minEngagement, setMinEngagement] = useState(searchParams.get('minEngagement') || '')
  const [maxEngagement, setMaxEngagement] = useState(searchParams.get('maxEngagement') || '')
  const [verified, setVerified] = useState(searchParams.get('verified') || '')
  const [cnecPartnerOnly, setCnecPartnerOnly] = useState(searchParams.get('cnecPartnerOnly') === 'true')
  const [includeKeywords, setIncludeKeywords] = useState<string[]>(() => {
    const kw = searchParams.get('includeKeywords')?.split(',').filter(Boolean) || []
    while (kw.length < 3) kw.push('')
    return kw.slice(0, 3)
  })
  const [keywordOperator, setKeywordOperator] = useState(searchParams.get('keywordOperator') || 'OR')
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>(() => {
    const kw = searchParams.get('excludeKeywords')?.split(',').filter(Boolean) || []
    while (kw.length < 3) kw.push('')
    return kw.slice(0, 3)
  })
  const [searchScope, setSearchScope] = useState(searchParams.get('searchScope') || 'all')
  const [sort, setSort] = useState(searchParams.get('sort') || 'followers')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const buildParams = useCallback(() => {
    const params = new URLSearchParams()
    if (tier) params.set('tier', tier)
    if (categories.length > 0) params.set('category', categories.join(','))
    if (minEngagement) params.set('minEngagement', minEngagement)
    if (maxEngagement) params.set('maxEngagement', maxEngagement)
    if (verified) params.set('verified', verified)
    if (cnecPartnerOnly) params.set('cnecPartnerOnly', 'true')
    const ik = includeKeywords.filter(Boolean)
    if (ik.length > 0) params.set('includeKeywords', ik.join(','))
    if (keywordOperator !== 'OR') params.set('keywordOperator', keywordOperator)
    const ek = excludeKeywords.filter(Boolean)
    if (ek.length > 0) params.set('excludeKeywords', ek.join(','))
    if (searchScope !== 'all') params.set('searchScope', searchScope)
    if (sort !== 'followers') params.set('sort', sort)
    const view = searchParams.get('view')
    if (view) params.set('view', view)
    return params
  }, [tier, categories, minEngagement, maxEngagement, verified, cnecPartnerOnly, includeKeywords, keywordOperator, excludeKeywords, searchScope, sort, searchParams])

  const applyFilters = useCallback(() => {
    const params = buildParams()
    router.push(`?${params.toString()}`)
  }, [buildParams, router])

  const applyFiltersDebounced = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(applyFilters, 300)
  }, [applyFilters])

  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, categories, verified, cnecPartnerOnly, sort, searchScope, keywordOperator])

  useEffect(() => {
    applyFiltersDebounced()
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minEngagement, maxEngagement, includeKeywords, excludeKeywords])

  const resetFilters = () => {
    setTier('')
    setCategories([])
    setMinEngagement('')
    setMaxEngagement('')
    setVerified('')
    setCnecPartnerOnly(false)
    setIncludeKeywords(['', '', ''])
    setKeywordOperator('OR')
    setExcludeKeywords(['', '', ''])
    setSearchScope('all')
    setSort('followers')
    const view = searchParams.get('view')
    router.push(view ? `?view=${view}` : '?')
  }

  const toggleCategory = (cat: string) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const removeFilter = (type: string, value?: string) => {
    switch (type) {
      case 'tier': setTier(''); break
      case 'category': setCategories(prev => prev.filter(c => c !== value)); break
      case 'engagement': setMinEngagement(''); setMaxEngagement(''); break
      case 'verified': setVerified(''); break
      case 'cnecPartner': setCnecPartnerOnly(false); break
      case 'includeKeyword':
        setIncludeKeywords(prev => prev.map(k => k === value ? '' : k))
        break
      case 'excludeKeyword':
        setExcludeKeywords(prev => prev.map(k => k === value ? '' : k))
        break
    }
  }

  const activeTags: { label: string; type: string; value?: string; color: string }[] = []
  if (tier) activeTags.push({ label: `티어: ${TIER_OPTIONS.find(t => t.value === tier)?.label || tier}`, type: 'tier', color: 'bg-purple-100 text-purple-700' })
  for (const cat of categories) {
    activeTags.push({ label: cat, type: 'category', value: cat, color: 'bg-purple-100 text-purple-700' })
  }
  if (minEngagement || maxEngagement) {
    activeTags.push({ label: `ER: ${minEngagement || '0'}%~${maxEngagement || '∞'}%`, type: 'engagement', color: 'bg-purple-100 text-purple-700' })
  }
  if (verified) {
    activeTags.push({ label: verified === 'true' ? '인증됨' : '미인증', type: 'verified', color: 'bg-purple-100 text-purple-700' })
  }
  if (cnecPartnerOnly) {
    activeTags.push({ label: 'CNEC 파트너', type: 'cnecPartner', color: 'bg-purple-100 text-purple-700' })
  }
  for (const kw of includeKeywords.filter(Boolean)) {
    activeTags.push({ label: `+${kw}`, type: 'includeKeyword', value: kw, color: 'bg-green-100 text-green-700' })
  }
  for (const kw of excludeKeywords.filter(Boolean)) {
    activeTags.push({ label: `-${kw}`, type: 'excludeKeyword', value: kw, color: 'bg-red-100 text-red-700' })
  }

  return (
    <div className="border rounded-lg p-4 mb-4 bg-background">
      <div className="flex items-center justify-between mb-3">
        <button
          className="flex items-center gap-1 text-sm font-medium"
          onClick={() => setExpanded(!expanded)}
        >
          필터
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeTags.length > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> 초기화
            </Button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="space-y-4">
          <div>
            <Label className="text-xs mb-1.5 block">팔로워 구간</Label>
            <div className="flex gap-2 flex-wrap">
              {TIER_OPTIONS.map(t => (
                <Button
                  key={t.value}
                  variant={tier === t.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTier(tier === t.value ? '' : t.value)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">카테고리</Label>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORY_OPTIONS.map(cat => (
                <Badge
                  key={cat}
                  variant={categories.includes(cat) ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1.5 block">참여율 (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="최소"
                  value={minEngagement}
                  onChange={e => setMinEngagement(e.target.value)}
                  className="h-8 text-sm"
                />
                <span className="text-muted-foreground text-xs">~</span>
                <Input
                  type="number"
                  placeholder="최대"
                  value={maxEngagement}
                  onChange={e => setMaxEngagement(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1.5 block">인증 여부</Label>
              <div className="flex gap-2">
                {[
                  { label: '전체', value: '' },
                  { label: '인증', value: 'true' },
                  { label: '미인증', value: 'false' },
                ].map(opt => (
                  <Button
                    key={opt.value}
                    variant={verified === opt.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVerified(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs block">CNEC 파트너만 보기</Label>
              <p className="text-xs text-muted-foreground">협업 경험이 있는 신뢰 크리에이터</p>
            </div>
            <Switch checked={cnecPartnerOnly} onCheckedChange={setCnecPartnerOnly} />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Label className="text-xs">포함 키워드</Label>
              <div className="flex gap-1">
                {(['OR', 'AND'] as const).map(op => (
                  <Button
                    key={op}
                    variant={keywordOperator === op ? 'default' : 'outline'}
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setKeywordOperator(op)}
                  >
                    {op}
                  </Button>
                ))}
              </div>
              <Select value={searchScope} onValueChange={setSearchScope}>
                <SelectTrigger className="w-24 h-6 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="bio">바이오만</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              {includeKeywords.map((kw, i) => (
                <Input
                  key={i}
                  placeholder={`키워드 ${i + 1}`}
                  value={kw}
                  onChange={e => {
                    const next = [...includeKeywords]
                    next[i] = e.target.value
                    setIncludeKeywords(next)
                  }}
                  className="h-8 text-sm"
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">제외 키워드</Label>
            <div className="flex gap-2">
              {excludeKeywords.map((kw, i) => (
                <Input
                  key={i}
                  placeholder={`제외 ${i + 1}`}
                  value={kw}
                  onChange={e => {
                    const next = [...excludeKeywords]
                    next[i] = e.target.value
                    setExcludeKeywords(next)
                  }}
                  className="h-8 text-sm"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-3 pt-3 border-t">
          {activeTags.map((tag, i) => (
            <Badge
              key={i}
              variant="secondary"
              className={cn('text-xs gap-1 pr-1', tag.color)}
            >
              {tag.label}
              <button
                onClick={() => removeFilter(tag.type, tag.value)}
                className="hover:bg-black/10 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
