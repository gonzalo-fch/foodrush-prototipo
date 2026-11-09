import { stores, users } from '../src/data/seed.ts'
import { seedMovements, seedOrders, seedProducts } from '../src/store/seed.ts'

const seededAt = Date.now()

export function createSeedState() {
  const reservedByProduct = new Map()

  const reservations = seedOrders
    .filter((order) => order.status === 'pendiente')
    .flatMap((order) =>
      order.items.map((item) => {
        const quantity = item.quantity
        reservedByProduct.set(
          item.productId,
          (reservedByProduct.get(item.productId) ?? 0) + quantity,
        )

        return {
          id: `order_${order.id}_${item.productId}`,
          storeId: order.storeId,
          productId: item.productId,
          customerId: order.customerId ?? 'anon',
          quantity,
          orderId: order.id,
          status: 'order',
          createdAt: order.createdAt ?? new Date().toISOString(),
          updatedAt: order.createdAt ?? new Date().toISOString(),
        }
      }),
    )

  const products = seedProducts.map((product, index) => ({
    ...product,
    reserved: reservedByProduct.get(product.id) ?? 0,
    sortIndex: index,
  }))

  for (const product of products) {
    if ((product.reserved ?? 0) > product.stock) {
      throw new Error(
        `Seed inconsistente: ${product.name} tiene ${product.reserved} reservados y solo ${product.stock} de stock.`,
      )
    }
  }

  const movements = seedMovements.map((movement, index) => ({
    ...movement,
    createdAt: new Date(seededAt - index * 60_000).toISOString(),
  }))

  return {
    stores,
    users,
    products,
    orders: seedOrders,
    movements,
    reservations,
    orderCounter: Math.max(...seedOrders.map((order) => Number(order.id) || 0), 1000),
  }
}
