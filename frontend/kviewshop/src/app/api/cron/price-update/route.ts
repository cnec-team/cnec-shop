import { NextRequest, NextResponse } from 'next/server';
import { updateAllProductPrices } from '@/lib/price/price-updater';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await updateAllProductPrices();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('Cron price update failed:', err);
    return NextResponse.json(
      { error: 'Price update failed' },
      { status: 500 }
    );
  }
}
