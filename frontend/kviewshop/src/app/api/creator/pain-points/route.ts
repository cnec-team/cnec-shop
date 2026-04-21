import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { calculateAndSaveCreatorVector } from "@/lib/creator/pain-point-vector";

async function getCreatorId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return creator?.id ?? null;
}

export async function GET() {
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const points = await prisma.creatorPainPoint.findMany({
    where: { creatorId },
    include: { painPoint: true },
    orderBy: { painPoint: { sortOrder: "asc" } },
  });

  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    select: {
      skinType: true,
      ageGroup: true,
      painPointVectorUpdatedAt: true,
    },
  });

  return NextResponse.json({
    painPoints: points.map((p) => ({
      code: p.painPointCode,
      severity: p.severity,
      priority: p.priority,
      note: p.note,
      koName: p.painPoint.koName,
      shortName: p.painPoint.shortName,
      iconName: p.painPoint.iconName,
    })),
    skinType: creator?.skinType ?? null,
    ageGroup: creator?.ageGroup ?? null,
    isCompleted: !!creator?.painPointVectorUpdatedAt,
  });
}

export async function PUT(req: Request) {
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    painPoints: Array<{
      code: string;
      severity: number;
      priority: "primary" | "secondary";
      note?: string;
    }>;
    skinType?: string;
    ageGroup?: string;
  };

  // Validate
  if (!body.painPoints?.length) {
    return NextResponse.json(
      { error: "페인포인트를 1개 이상 선택해주세요" },
      { status: 400 }
    );
  }

  const primaryCount = body.painPoints.filter(
    (p) => p.priority === "primary"
  ).length;
  if (primaryCount !== 1) {
    return NextResponse.json(
      { error: "주요 고민은 1개만 선택할 수 있어요" },
      { status: 400 }
    );
  }

  // Upsert pain points in transaction
  await prisma.$transaction(async (tx) => {
    // Delete existing
    await tx.creatorPainPoint.deleteMany({ where: { creatorId } });

    // Create new
    await tx.creatorPainPoint.createMany({
      data: body.painPoints.map((p) => ({
        creatorId,
        painPointCode: p.code,
        severity: Math.min(Math.max(p.severity, 1), 5),
        priority: p.priority,
        note: p.note ?? null,
      })),
    });

    // Update skin info
    const updateData: Record<string, unknown> = {};
    if (body.skinType) updateData.skinType = body.skinType;
    if (body.ageGroup) updateData.ageGroup = body.ageGroup;

    if (Object.keys(updateData).length > 0) {
      await tx.creator.update({
        where: { id: creatorId },
        data: updateData as Record<string, string>,
      });
    }
  });

  // Calculate and save vector
  const vector = await calculateAndSaveCreatorVector(creatorId);

  return NextResponse.json({
    success: true,
    vector,
  });
}
