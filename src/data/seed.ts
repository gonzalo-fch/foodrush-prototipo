import type { Category, Store, User } from '../types'

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
    image: '/backgrounds/catalog-blur.png',
  },
  {
    id: 'casino-araucarias',
    name: 'Casino de Las Araucarias',
    address: 'Campus Andrés Bello',
    image: '/backgrounds/catalog-blur.png',
  },
  {
    id: 'imperio-food-truck',
    name: 'Imperio - Food Truck',
    address: 'Uruguay 1552',
    image: '/backgrounds/catalog-blur.png',
  },
  {
    id: 'cafe-de-la-tia',
    name: 'Café de la Tía',
    address: 'Montevideo 810',
    image: '/backgrounds/catalog-blur.png',
  },
  {
    id: 'kiosko-edificio-d',
    name: 'Kiosko Edificio D',
    address: 'Edificio D - Campus Andrés Bello',
    image: '/backgrounds/catalog-blur.png',
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
