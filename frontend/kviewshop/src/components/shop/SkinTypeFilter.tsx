'use client';

import { cn } from '@/lib/utils';

interface SkinTypeFilterProps {
  skinTypes: { value: string; label: string }[];
  selected: string;
  onChange: (value: string) => void;
  allLabel: string;
}

export function SkinTypeFilter({ skinTypes, selected, onChange, allLabel }: SkinTypeFilterProps) {
  const items = [{ value: '', label: allLabel }, ...skinTypes];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors border',
            selected === item.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
