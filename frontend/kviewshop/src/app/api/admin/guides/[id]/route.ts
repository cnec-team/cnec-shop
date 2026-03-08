import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const supabase = getSupabase();

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
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const supabase = getSupabase();

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
