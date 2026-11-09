import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ClientStoreProvider, useClientStore } from './ClientStore'

function CartProbe() {
  const { cart, cartCount, addToCart, setCartQuantity, clearCart } =
    useClientStore()
  const quantity = cart.find((line) => line.productId === 'cp-4')?.quantity ?? 0

  return (
    <>
      <output data-testid="count">{cartCount}</output>
      <output data-testid="quantity">{quantity}</output>
      <button type="button" onClick={() => clearCart()}>
        vaciar
      </button>
      <button type="button" onClick={() => addToCart('cp-4', 2)}>
        agregar dos
      </button>
      <button type="button" onClick={() => addToCart('cp-4', 1)}>
        agregar uno
      </button>
      <button type="button" onClick={() => setCartQuantity('cp-4', 0)}>
        eliminar
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
      <button type="button" onClick={() => logout()}>
        salir
      </button>
    </>
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('ClientStore · carrito', () => {
  it('agrega, acumula cantidades y elimina productos', async () => {
    const user = userEvent.setup()
    render(
      <ClientStoreProvider>
        <CartProbe />
      </ClientStoreProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'vaciar' }))
    expect(screen.getByTestId('count')).toHaveTextContent('0')

    await user.click(screen.getByRole('button', { name: 'agregar dos' }))
    expect(screen.getByTestId('quantity')).toHaveTextContent('2')
    expect(screen.getByTestId('count')).toHaveTextContent('2')

    await user.click(screen.getByRole('button', { name: 'agregar uno' }))
    expect(screen.getByTestId('quantity')).toHaveTextContent('3')
    expect(screen.getByTestId('count')).toHaveTextContent('3')

    await user.click(screen.getByRole('button', { name: 'eliminar' }))
    expect(screen.getByTestId('quantity')).toHaveTextContent('0')
  })
})

describe('ClientStore · sesión', () => {
  it('inicia y cierra sesión con un usuario simulado', async () => {
    const user = userEvent.setup()
    render(
      <ClientStoreProvider>
        <AuthProbe />
      </ClientStoreProvider>,
    )

    expect(screen.getByTestId('user')).toHaveTextContent('sin sesión')

    await user.click(screen.getByRole('button', { name: 'entrar' }))
    expect(screen.getByTestId('user')).toHaveTextContent('Isabella Rodriguez')

    await user.click(screen.getByRole('button', { name: 'salir' }))
    expect(screen.getByTestId('user')).toHaveTextContent('sin sesión')
  })
})
