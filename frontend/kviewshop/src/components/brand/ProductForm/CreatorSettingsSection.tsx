'use client';

import { Switch } from '@/components/ui/switch';
import { CommissionSlider } from '@/components/ui/CommissionSlider';
import { SectionCard } from './SectionCard';

interface CreatorSettingsSectionProps {
  isActive: boolean;
  setIsActive: (v: boolean) => void;
  allowCreatorPick: boolean;
  setAllowCreatorPick: (v: boolean) => void;
  allowTrial: boolean;
  setAllowTrial: (v: boolean) => void;
  commissionRate: number;
  setCommissionRate: (v: number) => void;
  salePrice: number;
}

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5 last:border-b-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function CreatorSettingsSection({
  isActive,
  setIsActive,
  allowCreatorPick,
  setAllowCreatorPick,
  allowTrial,
  setAllowTrial,
  commissionRate,
  setCommissionRate,
  salePrice,
}: CreatorSettingsSectionProps) {
  return (
    <SectionCard
      title="크리에이터랑 어떻게 함께할까요?"
      subtitle="크리에이터가 이 상품을 얼마나 자유롭게 다룰지 결정해주세요"
    >
      <div className="space-y-5">
        <ToggleRow
          title="등록하자마자 판매 시작"
          description="등록을 마치면 고객이 바로 구매할 수 있어요"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
        <ToggleRow
          title="크리에이터가 자유롭게 홍보할 수 있게"
          description="크넥샵 크리에이터들이 내 상품을 선택해서 판매 링크를 만들 수 있어요"
          checked={allowCreatorPick}
          onCheckedChange={setAllowCreatorPick}
        />
        <ToggleRow
          title="크리에이터에게 체험 기회 제공"
          description="크리에이터가 먼저 써보고 진정성 있는 콘텐츠를 만들 수 있어요"
          checked={allowTrial}
          onCheckedChange={setAllowTrial}
        />
      </div>

      <div className="mt-2 border-t border-gray-100 pt-6">
        <CommissionSlider
          value={commissionRate}
          onChange={setCommissionRate}
          salePrice={salePrice}
        />
      </div>
    </SectionCard>
  );
}
