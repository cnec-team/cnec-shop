'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Sparkles,
  Copy,
  Target,
  TrendingUp,
  Zap,
  Shield,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

interface TipData {
  strategy: string;
  hook: string;
  target: string;
  estimatedCvr: string;
  caption: string;
  hashtags: string[];
  reasoning: string | null;
}

const STRATEGY_CONFIG: Record<string, {
  label: string;
  className: string;
  icon: typeof Shield;
}> = {
  CONSERVATIVE: {
    label: '안전 전략',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Shield,
  },
  AGGRESSIVE: {
    label: '적극 전략',
    className: 'bg-red-50 text-red-700 border-red-200',
    icon: Zap,
  },
  VIRAL: {
    label: '바이럴 전략',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: TrendingUp,
  },
};

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('복사했어요!');
}

function TipCard({ tip }: { tip: TipData }) {
  const config = STRATEGY_CONFIG[tip.strategy] ?? STRATEGY_CONFIG.CONSERVATIVE;
  const Icon = config.icon;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      {/* Strategy badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`text-xs gap-1 ${config.className}`}>
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
        <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-200">
          예상 전환율 {tip.estimatedCvr}
        </Badge>
      </div>

      {/* Hook */}
      <p className="text-lg font-bold text-gray-900 leading-tight">
        &ldquo;{tip.hook}&rdquo;
      </p>

      {/* Target */}
      <div className="flex items-start gap-2">
        <Target className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">{tip.target}</p>
      </div>

      <Separator />

      {/* Caption */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500">캡션</p>
          <button
            onClick={() => copyToClipboard(tip.caption)}
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Copy className="h-3 w-3" />
            복사
          </button>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {tip.caption}
        </p>
      </div>

      {/* Hashtags */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500">해시태그</p>
          <button
            onClick={() => copyToClipboard(tip.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' '))}
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Copy className="h-3 w-3" />
            복사
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tip.hashtags.map((tag, idx) => (
            <span key={idx} className="text-xs text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      </div>

      {/* Reasoning */}
      {tip.reasoning && (
        <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-relaxed">{tip.reasoning}</p>
        </div>
      )}
    </div>
  );
}

export function AiGonguTipButton({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="inline-flex items-center gap-0.5 text-[10px] text-purple-600 bg-purple-50 rounded-full px-1.5 py-0.5 font-medium hover:bg-purple-100 transition-colors"
      >
        <Sparkles className="h-2.5 w-2.5" />
        AI 공구팁
      </button>
      <AiGonguTipSheet productId={productId} open={open} onOpenChange={setOpen} />
    </>
  );
}

function AiGonguTipSheet({
  productId,
  open,
  onOpenChange,
}: {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [tips, setTips] = useState<TipData[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenChange = async (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && !loaded) {
      setLoading(true);
      try {
        const res = await fetch(`/api/creator/ai-tips/${productId}`);
        if (res.ok) {
          const data = await res.json();
          setTips(data.tips ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/creator/ai-tips/${productId}/generate`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'NOT_CONFIGURED') {
          setErrorMessage('준비 중인 기능이에요');
        } else if (data.code === 'RATE_LIMITED') {
          setErrorMessage('내일 다시 생성할 수 있어요');
        } else {
          setErrorMessage(data.error ?? '생성에 실패했어요');
        }
        return;
      }

      setTips(data.tips ?? []);
      toast.success('공구팁이 생성되었어요!');
    } catch {
      setErrorMessage('생성에 실패했어요. 잠시 후 다시 시도해주세요');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI 공구 어드바이저
          </SheetTitle>
        </SheetHeader>

        <div className="py-4 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3 p-4 rounded-2xl border border-gray-100">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : generating ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-purple-50 rounded-xl p-4">
                <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
                <div>
                  <p className="text-sm font-medium text-purple-900">상품을 분석하고 있어요...</p>
                  <p className="text-xs text-purple-600 mt-0.5">최적의 공구 전략을 찾고 있어요</p>
                </div>
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3 p-4 rounded-2xl border border-gray-100">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : errorMessage ? (
            <div className="text-center py-8 space-y-3">
              <Info className="h-10 w-10 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-500">{errorMessage}</p>
            </div>
          ) : tips.length > 0 ? (
            <div className="space-y-4">
              {tips.map((tip, idx) => (
                <TipCard key={idx} tip={tip} />
              ))}
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={handleGenerate}
                disabled={generating}
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                다시 생성하기
              </Button>
            </div>
          ) : (
            <div className="space-y-5 py-4">
              {/* 안내 영역 */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto">
                  <Sparkles className="h-7 w-7 text-purple-400" />
                </div>
                <p className="text-base font-semibold text-gray-900">
                  AI가 이 상품의 공구 전략을 만들어드려요
                </p>
                <div className="text-sm text-gray-500 leading-relaxed">
                  <p>상품 정보와 가격을 분석해서</p>
                  <p>릴스 훅, 캡션, 해시태그까지</p>
                  <p>바로 쓸 수 있는 공구 전략 3가지를 제안해요</p>
                </div>
              </div>

              {/* 예시 미리보기 */}
              <div className="bg-gray-50 rounded-xl p-4 mx-auto max-w-sm">
                <p className="text-xs font-medium text-gray-400 mb-1.5">예시</p>
                <p className="text-sm text-gray-700 font-medium">
                  &ldquo;속건조 10년 만에 해결한 방법&rdquo;
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  → 예상 전환율 3~5%
                </p>
              </div>

              {/* 생성 버튼 */}
              <div className="text-center space-y-2">
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12 px-8 text-sm font-semibold"
                >
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  무료로 공구 전략 받기
                </Button>
                <p className="text-[11px] text-gray-400">
                  약 10초 소요 · 1일 1회 생성 가능
                </p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
