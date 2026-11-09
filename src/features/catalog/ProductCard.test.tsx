import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Product } from '../../types'
import { ProductCard } from './ProductCard'

const product: Product = {
  id: 'cp-4',
  name: 'Ensalada César',
  unit: '1 Unidad',
  price: 3500,
  image: '/products/cart-ensalada.png',
  stock: 3,
  category: 'almuerzos',
}

describe('ProductCard', () => {
  it('muestra nombre, unidad y precio formateado', () => {
    render(<ProductCard product={product} onAdd={vi.fn()} />)

    expect(screen.getByText('Ensalada César')).toBeInTheDocument()
    expect(screen.getByText('1 Unidad')).toBeInTheDocument()
    expect(screen.getByText('$3.500')).toBeInTheDocument()
  })

  it('permite agregar un producto con stock', async () => {
    const onAdd = vi.fn()
    const user = userEvent.setup()
    render(<ProductCard product={product} onAdd={onAdd} />)

    await user.click(
      screen.getByRole('button', { name: 'Agregar Ensalada César al carrito' }),
    )

    expect(onAdd).toHaveBeenCalledWith(product)
  })

  it('deshabilita el botón y muestra Agotado sin stock', () => {
    render(<ProductCard product={{ ...product, stock: 0 }} onAdd={vi.fn()} />)

    expect(screen.getByText('Agotado')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Agregar Ensalada César al carrito' }),
    ).toBeDisabled()
  })
})
