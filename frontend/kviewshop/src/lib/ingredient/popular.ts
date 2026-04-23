/**
 * 검색바 포커스 시 상단에 노출되는 인기 성분 10개
 *
 * 선정 기준: K-뷰티에서 자주 언급되고 브랜드 MD가 익숙한 성분
 * DB의 koName과 정확히 일치해야 매칭됨
 *
 * 변경 시 주의: DB의 ingredient_masters.ko_name과 1:1 일치 확인 필수
 */
export const POPULAR_INGREDIENT_KO_NAMES: string[] = [
  'PDRN',
  '나이아신아마이드',
  '히알루론산',
  '레티놀',
  '센텔라',
  '비타민C',
  '펩타이드',
  '세라마이드',
  '콜라겐',
  '판테놀',
];
