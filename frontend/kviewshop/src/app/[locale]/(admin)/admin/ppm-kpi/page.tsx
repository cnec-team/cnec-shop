"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  Package,
  Target,
  FlaskConical,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface KPI {
  totalMatches: number;
  avgScore: number;
  highMatchRate: number;
  creatorsWithPainPoints: number;
  totalCreators: number;
  painPointInputRate: number;
  productsWithIngredients: number;
  totalProducts: number;
  ingredientInputRate: number;
  topPainPoints: Array<{ code: string; name: string; count: number }>;
  topIngredients: Array<{ name: string; tier: string; productCount: number }>;
}

export default function PPMKPIPage() {
  const [data, setData] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ppm-kpi");
      if (res.ok) setData(await res.json());
    } catch {
      toast.error("데이터를 불러올 수 없어요");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PPM 시스템 KPI</h1>
          <p className="text-sm text-gray-500">Pain-Point Match 핵심 지표</p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {data && (
        <>
          {/* Top KPIs */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KPICard icon={Target} label="매칭 정확도" value={`${Math.round(data.avgScore * 100)}%`} sub="평균 매칭도" />
            <KPICard icon={BarChart3} label="총 매칭 수" value={data.totalMatches.toLocaleString()} sub={`70%+ 비율: ${Math.round(data.highMatchRate * 100)}%`} />
            <KPICard icon={Users} label="피부 고민 입력률" value={`${Math.round(data.painPointInputRate * 100)}%`} sub={`${data.creatorsWithPainPoints}/${data.totalCreators}`} />
            <KPICard icon={FlaskConical} label="성분 입력률" value={`${Math.round(data.ingredientInputRate * 100)}%`} sub={`${data.productsWithIngredients}/${data.totalProducts}`} />
          </div>

          {/* Top Pain Points */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-violet-500" />
                크리에이터 피부 고민 Top 5
              </h3>
              <div className="space-y-2">
                {data.topPainPoints.slice(0, 5).map((pp, idx) => (
                  <div key={pp.code} className="flex items-center gap-3">
                    <span className="text-xs text-gray-300 w-4">{idx + 1}</span>
                    <span className="flex-1 text-sm">{pp.name}</span>
                    <span className="text-sm font-medium text-gray-700">{pp.count}명</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-violet-500" />
                인기 성분 Top 5
              </h3>
              <div className="space-y-2">
                {data.topIngredients.slice(0, 5).map((ing, idx) => (
                  <div key={ing.name} className="flex items-center gap-3">
                    <span className="text-xs text-gray-300 w-4">{idx + 1}</span>
                    <span className="flex-1 text-sm">{ing.name}</span>
                    <span className="text-xs text-gray-400">{ing.tier}</span>
                    <span className="text-sm font-medium text-gray-700">{ing.productCount}개</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KPICard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
