'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/lib/hooks/use-user';
import { getBuyerReviewsData, submitReview } from '@/lib/actions/buyer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Star,
  Instagram,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface ReviewProduct {
  id?: string;
  name?: string | null;
  nameKo?: string | null;
  nameEn?: string | null;
  imageUrl?: string | null;
  images?: string[];
}

interface OrderItem {
  id?: string;
  productId: string;
  productName?: string | null;
  productImage?: string | null;
  product?: ReviewProduct;
  price?: number | string;
}

interface PendingOrder {
  id: string;
  orderNumber: string | null;
  createdAt: string;
  items: OrderItem[];
}

interface Review {
  id: string;
  rating: number;
  content: string;
  title?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  instagramPostUrl?: string | null;
  instagram_post_url?: string | null;
  helpfulCount?: number;
  helpful_count?: number;
  pointsAwarded?: number;
  points_awarded?: number;
  pointsAwardedAt?: string | null;
  product?: ReviewProduct;
  [key: string]: unknown;
}

export default function BuyerReviewsPage() {
  const { buyer } = useUser();
  const params = useParams();
  const locale = params.locale as string;

  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'write' | 'history'>('write');

  // Review form state
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    content: '',
    instagram_post_url: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const buyerId = buyer?.id;
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!buyerId || fetchedRef.current) return;
    fetchedRef.current = true;

    const loadData = async () => {
      try {
        const data = await getBuyerReviewsData(buyerId);
        setReviews(data.reviews || []);
        setPendingOrders(data.pendingOrders || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [buyerId]);

  const pendingCount = pendingOrders.reduce(
    (acc: number, o) => acc + (o.items?.length || 0), 0
  );

  const handleSubmitReview = async () => {
    if (!buyer || !selectedProduct || !reviewForm.content) {
      toast.error('리뷰 내용을 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderWithProduct = pendingOrders.find((o) =>
        o.items?.some((i) => i.productId === selectedProduct)
      );

      const result = await submitReview({
        buyerId: buyer.id,
        productId: selectedProduct,
        orderId: orderWithProduct?.id,
        rating: reviewForm.rating,
        title: reviewForm.title || undefined,
        content: reviewForm.content,
        instagramPostUrl: reviewForm.instagram_post_url || undefined,
      });

      const pointsEarned = result.pointsEarned || (reviewForm.instagram_post_url ? 1000 : 500);
      toast.success(`리뷰가 등록되었습니다! ${pointsEarned}P 적립`);

      setSelectedProduct(null);
      setReviewForm({ rating: 5, title: '', content: '', instagram_post_url: '' });

      setPendingOrders(orders =>
        orders.map((o) => ({
          ...o,
          items: (o.items || []).filter((i) =>
            i.productId !== selectedProduct
          ),
        })).filter((o) => (o.items || []).length > 0)
      );
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('리뷰 등록에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">내 리뷰</h1>
        <p className="text-sm text-gray-500 mt-1">
          작성한 리뷰를 관리하세요
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-gray-100 rounded-xl p-1 flex">
        <button
          onClick={() => setActiveTab('write')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            activeTab === 'write'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500'
          }`}
        >
          작성 가능 ({pendingCount})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500'
          }`}
        >
          작성 완료 ({reviews.length})
        </button>
      </div>

      {activeTab === 'write' ? (
        <div className="space-y-3">
          {pendingCount === 0 ? (
            /* Empty state - writable */
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="py-10 text-center">
                <Star className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  작성 가능한 리뷰가 없어요
                </p>
                <p className="text-xs text-gray-400">
                  상품을 구매하면 리뷰를 작성할 수 있어요
                </p>
              </div>
            </div>
          ) : !selectedProduct ? (
            /* Product Selection List */
            <div className="space-y-3">
              {pendingOrders.flatMap((order) =>
                (order.items || []).map((item) => {
                  const imgSrc = item.product?.imageUrl || item.product?.images?.[0] || item.productImage;
                  const productName = item.product?.name || item.product?.nameKo || item.product?.nameEn || item.productName || '상품';
                  const price = item.price ? Number(item.price) : 0;

                  return (
                    <div
                      key={`${order.id}-${item.productId}`}
                      className="bg-white rounded-2xl border border-gray-100 p-5"
                    >
                      <div className="flex items-center gap-3">
                        {/* Product Image */}
                        <div className="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {imgSrc ? (
                            <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-gray-300" />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                            {productName}
                          </p>
                          {price > 0 && (
                            <p className="text-sm font-bold text-gray-900 mt-0.5">
                              {price.toLocaleString()}원
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString('ko-KR')} 구매
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => setSelectedProduct(item.productId)}
                        className="w-full mt-4 bg-gray-900 text-white rounded-xl h-11 text-sm font-medium"
                      >
                        리뷰 작성하기
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Review Form */
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
              <div>
                <p className="text-sm font-bold text-gray-900 mb-3">별점</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="p-0.5"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= reviewForm.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-gray-900 mb-2">제목 (선택)</p>
                <Input
                  placeholder="한줄 요약을 작성해주세요"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div>
                <p className="text-sm font-bold text-gray-900 mb-2">리뷰 내용</p>
                <Textarea
                  placeholder="솔직한 사용 후기를 남겨주세요..."
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                  rows={4}
                  className="rounded-xl border-gray-200"
                />
              </div>

              {/* Instagram bonus */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Instagram className="h-4 w-4 text-pink-500" />
                  <span className="text-sm font-semibold text-gray-900">
                    인스타그램 리뷰 보너스
                  </span>
                  <span className="rounded-full bg-pink-100 text-pink-600 px-2.5 py-0.5 text-xs font-medium">
                    +500P
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  인스타그램에 리뷰를 올리고 링크를 입력하면 추가 500P 적립
                </p>
                <Input
                  placeholder="https://instagram.com/p/..."
                  value={reviewForm.instagram_post_url}
                  onChange={(e) => setReviewForm({ ...reviewForm, instagram_post_url: e.target.value })}
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitReview}
                  disabled={isSubmitting || !reviewForm.content}
                  className="flex-1 bg-gray-900 text-white rounded-xl h-11 text-sm font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      등록 중...
                    </>
                  ) : (
                    <>
                      리뷰 등록하기
                      <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                        +{reviewForm.instagram_post_url ? '1,000' : '500'}P
                      </span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedProduct(null)}
                  className="border-gray-200 rounded-xl h-11 px-4 text-sm"
                >
                  취소
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* History tab */
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="py-10 text-center">
                <Star className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  작성한 리뷰가 없어요
                </p>
                <p className="text-xs text-gray-400">
                  구매하신 상품의 솔직한 리뷰를 남겨주세요!
                </p>
              </div>
            </div>
          ) : (
            reviews.map((review) => {
              const imgSrc = review.product?.imageUrl || review.product?.images?.[0];
              const productName = review.product?.name || review.product?.nameKo || review.product?.nameEn || '상품';
              const reviewDate = new Date(review.createdAt || review.created_at || '').toLocaleDateString('ko-KR');

              return (
                <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex gap-3">
                    {/* Product Image */}
                    <div className="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {imgSrc ? (
                        <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-gray-300" />
                      )}
                    </div>

                    {/* Review Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {productName}
                      </p>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3.5 w-3.5 ${
                              star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-200'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-gray-400 ml-1">{reviewDate}</span>
                      </div>

                      {/* Review text */}
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {review.content}
                      </p>

                      {/* Instagram badge */}
                      {(review.instagramPostUrl || review.instagram_post_url) && (
                        <a
                          href={review.instagramPostUrl || review.instagram_post_url || ''}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs text-pink-500"
                        >
                          <Instagram className="h-3 w-3" />
                          인스타그램 리뷰
                        </a>
                      )}
                    </div>

                    {/* Points badge */}
                    <div className="flex-shrink-0">
                      <span className="rounded-full bg-blue-50 text-blue-600 px-2.5 py-0.5 text-xs font-medium">
                        +{review.pointsAwarded || review.points_awarded || 0}P
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
