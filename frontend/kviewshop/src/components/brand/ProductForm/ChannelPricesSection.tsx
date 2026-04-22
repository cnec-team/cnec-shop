'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { SectionCard } from './SectionCard';

const fieldCls =
  'h-12 rounded-2xl border border-gray-200 bg-white text-sm placeholder:text-gray-300 focus-visible:border-gray-900 focus-visible:ring-2 focus-visible:ring-gray-100';
const labelCls = 'text-sm font-semibold text-gray-700';

interface ChannelPrice {
  value: string;
  url: string;
}

interface ChannelPricesSectionProps {
  coupang: ChannelPrice;
  setCoupang: (v: ChannelPrice) => void;
  jasa: ChannelPrice;
  setJasa: (v: ChannelPrice) => void;
  olive: ChannelPrice;
  setOlive: (v: ChannelPrice) => void;
  smart: ChannelPrice;
  setSmart: (v: ChannelPrice) => void;
  isExclusive: boolean;
  setIsExclusive: (v: boolean) => void;
}

export function ChannelPricesSection({
  coupang,
  setCoupang,
  jasa,
  setJasa,
  olive,
  setOlive,
  smart,
  setSmart,
  isExclusive,
  setIsExclusive,
}: ChannelPricesSectionProps) {
  const channels = [
    { label: '쿠팡 가격 (원)', urlPlaceholder: '쿠팡 상품 URL (선택)', state: coupang, setState: setCoupang },
    { label: '자사몰 가격 (원)', urlPlaceholder: '자사몰 상품 URL (선택)', state: jasa, setState: setJasa },
    { label: '올리브영 가격 (원)', urlPlaceholder: '올리브영 상품 URL (선택)', state: olive, setState: setOlive },
    { label: '스마트스토어 가격 (원)', urlPlaceholder: '스마트스토어 상품 URL (선택)', state: smart, setState: setSmart },
  ];

  return (
    <SectionCard
      title="채널별 판매가"
      subtitle="다른 채널 판매가를 입력하면 크리에이터에게 가격 비교 정보를 제공해요 (선택)"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {channels.map((ch) => (
          <div key={ch.label} className="space-y-2">
            <Label className={labelCls}>{ch.label}</Label>
            <Input
              type="number"
              min="0"
              value={ch.state.value}
              onChange={(e) => ch.setState({ ...ch.state, value: e.target.value })}
              placeholder="0"
              className={fieldCls}
            />
            <Input
              value={ch.state.url}
              onChange={(e) => ch.setState({ ...ch.state, url: e.target.value })}
              placeholder={ch.urlPlaceholder}
              className={`${fieldCls} text-xs`}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Checkbox
          id="isExclusive"
          checked={isExclusive}
          onCheckedChange={(v) => setIsExclusive(v === true)}
        />
        <Label htmlFor="isExclusive" className="text-sm font-normal text-gray-600 cursor-pointer">
          크넥샵 단독 판매 상품입니다
        </Label>
      </div>
    </SectionCard>
  );
}

export type { ChannelPrice };
