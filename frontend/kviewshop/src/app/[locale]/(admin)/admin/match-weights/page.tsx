"use client";

import { useState } from "react";
import { Sliders, Save, AlertCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DEFAULT_WEIGHTS = {
  cosine: 60,
  heroBoost: 25,
  trend: 15,
};

export default function MatchWeightsPage() {
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [saving, setSaving] = useState(false);

  const total = weights.cosine + weights.heroBoost + weights.trend;
  const isValid = total === 100;

  const updateWeight = (key: keyof typeof weights, value: number) => {
    setWeights((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!isValid) {
      toast.error("가중치 합계가 100%이어야 해요");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/match-weights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cosine: weights.cosine / 100,
          heroBoost: weights.heroBoost / 100,
          trend: weights.trend / 100,
        }),
      });
      if (res.ok) {
        toast.success("가중치가 저장됐어요. 전체 매칭 재계산이 시작됩니다");
      } else {
        toast.error("저장에 실패했어요");
      }
    } catch {
      toast.error("저장에 실패했어요");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sliders className="h-6 w-6 text-violet-500" />
          매칭 가중치 조정
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          매칭 점수 계산에 사용되는 가중치를 조정해요
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-6">
        <WeightSlider
          label="코사인 유사도 (피부 고민 벡터 매칭)"
          value={weights.cosine}
          onChange={(v) => updateWeight("cosine", v)}
          desc="크리에이터 피부 고민과 상품 성분의 벡터 유사도"
        />
        <WeightSlider
          label="핵심 성분 부스트"
          value={weights.heroBoost}
          onChange={(v) => updateWeight("heroBoost", v)}
          desc="핵심 성분이 크리에이터 주요 고민에 효과적인 정도"
        />
        <WeightSlider
          label="트렌드 점수"
          value={weights.trend}
          onChange={(v) => updateWeight("trend", v)}
          desc="성분의 K-뷰티 트렌드 반영도"
        />

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">합계:</span>
            <span
              className={`text-lg font-bold ${isValid ? "text-green-600" : "text-red-500"}`}
            >
              {total}%
            </span>
            {!isValid && (
              <span className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" />
                100%이어야 해요
              </span>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={!isValid || saving}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? "저장 중..." : "저장하고 재계산"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
        <p className="font-medium">주의: 가중치 변경 시 전체 매칭 점수가 재계산됩니다</p>
        <p className="text-xs text-amber-600 mt-1">
          크리에이터/상품이 많으면 수 분이 걸릴 수 있어요
        </p>
      </div>
    </div>
  );
}

function WeightSlider({
  label,
  value,
  onChange,
  desc,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  desc: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">{label}</p>
          <p className="text-xs text-gray-400">{desc}</p>
        </div>
        <span className="text-lg font-bold text-violet-600">{value}%</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={0}
        max={100}
        step={5}
      />
    </div>
  );
}
