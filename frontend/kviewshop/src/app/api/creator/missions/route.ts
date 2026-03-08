import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = getSupabase();

    const { data: creator } = await supabase
      .from('creators')
      .select('id, created_at')
      .eq('user_id', authUser.id)
      .single();
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Ensure missions exist
    await supabase.rpc('init_creator_missions', { p_creator_id: creator.id });

    // Auto-check missions based on current state
    // Check FIRST_PRODUCT
    const { count: shopItemCount } = await supabase
      .from('creator_shop_items')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', creator.id);

    if ((shopItemCount ?? 0) >= 1) {
      await supabase.rpc('check_and_complete_mission', {
        p_creator_id: creator.id,
        p_mission_key: 'FIRST_PRODUCT',
      });
    }

    if ((shopItemCount ?? 0) >= 5) {
      await supabase.rpc('check_and_complete_mission', {
        p_creator_id: creator.id,
        p_mission_key: 'FIVE_PRODUCTS',
      });
    }

    // Check FIRST_SALE
    const { count: saleCount } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', creator.id)
      .eq('status', 'CONFIRMED');

    if ((saleCount ?? 0) >= 1) {
      await supabase.rpc('check_and_complete_mission', {
        p_creator_id: creator.id,
        p_mission_key: 'FIRST_SALE',
      });
    }

    // Get missions
    const { data: missions } = await supabase
      .from('creator_missions')
      .select('*')
      .eq('creator_id', creator.id)
      .order('created_at', { ascending: true });

    // Calculate days since signup
    const daysSinceSignup = Math.floor(
      (Date.now() - new Date(creator.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    const completed = (missions ?? []).filter(m => m.is_completed).length;
    const total = (missions ?? []).length;

    return NextResponse.json({
      missions: missions ?? [],
      completedCount: completed,
      totalCount: total,
      daysSinceSignup,
      allCompleted: completed === total,
      expired: daysSinceSignup > 30,
    });
  } catch (error) {
    console.error('Missions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: manually complete a mission (e.g., SNS_SHARE)
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = getSupabase();

    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('user_id', authUser.id)
      .single();
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const body = await request.json();
    const { missionKey } = body;

    if (!missionKey) {
      return NextResponse.json({ error: 'missionKey is required' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('check_and_complete_mission', {
      p_creator_id: creator.id,
      p_mission_key: missionKey,
    });

    if (error) {
      console.error('Mission complete error:', error);
      return NextResponse.json({ error: 'Failed to complete mission' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Missions POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
