"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MatchedProductCard } from "@/components/creator/MatchedProductCard";

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

export default function MatchedProductsPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ko";

  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "trial" | "high">("all");

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

  const filtered = matches.filter((m) => {
    if (filter === "trial") return m.product.allowTrial;
    if (filter === "high") return m.score >= 0.7;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${locale}/creator/dashboard`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          대시보드로 돌아가기
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-violet-500" />
          <h1 className="text-2xl font-bold text-gray-900">
            나에게 딱 맞는 상품
          </h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          내 피부 고민과 매칭도가 높은 상품들이에요
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(
          [
            { key: "all", label: "전체" },
            { key: "high", label: "매칭도 70%+" },
            { key: "trial", label: "체험 가능" },
          ] as const
        ).map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-violet-100 text-violet-700"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-96 animate-pulse rounded-2xl bg-gray-100"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-gray-200" />
          <p className="mt-3 text-sm text-gray-400">
            아직 매칭된 상품이 없어요
          </p>
          <p className="mt-1 text-xs text-gray-300">
            피부 고민을 등록하면 맞춤 상품이 추천돼요
          </p>
          <Link
            href={`/${locale}/creator/onboarding/pain-points`}
            className="mt-4 inline-flex rounded-full bg-violet-600 px-6 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            피부 고민 등록하기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((match) => (
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
      )}
    </div>
  );
}
