'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SectionCard } from './SectionCard';
import { cn } from '@/lib/utils';

const fieldCls =
  'h-12 rounded-2xl border border-gray-200 bg-white text-sm placeholder:text-gray-300 focus-visible:border-gray-900 focus-visible:ring-2 focus-visible:ring-gray-100';
const labelCls = 'text-sm font-semibold text-gray-700';

export type ShippingChoice = 'FREE' | 'PAID' | 'CONDITIONAL_FREE';
export type DeliveryEta = 'D1_2' | 'D2_3' | 'D3_5' | 'D5_7';

const DELIVERY_OPTIONS: Array<{ value: DeliveryEta; label: string }> = [
  { value: 'D1_2', label: '주문 후 1-2일 이내' },
  { value: 'D2_3', label: '주문 후 2-3일 이내' },
  { value: 'D3_5', label: '주문 후 3-5일 이내' },
  { value: 'D5_7', label: '주문 후 5-7일 이내' },
];

interface DetailsSectionProps {
  detailUrl: string;
  setDetailUrl: (v: string) => void;
  shippingChoice: ShippingChoice;
  setShippingChoice: (v: ShippingChoice) => void;
  shippingFee: string;
  setShippingFee: (v: string) => void;
  freeShippingThreshold?: string;
  setFreeShippingThreshold?: (v: string) => void;
  deliveryEta: DeliveryEta;
  setDeliveryEta: (v: DeliveryEta) => void;
  courier?: string;
  setCourier?: (v: string) => void;
  returnPolicy?: string;
  setReturnPolicy?: (v: string) => void;
  shippingInfo?: string;
  setShippingInfo?: (v: string) => void;
}

export function DetailsSection({
  detailUrl,
  setDetailUrl,
  shippingChoice,
  setShippingChoice,
  shippingFee,
  setShippingFee,
  freeShippingThreshold = '',
  setFreeShippingThreshold,
  deliveryEta,
  setDeliveryEta,
  courier,
  setCourier,
  returnPolicy,
  setReturnPolicy,
  shippingInfo,
  setShippingInfo,
}: DetailsSectionProps) {
  return (
    <SectionCard
      title="상품 설명과 배송"
      subtitle="자사몰 상세페이지를 그대로 가져올 수 있어요"
    >
      <div className="space-y-2">
        <Label htmlFor="detailUrl" className={labelCls}>
          상품 상세페이지 URL
        </Label>
        <Input
          id="detailUrl"
          type="url"
          value={detailUrl}
          onChange={(e) => setDetailUrl(e.target.value)}
          placeholder="https://... 자사몰이나 쇼핑몰 링크를 붙여넣어 주세요"
          className={fieldCls}
        />
      </div>

      <div className="space-y-2">
        <Label className={labelCls}>배송비</Label>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { value: 'FREE' as const, label: '무료배송' },
              { value: 'CONDITIONAL_FREE' as const, label: '조건부 무료배송' },
              { value: 'PAID' as const, label: '유료배송' },
            ]
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setShippingChoice(opt.value)}
              className={cn(
                'rounded-full border px-5 py-2.5 text-sm font-medium transition-colors',
                shippingChoice === opt.value
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
              )}
            >
              {opt.label}
            </button>
          ))}
          {(shippingChoice === 'PAID' || shippingChoice === 'CONDITIONAL_FREE') && (
            <div className="relative">
              <Input
                type="number"
                min="0"
                value={shippingFee}
                onChange={(e) => setShippingFee(e.target.value)}
                placeholder="3000"
                className={`${fieldCls} w-36 pr-9 text-right`}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                원
              </span>
            </div>
          )}
          {shippingChoice === 'CONDITIONAL_FREE' && (
            <div className="relative">
              <Input
                type="number"
                min="0"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold?.(e.target.value)}
                placeholder="50000"
                className={`${fieldCls} w-44 pr-14 text-right`}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                원 이상
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deliveryEta" className={labelCls}>
          예상 배송일
        </Label>
        <Select value={deliveryEta} onValueChange={(v) => setDeliveryEta(v as DeliveryEta)}>
          <SelectTrigger className={`w-full sm:w-72 ${fieldCls}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DELIVERY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {setCourier && (
        <div className="space-y-2">
          <Label className={labelCls}>택배사</Label>
          <Select value={courier || ''} onValueChange={(v) => setCourier(v)}>
            <SelectTrigger className={`w-full sm:w-72 ${fieldCls}`}>
              <SelectValue placeholder="택배사 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cj">CJ대한통운</SelectItem>
              <SelectItem value="hanjin">한진택배</SelectItem>
              <SelectItem value="lotte">롯데택배</SelectItem>
              <SelectItem value="logen">로젠택배</SelectItem>
              <SelectItem value="post">우체국택배</SelectItem>
              <SelectItem value="etc">기타</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {setShippingInfo && (
        <div className="space-y-2">
          <Label className={labelCls}>배송 안내</Label>
          <Textarea
            value={shippingInfo || ''}
            onChange={(e) => setShippingInfo(e.target.value)}
            placeholder="배송 관련 안내 사항을 입력하세요 (선택)"
            rows={2}
            className="rounded-2xl border border-gray-200 bg-white text-sm"
          />
        </div>
      )}

      {setReturnPolicy && (
        <div className="space-y-2">
          <Label className={labelCls}>교환/반품 안내</Label>
          <Textarea
            value={returnPolicy || ''}
            onChange={(e) => setReturnPolicy(e.target.value)}
            placeholder="교환/반품 정책을 입력하세요 (선택)"
            rows={2}
            className="rounded-2xl border border-gray-200 bg-white text-sm"
          />
        </div>
      )}
    </SectionCard>
  );
}
