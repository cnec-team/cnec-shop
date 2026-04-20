'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DiscountBadge } from '@/components/ui/DiscountBadge';
import { SectionCard } from './SectionCard';
import { PRODUCT_CATEGORY_LABELS } from '@/types/database';

const fieldCls =
  'h-12 rounded-2xl border border-gray-200 bg-white text-sm placeholder:text-gray-300 focus-visible:border-gray-900 focus-visible:ring-2 focus-visible:ring-gray-100';
const labelCls = 'text-sm font-semibold text-gray-700';

interface BasicInfoSectionProps {
  name: string;
  setName: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  originalPrice: string;
  setOriginalPrice: (v: string) => void;
  salePrice: string;
  setSalePrice: (v: string) => void;
  stock: string;
  setStock: (v: string) => void;
}

function PriceInput({
  id,
  value,
  onChange,
  placeholder = '0',
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${fieldCls} pr-10 text-right`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
        원
      </span>
    </div>
  );
}

export function BasicInfoSection({
  name,
  setName,
  category,
  setCategory,
  originalPrice,
  setOriginalPrice,
  salePrice,
  setSalePrice,
  stock,
  setStock,
}: BasicInfoSectionProps) {
  return (
    <SectionCard
      title="어떤 상품을 판매할까요?"
      subtitle="공구에 참여할 팬들이 가장 먼저 보게 될 정보예요"
    >
      <div className="space-y-2">
        <Label htmlFor="name" className={labelCls}>
          상품명
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="브랜드와 상품명, 어떻게 불러드릴까요?"
          className={fieldCls}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className={labelCls}>
          카테고리
        </Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className={`w-full ${fieldCls}`}>
            <SelectValue placeholder="가장 잘 맞는 카테고리를 골라주세요" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PRODUCT_CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="originalPrice" className={labelCls}>
            원래 가격
          </Label>
          <PriceInput id="originalPrice" value={originalPrice} onChange={setOriginalPrice} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salePrice" className={labelCls}>
            공구 판매가
          </Label>
          <div className="space-y-2">
            <PriceInput id="salePrice" value={salePrice} onChange={setSalePrice} />
            <div className="flex items-center gap-2">
              <DiscountBadge
                originalPrice={Number(originalPrice)}
                salePrice={Number(salePrice)}
              />
              {Number(originalPrice) > 0 && Number(salePrice) > 0 ? (
                <span className="text-xs text-gray-400">자동 계산</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stock" className={labelCls}>
          준비 수량
        </Label>
        <div className="relative max-w-xs">
          <Input
            id="stock"
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="0"
            className={`${fieldCls} pr-10 text-right`}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            개
          </span>
        </div>
      </div>
    </SectionCard>
  );
}
