'use client';

import { useState } from 'react';
import { CategoryFilter } from '@/components/shop/CategoryFilter';
import { SkinTypeFilter } from '@/components/shop/SkinTypeFilter';

interface DiscoveryFiltersProps {
  categories: { value: string; label: string }[];
  skinTypes: { value: string; label: string }[];
  allLabel: string;
}

export function DiscoveryFilters({ categories, skinTypes, allLabel }: DiscoveryFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSkinType, setSelectedSkinType] = useState('');

  return (
    <div className="space-y-4">
      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        onChange={setSelectedCategory}
        allLabel={allLabel}
      />
      <SkinTypeFilter
        skinTypes={skinTypes}
        selected={selectedSkinType}
        onChange={setSelectedSkinType}
        allLabel={allLabel}
      />
    </div>
  );
}
