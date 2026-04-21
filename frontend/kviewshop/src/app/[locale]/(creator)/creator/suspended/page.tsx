import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default async function CreatorSuspendedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const creator = await prisma.creator.findFirst({
    where: { userId: session.user.id },
    select: { status: true, displayName: true },
  });

  if (!creator || creator.status !== 'SUSPENDED') {
    redirect(`/${locale}/creator/dashboard`);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold">계정이 정지되었어요</h1>
        <p className="text-muted-foreground">
          {creator.displayName || '크리에이터'}님의 계정이 관리자에 의해 정지되었습니다.
          자세한 사항은 고객센터로 문의해주세요.
        </p>
        <Card className="bg-muted/50">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            계정 정지 사유 또는 해제 요청은 카카오톡 채널을 통해 문의하실 수 있습니다.
          </CardContent>
        </Card>
        <div className="flex gap-3 justify-center">
          <a
            href="https://pf.kakao.com/_cnecshop"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 text-yellow-900 px-6 py-3 font-semibold hover:bg-yellow-500 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            카카오톡 문의
          </a>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 rounded-xl border px-6 py-3 font-semibold hover:bg-muted transition-colors"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
