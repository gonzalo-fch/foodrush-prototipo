import type { CommerceProduct, InventoryMovement, Order } from '../types'

function p(
  storeId: string,
  id: string,
  name: string,
  price: number,
  image: string,
  stock: number,
  category: string,
  unit: string,
  options: Partial<CommerceProduct> = {},
): CommerceProduct {
  return {
    storeId,
    id,
    name,
    price,
    image,
    visible: true,
    stock,
    category,
    unit,
    ...options,
  }
}

export const seedProducts: CommerceProduct[] = [
  // Casino Los Notros
  p('casino-los-notros', 'cp-7', 'Almuerzo Ejecutivo', 3660, '/products/utensilios-clean.png', 12, 'Almuerzos', '1 Unidad', {
    description: 'Almuerzo del día con entrada, plato principal y bebestible.',
    weight: '1 Unidad',
  }),
  p('casino-los-notros', 'cp-5', 'Monster Energy', 1890, '/products/monster-clean.png', 30, 'Bebidas', 'Lata 473ml', {
    description:
      'Energía que despierta tus sentidos. Monster Energy en lata combina un sabor intenso y refrescante con una potente mezcla energética, ideal para impulsarte en tus jornadas más largas o darle un boost a tu día.',
    weight: '473ml',
  }),
  p('casino-los-notros', 'cp-4', 'Ensalada César', 3500, '/products/cart-ensalada.png', 12, 'Almuerzos', '1 Unidad', {
    description: 'Ensalada fresca con pollo, crutones y aderezo César.',
    weight: '350g',
    sinSellos: true,
  }),
  p('casino-los-notros', 'cp-6', 'Agua Mineral', 690, '/products/agua-clean.png', 40, 'Bebidas', 'Botella 500ml', {
    description: 'Agua mineral sin gas.',
    weight: '500ml',
    sinSellos: true,
  }),
  p('casino-los-notros', 'cp-8', 'Café', 1200, '/products/cafe-clean.png', 15, 'Bebidas', '200ml', {
    description: 'Café caliente de grano seleccionado.',
    weight: '200ml',
    sinSellos: true,
  }),
  p('casino-los-notros', 'cp-2', 'Jumex Piña', 1150, '/products/jumex-clean.png', 0, 'Bebidas', 'Lata 300ml', {
    description: 'Jugo de piña en lata.',
    weight: '300ml',
  }),
  p('casino-los-notros', 'cp-1', 'Croissant de Almendras', 2500, '/products/croissant.png', 24, 'Sándwiches', '1 Unidad', {
    description: 'Croissant artesanal relleno de crema de almendras.',
    weight: '120g',
  }),
  p('casino-los-notros', 'cp-9', 'Sandwich + Coca Cola', 2900, '/products/sandwich-clean.png', 10, 'Sándwiches', '1 Combo', {
    description: 'Sandwich de jamón y queso acompañado de Coca Cola.',
    weight: '1 Combo',
  }),
  p('casino-los-notros', 'cp-3', 'Coca cola', 1800, '/products/coca-cola.png', 36, 'Bebidas', 'Lata 350ml', {
    description: 'Bebida gaseosa sabor original.',
    weight: '350ml',
    visible: false,
  }),

  // Casino de Las Araucarias
  p('casino-araucarias', 'ara-ensalada', 'Ensalada César', 3600, '/products/cart-ensalada.png', 6, 'Almuerzos', '1 Unidad', {
    description: 'Ensalada fresca con pollo, crutones y aderezo César.',
    weight: '350g',
    sinSellos: true,
  }),
  p('casino-araucarias', 'ara-agua', 'Agua Mineral', 700, '/products/agua-clean.png', 25, 'Bebidas', 'Botella 500ml', {
    description: 'Agua mineral sin gas.',
    weight: '500ml',
    sinSellos: true,
  }),
  p('casino-araucarias', 'ara-cafe', 'Café', 1300, '/products/cafe-clean.png', 10, 'Bebidas', '200ml', {
    description: 'Café caliente de grano seleccionado.',
    weight: '200ml',
    sinSellos: true,
  }),
  p('casino-araucarias', 'ara-croissant', 'Croissant de Almendras', 2600, '/products/croissant.png', 15, 'Sándwiches', '1 Unidad', {
    description: 'Croissant artesanal relleno de crema de almendras.',
    weight: '120g',
  }),

  // Imperio - Food Truck
  p('imperio-food-truck', 'imp-croissant', 'Croissant de Almendras', 2700, '/products/croissant.png', 18, 'Sándwiches', '1 Unidad', {
    description: 'Croissant artesanal relleno de crema de almendras.',
    weight: '120g',
  }),
  p('imperio-food-truck', 'imp-sandwich', 'Sandwich + Coca Cola', 3100, '/products/sandwich-clean.png', 12, 'Sándwiches', '1 Combo', {
    description: 'Sandwich de jamón y queso acompañado de Coca Cola.',
    weight: '1 Combo',
  }),
  p('imperio-food-truck', 'imp-coca', 'Coca cola', 1900, '/products/coca-cola.png', 20, 'Bebidas', 'Lata 350ml', {
    description: 'Bebida gaseosa sabor original.',
    weight: '350ml',
  }),
  p('imperio-food-truck', 'imp-cafe', 'Café', 1400, '/products/cafe-clean.png', 8, 'Bebidas', '200ml', {
    description: 'Café caliente de grano seleccionado.',
    weight: '200ml',
  }),

  // Café de la Tía
  p('cafe-de-la-tia', 'tia-cafe', 'Café', 1500, '/products/cafe-clean.png', 20, 'Bebidas', '200ml', {
    description: 'Café caliente de grano seleccionado.',
    weight: '200ml',
    sinSellos: true,
  }),
  p('cafe-de-la-tia', 'tia-croissant', 'Croissant de Almendras', 2800, '/products/croissant.png', 10, 'Sándwiches', '1 Unidad', {
    description: 'Croissant artesanal relleno de crema de almendras.',
    weight: '120g',
  }),
  p('cafe-de-la-tia', 'tia-agua', 'Agua Mineral', 750, '/products/agua-clean.png', 30, 'Bebidas', 'Botella 500ml', {
    description: 'Agua mineral sin gas.',
    weight: '500ml',
    sinSellos: true,
  }),

  // Kiosko Edificio D
  p('kiosko-edificio-d', 'kio-monster', 'Monster Energy', 2000, '/products/monster-clean.png', 14, 'Bebidas', 'Lata 473ml', {
    description: 'Bebida energética en lata.',
    weight: '473ml',
  }),
  p('kiosko-edificio-d', 'kio-agua', 'Agua Mineral', 800, '/products/agua-clean.png', 35, 'Bebidas', 'Botella 500ml', {
    description: 'Agua mineral sin gas.',
    weight: '500ml',
    sinSellos: true,
  }),
  p('kiosko-edificio-d', 'kio-jumex', 'Jumex Piña', 1250, '/products/jumex-clean.png', 8, 'Bebidas', 'Lata 300ml', {
    description: 'Jugo de piña en lata.',
    weight: '300ml',
  }),
  p('kiosko-edificio-d', 'kio-coca', 'Coca cola', 1900, '/products/coca-cola.png', 22, 'Bebidas', 'Lata 350ml', {
    description: 'Bebida gaseosa sabor original.',
    weight: '350ml',
  }),
]

