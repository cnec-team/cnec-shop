import Image from 'next/image';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { prisma } from '@/lib/db';
import { Footer } from '@/components/layout/footer';
import { LandingContent } from '@/components/home/LandingContent';

/* ─── SSR: DB에서 상품 직접 조회 (크롤러가 초기 HTML에서 읽을 수 있음) ─── */
async function getFeaturedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        isActive: true,
      },
      take: 12,
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
    return products;
  } catch (error) {
    console.error('상품 조회 실패:', error);
    return [];
  }
}

export default async function LandingPage() {
  const products = await getFeaturedProducts();

  return (
    <div className="min-h-screen bg-white">
      {/* 인터랙티브 랜딩 콘텐츠 (Client Component) */}
      <LandingContent />

      {/* ──── DB 상품 섹션 — SSR로 HTML에 직접 포함됨 ──── */}
      {products.length > 0 && (
        <section id="featured-products" className="py-24 md:py-32">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="mb-14 text-center">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900">
                지금 만나보세요
              </h2>
              <p className="text-base md:text-lg text-gray-400 mt-4">
                크리에이터가 직접 고른 K-뷰티 제품
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
              {products.map((p) => {
                const displayName = p.nameKo || p.name || '';
                const displayImage = p.thumbnailUrl || p.imageUrl || p.images?.[0] || null;
                const salePrice = Number(p.salePrice || p.price || 0);
                const originalPrice = p.originalPrice ? Number(p.originalPrice) : null;
                const brandName = p.brand.companyName || p.brand.brandName || '';

                return (
                  <div
                    key={p.id}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-500"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                      {displayImage ? (
                        <Image
                          src={displayImage}
                          alt={displayName}
                          width={512}
                          height={512}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-[11px] text-gray-400 font-medium">{brandName}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1 leading-snug line-clamp-2">
                        {displayName}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        {originalPrice && originalPrice > salePrice && (
                          <span className="text-xs text-gray-300 line-through">
                            {originalPrice.toLocaleString()}원
                          </span>
                        )}
                        <span className="text-sm font-bold text-blue-600">
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

      {/* ──── Footer — Server Component, SSR로 HTML에 직접 포함됨 ──── */}
      <Footer />
    </div>
  );
}
