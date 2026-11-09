import type { Order } from '../types'

export function ordersInRange(
  orders: Order[],
  start: Date,
  end: Date,
  status?: Order['status'],
) {
  return orders.filter((order) => {
    if (status && order.status !== status) return false
    if (!order.createdAt) return false
    const created = new Date(order.createdAt)
    return created >= start && created <= end
  })
}
