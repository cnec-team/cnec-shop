import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

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
    const amount = parseInt(body.amount, 10);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('award_points', {
      p_creator_id: creator.id,
      p_type: 'WITHDRAW',
      p_amount: -amount,
      p_description: '포인트 출금 신청',
      p_related_id: null,
    });

    if (error) {
      console.error('Withdraw error:', error);
      return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 });
    }

    if (!data?.success) {
      return NextResponse.json({ error: data?.error || 'Insufficient balance' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      newBalance: data.balance,
    });
  } catch (error) {
    console.error('Withdraw API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
