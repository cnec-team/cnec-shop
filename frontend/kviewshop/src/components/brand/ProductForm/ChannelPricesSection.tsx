'use client';

import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { SectionCard } from './SectionCard';

interface TrustPolicySectionProps {
  lowestPriceGuarantee: boolean;
  setLowestPriceGuarantee: (v: boolean) => void;
  cnecExclusive: boolean;
  setCnecExclusive: (v: boolean) => void;
}

export function TrustPolicySection({
  lowestPriceGuarantee,
  setLowestPriceGuarantee,
  cnecExclusive,
  setCnecExclusive,
}: TrustPolicySectionProps) {
  return (
    <SectionCard
      title="크리에이터 신뢰 정책"
      subtitle="크리에이터가 가장 중요하게 보는 항목이에요"
    >
      <div className="space-y-3">
        <label className="flex items-start gap-3 p-4 border rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
          <Checkbox
            checked={lowestPriceGuarantee}
            onCheckedChange={(v) => setLowestPriceGuarantee(v === true)}
            className="mt-0.5"
          />
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900">크넥샵 최저가 보장 상품입니다</div>
            <div className="text-sm text-gray-500 mt-1">
              다른 채널보다 비싸게 판매되지 않음을 약속해요
            </div>
            <Link
              href="/ko/policy/lowest-price-guarantee"
              target="_blank"
              className="text-xs text-blue-600 hover:underline mt-2 inline-block"
            >
              크넥샵 최저가 보장 정책 보기
            </Link>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 border rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
          <Checkbox
            checked={cnecExclusive}
            onCheckedChange={(v) => setCnecExclusive(v === true)}
            className="mt-0.5"
          />
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900">크넥샵 단독 판매 상품입니다</div>
            <div className="text-sm text-gray-500 mt-1">
              다른 채널에서는 판매하지 않는 독점 상품이에요
            </div>
          </div>
        </label>
      </div>
    </SectionCard>
  );
}
