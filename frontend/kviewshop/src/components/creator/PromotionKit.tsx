'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Copy, Hash, MessageSquare, Link as LinkIcon } from 'lucide-react';
import { buildShareUrl, buildPromotionCaption } from '@/lib/share';
import { PRODUCT_CATEGORY_LABELS } from '@/types/database';
import type { ProductCategory } from '@/types/database';

interface PromotionKitProps {
  productName: string;
  brandName: string;
  category: ProductCategory;
  shopId: string;
  productId: string;
}

export function PromotionKit({ productName, brandName, category, shopId, productId }: PromotionKitProps) {
  const baseUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.cnec.kr'}/ko/${shopId}/product/${productId}`;
  const shareUrl = buildShareUrl(baseUrl, 'instagram');
  const categoryLabel = PRODUCT_CATEGORY_LABELS[category] || category;
  const caption = `직접 써보고 추천하는 ${productName}! 프로필 링크에서 구매할 수 있어요`;
  const hashtags = `#크넥 #${brandName} #${categoryLabel}`;
  const fullText = buildPromotionCaption(productName, brandName, categoryLabel, shareUrl);

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(fullText);
    toast.success('전체 내용이 복사되었습니다!');
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success('링크가 복사되었습니다!');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">프로모션킷</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Caption */}
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <MessageSquare className="h-3.5 w-3.5" />
            추천 캡션
          </div>
          <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{caption}</p>
        </div>

        {/* Hashtags */}
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <Hash className="h-3.5 w-3.5" />
            해시태그
          </div>
          <p className="rounded-lg bg-gray-50 p-3 text-sm text-blue-600">{hashtags}</p>
        </div>

        {/* Link */}
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <LinkIcon className="h-3.5 w-3.5" />
            공유 링크
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
              {shareUrl}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Copy All */}
        <Button onClick={handleCopyAll} className="w-full" variant="default">
          <Copy className="mr-2 h-4 w-4" />
          전체 복사
        </Button>
      </CardContent>
    </Card>
  );
}
