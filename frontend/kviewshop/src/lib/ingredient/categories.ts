/**
 * 성분 카테고리 UI 매핑
 * DB의 11개 카테고리(재생/미백/보습/진정/안티에이징/장벽/모공/각질/항산화/발효/기타)를
 * 브랜드 MD 친화적 8개 탭으로 재그룹화
 */

export type CategoryTab = {
  id: string;
  label: string;
  dbCategories: string[]; // DB category 필드 매칭값
};

export const CATEGORY_TABS: CategoryTab[] = [
  { id: 'all', label: '전체', dbCategories: [] },
  { id: 'moisture', label: '보습', dbCategories: ['보습'] },
  { id: 'whitening', label: '미백', dbCategories: ['미백'] },
  { id: 'soothing', label: '진정', dbCategories: ['진정'] },
  { id: 'antiaging', label: '안티에이징', dbCategories: ['안티에이징', '재생'] },
  { id: 'barrier', label: '장벽', dbCategories: ['장벽'] },
  { id: 'pore', label: '모공/각질', dbCategories: ['모공', '각질'] },
  { id: 'antioxidant', label: '항산화', dbCategories: ['항산화', '발효'] },
];

/**
 * UI 탭 ID로 성분 필터링
 */
export function filterIngredientsByTab(
  ingredients: Array<{ category: string }>,
  tabId: string
) {
  if (tabId === 'all') return ingredients;
  const tab = CATEGORY_TABS.find((t) => t.id === tabId);
  if (!tab) return ingredients;
  return ingredients.filter((ing) => tab.dbCategories.includes(ing.category));
}

/**
 * 피부고민 코드 → 한글 라벨
 */
export const PAIN_POINT_LABELS: Record<string, string> = {
  p01: '여드름',
  p02: '모공',
  p03: '기미/잡티',
  p04: '주름',
  p05: '건조',
  p06: '민감',
  p07: '장벽손상',
  p08: '유분',
};
