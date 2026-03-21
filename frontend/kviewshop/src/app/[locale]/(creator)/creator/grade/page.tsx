'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, TrendingUp, Crown, Medal } from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';
import { GRADE_LABELS, GRADE_THRESHOLDS } from '@/types/database';
import { getCreatorSession, getCreatorGradeAndRankings } from '@/lib/actions/creator';

type CreatorGrade = 'ROOKIE' | 'SILVER' | 'GOLD' | 'PLATINUM';

const GRADE_COLORS: Record<CreatorGrade, string> = {
  ROOKIE: 'bg-gray-100 text-gray-800 border-gray-300',
  SILVER: 'bg-slate-100 text-slate-700 border-slate-400',
  GOLD: 'bg-amber-50 text-amber-700 border-amber-400',
  PLATINUM: 'bg-purple-50 text-purple-700 border-purple-400',
};

const GRADE_ICONS: Record<CreatorGrade, React.ComponentType<{ className?: string }>> = {
  ROOKIE: Medal,
  SILVER: Medal,
  GOLD: Crown,
  PLATINUM: Crown,
};

interface GradeData {
  grade: CreatorGrade;
  monthlySales: number;
  commissionBonusRate: number;
  nextGrade: CreatorGrade | null;
  amountToNext: number;
}

interface RankEntry {
  rank: number;
  displayName: string;
  profileImage: string | null;
  totalSales: number;
}

export default function CreatorGradePage() {
  const params = useParams();
  const locale = params.locale as string;
  const [creator, setCreator] = useState<{ id: string } | null>(null);
  const [gradeData, setGradeData] = useState<GradeData | null>(null);
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [rankPeriod, setRankPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const creatorData = await getCreatorSession();
      if (!creatorData || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }
      if (!creator) setCreator(creatorData as any);
    }

    init();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!creator) return;

    async function fetchGrade() {
      setLoading(true);
      try {
        const data = await getCreatorGradeAndRankings(rankPeriod);
        setGradeData({
          grade: (data.grade as CreatorGrade) ?? 'ROOKIE',
          monthlySales: data.monthlySales,
          commissionBonusRate: Number(data.commissionBonusRate),
          nextGrade: data.nextGrade as CreatorGrade | null,
          amountToNext: data.amountToNext,
        });
        setRankings(data.rankings);
      } catch (error) {
        console.error('Failed to fetch grade:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchGrade();
  }, [creator, rankPeriod]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const grade = gradeData?.grade ?? 'ROOKIE';
  const GradeIcon = GRADE_ICONS[grade];
  const progressPercent = gradeData?.nextGrade
    ? Math.min(100, (gradeData.monthlySales / GRADE_THRESHOLDS[gradeData.nextGrade]) * 100)
    : 100;

  return (
    <div className="space-y-6">
      <div className="hidden md:block">
        <h1 className="text-xl font-bold text-gray-900">등급</h1>
        <p className="text-sm text-gray-400 mt-0.5">내 등급과 혜택을 확인하세요</p>
      </div>

      {/* Current Grade */}
      <Card className={`border-2 ${GRADE_COLORS[grade]}`}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-white/80">
                <GradeIcon className="h-10 w-10" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">내 등급</p>
                <p className="text-3xl font-bold">{GRADE_LABELS[grade]}</p>
                {gradeData?.commissionBonusRate ? (
                  <p className="text-sm">수익 보너스: +{(gradeData.commissionBonusRate * 100).toFixed(1)}%</p>
                ) : null}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">이번 달 판매액</p>
              <p className="text-xl font-bold">{formatCurrency(gradeData?.monthlySales ?? 0, 'KRW')}</p>
            </div>
          </div>

          {/* Progress to next grade */}
          {gradeData?.nextGrade && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>{GRADE_LABELS[grade]}</span>
                <span>{GRADE_LABELS[gradeData.nextGrade]}까지 {formatCurrency(gradeData.amountToNext, 'KRW')}</span>
              </div>
              <div className="w-full bg-white/60 rounded-full h-3">
                <div
                  className="bg-primary rounded-full h-3 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grade Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">등급별 혜택</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(['ROOKIE', 'SILVER', 'GOLD', 'PLATINUM'] as CreatorGrade[]).map((g) => {
              const isCurrentOrHigher = (['ROOKIE', 'SILVER', 'GOLD', 'PLATINUM'] as CreatorGrade[]).indexOf(g) <=
                (['ROOKIE', 'SILVER', 'GOLD', 'PLATINUM'] as CreatorGrade[]).indexOf(grade);
              return (
                <div
                  key={g}
                  className={`p-4 rounded-lg border text-center ${
                    g === grade ? 'border-primary bg-primary/5' : isCurrentOrHigher ? 'border-muted' : 'border-dashed border-muted opacity-60'
                  }`}
                >
                  <p className="font-semibold text-sm">{GRADE_LABELS[g]}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {g === 'ROOKIE' ? '기본' : `월 ${formatCurrency(GRADE_THRESHOLDS[g], 'KRW')}+`}
                  </p>
                  <p className="text-xs mt-2">
                    보너스: {g === 'ROOKIE' ? '-' : g === 'SILVER' ? '+1%' : g === 'GOLD' ? '+2%' : '+3%'}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Rankings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              크리에이터 랭킹
            </CardTitle>
            <div className="flex gap-1">
              {(['weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setRankPeriod(p)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    rankPeriod === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {p === 'weekly' ? '주간' : '월간'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {rankings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">아직 랭킹 데이터가 없습니다</p>
          ) : (
            <div className="space-y-2">
              {rankings.map((r) => (
                <div key={r.rank} className="flex items-center gap-3 py-2">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                    r.rank === 1 ? 'bg-amber-100 text-amber-700' :
                    r.rank === 2 ? 'bg-slate-100 text-slate-700' :
                    r.rank === 3 ? 'bg-orange-100 text-orange-700' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {r.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.displayName}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(r.totalSales, 'KRW')}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
