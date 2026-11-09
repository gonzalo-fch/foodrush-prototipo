import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '../../components/ToastProvider'
import { api } from '../../lib/api'
import { AppStoreProvider } from '../../store/AppStore'
import { ClientStoreProvider } from '../../store/ClientStore'
import { ClientLogin } from './AuthScreens'

vi.mock('../../lib/api', () => ({
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

beforeEach(() => {
  window.localStorage.clear()
  vi.mocked(api.bootstrap).mockResolvedValue({
    products: [],
    orders: [],
    movements: [],
  })
})

describe('ClientLogin', () => {
  it('muestra un enlace al acceso del comercio', () => {
    render(
      <MemoryRouter>
        <AppStoreProvider>
          <ClientStoreProvider>
            <ToastProvider>
              <ClientLogin />
            </ToastProvider>
          </ClientStoreProvider>
        </AppStoreProvider>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('link', { name: 'Accede a tu panel' }),
    ).toHaveAttribute('href', '/comercio/login')
  })
})
