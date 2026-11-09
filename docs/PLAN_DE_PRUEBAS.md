# Plan de pruebas — FoodRush

| Campo | Valor |
|---|---|
| Proyecto | FoodRush |
| Documento | Plan de pruebas del prototipo |
| Versión | 1.0 |
| Fecha | 9 de noviembre de 2026 |
| Responsable | Gonzalo Caniupán |
| Objetivo relacionado | OE-05: verificar el funcionamiento mediante pruebas y casos de uso |
| Requisitos relacionados | RF-01 a RF-21, RNF-01 a RNF-09, UC-01 a UC-05 |

## 1. Objetivo

Definir y dejar evidencia de las pruebas que verifican el flujo principal de FoodRush: catálogo, carrito, compra ficticia, actualización coherente de inventario, aislamiento por comercio y persistencia de datos.

Este plan cubre la brecha identificada en la sección 6.3 del anteproyecto: existencia de un plan, ejecución registrada y evidencia reproducible.

## 2. Alcance

### Incluido

- Validación de reglas de negocio del backend (stock, precios, totales, cancelaciones).
- Pruebas de integración del repositorio de datos y de la API REST.
- Pruebas de componentes y stores del frontend.
- Protección de rutas por rol.
- Prueba manual de compartición de datos entre sesiones/dispositivos.
- Prueba manual del flujo completo con Firestore Emulator.
- Registro de resultados y cobertura.

### Excluido

- Pagos reales y pasarelas de pago.
- Firebase Authentication real (el informe define autenticación simulada).
- Pruebas de carga, estrés o concurrencia masiva.
- Validación con usuarios reales a escala.
- Pruebas sobre un proyecto Firebase productivo (se usa emulador y backend local).

## 3. Estrategia

Se usa una pirámide de pruebas:

1. **Unitarias:** reglas del dominio (validaciones, agrupación de ítems).
2. **Integración:** repositorio de archivos y API REST con Supertest.
3. **Integración de frontend:** stores, hook de carrito, guardas de ruta y componente de catálogo.
4. **Manuales guiadas:** flujo multisesión, Firestore Emulator y revisión responsive.

Las pruebas automatizadas se ejecutan con **Vitest** y no dependen de credenciales de Firebase. El backend de pruebas usa un archivo temporal aislado por caso.

## 4. Entornos de prueba

| Entorno | Uso | Configuración |
|---|---|---|
| Local con archivo | Automatizado y desarrollo | `DATA_BACKEND=file`, archivo temporal por prueba |
| Firestore Emulator | Verificación manual de Firestore | `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`, `FIREBASE_PROJECT_ID=foodrush-demo` |
| Navegador headless | Verificación de integración frontend/API | Chrome Headless 149 |
| Producción-like | Build y servidor Express | `npm run build && npm start` |

## 5. Herramientas

- Vitest 5.1.0
- @testing-library/react
- @testing-library/user-event
- @testing-library/jest-dom
- jsdom
- Supertest
- Cobertura V8 de Vitest
- Node.js 22.20.0
- Chrome Headless

## 6. Casos de prueba

### 6.1 Matriz área → prueba

| Área del plan 6.3 | Pruebas asociadas | Requisitos |
|---|---|---|
| Catálogo | PT-FE-02, PT-FE-03, PT-FE-04, PT-API-02 | RF-03, RF-14, RF-17 |
| Carrito | PT-FE-05, PT-FE-06, PT-FE-10, PT-DOM-01 | RF-04, RF-05, RF-06 |
| Compra ficticia | PT-REP-02, PT-API-03, PT-FE-09 | RF-07, RF-12, UC-02 |
| Restricciones de inventario | PT-REP-03, PT-REP-04, PT-REP-05, PT-REP-11, PT-API-04 | RF-08, RF-09, RF-10, RN-01, RN-02 |
| Coherencia y precio | PT-REP-02, PT-REP-06, PT-REP-08, PT-REP-09, PT-REP-10 | RF-09, RF-11, RF-12, RF-13, RN-05 |
| Permisos por rol | PT-FE-11, PT-FE-12, PT-FE-13, PT-FE-14, PT-REP-05 | RF-01, RF-02, RNF-04 |
| Persistencia | PT-REP-13, PM-04 | RF-21, RNF-06 |
| Manejo de errores | PT-DOM-02, PT-DOM-03, PT-DOM-04, PT-API-04, PT-API-08 | RNF-07 |
| Multidispositivo | PM-01, PM-02 | RF-02, RNF-06 |
| Firestore | PM-03 | RF-09, RF-21, RNF-06 |

