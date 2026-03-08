import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: Record<string, unknown> = { isPublished: true };
    if (category) {
      where.category = category;
    }

    const guides = await prisma.guide.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ guides });
  } catch (error) {
    console.error('Guides API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
