export const ADMIN_ROUTES: Record<string, { label: string; parent?: string }> = {
  '/admin': { label: '어드민' },
  '/admin/dashboard': { label: '대시보드', parent: '/admin' },
  '/admin/approvals': { label: '승인 관리', parent: '/admin' },
  '/admin/approvals/creators': { label: '크리에이터 승인', parent: '/admin' },
  '/admin/approvals/brands': { label: '브랜드 승인', parent: '/admin' },
  '/admin/brands': { label: '브랜드 관리', parent: '/admin' },
  '/admin/creators': { label: '크리에이터 관리', parent: '/admin' },
  '/admin/creator-data': { label: '크리에이터 데이터', parent: '/admin' },
  '/admin/creator-data/import': { label: '데이터 임포트', parent: '/admin/creator-data' },
  '/admin/campaigns': { label: '캠페인 관리', parent: '/admin' },
  '/admin/samples': { label: '샘플 관리', parent: '/admin' },
  '/admin/orders': { label: '주문 관리', parent: '/admin' },
  '/admin/settlements': { label: '정산 관리', parent: '/admin' },
  '/admin/settlements/[id]': { label: '정산 상세', parent: '/admin/settlements' },
  '/admin/broadcast': { label: '공지 발송', parent: '/admin' },
  '/admin/broadcast/new': { label: '새 공지 작성', parent: '/admin/broadcast' },
  '/admin/broadcast/[id]': { label: '공지 상세', parent: '/admin/broadcast' },
  '/admin/activity': { label: '활동 로그', parent: '/admin' },
  '/admin/guides': { label: '가이드 관리', parent: '/admin' },
  '/admin/settings': { label: '플랫폼 설정', parent: '/admin' },
  '/admin/billing/refunds': { label: '환불 관리', parent: '/admin' },
  '/admin/match-analytics': { label: '매칭 분석', parent: '/admin' },
  '/admin/match-weights': { label: '매칭 가중치', parent: '/admin' },
  '/admin/ppm-kpi': { label: 'PPM KPI', parent: '/admin' },
  '/admin/pricing-analytics': { label: '가격 분석', parent: '/admin' },
}

export type BreadcrumbItem = {
  href?: string
  label: string
}

/**
 * pathname에서 locale prefix를 제거하고 라우트 매핑에서 빵부스러기 체인을 생성
 */
export function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // locale prefix 제거 (예: /ko/admin/dashboard → /admin/dashboard)
  const cleanPath = pathname.replace(/^\/[a-z]{2}(?=\/)/, '')

  const items: BreadcrumbItem[] = []
  const route = ADMIN_ROUTES[cleanPath]

  if (!route) {
    // 동적 세그먼트 등 매핑에 없는 경우 → 상위 경로 추적
    const segments = cleanPath.split('/').filter(Boolean)
    let accumulated = ''
    for (const segment of segments) {
      accumulated += '/' + segment
      const mapped = ADMIN_ROUTES[accumulated]
      if (mapped) {
        items.push({ href: accumulated, label: mapped.label })
      }
    }
    return items
  }

  // 부모 체인 역추적
  const chain: { path: string; label: string }[] = []
  let current: string | undefined = cleanPath
  while (current && ADMIN_ROUTES[current]) {
    chain.unshift({ path: current, label: ADMIN_ROUTES[current].label })
    current = ADMIN_ROUTES[current].parent
  }

  return chain.map((c, i) => ({
    href: i < chain.length - 1 ? c.path : undefined,
    label: c.label,
  }))
}
