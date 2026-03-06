import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function getCreatorId(supabase: ReturnType<typeof getSupabase>, request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();
  return creator?.id ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const creatorId = await getCreatorId(supabase, request);
    if (!creatorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = (page - 1) * limit;

    // Get current balance (latest record)
    const { data: latestPoint } = await supabase
      .from('creator_points')
      .select('balance_after')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const balance = latestPoint?.balance_after ?? 0;

    // Get paginated history
    const { data: history, count } = await supabase
      .from('creator_points')
      .select('*', { count: 'exact' })
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return NextResponse.json({
      balance,
      history: history ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Points API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
