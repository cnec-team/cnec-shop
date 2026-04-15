'use client';

const CATEGORIES = [
  { key: 'all', label: '전체' },
  { key: 'skincare', label: '스킨케어' },
  { key: 'cleansing', label: '클렌징' },
  { key: 'suncare', label: '선케어' },
  { key: 'maskpack', label: '마스크팩' },
  { key: 'hair', label: '헤어' },
  { key: 'body', label: '바디' },
];

interface CategoryChipsProps {
  selected: string;
  onSelect: (key: string) => void;
}

export function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4">
      {CATEGORIES.map(cat => (
        <button
          key={cat.key}
          onClick={() => onSelect(cat.key)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selected === cat.key
              ? 'bg-[#1A1A1A] text-white'
              : 'bg-[#F5F5F5] text-[#1A1A1A]'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
