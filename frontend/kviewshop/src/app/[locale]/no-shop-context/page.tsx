import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { Users, ArrowRight } from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function NoShopContextPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await auth();

  // Redirect non-buyer roles to their dashboards
  if (session?.user?.role === 'super_admin') {
    redirect(`/${locale}/admin/dashboard`);
  }
  if (session?.user?.role === 'brand_admin') {
    redirect(`/${locale}/brand/dashboard`);
  }
  if (session?.user?.role === 'creator') {
    redirect(`/${locale}/creator/dashboard`);
  }

  // Fetch active creators with shop
  const creators = await prisma.creator.findMany({
    where: {
      status: 'ACTIVE',
      shopId: { not: null },
    },
    select: {
      id: true,
      shopId: true,
      displayName: true,
      bio: true,
      profileImageUrl: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Users className="w-7 h-7 text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            크리에이터 샵 둘러보기
          </h1>
          <p className="text-sm text-gray-500">
            크리에이터가 직접 추천하는 K-뷰티 아이템을 만나보세요
          </p>
        </div>

        {creators.length > 0 ? (
          <div className="space-y-3">
            {creators.map((creator) => (
              <Link
                key={creator.id}
                href={`/${locale}/${creator.shopId}`}
                className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-sm transition-shadow"
              >
                <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                  {creator.profileImageUrl ? (
                    <img
                      src={creator.profileImageUrl}
                      alt={creator.displayName ?? ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-400">
                      {creator.displayName?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {creator.displayName || creator.shopId}
                  </h3>
                  {creator.bio && (
                    <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                      {creator.bio}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">
              아직 등록된 크리에이터가 없어요
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href={`/${locale}/creators`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            전체 크리에이터 보기
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
