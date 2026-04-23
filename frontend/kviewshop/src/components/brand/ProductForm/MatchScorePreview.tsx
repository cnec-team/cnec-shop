'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PAIN_POINT_LABELS } from '@/lib/ingredient/categories';

type Scores = {
  p01: number;
  p02: number;
  p03: number;
  p04: number;
  p05: number;
  p06: number;
  p07: number;
  p08: number;
};

const EMPTY_SCORES: Scores = {
  p01: 0, p02: 0, p03: 0, p04: 0, p05: 0, p06: 0, p07: 0, p08: 0,
};

interface Props {
  ingredientIds: string[];
}

export function MatchScorePreview({ ingredientIds }: Props) {
  const [scores, setScores] = useState<Scores>(EMPTY_SCORES);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (ingredientIds.length === 0) {
      setScores(EMPTY_SCORES);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch('/api/brand/ingredients/preview-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredientIds }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.scores) setScores(data.scores);
      })
      .catch((err) => console.error('[MatchScorePreview] error:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredientIds.join(',')]);

  const sortedScores = (Object.entries(scores) as Array<[keyof Scores, number]>)
    .sort(([, a], [, b]) => b - a);

  const top3 = sortedScores.slice(0, 3);
  const rest = sortedScores.slice(3);

  if (ingredientIds.length === 0) {
    return (
      <div className="border rounded-lg p-6 bg-muted/30 text-center">
        <Sparkles className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">
          성분을 추가하면 어떤 크리에이터에게 매칭될지 실시간으로 보여드려요
        </p>
      </div>
    );
  }

  const topLabels = top3
    .filter(([, score]) => score >= 60)
    .map(([key]) => PAIN_POINT_LABELS[key]);

  const summary = (() => {
    if (topLabels.length === 0) {
      return '성분을 추가하면 매칭 정확도가 높아져요';
    }
    if (topLabels.length === 1) {
      return `이 상품은 ${topLabels[0]} 고민 크리에이터에게 우선 매칭돼요`;
    }
    return `이 상품은 ${topLabels.join(' · ')} 고민 크리에이터에게 우선 매칭돼요`;
  })();

  return (
    <div className="border rounded-lg p-4 bg-background space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold">예상 매칭 크리에이터</h4>
        {loading && (
          <span className="text-xs text-muted-foreground ml-auto">계산 중...</span>
        )}
      </div>

      {/* 상위 3개 점수 */}
      <div className="space-y-2">
        {top3.map(([key, value]) => (
          <ScoreBar key={key} label={PAIN_POINT_LABELS[key]} value={value} />
        ))}
      </div>

      {/* 나머지 5개 (접힘) */}
      {rest.length > 0 && (
        <>
          {expanded && (
            <div className="space-y-2 pt-2 border-t">
              {rest.map(([key, value]) => (
                <ScoreBar key={key} label={PAIN_POINT_LABELS[key]} value={value} />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" /> 접기
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" /> 나머지 {rest.length}개 보기
              </>
            )}
          </button>
        </>
      )}

      {/* 요약 메시지 */}
      <div className="pt-2 border-t">
        <p className="text-sm text-foreground flex items-start gap-2">
          <Lightbulb className="w-4 h-4 mt-0.5 text-yellow-500 flex-shrink-0" />
          <span>{summary}</span>
        </p>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const colorClass =
    value >= 70
      ? 'bg-green-500'
      : value >= 40
      ? 'bg-yellow-500'
      : 'bg-gray-300';

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-foreground w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', colorClass)}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <motion.span
        className="text-sm font-medium text-foreground w-12 text-right tabular-nums"
        key={value}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {value}점
      </motion.span>
    </div>
  );
}
