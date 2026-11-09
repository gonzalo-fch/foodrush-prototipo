import { describe, expect, it } from 'vitest'
import type { Order, OrderStatus } from '../types'
import { ordersInRange } from './orders'

function makeOrder(
  id: string,
  status: OrderStatus,
  createdAt: string,
  total: number,
): Order {
  return {
    id,
    customer: 'Cliente',
    store: 'Casino Los Notros',
    storeId: 'casino-los-notros',
    date: '9 de noviembre de 2026',
    createdAt,
    status,
    items: [],
    total,
    paymentMethod: 'Efectivo',
  }
}

const orders = [
  makeOrder('entregado', 'retirado', '2026-11-09T10:00:00.000Z', 1000),
  makeOrder('cancelado', 'cancelado', '2026-11-09T11:00:00.000Z', 500),
  makeOrder('pendiente', 'pendiente', '2026-11-09T12:00:00.000Z', 300),
  makeOrder('antiguo', 'retirado', '2026-11-01T10:00:00.000Z', 700),
]

describe('ordersInRange', () => {
  it('separa ventas entregadas de devoluciones', () => {
    const start = new Date('2026-11-09T00:00:00.000Z')
    const end = new Date('2026-11-09T23:59:59.999Z')

    expect(
      ordersInRange(orders, start, end, 'retirado').map((order) => order.id),
    ).toEqual(['entregado'])
    expect(
      ordersInRange(orders, start, end, 'cancelado').map((order) => order.id),
    ).toEqual(['cancelado'])
    expect(
      ordersInRange(orders, start, end, 'pendiente').map((order) => order.id),
    ).toEqual(['pendiente'])
  })

  it('respeta el rango de fechas', () => {
    const start = new Date('2026-11-09T00:00:00.000Z')
    const end = new Date('2026-11-09T23:59:59.999Z')

    expect(ordersInRange(orders, start, end).map((order) => order.id)).toEqual([
      'entregado',
      'cancelado',
      'pendiente',
    ])
  })
})
