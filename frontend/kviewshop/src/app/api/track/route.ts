import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing server config' }, { status: 500 });
    }

    // Check existing visitor cookie
    const existingVisitorId = request.cookies.get('cnec_visitor')?.value;
    const visitorId = existingVisitorId || generateVisitorId();

    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const cookieWindowMs = COOKIE_WINDOW_HOURS * 60 * 60 * 1000;
    const expiresAt = new Date(now.getTime() + cookieWindowMs);

    // Record shop visit
    await supabase.from('shop_visits').insert({
      creator_id,
      visitor_id: visitorId,
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        '',
      user_agent: request.headers.get('user-agent') || '',
      referer: referrer || request.headers.get('referer') || '',
      attribution_data: Object.keys(attributionData).length > 0 ? attributionData : {},
      visited_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
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
