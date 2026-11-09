import { useAppStore } from '../store/AppStore'
import { useClientStore } from '../store/ClientStore'
import type { CommerceProduct } from '../types'

export type CartEntry = {
  product: CommerceProduct
  quantity: number
}

export function useCart() {
  const { cart, selectedStore } = useClientStore()
  const { products } = useAppStore()

  const items: CartEntry[] = cart
    .map((line) => {
      const product = products.find(
        (entry) => entry.id === line.productId && entry.storeId === selectedStore.id,
      )
      return product ? { product, quantity: line.quantity } : null
    })
    .filter((entry): entry is CartEntry => Boolean(entry))

  const subtotal = items.reduce(
    (sum, entry) => sum + entry.product.price * entry.quantity,
    0,
  )
  const count = items.reduce((sum, entry) => sum + entry.quantity, 0)

  return { items, subtotal, count, selectedStore }
}
