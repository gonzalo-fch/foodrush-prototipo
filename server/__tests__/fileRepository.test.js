// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFileRepository } from '../fileRepository.js'

let directory
let dataFile
let repository

const baseOrder = {
  customer: 'Cliente de prueba',
  customerId: 'u-01',
  store: 'Casino Los Notros',
  storeId: 'casino-los-notros',
  paymentMethod: 'Efectivo',
}

beforeEach(() => {
  directory = mkdtempSync(path.join(tmpdir(), 'foodrush-test-'))
  dataFile = path.join(directory, 'state.json')
  repository = createFileRepository({ dataFile })
})

afterEach(() => {
  rmSync(directory, { recursive: true, force: true })
})

describe('FileRepository · datos iniciales', () => {
  it('inicializa productos, pedidos y movimientos del seed', async () => {
    const state = await repository.bootstrap()
    expect(state.products.length).toBeGreaterThan(0)
    expect(state.orders.length).toBeGreaterThan(0)
    expect(state.movements.length).toBeGreaterThan(0)
  })
})

describe('FileRepository · compra ficticia', () => {
  it('crea un pedido único, descuenta stock y registra el movimiento', async () => {
    const before = await repository.bootstrap()
    const product = before.products.find((entry) => entry.id === 'cp-4')

    const result = await repository.createOrder({
      ...baseOrder,
      items: [{ productId: 'cp-4', quantity: 2 }],
    })

    const updated = result.products.find((entry) => entry.id === 'cp-4')
    expect(result.order.id).toBeTruthy()
    expect(result.order.items[0].price).toBe(product.price)
    expect(result.order.total).toBe(product.price * 2)
    expect(updated.stock).toBe(product.stock - 2)
    expect(
      result.movements.some(
        (movement) =>
          movement.orderId === result.order.id &&
          movement.type === 'venta' &&
          movement.quantity === -2,
      ),
    ).toBe(true)
  })

  it('rechaza una cantidad mayor al stock sin modificarlo', async () => {
    const before = await repository.bootstrap()
    const product = before.products.find((entry) => entry.id === 'cp-4')

    await expect(
      repository.createOrder({
        ...baseOrder,
        items: [{ productId: 'cp-4', quantity: product.stock + 1 }],
      }),
    ).rejects.toThrow('Stock insuficiente')

    const after = await repository.bootstrap()
    expect(after.products.find((entry) => entry.id === 'cp-4').stock).toBe(
      product.stock,
    )
  })

  it('rechaza un producto agotado', async () => {
    await expect(
      repository.createOrder({
        ...baseOrder,
        items: [{ productId: 'cp-2', quantity: 1 }],
      }),
    ).rejects.toThrow('Stock insuficiente')
  })

  it('rechaza un producto de otro comercio', async () => {
    await expect(
      repository.createOrder({
        ...baseOrder,
        items: [{ productId: 'imp-coca', quantity: 1 }],
      }),
    ).rejects.toThrow('Producto no encontrado')
  })

  it('conserva el precio histórico aunque cambie el catálogo', async () => {
    const result = await repository.createOrder({
      ...baseOrder,
      items: [{ productId: 'cp-4', quantity: 1 }],
    })
    const originalPrice = result.order.items[0].price

    await repository.updateProduct('cp-4', { price: 9999 })

    const after = await repository.bootstrap()
    const order = after.orders.find((entry) => entry.id === result.order.id)
    expect(order.items[0].price).toBe(originalPrice)
  })

  it('cancela un pedido y repone el stock', async () => {
    const before = await repository.bootstrap()
    const product = before.products.find((entry) => entry.id === 'cp-4')

    const result = await repository.createOrder({
      ...baseOrder,
      items: [{ productId: 'cp-4', quantity: 3 }],
    })
    const cancelled = await repository.cancelOrder(result.order.id)

    expect(cancelled.order.status).toBe('cancelado')
    expect(cancelled.products.find((entry) => entry.id === 'cp-4').stock).toBe(
      product.stock,
    )
  })

  it('marca un pedido como entregado', async () => {
    const result = await repository.createOrder({
      ...baseOrder,
      items: [{ productId: 'cp-4', quantity: 1 }],
    })

    const completed = await repository.completeOrder(result.order.id)
    expect(completed.order.status).toBe('retirado')
  })
})

describe('FileRepository · productos e inventario', () => {
  it('agrega un producto y registra su stock inicial', async () => {
    const result = await repository.addProduct({
      storeId: 'casino-los-notros',
      name: 'Producto nuevo',
      price: 1200,
      stock: 5,
      category: 'Bebidas',
    })

    expect(result.product.id).toMatch(/^cp-/)
    expect(result.products.some((entry) => entry.id === result.product.id)).toBe(true)
    expect(
      result.movements.some(
        (movement) =>
          movement.productId === result.product.id &&
          movement.type === 'reposicion' &&
          movement.quantity === 5,
      ),
    ).toBe(true)
  })

  it('actualiza un producto y registra el ajuste de stock', async () => {
    const result = await repository.updateProduct('cp-4', {
      name: 'Ensalada actualizada',
      price: 4000,
      stock: 10,
    })

    expect(result.product.name).toBe('Ensalada actualizada')
    expect(result.product.price).toBe(4000)
    expect(result.product.stock).toBe(10)
  })

  it('nunca deja stock negativo', async () => {
    const result = await repository.adjustStock('cp-4', -999)
    expect(result.products.find((entry) => entry.id === 'cp-4').stock).toBe(0)
  })

  it('permite ocultar y eliminar un producto', async () => {
    const hidden = await repository.setVisibility('cp-4', false)
    expect(hidden.product.visible).toBe(false)

    const deleted = await repository.deleteProduct('cp-4')
    expect(deleted.products.some((entry) => entry.id === 'cp-4')).toBe(false)
  })

  it('persiste los cambios al recrear el repositorio', async () => {
    const created = await repository.addProduct({
      storeId: 'casino-los-notros',
      name: 'Persistente',
      price: 500,
      stock: 2,
    })

    const reloaded = createFileRepository({ dataFile })
    const state = await reloaded.bootstrap()
    expect(state.products.some((entry) => entry.id === created.product.id)).toBe(true)
  })
})
