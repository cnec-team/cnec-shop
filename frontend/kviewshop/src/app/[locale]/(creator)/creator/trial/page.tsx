'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Gift,
  Loader2,
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getTrialableProducts,
  requestProductTrial,
  getCreatorShippingInfo,
} from '@/lib/actions/trial'

type TrialProduct = {
  id: string
  name: string | null
  nameKo: string | null
  imageUrl: string | null
  thumbnailUrl: string | null
  images: string[]
  category: string | null
  description: string | null
  descriptionKo: string | null
  price: string | number | null
  originalPrice: string | number | null
  salePrice: string | number | null
  volume: string | null
  brand: { id: string; companyName: string | null; logoUrl: string | null }
  existingTrial: { id: string; status: string } | null
}

const CATEGORIES = [
  { value: '', label: '전체' },
  { value: 'skincare', label: '스킨케어' },
  { value: 'makeup', label: '메이크업' },
  { value: 'haircare', label: '헤어케어' },
  { value: 'bodycare', label: '바디케어' },
  { value: 'fragrance', label: '향수' },
  { value: 'supplement', label: '이너뷰티' },
]

const CATEGORY_LABEL: Record<string, string> = {
  skincare: '스킨케어',
  makeup: '메이크업',
  haircare: '헤어케어',
  bodycare: '바디케어',
  fragrance: '향수',
  supplement: '이너뷰티',
}

function formatPrice(val: string | number | null | undefined): string | null {
  if (val == null) return null
  const n = Number(val)
  if (isNaN(n) || n === 0) return null
  return n.toLocaleString('ko-KR') + '원'
}

const STATUS_LABEL: Record<string, { text: string; className: string; icon: React.ElementType }> = {
  pending: { text: '신청중', className: 'bg-yellow-50 text-yellow-700', icon: Clock },
  approved: { text: '승인됨', className: 'bg-blue-50 text-blue-700', icon: CheckCircle2 },
  shipped: { text: '배송중', className: 'bg-purple-50 text-purple-700', icon: Truck },
  received: { text: '수령완료', className: 'bg-emerald-50 text-emerald-700', icon: PackageCheck },
}

