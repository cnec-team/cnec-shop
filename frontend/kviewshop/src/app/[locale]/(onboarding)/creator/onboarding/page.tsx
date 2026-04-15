'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { ChevronLeft, Check, Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getOnboardingData, saveOnboardingStep } from '@/lib/actions/creator'

const TOTAL_STEPS = 5

const CATEGORIES = [
  '스킨케어', '클렌징', '선케어', '마스크팩', '헤어케어',
  '바디케어', '메이크업', '뷰티디바이스', '건강식품',
]

const SKIN_TYPES = ['건성', '지성', '복합성', '민감성']

const SKIN_CONCERNS = ['여드름', '모공', '주름', '색소침착', '건조', '민감']

const SNS_CHANNELS = [
  { key: 'instagram', label: '인스타그램' },
  { key: 'youtube', label: '유튜브' },
  { key: 'tiktok', label: '틱톡' },
  { key: 'blog', label: '네이버 블로그' },
  { key: 'threads', label: '스레드' },
  { key: 'other', label: '기타' },
]

const REVENUE_RANGES = [
  { value: 'under_1m', label: '100만 이하' },
  { value: '1m_5m', label: '100~500만' },
  { value: '5m_10m', label: '500~1,000만' },
  { value: 'over_10m', label: '1,000만 이상' },
]