function daysAgo(days: number, hour: number, minute = 15) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, minute, 0, 0)
  return date
}

function displayDate(date: Date) {
  return date.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const orderDates = {
  o1042: daysAgo(0, 14, 20),
  o1039: daysAgo(0, 10, 10),
  o1035: daysAgo(1, 18, 40),
  o1030: daysAgo(3, 12, 30),
  o1027: daysAgo(6, 16, 0),
}

export const seedOrders: Order[] = [
  {
    id: '1042',
    customer: 'Isabella Rodriguez',
    customerId: 'u-01',
    store: 'Casino Los Notros',
    storeId: 'casino-los-notros',
    date: displayDate(orderDates.o1042),
    createdAt: orderDates.o1042.toISOString(),
    status: 'pendiente',
    paymentMethod: 'Tarjeta de Crédito',
    total: 4650,
    items: [
      {
        productId: 'cp-4',
        name: 'Ensalada César',
        price: 3500,
        quantity: 1,
        image: '/products/cart-ensalada.png',
      },
      {
        productId: 'cp-2',
        name: 'Jumex Piña',
        price: 1150,
        quantity: 1,
        image: '/products/cart-jumex.png',
      },
    ],
  },
  {
    id: '1039',
    customer: 'Ana Pérez',
    customerId: 'u-02',
    store: 'Casino Los Notros',
    storeId: 'casino-los-notros',
    date: displayDate(orderDates.o1039),
    createdAt: orderDates.o1039.toISOString(),
    status: 'pendiente',
    paymentMethod: 'Efectivo',
    total: 3700,
    items: [
      {
        productId: 'cp-1',
        name: 'Croissant de Almendras',
        price: 2500,
        quantity: 1,
        image: '/products/croissant.png',
      },
      {
        productId: 'cp-6',
        name: 'Agua Mineral',
        price: 690,
        quantity: 1,
        image: '/products/fav-agua.png',
      },
    ],
  },
  {
    id: '1035',
    customer: 'Juan Gómez',
    customerId: 'u-03',
    store: 'Casino Los Notros',
    storeId: 'casino-los-notros',
    date: displayDate(orderDates.o1035),
    createdAt: orderDates.o1035.toISOString(),
    status: 'retirado',
    paymentMethod: 'Tarjeta de Débito',
    total: 3780,
    items: [
      {
        productId: 'cp-5',
        name: 'Monster Energy',
        price: 1890,
        quantity: 2,
        image: '/products/monster.png',
      },
    ],
  },
  {
    id: '1030',
    customer: 'Camila Soto',
    customerId: 'u-04',
    store: 'Casino Los Notros',
    storeId: 'casino-los-notros',
    date: displayDate(orderDates.o1030),
    createdAt: orderDates.o1030.toISOString(),
    status: 'cancelado',
    paymentMethod: 'Efectivo',
    total: 1800,
    items: [
      {
        productId: 'cp-3',
        name: 'Coca cola',
        price: 1800,
        quantity: 1,
        image: '/products/coca-cola.png',
      },
    ],
  },
  {
    id: '1027',
    customer: 'Martín Díaz',
    customerId: 'u-05',
    store: 'Casino Los Notros',
    storeId: 'casino-los-notros',
    date: displayDate(orderDates.o1027),
    createdAt: orderDates.o1027.toISOString(),
    status: 'retirado',
    paymentMethod: 'Tarjeta de Crédito',
    total: 4880,
    items: [
      {
        productId: 'cp-6',
        name: 'Agua Mineral',
        price: 690,
        quantity: 2,
        image: '/products/fav-agua.png',
      },
      {
        productId: 'cp-4',
        name: 'Ensalada César',
        price: 3500,
        quantity: 1,
        image: '/products/cart-ensalada.png',
      },
    ],
  },
]

export const seedMovements: InventoryMovement[] = [
  {
    id: 'mv-1',
    storeId: 'casino-los-notros',
    productId: 'cp-4',
    productName: 'Ensalada César',
    type: 'venta',
    quantity: -1,
    orderId: '1042',
    date: `${displayDate(orderDates.o1042)} · 13:20`,
    note: 'Descuento por venta',
  },
  {
    id: 'mv-2',
    storeId: 'casino-los-notros',
    productId: 'cp-2',
    productName: 'Jumex Piña',
    type: 'venta',
    quantity: -1,
    orderId: '1042',
    date: `${displayDate(orderDates.o1042)} · 13:20`,
    note: 'Descuento por venta',
  },
  {
    id: 'mv-3',
    storeId: 'casino-los-notros',
    productId: 'cp-1',
    productName: 'Croissant de Almendras',
    type: 'venta',
    quantity: -1,
    orderId: '1039',
    date: `${displayDate(orderDates.o1039)} · 12:05`,
    note: 'Descuento por venta',
  },
  {
    id: 'mv-4',
    storeId: 'casino-los-notros',
    productId: 'cp-1',
    productName: 'Croissant de Almendras',
    type: 'reposicion',
    quantity: 12,
    date: `${displayDate(orderDates.o1042)} · 09:00`,
    note: 'Reposición de stock',
  },
  {
    id: 'mv-5',
    storeId: 'casino-los-notros',
    productId: 'cp-5',
    productName: 'Monster Energy',
    type: 'venta',
    quantity: -2,
    orderId: '1035',
    date: `${displayDate(orderDates.o1035)} · 18:40`,
    note: 'Descuento por venta',
  },
  {
    id: 'mv-6',
    storeId: 'casino-los-notros',
    productId: 'cp-2',
    productName: 'Jumex Piña',
    type: 'ajuste',
    quantity: -4,
    date: `${displayDate(orderDates.o1035)} · 17:10`,
    note: 'Ajuste por merma',
  },
  {
    id: 'mv-7',
    storeId: 'casino-los-notros',
    productId: 'cp-3',
    productName: 'Coca cola',
    type: 'venta',
    quantity: -1,
    orderId: '1030',
    date: `${displayDate(orderDates.o1030)} · 15:30`,
    note: 'Descuento por venta',
  },
  {
    id: 'mv-8',
    storeId: 'casino-los-notros',
    productId: 'cp-3',
    productName: 'Coca cola',
    type: 'reposicion',
    quantity: 20,
    date: `${displayDate(orderDates.o1030)} · 11:00`,
    note: 'Reposición de stock',
  },
]
