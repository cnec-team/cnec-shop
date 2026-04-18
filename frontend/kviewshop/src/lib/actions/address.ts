'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

async function requireBuyer() {
  const session = await auth()
  if (!session?.user) throw new Error('로그인이 필요합니다')
  const buyer = await prisma.buyer.findFirst({ where: { userId: session.user.id } })
  if (!buyer) throw new Error('구매자 정보를 찾을 수 없습니다')
  return { user: session.user, buyer }
}

export async function getAddresses() {
  const { buyer } = await requireBuyer()
  return prisma.address.findMany({
    where: { buyerId: buyer.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })
}

export async function createAddress(data: {
  label?: string
  recipient: string
  phone: string
  zipcode: string
  address: string
  detail: string
  isDefault?: boolean
}) {
  const { buyer } = await requireBuyer()

  const count = await prisma.address.count({ where: { buyerId: buyer.id } })
  if (count >= 20) throw new Error('배송지는 최대 20개까지 등록할 수 있습니다')

  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({
        where: { buyerId: buyer.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    const isFirst = count === 0
    return tx.address.create({
      data: {
        buyerId: buyer.id,
        label: data.label || null,
        recipient: data.recipient,
        phone: data.phone,
        zipcode: data.zipcode,
        address: data.address,
        detail: data.detail,
        isDefault: data.isDefault || isFirst,
      },
    })
  })
}

export async function updateAddress(addressId: string, data: {
  label?: string
  recipient?: string
  phone?: string
  zipcode?: string
  address?: string
  detail?: string
  isDefault?: boolean
}) {
  const { buyer } = await requireBuyer()

  const addr = await prisma.address.findFirst({
    where: { id: addressId, buyerId: buyer.id },
  })
  if (!addr) throw new Error('배송지를 찾을 수 없습니다')

  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({
        where: { buyerId: buyer.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    return tx.address.update({
      where: { id: addressId },
      data: {
        ...(data.label !== undefined && { label: data.label }),
        ...(data.recipient !== undefined && { recipient: data.recipient }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.zipcode !== undefined && { zipcode: data.zipcode }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.detail !== undefined && { detail: data.detail }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      },
    })
  })
}

export async function deleteAddress(addressId: string) {
  const { buyer } = await requireBuyer()

  const addr = await prisma.address.findFirst({
    where: { id: addressId, buyerId: buyer.id },
  })
  if (!addr) throw new Error('배송지를 찾을 수 없습니다')

  await prisma.address.delete({ where: { id: addressId } })

  // 기본 배송지 삭제 시 다른 것으로 대체
  if (addr.isDefault) {
    const first = await prisma.address.findFirst({
      where: { buyerId: buyer.id },
      orderBy: { createdAt: 'desc' },
    })
    if (first) {
      await prisma.address.update({
        where: { id: first.id },
        data: { isDefault: true },
      })
    }
  }

  return { success: true }
}

export async function setDefaultAddress(addressId: string) {
  const { buyer } = await requireBuyer()

  const addr = await prisma.address.findFirst({
    where: { id: addressId, buyerId: buyer.id },
  })
  if (!addr) throw new Error('배송지를 찾을 수 없습니다')

  await prisma.$transaction([
    prisma.address.updateMany({
      where: { buyerId: buyer.id, isDefault: true },
      data: { isDefault: false },
    }),
    prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    }),
  ])

  return { success: true }
}
