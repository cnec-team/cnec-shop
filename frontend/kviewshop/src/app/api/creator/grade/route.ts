import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { GRADE_THRESHOLDS } from '@/types/database';
import type { CreatorGrade } from '@/types/database';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const GRADE_ORDER: CreatorGrade[] = ['ROOKIE', 'SILVER', 'GOLD', 'PLATINUM'];

export async function GET(request: NextRequest) {
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
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const { data: gradeRecord } = await supabase
      .from('creator_grades')
      .select('*')
      .eq('creator_id', creator.id)
      .single();

    const grade: CreatorGrade = (gradeRecord?.grade as CreatorGrade) || 'ROOKIE';
    const monthlySales = gradeRecord?.monthly_sales ?? 0;
    const commissionBonusRate = gradeRecord?.commission_bonus_rate ?? 0;

    // Calculate next grade
    const currentIndex = GRADE_ORDER.indexOf(grade);
    const nextGrade = currentIndex < GRADE_ORDER.length - 1 ? GRADE_ORDER[currentIndex + 1] : null;
    const amountToNext = nextGrade ? GRADE_THRESHOLDS[nextGrade] - monthlySales : 0;

    return NextResponse.json({
      grade,
      monthlySales,
      commissionBonusRate,
      nextGrade,
      amountToNext: Math.max(0, amountToNext),
      gradeUpdatedAt: gradeRecord?.grade_updated_at ?? null,
    });
  } catch (error) {
    console.error('Grade API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
