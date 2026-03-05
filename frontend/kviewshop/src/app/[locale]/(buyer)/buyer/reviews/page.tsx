'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/lib/hooks/use-user';
import { getClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  Gift,
  Instagram,
  Image as ImageIcon,
  Loader2,
  Check,
  Clock,
  ThumbsUp,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  product_id: string;
  rating: number;
  title: string;
  content: string;
  images: string[];
  instagram_post_url: string | null;
  instagram_verified: boolean;
  points_awarded: number;
  is_approved: boolean;
  helpful_count: number;
  created_at: string;
  product?: {
    name: string | null;
    name_ko: string | null;
    name_en: string | null;
    images: string[] | null;
    image_url: string | null;
  };
}

interface PendingReviewOrder {
  id: string;
  order_number: string;
  created_at: string;
  items: Array<{
    product_id: string;
    product: {
      id: string;
      name: string | null;
      name_ko: string | null;
      name_en: string | null;
      images: string[] | null;
      image_url: string | null;
    };
  }>;
}

export default function BuyerReviewsPage() {
  const { buyer } = useUser();
  const params = useParams();
  const locale = params.locale as string;

  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingReviewOrder[]>([]);
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

  useEffect(() => {
    const loadData = async () => {
      if (!buyer) return;

      try {
        const supabase = getClient();

        // Load existing reviews
        const { data: reviewsData } = await supabase
          .from('product_reviews')
          .select(`
            *,
            product:products (
              name,
              name_ko,
              name_en,
              images,
              image_url
            )
          `)
          .eq('buyer_id', buyer.id)
          .order('created_at', { ascending: false });

        if (reviewsData) {
          setReviews(reviewsData);
        }

        // Load completed orders without reviews
        const { data: ordersData } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            created_at,
            items:order_items (
              product_id,
              product:products (
                id,
                name,
                name_ko,
                name_en,
                images,
                image_url
              )
            )
          `)
          .eq('buyer_id', buyer.id)
          .eq('status', 'DELIVERED')
          .order('created_at', { ascending: false });

        if (ordersData) {
          // Filter out products that already have reviews
          const reviewedProductIds = new Set(reviewsData?.map(r => r.product_id) || []);
          const ordersWithPendingReviews = ordersData
            .map(order => ({
              ...order,
              items: order.items.filter(item => !reviewedProductIds.has(item.product_id)),
            }))
            .filter(order => order.items.length > 0);

          setPendingOrders(ordersWithPendingReviews as any);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [buyer]);

  const handleSubmitReview = async () => {
    if (!buyer || !selectedProduct || !reviewForm.content) {
      toast.error('Please fill in the review content');
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = getClient();

      // Find the order that contains this product
      const orderWithProduct = pendingOrders.find(o =>
        o.items.some(i => i.product_id === selectedProduct)
      );

      const { data, error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: selectedProduct,
          buyer_id: buyer.id,
          order_id: orderWithProduct?.id,
          rating: reviewForm.rating,
          title: reviewForm.title || null,
          content: reviewForm.content,
          instagram_post_url: reviewForm.instagram_post_url || null,
          is_verified_purchase: true,
          is_approved: true, // Auto-approve for now
        })
        .select()
        .single();

      if (error) throw error;

      // Calculate points
      const pointsEarned = reviewForm.instagram_post_url ? 1000 : 500;

      toast.success(`Review submitted! You earned ${pointsEarned} points!`);

      // Reset form
      setSelectedProduct(null);
      setReviewForm({ rating: 5, title: '', content: '', instagram_post_url: '' });

      // Refresh data
      setReviews([data, ...reviews]);
      setPendingOrders(orders =>
        orders.map(o => ({
          ...o,
          items: o.items.filter(i => i.product_id !== selectedProduct),
        })).filter(o => o.items.length > 0)
      );
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
          <Star className="h-8 w-8 text-yellow-500" />
          My Reviews
        </h1>
        <p className="text-muted-foreground mt-1">
          Write reviews and earn reward points!
        </p>
      </div>

      {/* Points Info */}
      <Card className="bg-gradient-to-r from-primary/10 to-yellow-500/10 border-primary/20">
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="p-3 rounded-full bg-primary/20">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Earn Points for Reviews!</h3>
            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4" /> Text Review: <strong className="text-primary">500P</strong>
              </span>
              <span className="flex items-center gap-1">
                <Instagram className="h-4 w-4" /> + Instagram Post: <strong className="text-primary">1,000P</strong>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('write')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'write'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Write Review ({pendingOrders.reduce((acc, o) => acc + o.items.length, 0)})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          History ({reviews.length})
        </button>
      </div>

      {activeTab === 'write' ? (
        <div className="space-y-4">
          {pendingOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Check className="h-16 w-16 mx-auto text-green-500/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground">
                  You've reviewed all your purchased products. Shop more to write more reviews!
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Product Selection */}
              {!selectedProduct ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {pendingOrders.flatMap(order =>
                    order.items.map(item => (
                      <Card
                        key={item.product_id}
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => setSelectedProduct(item.product_id)}
                      >
                        <CardContent className="flex items-center gap-4 pt-6">
                          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                            {item.product.images?.[0] ? (
                              <img
                                src={item.product.image_url || (item.product.images && item.product.images[0]) || ''}
                                alt={item.product.name_en || item.product.name || ''}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">
                              {locale === 'ko' ? (item.product.name_ko || item.product.name || item.product.name_en) : (item.product.name_en || item.product.name || item.product.name_ko)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Order: {order.order_number}
                            </p>
                          </div>
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            +500P~
                          </Badge>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Write Your Review</CardTitle>
                    <CardDescription>
                      Share your honest feedback
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Rating */}
                    <div className="space-y-2">
                      <Label>Rating</Label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            className="p-1"
                          >
                            <Star
                              className={`h-8 w-8 ${
                                star <= reviewForm.rating
                                  ? 'fill-yellow-500 text-yellow-500'
                                  : 'text-muted'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Title (optional)</Label>
                      <Input
                        placeholder="Summarize your experience"
                        value={reviewForm.title}
                        onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Review *</Label>
                      <Textarea
                        placeholder="Share your thoughts about this product..."
                        value={reviewForm.content}
                        onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                        rows={4}
                      />
                    </div>

                    {/* Instagram bonus */}
                    <div className="p-4 rounded-lg bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Instagram className="h-5 w-5 text-pink-500" />
                        <span className="font-medium">Double your points!</span>
                        <Badge className="bg-pink-500">+500P bonus</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Post your review on Instagram and paste the link below
                      </p>
                      <Input
                        placeholder="https://instagram.com/p/..."
                        value={reviewForm.instagram_post_url}
                        onChange={(e) => setReviewForm({ ...reviewForm, instagram_post_url: e.target.value })}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSubmitReview}
                        className="btn-gold flex-1"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            Submit Review
                            <Badge className="ml-2">
                              +{reviewForm.instagram_post_url ? '1,000' : '500'}P
                            </Badge>
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Star className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                <p className="text-muted-foreground">
                  Complete an order and write your first review!
                </p>
              </CardContent>
            </Card>
          ) : (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden">
                        {review.product?.images?.[0] && (
                          <img
                            src={review.product.image_url || (review.product.images && review.product.images[0]) || ''}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {locale === 'ko' ? (review.product?.name_ko || review.product?.name || review.product?.name_en) : (review.product?.name_en || review.product?.name || review.product?.name_ko)}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? 'fill-yellow-500 text-yellow-500'
                                  : 'text-muted'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm mt-2">{review.content}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{new Date(review.created_at).toLocaleDateString()}</span>
                          {review.instagram_post_url && (
                            <a
                              href={review.instagram_post_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-pink-500"
                            >
                              <Instagram className="h-3 w-3" />
                              Instagram
                            </a>
                          )}
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {review.helpful_count} helpful
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      +{review.points_awarded}P
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