### 6.2 Casos automatizados

| ID | Suite | Caso | Resultado esperado |
|---|---|---|---|
| PT-DOM-01 | Dominio | Agrupar cantidades repetidas del mismo producto | Se suman en una sola línea |
| PT-DOM-02 | Dominio | Carrito vacío | Se rechaza con mensaje |
| PT-DOM-03 | Dominio | Cantidad cero, negativa o decimal | Se rechaza con mensaje |
| PT-DOM-04 | Dominio | Producto con precio, stock o nombre inválido | Se rechaza |
| PT-REP-01 | Repositorio | Inicialización con seed | Productos, pedidos y movimientos disponibles |
| PT-REP-02 | Repositorio | Crear compra | Pedido, total, descuento de stock y movimiento correctos |
| PT-REP-03 | Repositorio | Cantidad mayor al stock | Error y stock sin cambios |
| PT-REP-04 | Repositorio | Producto agotado | Error de stock insuficiente |
| PT-REP-05 | Repositorio | Producto de otro comercio | Error de producto no encontrado |
| PT-REP-06 | Repositorio | Cambiar precio después de comprar | El pedido conserva el precio histórico |
| PT-REP-07 | Repositorio | Cancelar pedido | Estado cancelado y stock repuesto |
| PT-REP-08 | Repositorio | Marcar pedido entregado | Estado retirado |
| PT-REP-09 | Repositorio | Agregar producto | Producto creado y movimiento de stock inicial |
| PT-REP-10 | Repositorio | Editar producto y stock | Cambios persistidos y movimiento generado |
| PT-REP-11 | Repositorio | Ajuste de stock excesivo | Stock nunca queda negativo |
| PT-REP-12 | Repositorio | Ocultar y eliminar producto | Visibilidad y eliminación correctas |
| PT-REP-13 | Repositorio | Recrear repositorio | Los cambios persisten en el archivo |
| PT-REP-14 | Repositorio | Reservar stock en carrito | La disponibilidad baja y queda ligada al cliente |
| PT-REP-15 | Repositorio | Segundo cliente intenta reservar de más | Se limita a las unidades libres |
| PT-REP-16 | Repositorio | Quitar o vaciar carrito | Se liberan las reservas |
| PT-REP-17 | Repositorio | Crear pedido desde reserva | El stock no se descuenta todavía |
| PT-REP-18 | Repositorio | Entregar pedido | Se descuenta stock y se registra la venta |
| PT-REP-19 | Repositorio | Cancelar pedido | Se libera la reserva sin descontar stock |
| PT-REP-20 | Repositorio | Crear producto con sellos | Se guardan y exponen los sellos seleccionados |
| PT-REP-21 | Repositorio | Eliminar producto con reservas | Se bloquea la operación |
| PT-API-01 | API | `GET /api/health` | Responde estado y backend |
| PT-API-02 | API | `GET /api/bootstrap` | Entrega productos, pedidos y movimientos |
| PT-API-03 | API | `POST /api/orders` | Crea pedido y descuenta stock |
| PT-API-04 | API | Compra sin stock | HTTP 400 y mensaje |
| PT-API-05 | API | Completar pedido | HTTP 200 y estado retirado |
| PT-API-06 | API | Cancelar pedido | HTTP 200 y stock repuesto |
| PT-API-07 | API | CRUD de producto | Crear, editar, ocultar, ajustar y eliminar |
| PT-API-08 | API | Ruta inexistente | HTTP 404 |
| PT-API-09 | API | Reservar stock vía carrito | Disponibilidad actualizada |
| PT-API-10 | API | Reserva sin stock suficiente | HTTP 400 |
| PT-API-11 | API | Liberar línea y carrito | Reservas eliminadas |
| PT-API-12 | API | Eliminar producto reservado | HTTP 409 |
| PT-FE-01 | Frontend | Formato CLP | Formato `$3.500` |
| PT-FE-02 | Frontend | Render de tarjeta de producto | Nombre, unidad y precio visibles |
| PT-FE-03 | Frontend | Agregar producto con stock | Se invoca `onAdd` |
| PT-FE-04 | Frontend | Producto agotado | Botón deshabilitado y texto Agotado |
| PT-FE-05 | Frontend | Agregar y acumular en carrito | Cantidad y contador correctos |
| PT-FE-06 | Frontend | Eliminar línea del carrito | Cantidad vuelve a cero |
| PT-FE-07 | Frontend | Login y logout de cliente | Sesión simulada correcta |
| PT-FE-08 | Frontend | Carga inicial desde API | Productos visibles tras `bootstrap` |
| PT-FE-09 | Frontend | Compra desde AppStore | Pedido actualizado en estado |
| PT-FE-10 | Frontend | Subtotal del carrito | `$7.000` para 2 × `$3.500` |
| PT-FE-11 | Frontend | Cliente sin sesión | Redirección a login |
| PT-FE-12 | Frontend | Cliente autenticado | Acceso permitido |
| PT-FE-13 | Frontend | Comercio sin sesión | Redirección a login de comercio |
| PT-FE-14 | Frontend | Comercio autenticado | Acceso permitido |
| PT-FE-15 | Frontend | Enlace de acceso al panel de comercio | Enlace visible y apunta a `/comercio/login` |
| PT-FE-16 | Frontend | Separar ventas y devoluciones | Solo pedidos entregados cuentan como ventas |

