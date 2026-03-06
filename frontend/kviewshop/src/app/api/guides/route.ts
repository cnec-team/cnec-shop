import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = supabase
      .from('guides')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: guides, error } = await query;

    if (error) {
      console.error('Guides query error:', error);
      return NextResponse.json({ error: 'Failed to fetch guides' }, { status: 500 });
    }

    return NextResponse.json({ guides: guides ?? [] });
  } catch (error) {
    console.error('Guides API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
