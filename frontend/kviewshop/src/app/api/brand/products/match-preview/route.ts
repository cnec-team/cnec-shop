import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { targetPainPoints, strengths } = (await req.json()) as {
    targetPainPoints: string[];
    strengths: Record<string, number>;
  };

  if (!targetPainPoints?.length) {
    return NextResponse.json({
      veryHigh: 0,
      high: 0,
      medium: 0,
      total: 0,
      top20: [],
    });
  }

  const codes = ["P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08"];
  const targetVec = codes.map((c) => strengths[c] || 0);
  const vectorStr = `[${targetVec.join(",")}]`;

  try {
    const results = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        username: string | null;
        display_name: string | null;
        profile_image_url: string | null;
        ig_followers: number | null;
        match_score: number;
      }>
    >(
      `
      SELECT
        c.id,
        c.username,
        c.display_name,
        c.profile_image_url,
        c.ig_followers,
        1 - (c.pain_point_vector <=> $1::vector) AS match_score
      FROM creators c
      WHERE c.pain_point_vector IS NOT NULL
        AND c.cnec_is_partner = true
      ORDER BY match_score DESC
      LIMIT 100
      `,
      vectorStr
    );

    const veryHigh = results.filter((r) => r.match_score >= 0.7).length;
    const high = results.filter(
      (r) => r.match_score >= 0.5 && r.match_score < 0.7
    ).length;
    const medium = results.filter(
      (r) => r.match_score >= 0.3 && r.match_score < 0.5
    ).length;

    return NextResponse.json({
      veryHigh,
      high,
      medium,
      total: results.length,
      top20: results.slice(0, 20).map((r) => ({
        id: r.id,
        username: r.username,
        displayName: r.display_name,
        profileImageUrl: r.profile_image_url,
        igFollowers: r.ig_followers,
        matchScore: Math.round(r.match_score * 100) / 100,
      })),
    });
  } catch {
    // 벡터 데이터가 없는 경우
    return NextResponse.json({
      veryHigh: 0,
      high: 0,
      medium: 0,
      total: 0,
      top20: [],
    });
  }
}
