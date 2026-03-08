import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const guides = await prisma.guide.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ guides });
  } catch (error) {
    console.error('Admin guides error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, category, content_type, content, target_grade, display_order, is_published } = body;

    if (!title || !category) {
      return NextResponse.json({ error: 'title and category are required' }, { status: 400 });
    }

    const guide = await prisma.guide.create({
      data: {
        title,
        category,
        contentType: content_type || 'CARD',
        content: content || { sections: [] },
        targetGrade: target_grade || 'ALL',
        displayOrder: display_order ?? 0,
        isPublished: is_published ?? false,
      },
    });

    return NextResponse.json({ guide }, { status: 201 });
  } catch (error) {
    console.error('Admin guide create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
