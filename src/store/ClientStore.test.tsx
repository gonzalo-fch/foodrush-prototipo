import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../lib/api'
import { AppStoreProvider } from './AppStore'
import { ClientStoreProvider, useClientStore } from './ClientStore'

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

const product = {
  id: 'cp-4',
  storeId: 'casino-los-notros',
  name: 'Ensalada César',
  price: 3500,
  image: '/products/cart-ensalada.png',
  visible: true,
  stock: 12,
  reserved: 0,
  available: 12,
}

let serverQuantity = 0

function cartPayload() {
  return {
    products: [
      {
        ...product,
        reserved: serverQuantity,
        available: product.stock - serverQuantity,
      },
    ],
    cart:
      serverQuantity > 0
        ? [{ productId: product.id, quantity: serverQuantity }]
        : [],
  }
}

function CartProbe() {
  const { cart, cartCount, addToCart, setCartQuantity, clearCart } =
    useClientStore()
  const quantity = cart.find((line) => line.productId === 'cp-4')?.quantity ?? 0

  return (
    <>
      <output data-testid="count">{cartCount}</output>
      <output data-testid="quantity">{quantity}</output>
      <button type="button" onClick={() => void addToCart('cp-4', 2)}>
        agregar dos
      </button>
      <button type="button" onClick={() => void addToCart('cp-4', 1)}>
        agregar uno
      </button>
      <button type="button" onClick={() => void setCartQuantity('cp-4', 0)}>
        eliminar
      </button>
      <button type="button" onClick={() => void clearCart()}>
        vaciar
      </button>
    </>
  )
}

function AuthProbe() {
  const { currentUser, login, logout } = useClientStore()

  return (
    <>
      <output data-testid="user">{currentUser?.name ?? 'sin sesión'}</output>
      <button
        type="button"
        onClick={() => login('isabella@universidad.cl', '123456')}
      >
        entrar
      </button>
      <button type="button" onClick={() => void logout()}>
        salir
      </button>
    </>
  )
}

function renderWithProviders(children: ReactNode) {
  return render(
    <AppStoreProvider>
      <ClientStoreProvider>{children}</ClientStoreProvider>
    </AppStoreProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  serverQuantity = 0
  vi.mocked(api.bootstrap).mockResolvedValue({
    products: [product],
    orders: [],
    movements: [],
  })
  vi.mocked(api.loginClient).mockResolvedValue({
    id: 'u-01',
    name: 'Isabella Rodriguez',
    email: 'isabella@universidad.cl',
    role: 'cliente',
  })
  vi.mocked(api.getCart).mockImplementation(async () => cartPayload())
  vi.mocked(api.setCartItem).mockImplementation(async (input) => {
    serverQuantity =
      input.mode === 'add' ? serverQuantity + input.quantity : input.quantity
    return cartPayload()
  })
  vi.mocked(api.removeCartItem).mockImplementation(async () => {
    serverQuantity = 0
    return cartPayload()
  })
  vi.mocked(api.clearCart).mockImplementation(async () => {
    serverQuantity = 0
    return cartPayload()
  })
})

describe('ClientStore · carrito', () => {
  it('reserva, acumula y elimina cantidades', async () => {
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
    const user = userEvent.setup()
    renderWithProviders(<CartProbe />)

    await user.click(screen.getByRole('button', { name: 'agregar dos' }))
    await waitFor(() =>
      expect(screen.getByTestId('quantity')).toHaveTextContent('2'),
    )

    await user.click(screen.getByRole('button', { name: 'agregar uno' }))
    await waitFor(() =>
      expect(screen.getByTestId('quantity')).toHaveTextContent('3'),
    )
    expect(screen.getByTestId('count')).toHaveTextContent('3')

    await user.click(screen.getByRole('button', { name: 'eliminar' }))
    await waitFor(() =>
      expect(screen.getByTestId('quantity')).toHaveTextContent('0'),
    )
  })
})

describe('ClientStore · sesión', () => {
  it('inicia y cierra sesión con un usuario simulado', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AuthProbe />)

    expect(screen.getByTestId('user')).toHaveTextContent('sin sesión')

    await user.click(screen.getByRole('button', { name: 'entrar' }))
    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('Isabella Rodriguez'),
    )

    await user.click(screen.getByRole('button', { name: 'salir' }))
    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('sin sesión'),
    )
  })
})
