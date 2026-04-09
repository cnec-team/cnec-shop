'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Package,
  ArrowLeft,
  Gift,
  ShoppingBag,
  Plus,
  Check,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/i18n/config'
import { BrandBadge } from '@/components/common/BrandBadge'
import {
  getCreatorSession,
  getPickableProducts,
  addProductToShop,
  applyGongguProduct,
} from '@/lib/actions/creator'
import { requestProductTrial, getCreatorShippingAddress } from '@/lib/actions/trial'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ProductDetail {
  id: string
  name: string
  nameKo: string | null
  originalPrice: number
  salePrice: number
  images: string[] | null
  imageUrl: string | null
  category: string | null
  volume: string | null
  description: string | null
  descriptionKo: string | null
  defaultCommissionRate: number
  brandId: string
  brand: { brandName: string } | null
  allowTrial: boolean
  activeCampaign: {
    id: string
    type: string
    commissionRate: number
    recruitmentType?: string
    campaignProduct?: { campaignPrice: number }
  } | null
}

const CATEGORY_LABEL: Record<string, string> = {
  skincare: '스킨케어',
  makeup: '메이크업',
  haircare: '헤어케어',
  bodycare: '바디케어',
  fragrance: '향수',
  supplement: '이너뷰티',
}

export default function CreatorProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const productId = params.productId as string

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdded, setIsAdded] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  // Trial modal
  const [trialOpen, setTrialOpen] = useState(false)
  const [trialAddress, setTrialAddress] = useState('')
  const [savedAddress, setSavedAddress] = useState('')
  const [trialMessage, setTrialMessage] = useState('')
  const [trialSubmitting, setTrialSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const creatorData = await getCreatorSession()
        if (!creatorData || cancelled) { setLoading(false); return }

        const [data, addrRes] = await Promise.all([
          getPickableProducts(creatorData.id),
          getCreatorShippingAddress(),
        ])

        if (cancelled) return

        const prods = data.products as unknown as ProductDetail[]
        const found = prods.find((p) => p.id === productId)
        if (found) {
          setProduct(found)
          const shopIds = new Set(data.myShopItemProductIds as unknown as string[])
          setIsAdded(shopIds.has(productId))
        }
        if (addrRes.address) setSavedAddress(addrRes.address)
      } catch {
        toast.error('상품 정보를 불러오지 못했어요.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [productId])

  const handleAddToShop = async () => {
    if (!product) return
    setActionLoading(true)
    try {
      await addProductToShop(product.id)
      toast.success('내 샵에 추가되었습니다')
      setIsAdded(true)
    } catch (error: any) {
      if (error?.message?.includes('Unique')) {
        toast.error('이미 추가된 상품입니다')
        setIsAdded(true)
      } else {
        toast.error('추가하지 못했어요')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleGonggu = async () => {
    if (!product?.activeCampaign) return
    setActionLoading(true)
    try {
      const result = await applyGongguProduct({
        productId: product.id,
        campaignId: product.activeCampaign.id,
        recruitmentType: product.activeCampaign.recruitmentType ?? 'APPROVAL',
      })
      if (result.isOpen) setIsAdded(true)
      toast.success(result.isOpen ? '공구 참여가 완료되었습니다' : '공구 참여 신청이 완료되었습니다')
    } catch (error: any) {
      if (error?.message?.includes('Unique')) toast.error('이미 참여 신청한 공구입니다')
      else toast.error('신청에 실패했습니다')
    } finally {
      setActionLoading(false)
    }
  }

  const openTrialModal = () => {
    setTrialAddress(savedAddress)
    setTrialMessage('')
    setTrialOpen(true)
  }

  const handleTrialSubmit = async () => {
    if (!product) return
    if (!trialAddress.trim()) {
      toast.error('배송지를 입력해주세요.')
      return
    }
    setTrialSubmitting(true)
    try {
      const res = await requestProductTrial({
        productId: product.id,
        message: trialMessage || undefined,
        shippingAddress: { address: trialAddress.trim() },
      })
      if (res.success) {
        toast.success('체험을 신청했어요!')
        setSavedAddress(trialAddress.trim())
        setTrialOpen(false)
      } else {
        toast.error(res.error ?? '신청에 실패했어요.')
      }
    } catch {
      toast.error('신청에 실패했어요.')
    } finally {
      setTrialSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-12 rounded-2xl" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Package className="w-12 h-12 text-gray-300" />
        <p className="text-sm text-gray-500">상품을 찾을 수 없어요</p>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>
    )
  }

  const images = product.images?.length ? product.images : (product.imageUrl ? [product.imageUrl] : [])
  const discount = Number(product.originalPrice) > Number(product.salePrice)
    ? Math.round(((Number(product.originalPrice) - Number(product.salePrice)) / Number(product.originalPrice)) * 100)
    : 0
  const isGonggu = product.activeCampaign?.type === 'GONGGU'
  const commissionRate = product.activeCampaign?.commissionRate ?? product.defaultCommissionRate
  const earnings = Math.round(Number(product.salePrice) * Number(commissionRate))
  const categoryLabel = product.category ? CATEGORY_LABEL[product.category] : null

  return (
    <div className="space-y-4 max-w-2xl pb-32">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> 뒤로
      </button>

      {/* Image Gallery */}
      <div className="space-y-2">
        <div className="aspect-square bg-gray-50 rounded-2xl relative overflow-hidden">
          {images[selectedImage] ? (
            <Image
              src={images[selectedImage]}
              alt={product.nameKo || product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-gray-300" />
            </div>
          )}
          {isGonggu && (
            <span className="absolute top-3 left-3 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
              공구
            </span>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 ${
                  selectedImage === i ? 'border-gray-900' : 'border-transparent'
                }`}
              >
                <Image src={img} alt="" width={64} height={64} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        {product.brand && <BrandBadge brandName={product.brand.brandName} />}
        <h1 className="text-lg font-bold text-gray-900">{product.nameKo || product.name}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {categoryLabel && (
            <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5">{categoryLabel}</span>
          )}
          {product.volume && (
            <span className="text-xs text-gray-400">{product.volume}</span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2">
          {discount > 0 && (
            <span className="text-lg font-bold text-red-500">{discount}%</span>
          )}
          <span className="text-xl font-bold text-gray-900">
            {formatCurrency(Number(product.salePrice), 'KRW')}
          </span>
        </div>
        {discount > 0 && (
          <p className="text-sm text-gray-400 line-through mt-0.5">
            {formatCurrency(Number(product.originalPrice), 'KRW')}
          </p>
        )}
        <p className="text-sm text-earnings font-semibold mt-2">
          팔면 ₩{earnings.toLocaleString()} 수익
        </p>
      </div>

      {/* Description */}
      {(product.descriptionKo || product.description) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">상품 설명</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
            {product.descriptionKo || product.description}
          </p>
        </div>
      )}

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-50">
        <div className="max-w-2xl mx-auto space-y-2">
          {/* Trial Button */}
          {product.allowTrial && (
            <Button
              onClick={openTrialModal}
              className="w-full h-12 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium text-sm border-0"
            >
              <Gift className="w-4 h-4 mr-2" />
              체험 신청하기
            </Button>
          )}

          {/* Gonggu / Shop Add */}
          {isAdded ? (
            <Button variant="outline" className="w-full h-12 rounded-xl font-medium text-sm" disabled>
              <Check className="w-4 h-4 mr-2" /> 이미 추가됨
            </Button>
          ) : isGonggu ? (
            <Button
              onClick={handleGonggu}
              disabled={actionLoading}
              className="w-full h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium text-sm"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShoppingBag className="w-4 h-4 mr-2" />}
              바로 공구 신청하기
            </Button>
          ) : (
            <Button
              onClick={handleAddToShop}
              disabled={actionLoading}
              className="w-full h-12 rounded-xl bg-gray-900 text-white hover:bg-gray-800 font-medium text-sm"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              내 샵에 추가
            </Button>
          )}
        </div>
      </div>

      {/* Trial Modal */}
      <Dialog open={trialOpen} onOpenChange={setTrialOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>체험 신청</DialogTitle>
            <DialogDescription>샘플을 받아보고 공구 여부를 결정하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3 items-center">
              <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                {images[0] ? (
                  <Image src={images[0]} alt="" width={56} height={56} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">{product.brand?.brandName}</p>
                <p className="text-sm font-medium text-gray-900">{product.nameKo || product.name}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>배송지 <span className="text-red-500">*</span></Label>
              <Input
                value={trialAddress}
                onChange={(e) => setTrialAddress(e.target.value)}
                placeholder="배송 받을 주소를 입력하세요"
              />
              {savedAddress && trialAddress === savedAddress && (
                <p className="text-xs text-gray-400">내 프로필에 저장된 주소입니다</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>메시지 (선택)</Label>
              <Textarea
                value={trialMessage}
                onChange={(e) => setTrialMessage(e.target.value)}
                placeholder="이 제품에 관심을 가진 이유를 알려주세요"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleTrialSubmit}
              disabled={trialSubmitting}
              className="w-full bg-gray-900 text-white rounded-xl h-11 font-medium"
            >
              {trialSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : '신청하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
