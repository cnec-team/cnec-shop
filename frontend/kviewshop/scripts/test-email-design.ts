/**
 * 이메일 디자인 시스템 미리보기 생성 스크립트
 * 실행: npx tsx scripts/test-email-design.ts
 * 결과: test-output/brand-approved-preview.html
 */

import { brandApprovedTemplate } from '../src/lib/notifications/templates'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const outputDir = join(__dirname, '..', 'test-output')
mkdirSync(outputDir, { recursive: true })

const result = brandApprovedTemplate({
  brandName: '뷰티랩 코리아',
  recipientEmail: 'brand@example.com',
})

const outputPath = join(outputDir, 'brand-approved-preview.html')
writeFileSync(outputPath, result.email.html, 'utf-8')

console.log('샘플 미리보기 생성 완료:')
console.log(`  open ${outputPath}`)
