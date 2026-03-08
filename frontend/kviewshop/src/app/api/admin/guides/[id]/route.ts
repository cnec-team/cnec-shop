import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, category, content_type, content, target_grade, display_order, is_published } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (category !== undefined) updateData.category = category;
    if (content_type !== undefined) updateData.contentType = content_type;
    if (content !== undefined) updateData.content = content;
    if (target_grade !== undefined) updateData.targetGrade = target_grade;
    if (display_order !== undefined) updateData.displayOrder = display_order;
    if (is_published !== undefined) updateData.isPublished = is_published;

    const guide = await prisma.guide.update({
      where: { id },
      data: updateData,
    });

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

    const { id } = await params;
    await prisma.guide.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin guide delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
