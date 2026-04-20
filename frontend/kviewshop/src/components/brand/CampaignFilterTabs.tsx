'use client';

import { cn } from '@/lib/utils';

export type CampaignFilter = 'active' | 'draft' | 'ended' | 'all';

const TABS: Array<{ value: CampaignFilter; label: string }> = [
  { value: 'active', label: '진행 중' },
  { value: 'draft', label: '작성 중' },
  { value: 'ended', label: '종료' },
  { value: 'all', label: '전체보기' },
];

interface CampaignFilterTabsProps {
  value: CampaignFilter;
  counts?: Partial<Record<CampaignFilter, number>>;
  onChange: (value: CampaignFilter) => void;
}

export function CampaignFilterTabs({ value, counts, onChange }: CampaignFilterTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {TABS.map((tab) => {
        const active = value === tab.value;
        const count = counts?.[tab.value];
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100',
            )}
          >
            <span>{tab.label}</span>
            {typeof count === 'number' ? (
              <span
                className={cn(
                  'rounded-full px-1.5 text-xs tabular-nums',
                  active ? 'bg-white/15 text-white' : 'text-gray-400',
                )}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
