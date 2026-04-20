'use client';

import { Search, SlidersHorizontal } from 'lucide-react';

interface CampaignSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterClick?: () => void;
  placeholder?: string;
}

export function CampaignSearchBar({
  value,
  onChange,
  onFilterClick,
  placeholder = '어떤 캠페인을 찾으시나요?',
}: CampaignSearchBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-full border border-gray-100 bg-white pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100"
        />
      </div>
      <button
        type="button"
        onClick={onFilterClick}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50"
        aria-label="필터"
      >
        <SlidersHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
}