export default function CreatorTrialCatalogPage() {
  const [products, setProducts] = useState<TrialProduct[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<TrialProduct | null>(null)
  const [message, setMessage] = useState('')
  const [address, setAddress] = useState('')
  const [savedAddress, setSavedAddress] = useState('')
  const [savedName, setSavedName] = useState('')
  const [savedPhone, setSavedPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getTrialableProducts({
        category: category || undefined,
        page,
        limit,
      })
      setProducts(res.products as TrialProduct[])
      setTotal(res.total)
    } catch {
      toast.error('상품 목록을 불러오지 못했어요.')
    } finally {
      setLoading(false)
    }
  }, [category, page])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    getCreatorShippingInfo().then((res) => {
      if (res.address) setSavedAddress(res.address)
      if (res.name) setSavedName(res.name)
      if (res.phone) setSavedPhone(res.phone)
    })
  }, [])

  const profileComplete = useMemo(
    () => Boolean(savedName && savedPhone && savedAddress),
    [savedName, savedPhone, savedAddress]
  )

  const handleCategoryChange = (cat: string) => {
    setCategory(cat)
    setPage(1)
  }

  const openModal = (product: TrialProduct) => {
    if (!profileComplete) {
      toast.error('프로필 정보를 먼저 등록해주세요. (이름, 연락처, 배송지)')
      return
    }
    setSelectedProduct(product)
    setMessage('')
    setAddress(savedAddress)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!selectedProduct) return
    if (!savedName || !savedPhone) {
      toast.error('설정에서 이름과 연락처를 입력해주세요.')
      return
    }
    if (!address.trim()) {
      toast.error('배송지를 입력해주세요.')
      return
    }
    setSubmitting(true)
    try {
      const shippingAddress = { address: address.trim() }
      const res = await requestProductTrial({
        productId: selectedProduct.id,
        message: message || undefined,
        shippingAddress,
      })
      if (res.success) {
        toast.success('체험을 신청했어요!')
        setSavedAddress(address.trim())
        setModalOpen(false)
        fetchProducts()
      } else {
        toast.error(res.error ?? '신청에 실패했어요.')
      }
    } catch {
      toast.error('신청에 실패했어요. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">제품 체험 신청</h1>
        <p className="text-sm text-gray-500 mt-1">써보고 공구 여부를 결정하세요</p>
      </div>

      {/* Profile Incomplete Banner */}
      {!profileComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-amber-800">프로필 정보를 먼저 등록해주세요</p>
            <p className="text-xs text-amber-600">이름, 연락처, 배송지를 입력해야 체험 신청이 가능합니다</p>
            <Link
              href="/ko/creator/settings"
              className="inline-block text-sm font-medium text-amber-700 underline underline-offset-2 mt-1"
            >
              프로필 설정하기
            </Link>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategoryChange(cat.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              category === cat.value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* My trials link */}
      <Link
        href="/ko/creator/trial/my"
        className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Gift className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">내 체험 현황</p>
            <p className="text-xs text-gray-500">신청 내역과 진행 상황을 확인하세요</p>
          </div>
        </div>
        <Search className="w-4 h-4 text-gray-400" />
      </Link>

      {/* Products Grid */}
      {loading ? (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Package className="w-12 h-12 text-gray-300" />
          <p className="text-sm text-gray-500">아직 체험 가능한 상품이 없어요.</p>
          <p className="text-xs text-gray-400">곧 추가될 예정이에요!</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onApply={openModal}
                profileComplete={profileComplete}
              />
            ))}
          </div>
          {total > page * limit && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
              >
                더 보기
              </Button>
            </div>
          )}
        </>
      )}

      {/* Apply Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>체험 신청</DialogTitle>
            <DialogDescription>샘플을 받아보고 공구 여부를 결정하세요</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex gap-3 items-center">
                <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                  {selectedProduct.thumbnailUrl || selectedProduct.imageUrl || selectedProduct.images?.[0] ? (
                    <Image
                      src={selectedProduct.thumbnailUrl || selectedProduct.imageUrl || selectedProduct.images?.[0] || ''}
                      alt=""
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500">{selectedProduct.brand.companyName}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedProduct.nameKo || selectedProduct.name}
                  </p>
                </div>
              </div>

              {/* Shipping Info Confirmation */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <p className="text-xs font-medium text-gray-700">배송 정보</p>
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
                  <span className="text-gray-400">이름</span>
                  <span className={savedName ? 'text-gray-900 font-medium' : 'text-red-500 font-medium'}>{savedName || '미입력'}</span>
                  <span className="text-gray-400">연락처</span>
                  <span className={savedPhone ? 'text-gray-900 font-medium' : 'text-red-500 font-medium'}>{savedPhone || '미입력'}</span>
                  <span className="text-gray-400">주소</span>
                  <span className={address ? 'text-gray-900 font-medium' : 'text-red-500 font-medium'}>{address || '미입력'}</span>
                </div>
                {(!savedName || !savedPhone) && (
                  <p className="text-xs text-red-500">설정에서 이름과 연락처를 입력해주세요</p>
                )}
                {(!savedName || !savedPhone) && (
                  <Link href="/ko/creator/settings" className="text-xs text-blue-600 underline">설정에서 정보 입력하기</Link>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="trial-address">
                  배송지 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="trial-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="배송 받을 주소를 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trial-message">메시지 (선택)</Label>
                <Textarea
                  id="trial-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="이 제품에 관심을 가진 이유를 알려주세요"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !savedName || !savedPhone}
              className="w-full bg-gray-900 text-white rounded-xl h-11 font-medium"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                '신청하기'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProductCard({
  product,
  onApply,
  profileComplete,
}: {
  product: TrialProduct
  onApply: (p: TrialProduct) => void
  profileComplete: boolean
}) {
  const existing = product.existingTrial
  const statusInfo = existing ? STATUS_LABEL[existing.status] : null
  const imgSrc = product.thumbnailUrl || product.imageUrl || product.images?.[0]
  const price = formatPrice(product.salePrice) || formatPrice(product.price)
  const originalPrice = formatPrice(product.originalPrice)
  const categoryLabel = product.category ? CATEGORY_LABEL[product.category] : null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="aspect-[4/3] bg-gray-50 relative">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={product.nameKo || product.name || ''}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-300" />
          </div>
        )}
        {categoryLabel && (
          <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-xs text-gray-600 rounded-full px-2 py-0.5">
            {categoryLabel}
          </span>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <p className="text-xs text-gray-500">{product.brand.companyName}</p>
        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
          {product.nameKo || product.name}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {price && (
            <p className="text-sm font-bold text-gray-900">{price}</p>
          )}
          {originalPrice && price && originalPrice !== price && (
            <p className="text-xs text-gray-400 line-through">{originalPrice}</p>
          )}
          {product.volume && (
            <span className="text-xs text-gray-400">{product.volume}</span>
          )}
        </div>

        {existing && statusInfo ? (
          <div className="pt-1">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.className}`}>
              <statusInfo.icon className="w-3 h-3" />
              {statusInfo.text}
            </span>
          </div>
        ) : (
          <Button
            onClick={() => onApply(product)}
            className="w-full bg-gray-900 text-white rounded-xl h-9 text-sm font-medium mt-1"
          >
            체험 신청
          </Button>
        )}
      </div>
    </div>
  )
}
