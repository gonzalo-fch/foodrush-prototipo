import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ToastProvider'
import { useCart } from './useCart'
import { useAppStore } from '../store/AppStore'
import { useClientStore } from '../store/ClientStore'
import { useCommerceStore } from '../store/CommerceStore'

export function useCheckout() {
  const navigate = useNavigate()
  const { currentUser, selectedStore, clearCart } = useClientStore()
  const { items } = useCart()
  const { createOrder } = useAppStore()
  const { getStoreSettings } = useCommerceStore()
  const { showToast } = useToast()
  const { open } = getStoreSettings(selectedStore.id)

  return async (paymentMethod: string) => {
    if (!currentUser) {
      showToast('Debes iniciar sesión para comprar', 'error')
      navigate('/login')
      return
    }

    if (!open) {
      showToast('El comercio está cerrado en este momento', 'error')
      return
    }

    if (items.length === 0) {
      showToast('Tu carrito está vacío', 'error')
      navigate('/catalogo')
      return
    }

    try {
      const order = await createOrder({
        customer: currentUser.name,
        customerId: currentUser.id,
        store: selectedStore.name,
        storeId: selectedStore.id,
        paymentMethod,
        items: items.map(({ product, quantity }) => ({
          productId: product.id,
          quantity,
        })),
      })

      clearCart()
      showToast('Compra realizada correctamente')
      navigate(`/qr/${order.id}`)
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'No se pudo completar la compra',
        'error',
      )
    }
  }
}
