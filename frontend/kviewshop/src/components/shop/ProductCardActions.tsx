'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { addToCart } from '@/lib/actions/cart';
import { toggleWishlist } from '@/lib/actions/wishlist';
import { useGuestWishlistStore } from '@/lib/store/guest-wishlist';

interface ProductCardActionsProps {
  creatorId: string;
  productId: string;
  campaignId?: string | null;
  isWishlisted?: boolean;
  isLoggedIn: boolean;
  className?: string;
}

export function ProductCardActions({
  creatorId,
  productId,
  campaignId,
  isWishlisted = false,
  isLoggedIn,
  className,
}: ProductCardActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [wishlisted, setWishlisted] = useState(isWishlisted);

  // 비회원: hydration 후 guest-wishlist store에서 상태 확인
  useEffect(() => {
    if (!isLoggedIn) {
      const has = useGuestWishlistStore.getState().isWishlisted(creatorId, productId);
      setWishlisted(has);
    }
  }, [isLoggedIn, creatorId, productId]);

  // 로그인 유저의 서버 상태가 변경되면 반영
  useEffect(() => {
    if (isLoggedIn) {
      setWishlisted(isWishlisted);
    }
  }, [isLoggedIn, isWishlisted]);

  const handleAddCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      try {
        await addToCart({
          shopId: creatorId,
          productId,
          campaignId: campaignId || undefined,
          quantity: 1,
        });
        toast.success('장바구니에 담았어요');
        router.refresh();
      } catch {
        toast.error('담기에 실패했어요. 다시 시도해주세요');
      }
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      const result = useGuestWishlistStore.getState().toggle({
        shopId: creatorId,
        productId,
      });
      setWishlisted(result);
      if (result) {
        toast.success('찜했어요. 로그인하면 영구 저장돼요', {
          action: {
            label: '로그인',
            onClick: () => router.push('/buyer/login'),
          },
        });
      } else {
        toast.success('찜에서 제거했어요');
      }
      return;
    }

    startTransition(async () => {
      try {
        const result = await toggleWishlist({ shopId: creatorId, productId });
        setWishlisted(result.wishlisted);
        toast.success(result.wishlisted ? '찜했어요' : '찜에서 제거했어요');
      } catch {
        toast.error('실패했어요. 다시 시도해주세요');
      }
    });
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="flex-1 min-h-[44px]"
        disabled={pending}
        onClick={handleAddCart}
      >
        <ShoppingCart className="h-4 w-4" />
        <span className="ml-1">담기</span>
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="min-h-[44px] min-w-[44px] px-2"
        disabled={pending}
        onClick={handleToggleWishlist}
        aria-label={wishlisted ? '찜 해제' : '찜하기'}
      >
        <Heart
          className={cn(
            'h-4 w-4',
            wishlisted && 'fill-red-500 text-red-500'
          )}
        />
      </Button>
    </div>
  );
}
