'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Star,
  ThumbsUp,
  ChevronDown,
  Camera,
  Video,
  Instagram,
  BadgeCheck,
  Sparkles,
  Play,
} from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  images: string[];
  videos: string[];
  instagramPostUrl: string | null;
  instagramVerified: boolean;
  isVerifiedPurchase: boolean;
  isFeatured: boolean;
  helpfulCount: number;
  buyerName: string;
  createdAt: string;
}

interface ReviewStats {
  total: number;
  average: number;
  distribution: Record<number, number>;
}

interface ReviewSectionProps {
  productId: string;
  locale: string;
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${cls} ${
            i <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'
          }`}
        />
      ))}
    </div>
  );
}

export function ReviewSection({ productId, locale }: ReviewSectionProps) {
  const isKo = locale === 'ko';
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState('recent');
  const [ratingFilter, setRatingFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const t = {
    reviews: isKo ? '리뷰' : 'Reviews',
    noReviews: isKo ? '아직 리뷰가 없습니다' : 'No reviews yet',
    firstReview: isKo ? '첫 번째 리뷰를 작성해보세요' : 'Be the first to review',
    sortRecent: isKo ? '최신순' : 'Recent',
    sortHelpful: isKo ? '도움순' : 'Most Helpful',
    sortRatingHigh: isKo ? '높은평점' : 'High Rating',
    sortRatingLow: isKo ? '낮은평점' : 'Low Rating',
    all: isKo ? '전체' : 'All',
    helpful: isKo ? '도움돼요' : 'Helpful',
    verified: isKo ? '인증구매' : 'Verified',
    featured: isKo ? '추천' : 'Featured',
    loadMore: isKo ? '더 보기' : 'Load More',
    aiSummary: isKo ? 'AI 리뷰 요약' : 'AI Review Summary',
    generating: isKo ? 'AI가 리뷰를 분석하고 있습니다...' : 'AI is analyzing reviews...',
    photoVideo: isKo ? '포토/영상' : 'Photo/Video',
  };

  const fetchReviews = useCallback(async (pageNum: number, append: boolean = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        productId,
        sort,
        page: String(pageNum),
        limit: '10',
      });
      if (ratingFilter) params.set('rating', ratingFilter);

      const res = await fetch(`/api/reviews?${params.toString()}`);
      const data = await res.json();
      setReviews((prev) => (append ? [...prev, ...data.reviews] : data.reviews));
      setStats(data.stats);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [productId, sort, ratingFilter]);

  useEffect(() => {
    fetchReviews(1, false);
  }, [fetchReviews]);

  // Fetch AI summary
  useEffect(() => {
    async function fetchSummary() {
      setSummaryLoading(true);
      try {
        const res = await fetch('/api/reviews/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });
        const data = await res.json();
        if (data.summary) setSummary(data.summary);
      } catch {
        // ignore
      } finally {
        setSummaryLoading(false);
      }
    }
    fetchSummary();
  }, [productId]);

  const sortOptions = [
    { value: 'recent', label: t.sortRecent },
    { value: 'helpful', label: t.sortHelpful },
    { value: 'rating_high', label: t.sortRatingHigh },
    { value: 'rating_low', label: t.sortRatingLow },
  ];

  async function toggleHelpful(reviewId: string) {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? { ...r, helpfulCount: r.helpfulCount + (data.voted ? 1 : -1) }
              : r
          )
        );
      }
    } catch {
      // ignore
    }
  }

  if (!stats) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold flex items-center gap-2">
        {t.reviews}
        <span className="text-primary text-base">{stats.total}</span>
      </h2>

      {stats.total > 0 ? (
        <>
          {/* Rating Overview */}
          <div className="mt-4 p-5 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold">{stats.average}</div>
                <StarRating rating={Math.round(stats.average)} size="lg" />
              </div>
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRatingFilter(ratingFilter === String(star) ? '' : String(star))}
                    className={`flex items-center gap-2 w-full group ${
                      ratingFilter === String(star) ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span className="text-xs w-4 text-muted-foreground">{star}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{
                          width: `${stats.total > 0 ? (stats.distribution[star] / stats.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {stats.distribution[star]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Summary */}
          {(summary || summaryLoading) && (
            <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-violet-500/5 to-blue-500/5 border border-violet-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <h3 className="text-sm font-semibold text-violet-600">{t.aiSummary}</h3>
              </div>
              {summaryLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" />
                  <div className="h-2 w-2 rounded-full bg-violet-400 animate-bounce [animation-delay:0.1s]" />
                  <div className="h-2 w-2 rounded-full bg-violet-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="text-sm text-muted-foreground ml-1">{t.generating}</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {summary}
                </p>
              )}
            </div>
          )}

          {/* Sort */}
          <div className="flex gap-1.5 mt-4 overflow-x-auto">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  sort === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'text-muted-foreground border-border hover:border-primary/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Review List */}
          <div className="mt-4 space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className={`p-4 rounded-2xl border ${
                  review.isFeatured
                    ? 'border-primary/20 bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    <span className="text-sm font-medium">{review.buyerName}</span>
                    {review.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-green-600 bg-green-500/10 rounded-full px-1.5 py-0.5">
                        <BadgeCheck className="h-3 w-3" />
                        {t.verified}
                      </span>
                    )}
                    {review.isFeatured && (
                      <span className="text-xs text-primary bg-primary/10 rounded-full px-1.5 py-0.5 font-medium">
                        {t.featured}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Title */}
                {review.title && (
                  <p className="text-sm font-semibold mt-2">{review.title}</p>
                )}

                {/* Content */}
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {review.content}
                </p>

                {/* Images */}
                {review.images.length > 0 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto">
                    {review.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setExpandedImage(img)}
                        className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden border border-border"
                      >
                        <Image src={img} alt="" fill className="object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/20 transition-opacity">
                          <Camera className="h-4 w-4 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Videos */}
                {review.videos.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto">
                    {review.videos.map((vid, i) => (
                      <a
                        key={i}
                        href={vid}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center"
                      >
                        <Play className="h-6 w-6 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Instagram */}
                {review.instagramPostUrl && (
                  <a
                    href={review.instagramPostUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-pink-500 hover:underline"
                  >
                    <Instagram className="h-3.5 w-3.5" />
                    Instagram
                    {review.instagramVerified && (
                      <BadgeCheck className="h-3 w-3 text-blue-500" />
                    )}
                  </a>
                )}

                {/* Helpful */}
                <div className="mt-3 pt-2 border-t border-border/50">
                  <button
                    onClick={() => toggleHelpful(review.id)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {t.helpful} {review.helpfulCount > 0 && `(${review.helpfulCount})`}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {page < totalPages && (
            <div className="mt-6 text-center">
              <button
                onClick={() => fetchReviews(page + 1, true)}
                disabled={loading}
                className="rounded-full border border-border bg-card px-6 py-2 text-sm font-medium hover:border-primary/30 transition-colors disabled:opacity-50"
              >
                {loading ? '...' : t.loadMore}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 text-center py-12 rounded-2xl bg-card border border-border">
          <Star className="mx-auto h-10 w-10 text-muted-foreground/20 mb-3" />
          <p className="text-muted-foreground">{t.noReviews}</p>
          <p className="text-sm text-muted-foreground/70 mt-1">{t.firstReview}</p>
        </div>
      )}

      {/* Image Lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-h-[80vh] max-w-[90vw]">
            <Image
              src={expandedImage}
              alt=""
              width={800}
              height={800}
              className="rounded-2xl object-contain max-h-[80vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
