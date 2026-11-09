import { stores, users } from '../src/data/seed.ts'
import { seedMovements, seedOrders, seedProducts } from '../src/store/seed.ts'

const seededAt = Date.now()

export function createSeedState() {
  const products = seedProducts.map((product, index) => ({
    ...product,
    sortIndex: index,
  }))

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
    orderCounter: Math.max(...seedOrders.map((order) => Number(order.id) || 0), 1000),
  }
}
