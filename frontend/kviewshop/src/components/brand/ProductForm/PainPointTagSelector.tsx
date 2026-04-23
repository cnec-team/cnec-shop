'use client';

import {
  Droplet,
  Circle,
  Sun,
  Waves,
  CloudDrizzle,
  Flame,
  Shield,
  Droplets,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, LucideIcon> = {
  Droplet,
  Circle,
  Sun,
  Waves,
  CloudDrizzle,
  Flame,
  Shield,
  Droplets,
};

const ALL_PAIN_POINTS = [
  { code: 'P01', shortName: '여드름', iconName: 'Droplet' },
  { code: 'P02', shortName: '모공', iconName: 'Circle' },
  { code: 'P03', shortName: '기미/잡티', iconName: 'Sun' },
  { code: 'P04', shortName: '주름', iconName: 'Waves' },
  { code: 'P05', shortName: '건조', iconName: 'CloudDrizzle' },
  { code: 'P06', shortName: '민감', iconName: 'Flame' },
  { code: 'P07', shortName: '장벽 손상', iconName: 'Shield' },
  { code: 'P08', shortName: '유분', iconName: 'Droplets' },
];

interface Props {
  selected: string[]; // ['P01', 'P04', ...]
  onChange: (selected: string[]) => void;
}

export function PainPointTagSelector({ selected, onChange }: Props) {
  const toggle = (code: string) => {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else {
      onChange([...selected, code]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {ALL_PAIN_POINTS.map((pp) => {
        const Icon = ICON_MAP[pp.iconName] || Circle;
        const isSelected = selected.includes(pp.code);

        return (
          <button
            key={pp.code}
            type="button"
            onClick={() => toggle(pp.code)}
            className={cn(
              'flex w-full flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all',
              isSelected
                ? 'border-violet-400 bg-violet-50 shadow-sm'
                : 'border-gray-100 bg-white hover:border-gray-200'
            )}
          >
            <Icon
              className={cn(
                'h-5 w-5',
                isSelected ? 'text-violet-600' : 'text-gray-300'
              )}
            />
            <span
              className={cn(
                'text-xs font-medium',
                isSelected ? 'text-violet-700' : 'text-gray-600'
              )}
            >
              {pp.shortName}
            </span>
          </button>
        );
      })}
    </div>
  );
}
