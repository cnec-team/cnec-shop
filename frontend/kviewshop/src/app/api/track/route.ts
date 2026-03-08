import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { COOKIE_WINDOW_HOURS } from '@/types/database';

function generateVisitorId(): string {
  const array = new Uint8Array(16);
  globalThis.crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: NextRequest) {
  try {
    const { creator_id, utm_source, utm_medium, utm_campaign, referrer } = await request.json();

    if (!creator_id) {
      return NextResponse.json({ error: 'creator_id required' }, { status: 400 });
    }

    // Build attribution data from UTM params
    const attributionData: Record<string, string> = {};
    if (utm_source) attributionData.utm_source = utm_source;
    if (utm_medium) attributionData.utm_medium = utm_medium;
    if (utm_campaign) attributionData.utm_campaign = utm_campaign;
    if (referrer) attributionData.referrer = referrer;

    // Check existing visitor cookie
    const existingVisitorId = request.cookies.get('cnec_visitor')?.value;
    const visitorId = existingVisitorId || generateVisitorId();

    const now = new Date();
    const cookieWindowMs = COOKIE_WINDOW_HOURS * 60 * 60 * 1000;
    const expiresAt = new Date(now.getTime() + cookieWindowMs);

    // Record shop visit
    await prisma.shopVisit.create({
      data: {
        creatorId: creator_id,
        visitorId,
        ipAddress:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          '',
        userAgent: request.headers.get('user-agent') || '',
        referer: referrer || request.headers.get('referer') || '',
        attributionData: Object.keys(attributionData).length > 0 ? attributionData : {},
        visitedAt: now,
        expiresAt,
      },
    });

    // Set cookies with response
    const response = NextResponse.json({
      visitor_id: visitorId,
      creator_id,
      expires_at: expiresAt.toISOString(),
    });

    const cookieMaxAge = COOKIE_WINDOW_HOURS * 60 * 60; // seconds

    response.cookies.set('cnec_visitor', visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieMaxAge,
      path: '/',
    });

    response.cookies.set('cnec_creator', creator_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieMaxAge,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Track error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
