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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = getSupabase();
    if (!(await verifyAdmin(supabase, request))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, category, content_type, content, target_grade, display_order, is_published } = body;

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (category !== undefined) updateData.category = category;
    if (content_type !== undefined) updateData.content_type = content_type;
    if (content !== undefined) updateData.content = content;
    if (target_grade !== undefined) updateData.target_grade = target_grade;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_published !== undefined) updateData.is_published = is_published;

    const { data: guide, error } = await supabase
      .from('guides')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Guide update error:', error);
      return NextResponse.json({ error: 'Failed to update guide' }, { status: 500 });
    }

    return NextResponse.json({ guide });
  } catch (error) {
    console.error('Admin guide update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = getSupabase();
    if (!(await verifyAdmin(supabase, request))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { error } = await supabase
      .from('guides')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Guide delete error:', error);
      return NextResponse.json({ error: 'Failed to delete guide' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin guide delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
