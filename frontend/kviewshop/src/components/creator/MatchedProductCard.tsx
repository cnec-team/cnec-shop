"use client";

import Image from "next/image";
import Link from "next/link";
import { FlaskConical, ShoppingBag, TestTube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MatchReason {
  painPoint: string;
  painPointName: string;
  strength: number;
  reason: string;
}

interface HeroIngredient {
  name: string;
  tier: string;
  category: string;
}

interface Props {
  productId: string;
  score: number;
  reasons: MatchReason[];
  product: {
    id: string;
    name: string;
    image: string | null;
    salePrice: number | null;
    originalPrice: number | null;
    commissionRate: number;
    allowTrial: boolean;
    brandName: string | null;
    heroIngredients: HeroIngredient[];
  };
  locale: string;
}

export function MatchedProductCard({
  score,
  reasons,
  product,
  locale,
}: Props) {
  const matchPercent = Math.round(score * 100);
  const estimatedEarning =
    product.salePrice && product.commissionRate
      ? Math.round(product.salePrice * product.commissionRate)
      : null;

  const tierColor = (tier: string) => {
    if (tier === "S") return "bg-amber-50 text-amber-700 border-amber-200";
    if (tier === "A") return "bg-blue-50 text-blue-600 border-blue-200";
    return "bg-gray-50 text-gray-500 border-gray-200";
  };

  return (
    <div className="relative w-72 shrink-0 snap-start overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Match badge */}
      <div className="absolute left-3 top-3 z-10">
        <div
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-bold backdrop-blur-sm",
            matchPercent >= 70
              ? "bg-violet-500/90 text-white"
              : matchPercent >= 50
                ? "bg-blue-500/90 text-white"
                : "bg-gray-500/80 text-white"
          )}
        >
          {matchPercent}% 매칭
        </div>
      </div>

      {/* Image */}
      <div className="relative aspect-square w-full bg-gray-100">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name || "상품"}
            fill
            className="object-cover"
            sizes="288px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-gray-200" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5 space-y-2.5">
        {/* Brand */}
        <p className="text-xs text-gray-400">{product.brandName || "브랜드"}</p>

        {/* Name */}
        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
          {product.name}
        </p>

        {/* Hero Ingredients */}
        {product.heroIngredients.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.heroIngredients.map((ing) => (
              <Badge
                key={ing.name}
                variant="outline"
                className={cn("text-[10px] gap-0.5", tierColor(ing.tier))}
              >
                <FlaskConical className="h-2.5 w-2.5" />
                {ing.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Match reason */}
        {reasons.length > 0 && (
          <p className="text-xs text-violet-600 bg-violet-50 rounded-lg px-2.5 py-1.5">
            {(reasons as MatchReason[])[0]?.reason ||
              "나의 피부 고민과 잘 맞아요"}
          </p>
        )}

        {/* Price + earning */}
        <div className="flex items-end justify-between">
          <div>
            {product.originalPrice &&
              product.salePrice &&
              product.originalPrice > product.salePrice && (
                <p className="text-xs text-gray-300 line-through">
                  {product.originalPrice.toLocaleString()}원
                </p>
              )}
            <p className="text-base font-bold text-gray-900">
              {product.salePrice?.toLocaleString() || "-"}
              <span className="text-xs font-normal text-gray-500">원</span>
            </p>
          </div>
          {estimatedEarning && (
            <p className="text-xs text-green-600">
              예상 수익 {estimatedEarning.toLocaleString()}원
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="flex gap-2">
          {product.allowTrial && (
            <Link
              href={`/${locale}/creator/products/${product.id}`}
              className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-700 transition-colors"
            >
              <TestTube className="h-3.5 w-3.5" />
              체험 신청
            </Link>
          )}
          <Link
            href={`/${locale}/creator/products/${product.id}`}
            className={cn(
              "flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors",
              product.allowTrial ? "" : "flex-1"
            )}
          >
            자세히 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
