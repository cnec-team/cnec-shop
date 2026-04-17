import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = [
  'scontent.cdninstagram.com',
  'cdninstagram.com',
  'instagram.com',
  'r2.dev',
  'cloudflarestorage.com',
]

function isAllowed(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return ALLOWED_HOSTS.some(h => hostname === h || hostname.endsWith(`.${h}`))
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url || !isAllowed(url)) {
    return new NextResponse(null, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!res.ok) {
      return new NextResponse(null, { status: 502 })
    }

    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') ?? 'image/jpeg'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      },
    })
  } catch {
    return new NextResponse(null, { status: 502 })
  }
}
