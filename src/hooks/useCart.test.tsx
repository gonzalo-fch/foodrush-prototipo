import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../lib/api'
import { AppStoreProvider } from '../store/AppStore'
import { ClientStoreProvider } from '../store/ClientStore'
import { useCart } from './useCart'

vi.mock('../lib/api', () => ({
  api: {
    bootstrap: vi.fn(),
    loginClient: vi.fn(),
    registerClient: vi.fn(),
    loginCommerce: vi.fn(),
    getCommerces: vi.fn(),
    updateCommerce: vi.fn(),
    changeCommercePassword: vi.fn(),
    getCart: vi.fn(),
    setCartItem: vi.fn(),
    removeCartItem: vi.fn(),
    clearCart: vi.fn(),
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

const products = [
  {
    id: 'cp-4',
    storeId: 'casino-los-notros',
    name: 'Ensalada César',
    price: 3500,
    image: '/products/cart-ensalada.png',
    visible: true,
    stock: 12,
    reserved: 2,
    available: 10,
  },
  {
    id: 'cp-8',
    storeId: 'casino-los-notros',
    name: 'Café',
    price: 1200,
    image: '/products/cafe-clean.png',
    visible: true,
    stock: 15,
    reserved: 0,
    available: 15,
  },
]

function CartProbe() {
  const { subtotal, count } = useCart()

  return (
    <>
      <output data-testid="subtotal">{subtotal}</output>
      <output data-testid="count">{count}</output>
    </>
  )
}

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem(
    'foodrush-client-v3',
    JSON.stringify({
      currentUser: {
        id: 'u-01',
        name: 'Isabella Rodriguez',
        email: 'isabella@universidad.cl',
        role: 'cliente',
      },
    }),
  )
  vi.mocked(api.bootstrap).mockResolvedValue({
    products,
    orders: [],
    movements: [],
  })
  vi.mocked(api.getCart).mockResolvedValue({
    products,
    cart: [{ productId: 'cp-4', quantity: 2 }],
  })
})

describe('useCart', () => {
  it('calcula subtotal y cantidad con los productos del comercio', async () => {
    render(
      <AppStoreProvider>
        <ClientStoreProvider>
          <CartProbe />
        </ClientStoreProvider>
      </AppStoreProvider>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('subtotal')).toHaveTextContent('7000'),
    )
    expect(screen.getByTestId('count')).toHaveTextContent('2')
  })
})
