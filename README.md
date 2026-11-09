# FoodRush

![CI](https://github.com/gonzalo-fch/foodrush-prototipo/actions/workflows/ci.yml/badge.svg)

Prototipo web responsive para consultar catálogos, registrar compras ficticias y administrar productos e inventario de establecimientos físicos.

## Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Base de datos:** Firebase Firestore
- **Persistencia local de desarrollo:** archivo JSON en `server/.data/state.json`

## Requisitos

- Node.js **22.6 o superior** (el backend importa los seeds TypeScript con `--experimental-strip-types`).
- Java 21 solo si se usará el emulador de Firestore.

## Instalación

```bash
npm install
cp .env.example .env
```

## Ejecutar en desarrollo

Con backend local (sin credenciales de Firebase):

```bash
npm run dev:all
```

Esto levanta:

- Frontend: http://localhost:5173
- API: http://localhost:3001
- Persistencia: `server/.data/state.json`

También se pueden ejecutar en terminales separadas:

```bash
npm run dev
npm run dev:api
```

## Ejecutar con Firestore

1. Crear un proyecto en Firebase y habilitar Firestore.
2. Crear una cuenta de servicio con permisos de Firestore.
3. Actualizar `.firebaserc` con tu project id real (o usar `--project` en la CLI).
4. Completar en `.env`:

```env
DATA_BACKEND=firestore
FIREBASE_PROJECT_ID=tu-proyecto
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

También se puede usar `GOOGLE_APPLICATION_CREDENTIALS` apuntando a un service account JSON.

El primer arranque carga automáticamente los datos iniciales si la colección `products` está vacía.

### Emulador local de Firestore

```bash
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 \
npx firebase-tools emulators:start --only firestore --project foodrush-demo
```

Y en otra terminal:

```bash
DATA_BACKEND=firestore \
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
FIREBASE_PROJECT_ID=foodrush-demo \
npm run server
```

## Producción

```bash
npm run build
npm start
```

El servidor Express sirve `dist/` y la API en el puerto configurado (`PORT`, por defecto `3001`).

## Pruebas

```bash
npm test
npm run test:coverage
```

- Plan de pruebas: `docs/PLAN_DE_PRUEBAS.md`
- Registro de ejecución: `docs/REGISTRO_DE_PRUEBAS.md`
- Integración continua: `.github/workflows/ci.yml`

## Cuentas demo

### Clientes

| Usuario | Correo | Contraseña |
|---|---|---|
| Isabella Rodriguez | `isabella@universidad.cl` | `123456` |
| Ana Pérez | `ana.perez@universidad.cl` | `123456` |
| Juan Gómez | `juan.gomez@universidad.cl` | `123456` |
| Camila Soto | `camila.soto@universidad.cl` | `123456` |
| Martín Díaz | `martin.diaz@universidad.cl` | `123456` |

### Comercios

| Comercio | Correo | Contraseña |
|---|---|---|
| Casino Los Notros | `admin@casinolosnotros.cl` | `123456` |
| Casino de Las Araucarias | `admin@casinoaraucarias.cl` | `123456` |
| Imperio - Food Truck | `admin@imperiofoodtruck.cl` | `123456` |

El acceso del comercio está en `/comercio/login`.

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servidor y backend activo |
| GET | `/api/bootstrap` | Productos, pedidos y movimientos |
| POST | `/api/orders` | Registrar compra ficticia y descontar stock |
| PATCH | `/api/orders/:id/complete` | Marcar pedido como entregado |
| POST | `/api/orders/:id/cancel` | Cancelar pedido y reponer stock |
| POST | `/api/products` | Crear producto |
| PATCH | `/api/products/:id` | Editar producto |
| DELETE | `/api/products/:id` | Eliminar producto |
| PATCH | `/api/products/:id/visibility` | Activar u ocultar producto |
| POST | `/api/products/:id/stock` | Ajustar stock |

## Alcance

- No se procesan pagos reales.
- La autenticación y los roles son simulados.
- Las imágenes de producto se guardan como data URL y están limitadas a 600 KB.
