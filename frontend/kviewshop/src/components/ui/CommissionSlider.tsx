'use client';

import { Slider } from '@/components/ui/slider';
import { TrendingUp } from 'lucide-react';

interface CommissionSliderProps {
  value: number;
  onChange: (value: number) => void;
  salePrice?: number;
  min?: number;
  max?: number;
}

export function CommissionSlider({
  value,
  onChange,
  salePrice,
  min = 10,
  max = 30,
}: CommissionSliderProps) {
  const earning = salePrice ? Math.round(salePrice * value / 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">크리에이터 수익</p>
          <p className="text-xs text-gray-400 mt-0.5">
            크리에이터가 상품을 팔면 얼마를 돌려드릴까요?
          </p>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className="text-2xl font-bold text-blue-600 tabular-nums"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {value}
          </span>
          <span className="text-sm font-bold text-blue-600">%</span>
        </div>
      </div>

      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={1}
        className="w-full"
      />

      <div className="flex justify-between text-xs text-gray-400">
        <span>{min}%</span>
        <span>{max}%</span>
      </div>

      {salePrice && salePrice > 0 ? (
        <div className="flex items-center gap-3 rounded-2xl bg-blue-600 px-4 py-3.5 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <TrendingUp className="h-[18px] w-[18px]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-white/70">상품 1개 팔릴 때마다</p>
            <p className="mt-0.5 text-base font-bold tabular-nums">
              크리에이터에게 {earning.toLocaleString('ko-KR')}원 지급
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-gray-50 px-4 py-3.5 text-xs text-gray-400">
          판매가를 입력하면 예상 지급 금액이 표시돼요
        </div>
      )}
    </div>
  );
}
