'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, AlertCircle, Sparkles, Star } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CATEGORY_TABS,
  filterIngredientsByTab,
} from '@/lib/ingredient/categories';
import { POPULAR_INGREDIENT_KO_NAMES } from '@/lib/ingredient/popular';

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
  const [activeTab, setActiveTab] = useState<string>('moisture');
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ESC 키로 드롭다운 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocused) {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isFocused]);

  // 인기 성분 추출 (POPULAR 배열 순서 유지, DB에 없는 성분은 자동 스킵)
  const popularIngredients = useMemo(() => {
    return POPULAR_INGREDIENT_KO_NAMES.map((name) =>
      ingredients.find((ing) => ing.koName === name)
    ).filter((ing): ing is Ingredient => ing !== undefined);
  }, [ingredients]);

  // 검색 결과 (한글/영문 동시 매칭)
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return null;
    const q = debouncedQuery.trim().toLowerCase();
    return ingredients.filter(
      (ing) =>
        ing.koName.toLowerCase().includes(q) ||
        ing.enName.toLowerCase().includes(q)
    );
  }, [debouncedQuery, ingredients]);

  // 탭별 필터링
  const tabIngredients = useMemo(() => {
    return filterIngredientsByTab(ingredients, activeTab);
  }, [ingredients, activeTab]);

  const selectedIds = useMemo(
    () => new Set(selected.map((s) => s.id)),
    [selected]
  );

  const canAddMore = selected.length < maxCount;

  const handleAdd = (ing: Ingredient) => {
    if (selectedIds.has(ing.id) || !canAddMore) return;
    onChange([...selected, { id: ing.id, koName: ing.koName }]);
  };

  const handleAddCustom = () => {
    const name = query.trim();
    if (!name || !canAddMore) return;
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

  // 드롭다운 표시 조건
  const showDropdown = isFocused && canAddMore;

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* 검색 바 + 카운트 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground">
            이 제품의 주인공 성분은 뭔가요?
          </label>
          <span className="text-xs text-muted-foreground">
            {selected.length}/{maxCount}개
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="성분명을 입력해 보세요 (예: PDRN, 나이아신아마이드)"
            className="pl-9"
            disabled={!canAddMore}
          />

          {/* 드롭다운 */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-20 max-h-[400px] overflow-y-auto">
              {/* 검색 결과 모드 */}
              {searchResults !== null ? (
                <div className="p-3">
                  {searchResults.length > 0 ? (
                    <>
                      <div className="text-xs text-muted-foreground mb-2">
                        검색 결과 {searchResults.length}개
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {searchResults.slice(0, 30).map((ing) => {
                          const isSelected = selectedIds.has(ing.id);
                          return (
                            <button
                              key={ing.id}
                              type="button"
                              onClick={() => handleAdd(ing)}
                              disabled={isSelected}
                              className={cn(
                                'px-3 py-1.5 rounded-full border text-sm transition-all',
                                isSelected
                                  ? 'bg-primary/10 border-primary text-primary cursor-default'
                                  : 'bg-background border-border hover:border-primary hover:bg-primary/5'
                              )}
                            >
                              {ing.koName}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        검색 결과가 없어요
                      </p>
                      {query.trim() && (
                        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <button
                              type="button"
                              onClick={handleAddCustom}
                              className="text-sm font-medium text-foreground hover:underline text-left"
                            >
                              &quot;{query.trim()}&quot; 성분으로 직접 추가
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
              ) : (
                /* 인기 성분 모드 (포커스 시 기본 노출) */
                <div className="p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>인기 성분</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularIngredients.map((ing) => {
                      const isSelected = selectedIds.has(ing.id);
                      return (
                        <button
                          key={ing.id}
                          type="button"
                          onClick={() => handleAdd(ing)}
                          disabled={isSelected}
                          className={cn(
                            'px-3 py-1.5 rounded-full border text-sm transition-all',
                            isSelected
                              ? 'bg-primary/10 border-primary text-primary cursor-default'
                              : 'bg-background border-border hover:border-primary hover:bg-primary/5'
                          )}
                        >
                          {ing.koName}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      성분명을 입력하거나 아래 카테고리에서 찾아보세요
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 안내 문구 */}
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
          <Star className="w-3 h-3 flex-shrink-0" />
          <span>
            핵심 성분은 최대 {maxCount}개까지 선택할 수 있어요. 매칭 정확도의 80%를 결정해요.
          </span>
        </p>
      </div>

      {/* 카테고리 탭 (드롭다운과 별도로 항상 표시) */}
      <div className="space-y-3">
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
                  : 'bg-background border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="border rounded-lg p-3 bg-muted/30 min-h-[100px]">
          <div className="flex flex-wrap gap-2">
            {tabIngredients.map((ing) => {
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
        </div>
      </div>

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
