import { prisma } from './db'

export async function decrementStock(productId: string, quantity: number) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    })

    if (!product) {
      return { success: false, reason: 'product_not_found' } as const
    }

    if (product.stock < quantity) {
      return {
        success: false,
        reason: 'insufficient_stock',
        available: product.stock,
      } as const
    }

    const updated = await tx.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    })

    return { success: true, remaining: updated.stock } as const
  })
}

export async function incrementStock(productId: string, quantity: number) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    })

    if (!product) {
      return { success: false, reason: 'product_not_found' } as const
    }

    const updated = await tx.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } },
    })

    return { success: true, remaining: updated.stock } as const
  })
}
