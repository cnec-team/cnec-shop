"use client";

import { FlaskConical } from "lucide-react";
import {
  IngredientPicker,
  type IngredientItem,
} from "./IngredientPicker";
import { PainPointSelector } from "./PainPointSelector";
import { MatchPreview } from "./MatchPreview";

interface Props {
  selectedIngredients: IngredientItem[];
  onIngredientsChange: (items: IngredientItem[]) => void;
  selectedPainPoints: Record<string, number>;
  onPainPointsChange: (points: Record<string, number>) => void;
}

export function IngredientPainPointSection({
  selectedIngredients,
  onIngredientsChange,
  selectedPainPoints,
  onPainPointsChange,
}: Props) {
  return (
    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 to-white px-5 py-3.5">
        <FlaskConical className="h-4.5 w-4.5 text-violet-500" />
        <h2 className="text-base font-semibold text-gray-900">
          핵심 성분 & 피부 고민 매칭
        </h2>
      </div>

      <div className="space-y-6 p-5">
        {/* 1. 성분 선택 */}
        <IngredientPicker
          selected={selectedIngredients}
          onChange={onIngredientsChange}
        />

        {/* 2. 페인포인트 선택 */}
        <PainPointSelector
          selectedIngredients={selectedIngredients}
          selectedPainPoints={selectedPainPoints}
          onChange={onPainPointsChange}
        />

        {/* 3. 매칭 미리보기 */}
        <MatchPreview selectedPainPoints={selectedPainPoints} />
      </div>
    </section>
  );
}
