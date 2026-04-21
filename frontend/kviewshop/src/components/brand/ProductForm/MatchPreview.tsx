"use client";

import { useState, useEffect, useRef } from "react";
import { Users, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MatchPreviewData {
  veryHigh: number;
  high: number;
  medium: number;
  total: number;
  top20: Array<{
    id: string;
    username: string | null;
    displayName: string | null;
    profileImageUrl: string | null;
    igFollowers: number | null;
    matchScore: number;
  }>;
}

interface Props {
  selectedPainPoints: Record<string, number>;
}

export function MatchPreview({ selectedPainPoints }: Props) {
  const [data, setData] = useState<MatchPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const entries = Object.entries(selectedPainPoints);
    if (entries.length === 0) {
      setData(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/brand/products/match-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetPainPoints: entries.map(([code]) => code),
            strengths: selectedPainPoints,
          }),
        });
        setData(await res.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [selectedPainPoints]);

  if (!data && !loading) return null;

  const formatFollowers = (n: number | null) => {
    if (!n) return "-";
    if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
    return String(n);
  };

  return (
    <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-violet-500" />
        <h3 className="text-sm font-semibold text-gray-800">
          매칭 미리보기
        </h3>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4 justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
          <span className="text-sm text-gray-400">크리에이터 매칭 중...</span>
        </div>
      ) : data ? (
        <div className="space-y-3">
          {/* Big number */}
          {data.veryHigh > 0 ? (
            <div className="text-center">
              <div className="text-3xl font-bold text-violet-600">
                {data.veryHigh}
                <span className="text-base font-normal text-gray-500">명</span>
              </div>
              <p className="text-xs text-gray-500">
                과 찰떡이에요 (매칭도 70%+)
              </p>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-gray-400">
                아직 매칭된 크리에이터가 없어요
              </p>
              <p className="text-xs text-gray-300 mt-1">
                크리에이터들이 피부 고민을 등록하면 매칭이 시작돼요
              </p>
            </div>
          )}

          {/* Buckets */}
          {(data.veryHigh > 0 || data.high > 0 || data.medium > 0) && (
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="찰떡" value={data.veryHigh} color="violet" />
              <StatCard label="잘 맞음" value={data.high} color="blue" />
              <StatCard label="보통" value={data.medium} color="gray" />
            </div>
          )}

          {/* Top 20 preview button */}
          {data.top20.length > 0 && (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-violet-200 text-violet-600 hover:bg-violet-50"
                  type="button"
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  Top {data.top20.length} 미리 보기
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-violet-500" />
                    찰떡 크리에이터 Top {data.top20.length}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
                  {data.top20.map((creator, idx) => (
                    <div
                      key={creator.id}
                      className="flex items-center gap-3 rounded-lg border border-gray-100 p-3"
                    >
                      <span className="text-xs font-medium text-gray-300 w-5">
                        {idx + 1}
                      </span>
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={creator.profileImageUrl || undefined}
                        />
                        <AvatarFallback className="text-xs">
                          {(creator.displayName || creator.username || "?")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">
                          {creator.displayName || creator.username || "크리에이터"}
                        </p>
                        <p className="text-xs text-gray-400">
                          팔로워 {formatFollowers(creator.igFollowers)}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-bold",
                          creator.matchScore >= 0.7
                            ? "bg-violet-100 text-violet-700"
                            : creator.matchScore >= 0.5
                              ? "bg-blue-50 text-blue-600"
                              : "bg-gray-100 text-gray-500"
                        )}
                      >
                        {Math.round(creator.matchScore * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "violet" | "blue" | "gray";
}) {
  const colors = {
    violet: "bg-violet-50 text-violet-700",
    blue: "bg-blue-50 text-blue-600",
    gray: "bg-gray-50 text-gray-500",
  };

  return (
    <div
      className={cn(
        "rounded-lg p-2 text-center",
        colors[color]
      )}
    >
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px]">{label}</div>
    </div>
  );
}
