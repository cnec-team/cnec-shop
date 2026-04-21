"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Droplet,
  Circle,
  Sun,
  Waves,
  CloudDrizzle,
  Flame,
  Shield,
  Droplets,
  type LucideIcon,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Droplet, Circle, Sun, Waves, CloudDrizzle, Flame, Shield, Droplets,
};

const PAIN_POINTS = [
  { code: "P01", shortName: "여드름", iconName: "Droplet" },
  { code: "P02", shortName: "모공", iconName: "Circle" },
  { code: "P03", shortName: "기미/잡티", iconName: "Sun" },
  { code: "P04", shortName: "주름", iconName: "Waves" },
  { code: "P05", shortName: "건조", iconName: "CloudDrizzle" },
  { code: "P06", shortName: "민감", iconName: "Flame" },
  { code: "P07", shortName: "장벽 손상", iconName: "Shield" },
  { code: "P08", shortName: "유분", iconName: "Droplets" },
];

interface PainPointData {
  code: string;
  severity: number;
  priority: "primary" | "secondary";
}

export default function PainPointSettingsPage() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ko";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Map<string, PainPointData>>(new Map());
  const [skinType, setSkinType] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/creator/pain-points");
        const data = await res.json();
        const map = new Map<string, PainPointData>();
        for (const pp of data.painPoints || []) {
          map.set(pp.code, {
            code: pp.code,
            severity: pp.severity,
            priority: pp.priority,
          });
        }
        setSelected(map);
        setSkinType(data.skinType);
      } catch {
        toast.error("데이터를 불러올 수 없어요");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const togglePoint = (code: string) => {
    const next = new Map(selected);
    if (next.has(code)) {
      next.delete(code);
    } else {
      // primary가 없으면 primary로, 있으면 secondary로
      const hasPrimary = Array.from(next.values()).some(
        (p) => p.priority === "primary"
      );
      next.set(code, {
        code,
        severity: 3,
        priority: hasPrimary ? "secondary" : "primary",
      });
    }
    setSelected(next);
  };

  const updateSeverity = (code: string, severity: number) => {
    const next = new Map(selected);
    const item = next.get(code);
    if (item) {
      next.set(code, { ...item, severity });
      setSelected(next);
    }
  };

  const setPrimary = (code: string) => {
    const next = new Map(selected);
    for (const [key, val] of next) {
      if (key === code) {
        next.set(key, { ...val, priority: "primary" });
      } else if (val.priority === "primary") {
        next.set(key, { ...val, priority: "secondary" });
      }
    }
    setSelected(next);
  };

  const handleSave = async () => {
    if (selected.size === 0) {
      toast.error("고민을 1개 이상 선택해주세요");
      return;
    }

    const hasPrimary = Array.from(selected.values()).some(
      (p) => p.priority === "primary"
    );
    if (!hasPrimary) {
      toast.error("주요 고민을 1개 선택해주세요");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/creator/pain-points", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          painPoints: Array.from(selected.values()),
          skinType: skinType || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "저장에 실패했어요");
        return;
      }

      toast.success("피부 고민이 업데이트됐어요");
      router.push(`/${locale}/creator/settings`);
    } catch {
      toast.error("저장에 실패했어요");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="mx-auto max-w-lg px-4 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          설정으로 돌아가기
        </button>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          내 피부 고민 관리
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          변경하면 새로운 상품 매칭이 자동으로 갱신돼요
        </p>

        <div className="mt-6 space-y-2">
          {PAIN_POINTS.map((pp) => {
            const Icon = ICON_MAP[pp.iconName] || Circle;
            const data = selected.get(pp.code);
            const isSelected = !!data;
            const isPrimary = data?.priority === "primary";

            return (
              <div
                key={pp.code}
                className={cn(
                  "rounded-2xl border-2 p-4 transition-all",
                  isSelected
                    ? isPrimary
                      ? "border-violet-300 bg-violet-50"
                      : "border-blue-200 bg-blue-50/50"
                    : "border-gray-100 bg-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => togglePoint(pp.code)}
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      isSelected
                        ? isPrimary
                          ? "bg-violet-500 text-white"
                          : "bg-blue-400 text-white"
                        : "bg-gray-100 text-gray-300"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-800">
                      {pp.shortName}
                    </span>
                  </div>
                  {isSelected && (
                    <button
                      type="button"
                      onClick={() => setPrimary(pp.code)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        isPrimary
                          ? "bg-violet-500 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      )}
                    >
                      {isPrimary ? "주요 고민" : "주요로 변경"}
                    </button>
                  )}
                </div>

                {isSelected && (
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-8 shrink-0">
                      심각도
                    </span>
                    <Slider
                      value={[data.severity]}
                      onValueChange={([v]) => updateSeverity(pp.code, v)}
                      min={1}
                      max={5}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs font-medium text-gray-600 w-4">
                      {data.severity}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <Button
            onClick={handleSave}
            disabled={saving || selected.size === 0}
            className="w-full h-12 rounded-full bg-gray-900 text-white hover:bg-gray-800"
          >
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? "저장 중..." : "저장하기"}
          </Button>
        </div>
      </div>
    </div>
  );
}
