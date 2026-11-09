import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Order } from '../types'
import { api } from '../lib/api'
import { AppStoreProvider, useAppStore } from './AppStore'

vi.mock('../lib/api', () => ({
  api: {
    bootstrap: vi.fn(),
    createOrder: vi.fn(),
    addProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    setVisibility: vi.fn(),
    adjustStock: vi.fn(),
    completeOrder: vi.fn(),
    cancelOrder: vi.fn(),
  },
}))

const product = {
  id: 'cp-4',
  storeId: 'casino-los-notros',
  name: 'Ensalada César',
  price: 3500,
  image: '/products/cart-ensalada.png',
  visible: true,
  stock: 12,
  category: 'Almuerzos',
}

const order: Order = {
  id: '1043',
  customer: 'Isabella Rodriguez',
  customerId: 'u-01',
  store: 'Casino Los Notros',
  storeId: 'casino-los-notros',
  date: '9 de noviembre de 2026',
  createdAt: '2026-11-09T10:00:00.000Z',
  status: 'pendiente',
  items: [
    {
      productId: 'cp-4',
      name: 'Ensalada César',
      price: 3500,
      quantity: 1,
      image: '/products/cart-ensalada.png',
    },
  ],
  total: 3500,
  paymentMethod: 'Efectivo',
}

function Probe() {
  const { products, orders, createOrder } = useAppStore()

  return (
    <>
      <output data-testid="products">{products.length}</output>
      <output data-testid="orders">{orders.length}</output>
      <button
        type="button"
        onClick={() => {
          void createOrder({
            customer: 'Isabella Rodriguez',
            customerId: 'u-01',
            store: 'Casino Los Notros',
            storeId: 'casino-los-notros',
            paymentMethod: 'Efectivo',
            items: [{ productId: 'cp-4', quantity: 1 }],
          })
        }}
      >
        comprar
      </button>
    </>
  )
}

beforeEach(() => {
  vi.mocked(api.bootstrap).mockResolvedValue({
    products: [product],
    orders: [],
    movements: [],
  })
  vi.mocked(api.createOrder).mockResolvedValue({
    products: [{ ...product, stock: 11 }],
    orders: [order],
    movements: [],
    order,
  })
})

describe('AppStore', () => {
  it('carga productos desde la API', async () => {
    render(
      <AppStoreProvider>
        <Probe />
      </AppStoreProvider>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('products')).toHaveTextContent('1'),
    )
    expect(api.bootstrap).toHaveBeenCalled()
  })

  it('registra una compra a través de la API y actualiza el estado', async () => {
    const user = userEvent.setup()
    render(
      <AppStoreProvider>
        <Probe />
      </AppStoreProvider>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('products')).toHaveTextContent('1'),
    )
    await user.click(screen.getByRole('button', { name: 'comprar' }))

    await waitFor(() =>
      expect(screen.getByTestId('orders')).toHaveTextContent('1'),
    )
    expect(api.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: 'casino-los-notros',
        items: [{ productId: 'cp-4', quantity: 1 }],
      }),
    )
  })
})
