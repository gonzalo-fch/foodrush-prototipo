// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  aggregateOrderItems,
  buildMovement,
  buildProduct,
  validateOrderInput,
} from '../domain.js'

describe('aggregateOrderItems', () => {
  it('agrupa las cantidades del mismo producto', () => {
    expect(
      aggregateOrderItems([
        { productId: 'cp-4', quantity: 2 },
        { productId: 'cp-4', quantity: 1 },
        { productId: 'cp-8', quantity: 3 },
      ]),
    ).toEqual([
      { productId: 'cp-4', quantity: 3 },
      { productId: 'cp-8', quantity: 3 },
    ])
  })

  it('rechaza un carrito vacío', () => {
    expect(() => aggregateOrderItems([])).toThrow('carrito está vacío')
  })

  it('rechaza cantidades menores o iguales a cero', () => {
    expect(() =>
      aggregateOrderItems([{ productId: 'cp-4', quantity: 0 }]),
    ).toThrow('enteros mayores que cero')
  })

  it('rechaza cantidades no enteras', () => {
    expect(() =>
      aggregateOrderItems([{ productId: 'cp-4', quantity: 1.5 }]),
    ).toThrow('enteros mayores que cero')
  })
})

describe('buildProduct', () => {
  const validInput = {
    storeId: 'casino-los-notros',
    name: '  Producto de prueba  ',
    price: 1500,
    stock: 4,
  }

  it('crea un producto válido y normaliza sus campos', () => {
    const product = buildProduct(validInput)
    expect(product.id).toMatch(/^cp-/)
    expect(product.name).toBe('Producto de prueba')
    expect(product.price).toBe(1500)
    expect(product.stock).toBe(4)
    expect(product.visible).toBe(true)
  })

  it('rechaza un precio inválido', () => {
    expect(() => buildProduct({ ...validInput, price: 0 })).toThrow('precio válido')
  })

  it('rechaza un stock negativo', () => {
    expect(() => buildProduct({ ...validInput, stock: -1 })).toThrow('cantidad válida')
  })

  it('rechaza un nombre vacío', () => {
    expect(() => buildProduct({ ...validInput, name: '   ' })).toThrow('nombre del producto')
  })
})

describe('buildMovement', () => {
  it('genera un movimiento ligado a un pedido', () => {
    const movement = buildMovement(
      { id: 'cp-4', name: 'Ensalada César', storeId: 'casino-los-notros' },
      'venta',
      -2,
      'Descuento por venta',
      '1043',
    )

    expect(movement.id).toMatch(/^mv-/)
    expect(movement.type).toBe('venta')
    expect(movement.quantity).toBe(-2)
    expect(movement.orderId).toBe('1043')
    expect(movement.date).toBeTruthy()
    expect(movement.createdAt).toBeTruthy()
  })
})

describe('validateOrderInput', () => {
  it('acepta una compra con cliente, comercio y pago', () => {
    expect(() =>
      validateOrderInput({
        customer: 'Ana Pérez',
        storeId: 'casino-los-notros',
        paymentMethod: 'Efectivo',
      }),
    ).not.toThrow()
  })

  it('rechaza una compra sin método de pago', () => {
    expect(() =>
      validateOrderInput({
        customer: 'Ana Pérez',
        storeId: 'casino-los-notros',
      }),
    ).toThrow('método de pago')
  })
})
