import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle2, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default async function BrandPendingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const brand = await prisma.brand.findFirst({
    where: { userId: session.user.id },
    select: { approved: true, companyName: true, createdAt: true },
  });

  if (!brand) {
    redirect(`/${locale}/signup`);
  }

  if (brand.approved) {
    redirect(`/${locale}/brand/dashboard`);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
          <Clock className="h-8 w-8 text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold">브랜드 심사 중이에요</h1>
        <p className="text-muted-foreground">
          {brand.companyName || '브랜드'} 가입 신청이 접수되었습니다.
          1~2영업일 내 심사 결과를 알려드릴게요.
        </p>
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm text-muted-foreground text-left">
              <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> 이메일로 심사 결과를 보내드려요</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> 승인 시 바로 상품 등록이 가능해요</p>
            </div>
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
            문의하기
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
