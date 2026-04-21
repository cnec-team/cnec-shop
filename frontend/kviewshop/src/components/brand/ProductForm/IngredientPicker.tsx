"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { X, Search, Star, TrendingUp, FlaskConical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface IngredientItem {
  id: string;
  koName: string;
  enName: string;
  category: string;
  tier: string;
  trendScore: number;
  description: string;
  efficacyP01: number;
  efficacyP02: number;
  efficacyP03: number;
  efficacyP04: number;
  efficacyP05: number;
  efficacyP06: number;
  efficacyP07: number;
  efficacyP08: number;
}

interface Props {
  selected: IngredientItem[];
  onChange: (items: IngredientItem[]) => void;
  maxItems?: number;
}

export function IngredientPicker({ selected, onChange, maxItems = 3 }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IngredientItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/ingredients/search?q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      setResults(data.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const addItem = (item: IngredientItem) => {
    if (selected.length >= maxItems) return;
    if (selected.some((s) => s.id === item.id)) return;
    onChange([...selected, item]);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const removeItem = (id: string) => {
    onChange(selected.filter((s) => s.id !== id));
  };

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const tierColor = (tier: string) => {
    if (tier === "S") return "bg-amber-100 text-amber-800 border-amber-300";
    if (tier === "A") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-gray-50 text-gray-600 border-gray-200";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900">
          이 제품의 주인공 성분은 뭔가요?
        </label>
        <span className="text-xs text-gray-400">
          {selected.length}/{maxItems}개
        </span>
      </div>

      {/* Selected items */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm"
            >
              <FlaskConical className="h-4 w-4 text-violet-500" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{item.koName}</span>
                <span className="text-[11px] text-gray-400">
                  {item.category}
                </span>
              </div>
              <Badge
                variant="outline"
                className={cn("ml-1 text-[10px]", tierColor(item.tier))}
              >
                {item.tier}
              </Badge>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-gray-100"
              >
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      {selected.length < maxItems && (
        <div ref={containerRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="성분명을 입력해 보세요 (예: PDRN, 나이아신아마이드)"
              value={query}
              onChange={(e) => handleInput(e.target.value)}
              onFocus={() => query.length >= 1 && setOpen(true)}
              className="pl-9"
            />
          </div>

          {/* Dropdown */}
          {open && (results.length > 0 || loading) && (
            <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {loading && (
                <div className="px-4 py-3 text-sm text-gray-400">
                  검색 중...
                </div>
              )}
              {results
                .filter((r) => !selected.some((s) => s.id === r.id))
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addItem(item)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50"
                  >
                    <FlaskConical className="h-4 w-4 shrink-0 text-violet-400" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {item.koName}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            tierColor(item.tier)
                          )}
                        >
                          {item.tier}
                        </Badge>
                        <span className="text-[11px] text-gray-400">
                          {item.category}
                        </span>
                      </div>
                      <p className="truncate text-xs text-gray-400">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <TrendingUp className="h-3 w-3" />
                      {item.trendScore}
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Help text */}
      <div className="flex items-start gap-1.5 text-xs text-gray-400">
        <Star className="mt-0.5 h-3 w-3 shrink-0" />
        <span>
          핵심 성분은 최대 {maxItems}개까지 선택할 수 있어요. 매칭 정확도의
          80%를 결정해요.
        </span>
      </div>
    </div>
  );
}
