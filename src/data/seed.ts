import type { Category, Product, Store, User } from '../types'

export const categories: Category[] = [
  { id: 'todo', label: 'Todo' },
  { id: 'sin-sellos', label: 'Sin sellos' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'sandwiches', label: 'Sándwiches' },
  { id: 'bebidas', label: 'Bebidas' },
  { id: 'almuerzos', label: 'Almuerzos' },
]

export const stores: Store[] = [
  {
    id: 'casino-los-notros',
    name: 'Casino Los Notros',
    address: 'Campus Andrés Bello',
  },
  {
    id: 'casino-araucarias',
    name: 'Casino de Las Araucarias',
    address: 'Campus Andrés Bello',
  },
  {
    id: 'imperio-food-truck',
    name: 'Imperio - Food Truck',
    address: 'Uruguay 1552',
  },
  {
    id: 'cafe-de-la-tia',
    name: 'Café de la Tía',
    address: 'Montevideo 810',
  },
  {
    id: 'kiosko-edificio-d',
    name: 'Kiosko Edificio D',
    address: 'Edificio D - Campus Andrés Bello',
  },
]

export const users: User[] = [
  {
    id: 'u-01',
    name: 'Isabella Rodriguez',
    email: 'isabella@universidad.cl',
    password: '123456',
    avatar: '/users/isabella.png',
    role: 'cliente',
  },
  {
    id: 'u-02',
    name: 'Ana Pérez',
    email: 'ana.perez@universidad.cl',
    password: '123456',
    role: 'cliente',
  },
  {
    id: 'u-03',
    name: 'Juan Gómez',
    email: 'juan.gomez@universidad.cl',
    password: '123456',
    role: 'cliente',
  },
  {
    id: 'u-04',
    name: 'Camila Soto',
    email: 'camila.soto@universidad.cl',
    password: '123456',
    role: 'cliente',
  },
  {
    id: 'u-05',
    name: 'Martín Díaz',
    email: 'martin.diaz@universidad.cl',
    password: '123456',
    role: 'cliente',
  },
  {
    id: 'u-06',
    name: 'Administrador Casino Los Notros',
    email: 'admin@casinolosnotros.cl',
    password: '123456',
    role: 'comercio',
    storeId: 'casino-los-notros',
  },
  {
    id: 'u-07',
    name: 'Administrador Casino de Las Araucarias',
    email: 'admin@casinoaraucarias.cl',
    password: '123456',
    role: 'comercio',
    storeId: 'casino-araucarias',
  },
  {
    id: 'u-08',
    name: 'Administrador Imperio Food Truck',
    email: 'admin@imperiofoodtruck.cl',
    password: '123456',
    role: 'comercio',
    storeId: 'imperio-food-truck',
  },
]

export const products: Product[] = [
  {
    id: 'p-01',
    name: 'Almuerzo Ejecutivo',
    unit: '1 Unidad',
    price: 3660,
    image: '/products/utensilios.png',
    stock: 12,
    category: 'almuerzos',
  },
  {
    id: 'p-02',
    name: 'Monster Energy',
    unit: 'Lata 473ml',
    price: 1890,
    image: '/products/monster.png',
    stock: 24,
    category: 'bebidas',
  },
  {
    id: 'p-03',
    name: 'Ensalada César',
    unit: '1 Unidad',
    price: 3500,
    image: '/products/ensalada.png',
    stock: 8,
    category: 'almuerzos',
    sinSellos: true,
  },
  {
    id: 'p-04',
    name: 'Agua Mineral',
    unit: 'Botella 500ml',
    price: 690,
    image: '/products/agua.png',
    stock: 30,
    category: 'bebidas',
    sinSellos: true,
  },
  {
    id: 'p-05',
    name: 'Café',
    unit: '200ml',
    price: 1200,
    image: '/products/cafe.png',
    stock: 15,
    category: 'bebidas',
    sinSellos: true,
  },
  {
    id: 'p-06',
    name: 'Jumex Piña',
    unit: 'Lata 300ml',
    price: 1150,
    image: '/products/jumex-clean.png',
    stock: 0,
    category: 'bebidas',
  },
]
