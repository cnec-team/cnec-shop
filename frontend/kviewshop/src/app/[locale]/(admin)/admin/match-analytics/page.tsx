"use client";

import { useState, useEffect } from "react";
import { BarChart3, Users, Package, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Analytics {
  totalMatches: number;
  avgScore: number;
  highMatches: number;
  creatorsWithVector: number;
  productsWithVector: number;
  scoreDistribution: Array<{ range: string; count: number }>;
}

export default function MatchAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/match-analytics");
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      toast.error("데이터를 불러올 수 없어요");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">매칭 분석</h1>
          <p className="text-sm text-gray-500">
            Pain-Point Match 시스템 현황
          </p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {data && (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              icon={BarChart3}
              label="총 매칭 수"
              value={data.totalMatches.toLocaleString()}
            />
            <StatCard
              icon={BarChart3}
              label="평균 매칭도"
              value={`${Math.round(data.avgScore * 100)}%`}
            />
            <StatCard
              icon={Users}
              label="벡터 보유 크리에이터"
              value={data.creatorsWithVector.toLocaleString()}
            />
            <StatCard
              icon={Package}
              label="벡터 보유 상품"
              value={data.productsWithVector.toLocaleString()}
            />
          </div>

          {/* Distribution */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              매칭도 분포
            </h2>
            <div className="space-y-3">
              {data.scoreDistribution.map((d) => {
                const maxCount = Math.max(
                  ...data.scoreDistribution.map((x) => x.count),
                  1
                );
                return (
                  <div key={d.range} className="flex items-center gap-3">
                    <span className="w-20 text-sm text-gray-600 shrink-0">
                      {d.range}
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-400 rounded-full transition-all"
                        style={{
                          width: `${(d.count / maxCount) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="w-12 text-right text-sm font-medium text-gray-700">
                      {d.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
