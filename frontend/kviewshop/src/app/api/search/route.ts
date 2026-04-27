'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const priceRange = searchParams.get('price') || '';
  const sort = searchParams.get('sort') || 'popular';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const suggest = searchParams.get('suggest') === 'true';

  // Autocomplete suggestions mode
  if (suggest && q && q.length >= 1) {
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { nameKo: { contains: q, mode: 'insensitive' } },
          { nameEn: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        nameKo: true,
        thumbnailUrl: true,
        salePrice: true,
        brand: { select: { brandName: true } },
      },
      take: 8,
      orderBy: { reviewCount: 'desc' },
    });

    const brands = await prisma.brand.findMany({
      where: {
        OR: [
          { brandName: { contains: q, mode: 'insensitive' } },
          { companyName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, brandName: true, logoUrl: true },
      take: 4,
    });

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        salePrice: p.salePrice ? Number(p.salePrice) : null,
      })),
      brands,
    });
  }

  // Full search mode
  const where: any = { status: 'ACTIVE' };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { nameKo: { contains: q, mode: 'insensitive' } },
      { nameEn: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { descriptionKo: { contains: q, mode: 'insensitive' } },
      { brand: { brandName: { contains: q, mode: 'insensitive' } } },
    ];
  }

  if (category) {
    where.category = category;
  }

  if (brand) {
    where.brandId = brand;
  }

  if (priceRange) {
    switch (priceRange) {
      case 'under10k':
        where.salePrice = { lte: 10000 };
        break;
      case 'under30k':
        where.salePrice = { lte: 30000 };
        break;
      case 'under50k':
        where.salePrice = { lte: 50000 };
        break;
      case 'over50k':
        where.salePrice = { gt: 50000 };
        break;
    }
  }

  let orderBy: any;
  switch (sort) {
    case 'recent':
      orderBy = { createdAt: 'desc' };
      break;
    case 'price_low':
      orderBy = { salePrice: 'asc' };
      break;
    case 'price_high':
      orderBy = { salePrice: 'desc' };
      break;
    case 'rating':
      orderBy = { averageRating: 'desc' };
      break;
    case 'review':
      orderBy = { reviewCount: 'desc' };
      break;
    default:
      orderBy = { createdAt: 'desc' };
  }

  const offset = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        brand: {
          select: { id: true, brandName: true, logoUrl: true },
        },
      },
      orderBy,
      skip: offset,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    products: products.map((p) => ({
      ...p,
      price: p.price ? Number(p.price) : null,
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      defaultCommissionRate: Number(p.defaultCommissionRate),
      shippingFee: Number(p.shippingFee),
      freeShippingThreshold: p.freeShippingThreshold ? Number(p.freeShippingThreshold) : null,
      averageRating: p.averageRating ? Number(p.averageRating) : null,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