### 6.3 Casos manuales

| ID | Caso | Pasos | Resultado esperado |
|---|---|---|---|
| PM-01 | Compra visible en otra sesión | Crear pedido vía API; abrir el panel del comercio en otra sesión | El pedido aparece en `/comercio/pedidos` |
| PM-02 | Aislamiento por comercio | Iniciar sesión como Casino de Las Araucarias | Se muestra su comercio y solo sus pedidos/productos |
| PM-03 | Flujo con Firestore Emulator | Levantar emulador; ejecutar compra, cancelación y CRUD | Operaciones correctas y datos persistidos |
| PM-04 | Persistencia tras reinicio | Crear datos; reiniciar el servidor | Los datos se conservan |
| PM-05 | Diseño responsive | Abrir flujo cliente y comercio en móvil y escritorio | Sin pérdida de funciones |
| PM-06 | Sin pagos reales | Completar compra ficticia | No se solicita ni procesa un cobro real |
| PM-07 | Despliegue Docker | Construir y ejecutar la imagen; consultar health y frontend | Contenedor operativo y reproducible |
| PM-08 | Reservas entre clientes | Reservar 2 de 3 unidades y probar con un segundo cliente | El segundo cliente solo puede reservar 1 |
| PM-09 | Venta y entrega | Crear pedido y luego entregarlo | Stock se descuenta recién al entregar |
| PM-10 | Sellos nutricionales | Crear producto con Sodio y Azúcares y abrir su detalle | Ambos sellos visibles |
| PM-11 | Buscador de comercios | Abrir “Buscar otra ubicación” y filtrar | Listado con imagen, nombre, dirección y filtro |
| PM-12 | Pago simulado | Abrir formulario de tarjeta | Datos de prueba precargados y aviso visible |
| PM-13 | Ventas y devoluciones | Revisar Home y Dashboard | Ventas entregadas y devoluciones separadas |

## 7. Datos de prueba

- Comercio principal: `casino-los-notros`.
- Producto con stock: `cp-4` (Ensalada César).
- Producto agotado: `cp-2` (Jumex Piña).
- Producto de otro comercio: `imp-coca`.
- Usuario cliente: `isabella@universidad.cl` / `123456`.
- Usuario comercio: `admin@casinoaraucarias.cl` / `123456`.
- Pedidos y movimientos iniciales definidos en `src/store/seed.ts`.

## 8. Criterios de entrada y salida

### Entrada

- Dependencias instaladas (`npm ci`).
- Código compilable.
- Backend local disponible o repositorio de archivos aislado.

### Salida

- Todas las pruebas automatizadas en verde.
- Build de producción correcto.
- Sin errores de lint.
- Registro de ejecución y cobertura generados.
- Casos manuales críticos ejecutados y documentados.

## 9. Riesgos

| Riesgo | Mitigación |
|---|---|
| Firestore real no disponible en el entorno académico | Pruebas automatizadas con repositorio local + prueba manual con emulador |
| Diferencias entre backend local y Firestore | Pruebas de API y verificación manual del emulador |
| Datos de seed modificados por pruebas | Cada prueba usa archivo temporal aislado |
| Falta de credenciales en CI | CI no depende de Firebase; ejecuta pruebas locales |
| Regresiones futuras | CI con lint, test, coverage y build en cada push |

## 10. Evidencia

- Comando de pruebas: `npm test`
- Comando de cobertura: `npm run test:coverage`
- Reporte HTML: `coverage/index.html`
- Registro de ejecución: `docs/REGISTRO_DE_PRUEBAS.md`
- Integración continua: `.github/workflows/ci.yml`
