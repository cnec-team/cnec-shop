import type { Creator } from '@/generated/prisma/client'

export function maskCreatorContact<T extends Partial<Creator>>(creator: T): T {
  return {
    ...creator,
    // 브랜드가 검색/열람 시 연락처는 항상 가림
    // 메시지 발송 시스템 내부에서만 실제 연락처 사용
  } as T
}

export function shouldMaskForBrand(_context: 'search' | 'detail' | 'group'): boolean {
  // 모든 브라우징 컨텍스트에서 마스킹
  return true
}
