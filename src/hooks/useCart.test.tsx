import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ClientStoreProvider, useClientStore } from '../store/ClientStore'
import { AppStoreProvider, useAppStore } from '../store/AppStore'
import { api } from '../lib/api'
import { useCart } from './useCart'

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

const products = [
  {
    id: 'cp-4',
    storeId: 'casino-los-notros',
    name: 'Ensalada César',
    price: 3500,
    image: '/products/cart-ensalada.png',
    visible: true,
    stock: 12,
  },
  {
    id: 'cp-8',
    storeId: 'casino-los-notros',
    name: 'Café',
    price: 1200,
    image: '/products/cafe-clean.png',
    visible: true,
    stock: 15,
  },
]

function CartProbe() {
  const { products: catalog } = useAppStore()
  const { clearCart, addToCart } = useClientStore()
  const { subtotal, count } = useCart()

  return (
    <>
      <output data-testid="products">{catalog.length}</output>
      <output data-testid="subtotal">{subtotal}</output>
      <output data-testid="count">{count}</output>
      <button type="button" onClick={() => clearCart()}>
        vaciar
      </button>
      <button type="button" onClick={() => addToCart('cp-4', 2)}>
        agregar
      </button>
    </>
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('useCart', () => {
  it('calcula subtotal y cantidad con los productos del comercio', async () => {
    vi.mocked(api.bootstrap).mockResolvedValue({
      products,
      orders: [],
      movements: [],
    })

    const user = userEvent.setup()
    render(
      <AppStoreProvider>
        <ClientStoreProvider>
          <CartProbe />
        </ClientStoreProvider>
      </AppStoreProvider>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('products')).toHaveTextContent('2'),
    )

    await user.click(screen.getByRole('button', { name: 'vaciar' }))
    expect(screen.getByTestId('subtotal')).toHaveTextContent('0')

    await user.click(screen.getByRole('button', { name: 'agregar' }))
    await waitFor(() =>
      expect(screen.getByTestId('subtotal')).toHaveTextContent('7000'),
    )
    expect(screen.getByTestId('count')).toHaveTextContent('2')
  })
})
