"use client";

import { useState, useEffect } from "react";
import { Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";
import { MatchedProductCard } from "./MatchedProductCard";

interface MatchData {
  productId: string;
  score: number;
  reasons: Array<{
    painPoint: string;
    painPointName: string;
    strength: number;
    reason: string;
  }>;
  product: {
    id: string;
    name: string;
    image: string | null;
    salePrice: number | null;
    originalPrice: number | null;
    commissionRate: number;
    allowTrial: boolean;
    brandName: string | null;
    heroIngredients: Array<{
      name: string;
      tier: string;
      category: string;
    }>;
  };
}

interface Props {
  locale: string;
}

export function MatchedProductsSection({ locale }: Props) {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/creator/feed/matched-products");
        if (res.ok) {
          const data = await res.json();
          setMatches(data.matches || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-100" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 w-72 shrink-0 animate-pulse rounded-2xl bg-gray-100"
            />
          ))}
        </div>
      </div>
    );
  }

  if (matches.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-500" />
          <h2 className="text-lg font-bold text-gray-900">
            나에게 딱 맞는 신상품
          </h2>
        </div>
        <Link
          href={`/${locale}/creator/matched`}
          className="flex items-center gap-0.5 text-sm text-violet-600 hover:text-violet-700"
        >
          더 보기
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
        {matches.slice(0, 5).map((match) => (
          <MatchedProductCard
            key={match.productId}
            productId={match.productId}
            score={match.score}
            reasons={match.reasons}
            product={match.product}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}
