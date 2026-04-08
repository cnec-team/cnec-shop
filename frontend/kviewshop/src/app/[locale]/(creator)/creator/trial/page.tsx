'use client'

import { useState, useEffect, useCallback } from 'react'
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
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getTrialableProducts,
  requestProductTrial,
} from '@/lib/actions/trial'

type TrialProduct = {
  id: string
  name: string | null
  nameKo: string | null
  imageUrl: string | null
  thumbnailUrl: string | null
  category: string | null
  description: string | null
  descriptionKo: string | null
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

  const handleCategoryChange = (cat: string) => {
    setCategory(cat)
    setPage(1)
  }

  const openModal = (product: TrialProduct) => {
    setSelectedProduct(product)
    setMessage('')
    setAddress('')
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!selectedProduct) return
    setSubmitting(true)
    try {
      const shippingAddress = address ? { address } : undefined
      const res = await requestProductTrial({
        productId: selectedProduct.id,
        message: message || undefined,
        shippingAddress,
      })
      if (res.success) {
        toast.success('체험을 신청했어요!')
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onApply={openModal}
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
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex gap-3 items-center">
                <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                  {selectedProduct.thumbnailUrl || selectedProduct.imageUrl ? (
                    <Image
                      src={selectedProduct.thumbnailUrl || selectedProduct.imageUrl || ''}
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

              <div className="space-y-2">
                <Label htmlFor="trial-address">배송지 (선택)</Label>
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
              disabled={submitting}
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
}: {
  product: TrialProduct
  onApply: (p: TrialProduct) => void
}) {
  const existing = product.existingTrial
  const statusInfo = existing ? STATUS_LABEL[existing.status] : null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="aspect-square bg-gray-50 relative">
        {product.thumbnailUrl || product.imageUrl ? (
          <Image
            src={product.thumbnailUrl || product.imageUrl || ''}
            alt={product.nameKo || product.name || ''}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <p className="text-xs text-gray-500">{product.brand.companyName}</p>
        <p className="text-sm font-medium text-gray-900 line-clamp-2">
          {product.nameKo || product.name}
        </p>

        {existing && statusInfo ? (
          <div className="pt-1">
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${statusInfo.className}`}>
              <statusInfo.icon className="w-3 h-3" />
              {statusInfo.text}
            </span>
          </div>
        ) : (
          <Button
            onClick={() => onApply(product)}
            className="w-full bg-gray-900 text-white rounded-xl h-10 text-sm font-medium mt-2"
          >
            체험 신청하기
          </Button>
        )}
      </div>
    </div>
  )
}
