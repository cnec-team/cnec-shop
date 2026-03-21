'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';

const MOCRA_THRESHOLDS = {
  WARNING: 750000,
  CRITICAL: 1000000,
} as const;

// Mock data
const mockMoCRAData: {
  status: 'green' | 'yellow' | 'red';
  usSalesYTD: number;
  lastUpdated: string;
  monthlyBreakdown: { month: string; sales: number }[];
  projectedYearEnd: number;
} = {
  status: 'yellow',
  usSalesYTD: 850000,
  lastUpdated: '2026-02-03T10:30:00Z',
  monthlyBreakdown: [
    { month: '1월', sales: 120000 },
    { month: '2월', sales: 145000 },
    { month: '3월', sales: 98000 },
    { month: '4월', sales: 112000 },
    { month: '5월', sales: 135000 },
    { month: '6월', sales: 110000 },
    { month: '7월', sales: 130000 },
  ],
  projectedYearEnd: 1200000,
};

function getStatusConfig(status: 'green' | 'yellow' | 'red') {
  switch (status) {
    case 'green':
      return {
        icon: CheckCircle,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        label: '안전',
      };
    case 'yellow':
      return {
        icon: AlertTriangle,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        label: '주의',
      };
    case 'red':
      return {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: '위험',
      };
  }
}

const STATUS_LABELS: Record<string, string> = {
  green: '안전',
  yellow: '주의',
  red: '위험',
};

const STATUS_DESC: Record<string, string> = {
  green: '조치가 필요하지 않습니다',
  yellow: 'FDA 등록을 준비하세요',
  red: 'FDA 등록이 필요합니다',
};

export default function MoCRAPage() {
  const t = useTranslations('mocra');

  const statusConfig = getStatusConfig(mockMoCRAData.status);
  const StatusIcon = statusConfig.icon;
  const progressPercent = (mockMoCRAData.usSalesYTD / MOCRA_THRESHOLDS.CRITICAL) * 100;
  const warningPercent = (MOCRA_THRESHOLDS.WARNING / MOCRA_THRESHOLDS.CRITICAL) * 100;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{t('subtitle')}</p>
      </div>

      {/* Status Banner */}
      <div className={`rounded-2xl border-2 ${statusConfig.borderColor} ${statusConfig.bgColor} p-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${statusConfig.bgColor}`}>
              <StatusIcon className={`h-8 w-8 ${statusConfig.color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">현재 상태</p>
              <h2 className={`text-3xl font-bold ${statusConfig.color}`}>
                {STATUS_LABELS[mockMoCRAData.status]}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {STATUS_DESC[mockMoCRAData.status]}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">미국 매출 (연간 누적)</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(mockMoCRAData.usSalesYTD, 'USD')}
            </p>
            <p className="text-xs text-gray-400 flex items-center justify-end mt-1">
              <Calendar className="h-3 w-3 mr-1" />
              최종 업데이트: {new Date(mockMoCRAData.lastUpdated).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900">매출 기준 진행 상황</h3>
          <p className="text-xs text-gray-400 mt-0.5">미국 화장품 매출과 MoCRA 기준을 비교합니다</p>
        </div>

        <div className="relative">
          <Progress value={progressPercent} className="h-4" />
          {/* Warning threshold marker */}
          <div
            className="absolute top-0 h-4 w-0.5 bg-amber-500"
            style={{ left: `${warningPercent}%` }}
          />
          {/* Labels */}
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>$0</span>
            <span className="text-amber-600">
              $800,000 (주의)
            </span>
            <span className="text-red-600">
              $1,000,000 (FDA 등록 필요)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <CheckCircle className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-700">안전</p>
            <p className="text-xs text-gray-500 mt-1">$0 - $799,999</p>
            <p className="text-xs text-gray-400">조치 불필요</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle className="h-6 w-6 text-amber-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-amber-700">주의</p>
            <p className="text-xs text-gray-500 mt-1">$800,000 - $999,999</p>
            <p className="text-xs text-gray-400">등록 준비 필요</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-red-50 border border-red-200">
            <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-700">위험</p>
            <p className="text-xs text-gray-500 mt-1">$1,000,000+</p>
            <p className="text-xs text-gray-400">FDA 등록 필수</p>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">월별 매출 내역</h3>
          <p className="text-xs text-gray-400 mt-0.5">미국 화장품 매출 월별 추이 (2026년)</p>
        </div>

        <div className="space-y-3">
          {mockMoCRAData.monthlyBreakdown.map((month) => (
            <div key={month.month} className="flex items-center gap-4">
              <span className="w-8 text-sm font-medium text-gray-600">{month.month}</span>
              <div className="flex-1">
                <Progress
                  value={(month.sales / 200000) * 100}
                  className="h-2"
                />
              </div>
              <span className="w-24 text-sm text-right text-gray-700">
                {formatCurrency(month.sales, 'USD')}
              </span>
            </div>
          ))}
        </div>
        <Separator className="my-4" />
        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            <span className="font-medium text-gray-900">연말 예상 매출</span>
          </div>
          <span className="text-lg font-bold text-amber-600">
            {formatCurrency(mockMoCRAData.projectedYearEnd, 'USD')}
          </span>
        </div>
      </div>

      {/* Action Required */}
      {mockMoCRAData.status !== 'green' && (
        <div className="bg-white rounded-2xl border-2 border-amber-200 p-6 space-y-4">
          <h3 className="text-base font-semibold text-amber-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            조치가 필요합니다
          </h3>
          <p className="text-sm text-gray-600">
            미국 화장품 매출이 MoCRA 소규모 사업자 면제 기준에 근접하거나 초과했습니다.
            미국에서 화장품을 계속 판매하려면 FDA에 등록해야 할 수 있습니다.
          </p>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">다음 단계:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>FDA 규정에 맞게 제품 라벨링을 검토하세요</li>
              <li>시설 등록 문서를 준비하세요</li>
              <li>규제 전문가 자문을 고려하세요</li>
              <li>FDA 화장품 제품 목록 등록 절차를 시작하세요</li>
            </ul>
          </div>
          <Button className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl h-12" asChild>
            <a
              href="https://www.fda.gov/cosmetics/cosmetic-products-facility-registration"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('learnMore')}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
