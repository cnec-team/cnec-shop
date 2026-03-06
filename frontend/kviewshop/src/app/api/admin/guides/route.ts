import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function verifyAdmin(supabase: ReturnType<typeof getSupabase>, request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return false;

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  return userData?.role === 'super_admin';
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!(await verifyAdmin(supabase, request))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: guides, error } = await supabase
      .from('guides')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch guides' }, { status: 500 });
    }

    return NextResponse.json({ guides: guides ?? [] });
  } catch (error) {
    console.error('Admin guides error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!(await verifyAdmin(supabase, request))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, category, content_type, content, target_grade, display_order, is_published } = body;

    if (!title || !category) {
      return NextResponse.json({ error: 'title and category are required' }, { status: 400 });
    }

    const { data: guide, error } = await supabase
      .from('guides')
      .insert({
        title,
        category,
        content_type: content_type || 'CARD',
        content: content || { sections: [] },
        target_grade: target_grade || 'ALL',
        display_order: display_order ?? 0,
        is_published: is_published ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error('Guide create error:', error);
      return NextResponse.json({ error: 'Failed to create guide' }, { status: 500 });
    }

    return NextResponse.json({ guide }, { status: 201 });
  } catch (error) {
    console.error('Admin guide create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
