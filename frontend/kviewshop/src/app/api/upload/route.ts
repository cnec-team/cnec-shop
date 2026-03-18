import { getAuthUser } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'uploads'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Check R2 configuration
    const missingEnvVars = [
      'R2_ACCOUNT_ID',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_BUCKET_NAME',
      'NEXT_PUBLIC_R2_PUBLIC_URL',
    ].filter((key) => !process.env[key])

    if (missingEnvVars.length > 0) {
      console.error('Missing R2 env vars:', missingEnvVars.join(', '))
      return NextResponse.json(
        { error: `Storage not configured. Missing: ${missingEnvVars.join(', ')}` },
        { status: 500 }
      )
    }

    const { uploadFile } = await import('@/lib/storage')

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop()
    const key = `${folder}/${user.id}/${Date.now()}.${ext}`

    const url = await uploadFile(key, buffer, file.type)

    return NextResponse.json({ url, key })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Upload error:', message, error)
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 })
  }
}
