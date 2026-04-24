export const CATEGORY_KEYWORDS = {
  '메이크업': ['메이크업', '뷰티', 'makeup', 'beauty', 'cosmetic'],
  '스킨케어': ['스킨케어', '뷰티', 'skincare', 'skin', 'cosmetic'],
  '헤어': ['헤어', 'hair'],
  '네일': ['네일', 'nail'],
  '향수': ['향수', '퍼퓸', 'perfume', 'fragrance'],
  '바디케어': ['바디', 'body'],
  '셀프케어': ['셀프케어', '일상', 'personal care', 'self care'],
  '시술·클리닉': ['시술', '클리닉', '피부과', 'clinic', 'dermatology', 'medical spa'],
  '다이어트·헬스': ['다이어트', '헬스', '건강', '운동', 'fitness', 'health'],
} as const

export type BeautyCategory = keyof typeof CATEGORY_KEYWORDS

export const BEAUTY_CATEGORIES: BeautyCategory[] = Object.keys(CATEGORY_KEYWORDS) as BeautyCategory[]

export function categoryToKeywords(category: string): string[] {
  const kws = CATEGORY_KEYWORDS[category as BeautyCategory]
  return kws ? [...kws] : [category]
}

export function buildCategoryWhereClause(categories: string[]) {
  if (categories.length === 0) return null
  const keywords = categories.flatMap(categoryToKeywords)
  return {
    OR: keywords.map(k => ({
      igCategory: { contains: k, mode: 'insensitive' as const },
    })),
  }
}
