"use client";

import { useState, useEffect, useRef } from "react";
import {
  Droplet,
  Circle,
  Sun,
  Waves,
  CloudDrizzle,
  Flame,
  Shield,
  Droplets,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IngredientItem } from "./IngredientPicker";

const ICON_MAP: Record<string, LucideIcon> = {
  Droplet,
  Circle,
  Sun,
  Waves,
  CloudDrizzle,
  Flame,
  Shield,
  Droplets,
};

interface Recommendation {
  code: string;
  strength: number;
  koName: string;
  shortName: string;
  iconName: string;
  strengthLabel: string;
}

const ALL_PAIN_POINTS = [
  { code: "P01", koName: "여드름·트러블", shortName: "여드름", iconName: "Droplet" },
  { code: "P02", koName: "모공", shortName: "모공", iconName: "Circle" },
  { code: "P03", koName: "기미·잡티·색소침착", shortName: "기미/잡티", iconName: "Sun" },
  { code: "P04", koName: "주름·탄력", shortName: "주름", iconName: "Waves" },
  { code: "P05", koName: "건조·보습", shortName: "건조", iconName: "CloudDrizzle" },
  { code: "P06", koName: "민감·자극", shortName: "민감", iconName: "Flame" },
  { code: "P07", koName: "장벽 손상", shortName: "장벽 손상", iconName: "Shield" },
  { code: "P08", koName: "유분·블랙헤드", shortName: "유분", iconName: "Droplets" },
];

interface Props {
  selectedIngredients: IngredientItem[];
  selectedPainPoints: Record<string, number>; // { P01: 0.8, P04: 0.6 }
  onChange: (points: Record<string, number>) => void;
}

export function PainPointSelector({
  selectedIngredients,
  selectedPainPoints,
  onChange,
}: Props) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // AI 추천 호출
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (selectedIngredients.length === 0) {
      setRecommendations([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/brand/products/recommend-pain-points", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ingredientIds: selectedIngredients.map((i) => i.id),
          }),
        });
        const data = await res.json();
        setRecommendations(data.recommendations || []);

        // 자동 선택: 추천된 것 중 강도 0.6 이상은 자동 체크
        const autoSelected: Record<string, number> = { ...selectedPainPoints };
        let changed = false;
        for (const rec of data.recommendations || []) {
          if (rec.strength >= 0.6 && !(rec.code in autoSelected)) {
            autoSelected[rec.code] = rec.strength;
            changed = true;
          }
        }
        if (changed) onChange(autoSelected);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIngredients]);

  const togglePoint = (code: string) => {
    const next = { ...selectedPainPoints };
    if (code in next) {
      delete next[code];
    } else {
      // 추천에서 강도 가져오기, 없으면 0.5 기본값
      const rec = recommendations.find((r) => r.code === code);
      next[code] = rec?.strength ?? 0.5;
    }
    onChange(next);
  };

  const updateStrength = (code: string, value: number) => {
    onChange({ ...selectedPainPoints, [code]: value });
  };

  const isRecommended = (code: string) =>
    recommendations.some((r) => r.code === code);
  const isSelected = (code: string) => code in selectedPainPoints;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900">
          어떤 고민을 가진 분들께 잘 맞아요?
        </label>
        {loading && (
          <span className="flex items-center gap-1 text-xs text-violet-500">
            <Sparkles className="h-3 w-3 animate-pulse" />
            분석 중...
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ALL_PAIN_POINTS.map((pp) => {
          const Icon = ICON_MAP[pp.iconName] || Circle;
          const selected = isSelected(pp.code);
          const recommended = isRecommended(pp.code);
          const rec = recommendations.find((r) => r.code === pp.code);

          return (
            <div key={pp.code} className="relative">
              <button
                type="button"
                onClick={() => togglePoint(pp.code)}
                className={cn(
                  "flex w-full flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all",
                  selected
                    ? "border-violet-400 bg-violet-50 shadow-sm"
                    : recommended
                      ? "border-violet-200 bg-violet-50/30 hover:border-violet-300"
                      : "border-gray-100 bg-white hover:border-gray-200"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    selected
                      ? "text-violet-600"
                      : recommended
                        ? "text-violet-400"
                        : "text-gray-300"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium",
                    selected ? "text-violet-700" : "text-gray-600"
                  )}
                >
                  {pp.shortName}
                </span>
              </button>

              {recommended && !selected && (
                <Badge className="absolute -right-1 -top-1 bg-violet-500 px-1 py-0 text-[9px] text-white">
                  AI
                </Badge>
              )}
              {recommended && selected && rec && (
                <Badge className="absolute -right-1 -top-1 bg-violet-500 px-1 py-0 text-[9px] text-white">
                  {rec.strengthLabel}
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {/* 선택된 페인포인트의 강도 조절 */}
      {Object.keys(selectedPainPoints).length > 0 && (
        <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
          <p className="text-xs font-medium text-gray-500">
            효과 강도를 조절해 보세요
          </p>
          {Object.entries(selectedPainPoints).map(([code, strength]) => {
            const pp = ALL_PAIN_POINTS.find((p) => p.code === code);
            if (!pp) return null;
            return (
              <div
                key={code}
                className="flex items-center gap-3"
              >
                <span className="w-16 text-xs text-gray-600 shrink-0">
                  {pp.shortName}
                </span>
                <Slider
                  value={[strength * 100]}
                  onValueChange={([v]) => updateStrength(code, v / 100)}
                  max={100}
                  min={10}
                  step={5}
                  className="flex-1"
                />
                <span className="w-10 text-right text-xs font-medium text-violet-600">
                  {Math.round(strength * 100)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
