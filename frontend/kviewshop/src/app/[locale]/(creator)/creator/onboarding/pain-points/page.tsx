"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Droplet, Circle, Sun, Waves, CloudDrizzle, Flame, Shield, Droplets,
};

const SKIN_TYPES = [
  { value: "dry", label: "건성", desc: "당김과 각질이 잦아요" },
  { value: "oily", label: "지성", desc: "번들거림이 신경 쓰여요" },
  { value: "combination", label: "복합성", desc: "T존은 번들, 볼은 건조" },
  { value: "sensitive", label: "민감성", desc: "쉽게 붉어지고 따가워요" },
  { value: "normal", label: "중성", desc: "큰 트러블 없어요" },
];

const PAIN_POINTS = [
  { code: "P01", koName: "여드름·트러블", shortName: "여드름", iconName: "Droplet", desc: "여드름이 자주 올라와요" },
  { code: "P02", koName: "모공", shortName: "모공", iconName: "Circle", desc: "모공이 눈에 띄어요" },
  { code: "P03", koName: "기미·잡티", shortName: "기미/잡티", iconName: "Sun", desc: "기미나 잡티가 신경 쓰여요" },
  { code: "P04", koName: "주름·탄력", shortName: "주름", iconName: "Waves", desc: "잔주름이 보이기 시작해요" },
  { code: "P05", koName: "건조·보습", shortName: "건조", iconName: "CloudDrizzle", desc: "피부가 자주 당겨요" },
  { code: "P06", koName: "민감·자극", shortName: "민감", iconName: "Flame", desc: "쉽게 붉어지고 따가워요" },
  { code: "P07", koName: "장벽 손상", shortName: "장벽 손상", iconName: "Shield", desc: "시술 후 회복이 필요해요" },
  { code: "P08", koName: "유분·블랙헤드", shortName: "유분", iconName: "Droplets", desc: "유분이 많고 번들거려요" },
];

