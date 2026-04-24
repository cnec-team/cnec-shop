import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadFile } from '@/lib/storage'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const settlementId = formData.get('settlementId') as string | null

  if (!file || !settlementId) {
    return NextResponse.json({ error: '파일과 정산 ID가 필요해요' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: '파일 크기는 10MB 이하여야 해요' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'JPG, PNG, PDF만 업로드 가능해요' }, { status: 400 })
  }

  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9가-힣._-]/g, '_')
    .replace(/_{2,}/g, '_')

  const ext = sanitizedName.split('.').pop() || 'bin'
  const key = `settlements/${settlementId}/proofs/${Date.now()}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await uploadFile(key, buffer, file.type)

  return NextResponse.json({ url })
}
