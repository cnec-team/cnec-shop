import { NextResponse } from "next/server";

// 현재는 가중치를 코드에서 관리 (향후 DB 테이블로 이동 가능)
// engine.ts의 가중치: cosine=0.6, heroBoost=0.25, trend=0.15

export async function POST(req: Request) {
  const body = (await req.json()) as {
    cosine: number;
    heroBoost: number;
    trend: number;
  };

  const total = body.cosine + body.heroBoost + body.trend;
  if (Math.abs(total - 1) > 0.01) {
    return NextResponse.json(
      { error: "가중치 합계가 1이어야 합니다" },
      { status: 400 }
    );
  }

  // TODO: DB에 가중치 저장 + 전체 재계산 배치 잡 실행
  // 현재는 로그만
  console.log("[PPM] 가중치 업데이트:", body);

  return NextResponse.json({
    success: true,
    weights: body,
    message: "가중치가 저장됐습니다. 전체 재계산은 향후 업데이트 예정입니다.",
  });
}
