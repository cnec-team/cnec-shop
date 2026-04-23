'use client';

import { useEffect, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { IngredientPickerV2, type SelectedIngredient } from './IngredientPickerV2';
import { MatchScorePreview } from './MatchScorePreview';
import { PainPointTagSelector } from './PainPointTagSelector';

type Ingredient = {
  id: string;
  koName: string;
  enName: string;
  category: string;
};

interface Props {
  selectedIngredients: SelectedIngredient[];
  onIngredientsChange: (items: SelectedIngredient[]) => void;
  selectedPainPoints: string[];
  onPainPointsChange: (points: string[]) => void;
}

export function IngredientPainPointSection({
  selectedIngredients,
  onIngredientsChange,
  selectedPainPoints,
  onPainPointsChange,
}: Props) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // 성분 마스터 전체 로드
  useEffect(() => {
    fetch('/api/brand/ingredients')
      .then((res) => res.json())
      .then((data) => {
        if (data.items) setIngredients(data.items);
      })
      .catch((err) => console.error('[IngredientPainPointSection] load error:', err));
  }, []);

  // 마스터 DB 성분만 필터링 (자유 입력 제외)
  const masterIngredientIds = selectedIngredients
    .filter((ing) => !ing.isCustom)
    .map((ing) => ing.id);

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 to-white px-5 py-3.5">
        <FlaskConical className="h-4.5 w-4.5 text-violet-500" />
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            핵심 성분 (선택)
          </h2>
          <p className="text-xs text-gray-500">
            크리에이터 매칭 정확도를 높여요
          </p>
        </div>
      </div>

      <div className="space-y-6 p-5">
        {/* 성분 선택 */}
        <IngredientPickerV2
          ingredients={ingredients}
          selected={selectedIngredients}
          onChange={onIngredientsChange}
        />

        {/* 실시간 매칭 프리뷰 */}
        <MatchScorePreview ingredientIds={masterIngredientIds} />

        {/* 피부 고민 태그 선택 */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold mb-3">
            어떤 고민을 가진 분들께 잘 맞아요?
          </h4>
          <PainPointTagSelector
            selected={selectedPainPoints}
            onChange={onPainPointsChange}
          />
        </div>
      </div>
    </section>
  );
}
