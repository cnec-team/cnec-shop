import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { getUploadUrl } from '@/lib/storage'

/**
 * Returns a presigned R2 PUT URL so the admin UI can upload the CSV
 * directly to R2, bypassing Vercel's 4.5MB serverless body size limit.
 */
export async function POST(request: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const filename: string = typeof body.filename === 'string' ? body.filename : 'import.csv'
    if (!filename.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ error: 'CSV 파일만 업로드 가능합니다' }, { status: 400 })
    }

    const key = `admin/imports/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const uploadUrl = await getUploadUrl(key, 'text/csv')

    return NextResponse.json({ uploadUrl, key })
  } catch (err) {
    console.error('[upload-url] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload URL 발급 실패' },
      { status: 500 }
    )
  }
}
