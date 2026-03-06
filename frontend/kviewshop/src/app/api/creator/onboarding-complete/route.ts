import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { awardPoints } from '@/lib/points';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: creator } = await supabase
      .from('creators')
      .select('id, onboarding_completed')
      .eq('user_id', user.id)
      .single();

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Skip if already completed
    if (creator.onboarding_completed) {
      return NextResponse.json({ success: true, totalPoints: 5000, alreadyCompleted: true });
    }

    // Award points
    const signupResult = await awardPoints(supabase, creator.id, 'SIGNUP_BONUS', '가입 축하 포인트');
    const personaResult = await awardPoints(supabase, creator.id, 'PERSONA_COMPLETE', '페르소나 완료 보너스');

    // Complete SHOP_OPEN mission
    await supabase.rpc('init_creator_missions', { p_creator_id: creator.id });
    await supabase.rpc('check_and_complete_mission', {
      p_creator_id: creator.id,
      p_mission_key: 'SHOP_OPEN',
    });

    // Mark onboarding as completed
    await supabase
      .from('creators')
      .update({ onboarding_completed: true })
      .eq('id', creator.id);

    const totalPoints = 5000; // 3000 + 2000

    return NextResponse.json({ success: true, totalPoints });
  } catch (error) {
    console.error('Onboarding complete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
