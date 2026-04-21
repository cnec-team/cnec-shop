import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { Users, ArrowRight, Package } from 'lucide-react';
import { Footer } from '@/components/layout/footer';

interface PageProps {
  params: Promise<{ locale: string }>;
}

async function getFeaturedProducts() {
  try {
    return await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        isActive: true,
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        nameKo: true,
        price: true,
        originalPrice: true,
        salePrice: true,
        images: true,
        thumbnailUrl: true,
        imageUrl: true,
        brand: {
          select: {
            companyName: true,
            brandName: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('[NoShopContext] products fetch failed:', error);
    return [];
  }
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
  const [creators, products] = await Promise.all([
    prisma.creator.findMany({
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
    }),
    getFeaturedProducts(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* last_shop_id 쿠키는 유지 — 유효하지 않은 경우에만 미들웨어가 이 페이지로 보냄 */}
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

      {/* ──── 공개 상품 섹션 — SSR 렌더링 (크롤러 필수) ──── */}
      {products.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900">지금 만나보세요</h2>
              <p className="text-sm text-gray-500 mt-2">
                크리에이터가 직접 고른 K-뷰티 제품
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.map((p) => {
                const displayName = p.nameKo || p.name || '';
                const displayImage = p.thumbnailUrl || p.imageUrl || p.images?.[0] || null;
                const salePrice = Number(p.salePrice || p.price || 0);
                const originalPrice = p.originalPrice ? Number(p.originalPrice) : null;
                const brandName = p.brand.companyName || p.brand.brandName || '';

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                  >
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      {displayImage ? (
                        <Image
                          src={displayImage}
                          alt={displayName}
                          width={400}
                          height={400}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-[11px] text-gray-400">{brandName}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1 leading-snug line-clamp-2">
                        {displayName}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        {originalPrice && originalPrice > salePrice && (
                          <span className="text-xs text-gray-400 line-through">
                            {originalPrice.toLocaleString()}원
                          </span>
                        )}
                        <span className="text-sm font-bold text-gray-900">
                          {salePrice.toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ──── Footer — SSR 렌더링 (법정 사업자 정보, 크롤러 필수) ──── */}
      <Footer />
    </div>
  );
}