export default function PainPointOnboardingPage() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ko";

  const [step, setStep] = useState(1);
  const [skinType, setSkinType] = useState<string | null>(null);
  const [primaryCode, setPrimaryCode] = useState<string | null>(null);
  const [primarySeverity, setPrimarySeverity] = useState(3);
  const [secondaryCodes, setSecondaryCodes] = useState<string[]>([]);
  const [secondarySeverities, setSecondarySeverities] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const toggleSecondary = (code: string) => {
    if (secondaryCodes.includes(code)) {
      setSecondaryCodes(secondaryCodes.filter((c) => c !== code));
    } else if (secondaryCodes.length < 2) {
      setSecondaryCodes([...secondaryCodes, code]);
      if (!secondarySeverities[code]) {
        setSecondarySeverities({ ...secondarySeverities, [code]: 2 });
      }
    }
  };

  const handleSave = async () => {
    if (!primaryCode) return;
    setSaving(true);

    const painPoints = [
      { code: primaryCode, severity: primarySeverity, priority: "primary" as const },
      ...secondaryCodes.map((code) => ({
        code,
        severity: secondarySeverities[code] || 2,
        priority: "secondary" as const,
      })),
    ];

    try {
      const res = await fetch("/api/creator/pain-points", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          painPoints,
          skinType: skinType || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "저장에 실패했어요");
        return;
      }

      setDone(true);
      toast.success("피부 고민 등록 완료!");

      // 3초 후 리다이렉트
      setTimeout(() => {
        router.push(`/${locale}/creator/dashboard`);
      }, 3000);
    } catch {
      toast.error("저장에 실패했어요. 다시 시도해주세요");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-100">
            <Sparkles className="h-8 w-8 text-violet-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">완료!</h1>
          <p className="text-gray-500">
            이제 당신에게 딱 맞는 신상품이 자동 추천돼요
          </p>
          <div className="h-1 w-32 mx-auto rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full bg-violet-500 animate-pulse rounded-full" style={{ width: "100%" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="mx-auto max-w-lg px-4 pt-8">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                s <= step ? "bg-violet-500" : "bg-gray-200"
              )}
            />
          ))}
        </div>

        {/* Step 1: Skin Type */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                피부 타입이 어떻게 되세요?
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                나에게 맞는 제품을 추천해 드려요
              </p>
            </div>

            <div className="space-y-2">
              {SKIN_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSkinType(type.value)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all",
                    skinType === type.value
                      ? "border-violet-400 bg-violet-50 shadow-sm ring-2 ring-violet-100"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      skinType === type.value
                        ? "bg-violet-500 text-white"
                        : "bg-gray-100 text-gray-400"
                    )}
                  >
                    <Check className={cn("h-5 w-5", skinType !== type.value && "opacity-0")} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{type.label}</p>
                    <p className="text-xs text-gray-400">{type.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!skinType}
              className="w-full h-12 rounded-full bg-gray-900 text-white hover:bg-gray-800"
            >
              다음
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Primary Pain Point */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                가장 큰 피부 고민은 뭔가요?
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                1개만 골라주세요
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PAIN_POINTS.map((pp) => {
                const Icon = ICON_MAP[pp.iconName] || Circle;
                const selected = primaryCode === pp.code;
                return (
                  <button
                    key={pp.code}
                    type="button"
                    onClick={() => setPrimaryCode(pp.code)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all",
                      selected
                        ? "border-violet-400 bg-violet-50 shadow-sm ring-2 ring-violet-100"
                        : "border-gray-100 bg-white hover:border-gray-200"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        selected ? "text-violet-600" : "text-gray-300"
                      )}
                    />
                    <span className={cn("text-sm font-medium", selected ? "text-violet-700" : "text-gray-600")}>
                      {pp.shortName}
                    </span>
                    <span className="text-[11px] text-gray-400">{pp.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Severity slider */}
            {primaryCode && (
              <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  어느 정도인가요?
                </p>
                <Slider
                  value={[primarySeverity]}
                  onValueChange={([v]) => setPrimarySeverity(v)}
                  min={1}
                  max={5}
                  step={1}
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>가끔</span>
                  <span>매일 심하게</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="h-12 rounded-full px-6"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                이전
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!primaryCode}
                className="flex-1 h-12 rounded-full bg-gray-900 text-white hover:bg-gray-800"
              >
                다음
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Secondary Pain Points */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                추가 고민이 있나요?
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                최대 2개까지 선택할 수 있어요 (선택사항)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PAIN_POINTS.filter((pp) => pp.code !== primaryCode).map((pp) => {
                const Icon = ICON_MAP[pp.iconName] || Circle;
                const selected = secondaryCodes.includes(pp.code);
                const disabled = !selected && secondaryCodes.length >= 2;
                return (
                  <button
                    key={pp.code}
                    type="button"
                    onClick={() => toggleSecondary(pp.code)}
                    disabled={disabled}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all",
                      selected
                        ? "border-blue-300 bg-blue-50 shadow-sm"
                        : disabled
                          ? "border-gray-50 bg-gray-50 opacity-50"
                          : "border-gray-100 bg-white hover:border-gray-200"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        selected ? "text-blue-500" : "text-gray-300"
                      )}
                    />
                    <span className={cn("text-sm font-medium", selected ? "text-blue-700" : "text-gray-600")}>
                      {pp.shortName}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Secondary severity sliders */}
            {secondaryCodes.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-4">
                {secondaryCodes.map((code) => {
                  const pp = PAIN_POINTS.find((p) => p.code === code);
                  return (
                    <div key={code} className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        {pp?.shortName} - 어느 정도인가요?
                      </p>
                      <Slider
                        value={[secondarySeverities[code] || 2]}
                        onValueChange={([v]) =>
                          setSecondarySeverities({ ...secondarySeverities, [code]: v })
                        }
                        min={1}
                        max={5}
                        step={1}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="h-12 rounded-full px-6"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                이전
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-12 rounded-full bg-violet-600 text-white hover:bg-violet-700"
              >
                {saving ? "저장 중..." : secondaryCodes.length > 0 ? "완료하기" : "건너뛰고 완료하기"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
