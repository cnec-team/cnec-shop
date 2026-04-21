"use client";

import { useState, useEffect } from "react";
import { BarChart3, Users, Package, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProductStat {
  id: string;
  name: string;
  avgScore: number;
  totalMatches: number;
  highMatches: number;
  targetPainPoints: string[];
}

interface TopCreator {
  score: number;
  productName: string;
  creator: {
    id: string;
    username: string | null;
    displayName: string | null;
    profileImageUrl: string | null;
    igFollowers: number | null;
  };
}

interface Data {
  avgScore: number;
  totalMatches: number;
  products: ProductStat[];
  topCreators: TopCreator[];
}

const PP_LABELS: Record<string, string> = {
  P01: "여드름", P02: "모공", P03: "기미/잡티", P04: "주름",
  P05: "건조", P06: "민감", P07: "장벽", P08: "유분",
};

export default function MatchPerformancePage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/brand/analytics/match-performance")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">매칭 성과 리포트</h1>
        <p className="text-sm text-gray-500">
          우리 상품과 크리에이터의 매칭 현황이에요
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">평균 매칭도</span>
          </div>
          <p className="text-3xl font-bold text-violet-600">
            {Math.round(data.avgScore * 100)}%
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs">총 매칭 수</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {data.totalMatches.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Package className="h-4 w-4" />
            <span className="text-xs">등록 상품</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {data.products.length}
          </p>
        </div>
      </div>

      {/* Product stats */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">상품별 매칭 현황</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {data.products.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                <div className="flex gap-1 mt-1">
                  {p.targetPainPoints.map((pp) => (
                    <Badge key={pp} variant="outline" className="text-[10px]">
                      {PP_LABELS[pp] || pp}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={cn(
                  "text-lg font-bold",
                  p.avgScore >= 0.7 ? "text-violet-600" : p.avgScore >= 0.5 ? "text-blue-600" : "text-gray-500"
                )}>
                  {Math.round(p.avgScore * 100)}%
                </p>
                <p className="text-xs text-gray-400">
                  찰떡 {p.highMatches}명 / 총 {p.totalMatches}명
                </p>
              </div>
            </div>
          ))}
          {data.products.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">
              아직 매칭 데이터가 없어요
            </div>
          )}
        </div>
      </div>

      {/* Top creators */}
      {data.topCreators.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-500" />
              <h2 className="font-semibold text-gray-900">가장 잘 맞는 크리에이터 Top 10</h2>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {data.topCreators.map((tc, idx) => (
              <div key={`${tc.creator.id}-${idx}`} className="flex items-center gap-3 p-4">
                <span className="text-xs font-medium text-gray-300 w-5">{idx + 1}</span>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={tc.creator.profileImageUrl || undefined} />
                  <AvatarFallback className="text-xs">
                    {(tc.creator.displayName || tc.creator.username || "?")[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {tc.creator.displayName || tc.creator.username}
                  </p>
                  <p className="text-xs text-gray-400">
                    {tc.productName}
                  </p>
                </div>
                <div className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-bold",
                  tc.score >= 0.7 ? "bg-violet-100 text-violet-700" : "bg-blue-50 text-blue-600"
                )}>
                  {Math.round(tc.score * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
