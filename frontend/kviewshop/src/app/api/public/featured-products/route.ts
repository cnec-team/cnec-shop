import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
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

    return NextResponse.json(
      products.map((p) => ({
        id: p.id,
        name: p.nameKo || p.name || '',
        brandName: p.brand.companyName || p.brand.brandName || '',
        image: p.thumbnailUrl || p.imageUrl || p.images?.[0] || null,
        price: Number(p.salePrice || p.price || 0),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      })),
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      },
    );
  } catch (error) {
    console.error('Failed to fetch featured products:', error);
    return NextResponse.json([]);
  }
}
