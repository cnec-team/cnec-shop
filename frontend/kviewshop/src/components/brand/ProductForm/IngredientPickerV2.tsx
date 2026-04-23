'use client';

import { useState, useMemo } from 'react';
import { Search, X, AlertCircle } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CATEGORY_TABS,
  filterIngredientsByTab,
} from '@/lib/ingredient/categories';

type Ingredient = {
  id: string;
  koName: string;
  enName: string;
  category: string;
};

export type SelectedIngredient = {
  id: string;
  koName: string;
  isCustom?: boolean;
};

interface Props {
  ingredients: Ingredient[];
  selected: SelectedIngredient[];
  onChange: (selected: SelectedIngredient[]) => void;
  maxCount?: number;
}

const MAX = 3;

export function IngredientPickerV2({
  ingredients,
  selected,
  onChange,
  maxCount = MAX,
}: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 150);
  const [activeTab, setActiveTab] = useState<string>('all');

  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return null;
    const q = debouncedQuery.trim().toLowerCase();
    return ingredients.filter(
      (ing) =>
        ing.koName.toLowerCase().includes(q) ||
        ing.enName.toLowerCase().includes(q)
    );
  }, [debouncedQuery, ingredients]);

  const tabIngredients = useMemo(() => {
    return filterIngredientsByTab(ingredients, activeTab);
  }, [ingredients, activeTab]);

  const selectedIds = useMemo(
    () => new Set(selected.map((s) => s.id)),
    [selected]
  );

  const canAddMore = selected.length < maxCount;

  const handleAdd = (ing: Ingredient) => {
    if (selectedIds.has(ing.id)) return;
    if (!canAddMore) return;
    onChange([...selected, { id: ing.id, koName: ing.koName }]);
  };

  const handleAddCustom = () => {
    const name = query.trim();
    if (!name) return;
    if (!canAddMore) return;
    if (selected.some((s) => s.koName === name)) return;
    onChange([
      ...selected,
      { id: `custom-${Date.now()}`, koName: name, isCustom: true },
    ]);
    setQuery('');
  };

  const handleRemove = (id: string) => {
    onChange(selected.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* 검색 바 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="성분 검색 또는 카테고리로 찾기"
          className="pl-9 pr-16"
          disabled={!canAddMore}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {selected.length}/{maxCount}개
        </span>
      </div>

      {/* 검색 결과 표시 */}
      {searchResults !== null && (
        <div className="border rounded-lg p-3 bg-muted/30">
          {searchResults.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {searchResults.slice(0, 20).map((ing) => {
                const isSelected = selectedIds.has(ing.id);
                return (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => handleAdd(ing)}
                    disabled={isSelected || !canAddMore}
                    className={cn(
                      'px-3 py-1.5 rounded-full border text-sm transition-all',
                      isSelected
                        ? 'bg-primary/10 border-primary text-primary cursor-default'
                        : 'bg-background border-border hover:border-primary hover:bg-primary/5',
                      !canAddMore && !isSelected && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {ing.koName}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                검색 결과가 없어요
              </p>
              {canAddMore && query.trim() && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={handleAddCustom}
                      className="text-sm font-medium text-foreground hover:underline text-left"
                    >
                      &ldquo;{query.trim()}&rdquo; 성분으로 직접 추가
                    </button>
                    <p className="text-xs text-muted-foreground mt-1">
                      자사 특허 성분 등은 직접 입력할 수 있어요. 단, 매칭 점수에는 반영되지 않아요.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 카테고리 탭 + 성분 그리드 (검색 중이 아닐 때만) */}
      {searchResults === null && (
        <>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm border transition-all',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:border-primary/50'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="border rounded-lg p-3 bg-muted/30 min-h-[120px]">
            <div className="flex flex-wrap gap-2">
              {tabIngredients.map((ing) => {
                const typedIng = ing as Ingredient;
                const isSelected = selectedIds.has(typedIng.id);
                return (
                  <button
                    key={typedIng.id}
                    type="button"
                    onClick={() => handleAdd(typedIng)}
                    disabled={isSelected || !canAddMore}
                    className={cn(
                      'px-3 py-1.5 rounded-full border text-sm transition-all',
                      isSelected
                        ? 'bg-primary/10 border-primary text-primary cursor-default'
                        : 'bg-background border-border hover:border-primary hover:bg-primary/5',
                      !canAddMore && !isSelected && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {typedIng.koName}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* 선택된 성분 */}
      {selected.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">선택된 성분</p>
          <div className="flex flex-wrap gap-2">
            {selected.map((ing) => (
              <Badge
                key={ing.id}
                variant="secondary"
                className="px-3 py-1.5 text-sm gap-1.5"
              >
                {ing.koName}
                {ing.isCustom && (
                  <span className="text-xs text-muted-foreground">(매칭 제외)</span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(ing.id)}
                  className="hover:text-destructive ml-0.5"
                  aria-label={`${ing.koName} 제거`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
