'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SectionCard } from './SectionCard';

const fieldCls =
  'h-12 rounded-2xl border border-gray-200 bg-white text-sm placeholder:text-gray-300 focus-visible:border-gray-900 focus-visible:ring-2 focus-visible:ring-gray-100';
const labelCls = 'text-sm font-semibold text-gray-700';
const textareaCls =
  'rounded-2xl border border-gray-200 bg-white text-sm placeholder:text-gray-300 focus-visible:border-gray-900 focus-visible:ring-2 focus-visible:ring-gray-100';

interface ProductDescriptionSectionProps {
  description: string;
  setDescription: (v: string) => void;
  volume: string;
  setVolume: (v: string) => void;
  ingredients: string;
  setIngredients: (v: string) => void;
  howToUse: string;
  setHowToUse: (v: string) => void;
}

export function ProductDescriptionSection({
  description,
  setDescription,
  volume,
  setVolume,
  ingredients,
  setIngredients,
  howToUse,
  setHowToUse,
}: ProductDescriptionSectionProps) {
  return (
    <SectionCard
      title="상품 상세 정보"
      subtitle="상품에 대한 자세한 설명을 입력해주세요 (선택)"
    >
      <div className="space-y-2">
        <Label htmlFor="description" className={labelCls}>
          상품 설명
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="상품에 대한 간단한 소개를 입력하세요"
          rows={3}
          className={textareaCls}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="volume" className={labelCls}>
          용량/규격
        </Label>
        <Input
          id="volume"
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          placeholder="예: 50ml, 30g"
          className={fieldCls}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ingredients" className={labelCls}>
          전성분
        </Label>
        <Textarea
          id="ingredients"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="전성분 목록을 입력하세요"
          rows={3}
          className={textareaCls}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="howToUse" className={labelCls}>
          사용 방법
        </Label>
        <Textarea
          id="howToUse"
          value={howToUse}
          onChange={(e) => setHowToUse(e.target.value)}
          placeholder="사용 방법을 입력하세요"
          rows={3}
          className={textareaCls}
        />
      </div>
    </SectionCard>
  );
}
