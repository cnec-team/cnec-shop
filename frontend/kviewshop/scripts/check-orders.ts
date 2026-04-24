import { prisma } from '../src/lib/db';
async function main() {
  const orders = await prisma.order.findMany({ select: { id: true, status: true, createdAt: true, orderNumber: true, totalAmount: true } });
  console.log('Total orders:', orders.length);
  const byStatus: Record<string,number> = {};
  for (const o of orders) { byStatus[o.status] = (byStatus[o.status]||0)+1; }
  console.log('By status:', JSON.stringify(byStatus));
  if (orders.length > 0) {
    const sorted = orders.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
    console.log('Most recent:', sorted[0].createdAt.toISOString(), sorted[0].orderNumber, sorted[0].status);
    console.log('Oldest:', sorted[sorted.length-1].createdAt.toISOString());
  }
  const items = await prisma.orderItem.count();
  console.log('Total order items:', items);
  const conv = await prisma.conversion.count();
  console.log('Total conversions:', conv);
  await prisma.$disconnect();
}
main();
