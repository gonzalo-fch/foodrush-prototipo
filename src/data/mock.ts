export type NotificationItem = {
  id: string
  title: string
  body: string
  time: string
  icon: 'tag' | 'bag' | 'card' | 'coffee'
  unread?: boolean
}

export const newNotifications: NotificationItem[] = [
  {
    id: 'n-1',
    title: '¡Oferta del Día!',
    body: 'Aprovecha el 2x1 en todos los cafés.',
    time: 'Hace 5 min',
    icon: 'tag',
    unread: true,
  },
  {
    id: 'n-2',
    title: 'Compra Confirmada',
    body: 'Tu compra #1234 fue realizada correctamente',
    time: 'Hace 20 min',
    icon: 'bag',
    unread: true,
  },
]

export const previousNotifications: NotificationItem[] = [
  {
    id: 'n-3',
    title: 'Pago en Efectivo Exitoso',
    body: 'Tu pago de $2.366 fue procesado.',
    time: 'Ayer 15:28',
    icon: 'card',
  },
  {
    id: 'n-4',
    title: '¡Nuevo Producto!',
    body: 'Prueba nuestro nuevo Frappuccino en Casino Los Notros.',
    time: '25 Mayo',
    icon: 'coffee',
  },
]