export default function CreatorOnboardingPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Step 1: Categories
  const [categories, setCategories] = useState<string[]>([])

  // Step 2: Skin
  const [skinType, setSkinType] = useState<string | null>(null)
  const [skinConcerns, setSkinConcerns] = useState<string[]>([])

  // Step 3: SNS
  const [selectedChannels, setSelectedChannels] = useState<Record<string, boolean>>({})
  const [channelUrls, setChannelUrls] = useState<Record<string, string>>({})
  const [mainChannel, setMainChannel] = useState<string | null>(null)

  // Step 4: Bio + Experience
  const [bio, setBio] = useState('')
  const [hasExperience, setHasExperience] = useState<boolean | null>(null)
  const [avgRevenue, setAvgRevenue] = useState<string | null>(null)

  // Step 5: Shop
  const [shopId, setShopId] = useState('')
  const [shopIdAvailable, setShopIdAvailable] = useState<boolean | null>(null)
  const [checkingShopId, setCheckingShopId] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const data = await getOnboardingData()
        if (data.onboardingStatus === 'COMPLETE' || data.onboardingCompleted) {
          router.replace(`/${locale}/creator/dashboard`)
          return
        }
        if (data.categories.length > 0) setCategories(data.categories)
        if (data.skinType) setSkinType(data.skinType)
        if (data.skinConcerns.length > 0) setSkinConcerns(data.skinConcerns)
        if (data.snsChannels) {
          const channels = data.snsChannels
          const sel: Record<string, boolean> = {}
          const urls: Record<string, string> = {}
          for (const [k, v] of Object.entries(channels)) {
            sel[k] = true
            urls[k] = v.url
            if (v.isMain) setMainChannel(k)
          }
          setSelectedChannels(sel)
          setChannelUrls(urls)
        }
        if (data.bio) setBio(data.bio)
        if (data.sellingExperience !== null) setHasExperience(data.sellingExperience ?? null)
        if (data.avgRevenue) setAvgRevenue(data.avgRevenue)
        if (data.shopId) {
          setShopId(data.shopId)
          setShopIdAvailable(true)
        }
        if (data.profileImageUrl) setProfileImage(data.profileImageUrl)
      } catch {
        // ignore — fresh start
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [locale, router])

  // Shop ID check
  const checkShopId = useCallback(async (id: string) => {
    if (id.length < 2) { setShopIdAvailable(null); return }
    setCheckingShopId(true)
    try {
      const res = await fetch(`/api/auth/check-shop-id?id=${encodeURIComponent(id)}`)
      const data = await res.json()
      setShopIdAvailable(data.available)
    } catch {
      setShopIdAvailable(null)
    } finally {
      setCheckingShopId(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (shopId) checkShopId(shopId)
    }, 500)
    return () => clearTimeout(timer)
  }, [shopId, checkShopId])

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return categories.length >= 1
      case 1: return true // optional
      case 2: return Object.values(selectedChannels).some(Boolean)
      case 3: return true // skippable
      case 4: return shopId.length >= 2 && shopIdAvailable === true
      default: return false
    }
  }

  const handleNext = async () => {
    setSaving(true)
    try {
      const snsChannelsData: Record<string, { url: string; isMain: boolean }> = {}
      for (const [k, v] of Object.entries(selectedChannels)) {
        if (v) {
          snsChannelsData[k] = { url: channelUrls[k] || '', isMain: mainChannel === k }
        }
      }

      await saveOnboardingStep({
        step,
        categories: step === 0 ? categories : undefined,
        skinType: step === 1 ? (skinType ?? undefined) : undefined,
        skinConcerns: step === 1 ? skinConcerns : undefined,
        snsChannels: step === 2 ? snsChannelsData : undefined,
        instagramHandle: step === 2 ? (channelUrls.instagram || undefined) : undefined,
        youtubeHandle: step === 2 ? (channelUrls.youtube || undefined) : undefined,
        tiktokHandle: step === 2 ? (channelUrls.tiktok || undefined) : undefined,
        bio: step === 3 ? bio : undefined,
        sellingExperience: step === 3 ? (hasExperience ?? undefined) : undefined,
        avgRevenue: step === 3 ? (avgRevenue ?? undefined) : undefined,
        shopId: step === 4 ? shopId : undefined,
        profileImageUrl: step === 4 ? (profileImage ?? undefined) : undefined,
      })

      if (step === TOTAL_STEPS - 1) {
        try {
          await fetch('/api/creator/onboarding-complete', { method: 'POST' })
        } catch { /* points/missions — non-blocking */ }
        toast.success('온보딩이 완료되었어요!')
        router.replace(`/${locale}/creator/dashboard`)
      } else {
        setStep(step + 1)
      }
    } catch {
      toast.error('저장에 실패했어요. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1)
  }

  const handleUploadProfile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'profiles')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      setProfileImage(url)
    } catch {
      toast.error('이미지 업로드에 실패했어요.')
    } finally {
      setUploading(false)
    }
  }

  const toggleCategory = (cat: string) => {
    setCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat])
  }

  const toggleConcern = (concern: string) => {
    setSkinConcerns((prev) => {
      if (prev.includes(concern)) return prev.filter((c) => c !== concern)
      if (prev.length >= 3) return prev
      return [...prev, concern]
    })
  }

  const toggleChannel = (key: string) => {
    setSelectedChannels((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      if (!next[key] && mainChannel === key) setMainChannel(null)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100
  const isSkippable = step === 1 || step === 3

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between px-4 h-12">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : router.back()}
            className="p-1 -ml-1"
          >
            <ChevronLeft className="h-5 w-5 text-gray-900" />
          </button>
          <span className="text-sm font-medium text-gray-900">크리에이터 등록</span>
          <span className="text-sm text-gray-400">{step + 1}/{TOTAL_STEPS}</span>
        </div>
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gray-900 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-8 pb-36 overflow-y-auto">
        {/* Step 1: Categories */}
        {step === 0 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              내가 주로 추천하는<br />상품의 카테고리를<br />모두 선택해주세요
            </h1>
            <p className="text-sm text-[#8E8E93] mt-2">여러 개 선택할 수 있어요</p>
            <div className="grid grid-cols-3 gap-3 mt-8">
              {CATEGORIES.map((cat) => {
                const selected = categories.includes(cat)
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`relative h-[100px] rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
                      selected
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-[#F5F5F5] text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                    {selected && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2: K-Beauty Profile */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              팔로워에게 딱 맞는<br />추천을 위해 알려주세요
            </h1>
            <p className="text-sm text-[#8E8E93] mt-2">나중에 수정할 수 있어요</p>

            {/* Skin Type */}
            <div className="mt-8">
              <p className="text-sm font-semibold text-gray-900 mb-3">피부 타입</p>
              <div className="flex flex-wrap gap-2">
                {SKIN_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSkinType(skinType === type ? null : type)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      skinType === type
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-[#F5F5F5] text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Skin Concerns */}
            <div className="mt-8">
              <p className="text-sm font-semibold text-gray-900 mb-1">피부 고민</p>
              <p className="text-xs text-[#8E8E93] mb-3">최대 3개 선택</p>
              <div className="grid grid-cols-2 gap-2">
                {SKIN_CONCERNS.map((concern) => (
                  <button
                    key={concern}
                    onClick={() => toggleConcern(concern)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      skinConcerns.includes(concern)
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-[#F5F5F5] text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {concern}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: SNS Channels */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              활동 중인 SNS 채널을<br />모두 선택해주세요
            </h1>
            <p className="text-sm text-[#8E8E93] mt-2">
              팔로워가 많은 채널을 메인으로 지정하면 브랜드 승인율 3.4배
            </p>

            <div className="mt-8 space-y-3">
              {SNS_CHANNELS.map(({ key, label }) => {
                const checked = selectedChannels[key] || false
                return (
                  <div key={key}>
                    <button
                      onClick={() => toggleChannel(key)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                        checked
                          ? 'bg-[#1A1A1A] text-white'
                          : 'bg-[#F5F5F5] text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {checked && <Check className="h-4 w-4 text-white shrink-0" />}
                      <span className="flex-1 text-left">{label}</span>
                      {checked && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setMainChannel(mainChannel === key ? null : key) }}
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            mainChannel === key
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/20 text-white/70'
                          }`}
                        >
                          {mainChannel === key ? '메인' : '메인 지정'}
                        </button>
                      )}
                    </button>
                    {checked && (
                      <input
                        type="text"
                        value={channelUrls[key] || ''}
                        onChange={(e) => setChannelUrls((prev) => ({ ...prev, [key]: e.target.value }))}
                        placeholder={key === 'instagram' ? '@username 또는 URL' : 'URL을 입력해주세요'}
                        className="w-full mt-2 px-4 py-3 bg-[#F5F5F5] rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 4: Bio + Experience */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              브랜드에게<br />나를 소개해주세요
            </h1>
            <p className="text-sm text-[#8E8E93] mt-2">나중에 수정할 수 있어요</p>

            {/* Bio */}
            <div className="mt-8">
              <p className="text-sm font-semibold text-gray-900 mb-2">내 소개</p>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="채널 컨셉, 팔로워 특성 등"
                rows={4}
                className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
            </div>

            {/* Selling Experience */}
            <div className="mt-8">
              <p className="text-sm font-semibold text-gray-900 mb-3">판매 경험이 있나요?</p>
              <div className="flex gap-3">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    onClick={() => { setHasExperience(val); if (!val) setAvgRevenue(null) }}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      hasExperience === val
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-[#F5F5F5] text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {val ? '예' : '아니오'}
                  </button>
                ))}
              </div>
            </div>

            {/* Revenue Range */}
            {hasExperience === true && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-gray-900 mb-3">평균 월 매출 구간</p>
                <div className="grid grid-cols-2 gap-2">
                  {REVENUE_RANGES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setAvgRevenue(avgRevenue === value ? null : value)}
                      className={`py-3 rounded-xl text-sm font-medium transition-all ${
                        avgRevenue === value
                          ? 'bg-[#1A1A1A] text-white'
                          : 'bg-[#F5F5F5] text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Shop Setup */}
        {step === 4 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              내 샵을 오픈할<br />준비가 되었어요!
            </h1>
            <p className="text-sm text-[#8E8E93] mt-2">마지막 단계예요</p>

            {/* Profile Image */}
            <div className="mt-8 flex flex-col items-center">
              <label className="relative cursor-pointer group">
                <div className="w-24 h-24 rounded-full bg-[#F5F5F5] overflow-hidden flex items-center justify-center">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt="프로필"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="h-8 w-8 text-gray-400" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center">
                  <Camera className="h-3.5 w-3.5 text-white" />
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadProfile}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-[#8E8E93] mt-3">프로필 사진</p>
            </div>

            {/* Shop ID */}
            <div className="mt-8">
              <p className="text-sm font-semibold text-gray-900 mb-2">샵 ID</p>
              <div className="relative">
                <input
                  type="text"
                  value={shopId}
                  onChange={(e) => {
                    const v = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
                    setShopId(v)
                    setShopIdAvailable(null)
                  }}
                  placeholder="영문, 숫자, 밑줄만 가능"
                  className="w-full px-4 py-3.5 bg-[#F5F5F5] rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-gray-900"
                />
                {checkingShopId && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                )}
                {!checkingShopId && shopIdAvailable === true && shopId.length >= 2 && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
              </div>
              {shopId.length >= 2 && (
                <p className={`text-xs mt-1.5 ${shopIdAvailable === true ? 'text-green-600' : shopIdAvailable === false ? 'text-red-500' : 'text-gray-400'}`}>
                  {shopIdAvailable === true
                    ? 'cnecshop.com/' + shopId + ' 사용 가능'
                    : shopIdAvailable === false
                    ? '이미 사용 중인 ID입니다'
                    : '확인 중...'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Fixed */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
        <div className="max-w-[480px] mx-auto space-y-2">
          {isSkippable && (
            <button
              onClick={handleSkip}
              className="w-full text-sm text-[#8E8E93] underline py-1"
            >
              건너뛰기
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed() || saving}
            className={`w-full h-[52px] rounded-xl text-[15px] font-semibold transition-all flex items-center justify-center ${
              canProceed() && !saving
                ? 'bg-[#1A1A1A] text-white active:scale-[0.98]'
                : 'bg-[#F5F5F5] text-[#8E8E93]'
            }`}
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : step === TOTAL_STEPS - 1 ? (
              '완료'
            ) : (
              '다음'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
