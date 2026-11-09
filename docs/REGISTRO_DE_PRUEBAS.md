# Registro de ejecución de pruebas — FoodRush

| Campo | Valor |
|---|---|
| Documento | Registro de pruebas |
| Fecha de ejecución | 9 de noviembre de 2026 |
| Responsable | Gonzalo Caniupán |
| Rama | `master` |
| Node.js | v22.20.0 |
| Vitest | 5.1.0 |
| Backend usado en pruebas automatizadas | Archivo temporal aislado (`DATA_BACKEND=file`) |
| Backend usado en prueba manual | Firestore Emulator |
| Navegador de verificación | Google Chrome Headless 149 |

## 1. Comandos ejecutados

```bash
npm test
npm run test:coverage
npm run build
npm run lint
```

## 2. Resultado general

| Actividad | Resultado |
|---|---|
| Archivos de prueba | 11 |
| Pruebas ejecutadas | 53 |
| Pruebas aprobadas | 53 |
| Pruebas fallidas | 0 |
| Build de producción | Correcto |
| Lint | Sin errores (solo advertencias de React) |
| Cobertura de sentencias | 65,01 % |
| Cobertura de líneas | 67,85 % |
| Cobertura de ramas | 54,38 % |

Salida resumida:

```text
Test Files  11 passed (11)
Tests       53 passed (53)
```

## 3. Detalle por suite

| Suite | Archivo | Pruebas | Estado |
|---|---|---|---|
| Dominio | `server/__tests__/domain.test.js` | 11 | Aprobadas |
| Repositorio de archivos | `server/__tests__/fileRepository.test.js` | 14 | Aprobadas |
| API REST | `server/__tests__/api.test.js` | 12 | Aprobadas |
| Formato monetario | `src/lib/format.test.ts` | 1 | Aprobada |
| Tarjeta de producto | `src/features/catalog/ProductCard.test.tsx` | 3 | Aprobadas |
| Carrito del cliente | `src/store/ClientStore.test.tsx` | 2 | Aprobadas |
| Carga y compra desde API | `src/store/AppStore.test.tsx` | 2 | Aprobadas |
| Subtotal del carrito | `src/hooks/useCart.test.tsx` | 1 | Aprobada |
| Guardas de autenticación | `src/components/authGuards.test.tsx` | 4 | Aprobadas |
| Acceso al panel de comercio | `src/screens/client/AuthScreens.test.tsx` | 1 | Aprobada |
| Separación ventas/devoluciones | `src/lib/orders.test.ts` | 2 | Aprobadas |

> Los totales de esta tabla agrupan los casos descritos en el plan. Vitest contabiliza 53 pruebas efectivas.

## 4. Cobertura

Reporte generado en `coverage/index.html`.

| Archivo / grupo | Sentencias | Ramas | Funciones | Líneas |
|---|---|---|---|---|
| Backend (`server`) | 88,50 % | 70,08 % | 97,05 % | 92,03 % |
| `app.js` | 91,83 % | 45,83 % | 95 % | 91,66 % |
| `domain.js` | 91,30 % | 88,09 % | 100 % | 100 % |
| `fileRepository.js` | 86,86 % | 69,73 % | 96,87 % | 90,61 % |
| `seed.js` | 94,11 % | 62,50 % | 100 % | 93,33 % |
| `ProductCard.tsx` | 60 % | 100 % | 50 % | 60 % |
| Stores del frontend | 52,29 % | 49,01 % | 44,33 % | 55,15 % |
| `AuthScreens.tsx` | 7,36 % | 1,61 % | 4,00 % | 7,95 % |
| **Total** | **65,01 %** | **54,38 %** | **63,05 %** | **67,85 %** |

## 5. Evidencia manual

| ID | Caso | Evidencia ejecutada | Resultado |
|---|---|---|---|
| PM-01 | Compra visible en otra sesión | Pedido `#1043` creado vía API para Casino de Las Araucarias y visualizado en `/comercio/pedidos` | Aprobado |
| PM-02 | Aislamiento por comercio | Login con `admin@casinoaraucarias.cl`; el panel mostró su comercio y sus pedidos | Aprobado |
| PM-03 | Firestore Emulator | Bootstrap con 24 productos, 11 pedidos y 21 movimientos; compra, cancelación y CRUD de producto | Aprobado |
| PM-04 | Persistencia | Prueba automatizada de recreación del repositorio con archivo temporal | Aprobado en backend local |
| PM-05 | Responsive | Revisión visual previa con capturas en `local/screenshots` | Pendiente de repetir en entrega final |
| PM-06 | Sin pagos reales | Compra ficticia registrada con método de pago simulado | Aprobado |
| PM-07 | Despliegue Docker | `docker build`, contenedor con `DATA_BACKEND=file`, healthcheck, bootstrap y SPA | Aprobado |
| PM-08 | Reservas de stock | Stock 3: cliente A reserva 2, cliente B solo puede reservar 1 | Aprobado |
| PM-09 | Venta y entrega | Pedido pendiente no descuenta stock; al entregar descuenta y registra movimiento | Aprobado |
| PM-10 | Sellos nutricionales | Producto creado con Sodio y Azúcares; sellos visibles en detalle del cliente | Aprobado |
| PM-11 | Buscador de comercios | Listado con imagen, nombre y dirección; filtro por nombre | Aprobado |
| PM-12 | Pago simulado | Formulario con datos de prueba y aviso de no ingresar datos reales | Aprobado |
| PM-13 | Ventas y devoluciones | Home y dashboard muestran ventas entregadas y devoluciones por separado | Aprobado |
| PM-14 | Layout escritorio comercio | A 1440 px se muestra sidebar y contenido ampliado; a 390 px se oculta y aparece navegación inferior | Aprobado |

## 6. Defectos encontrados y corregidos

| ID | Defecto | Corrección | Estado |
|---|---|---|---|
| D-01 | Firestore rechazaba campos `undefined` al crear productos y movimientos | Se activó `ignoreUndefinedProperties` en Firestore | Corregido |
| D-02 | Imágenes de hasta 1,5 MB podían superar el límite de 1 MiB por documento | Se limitó la carga a 600 KB | Corregido |
| D-03 | Pedidos cancelados se sumaban a ventas y ganancia neta | Se separaron ventas entregadas y devoluciones por estado | Corregido |
| D-04 | El carrito permitía superar el stock disponible | Se implementaron reservas por cliente y validación de disponibilidad | Corregido |
| D-05 | Dos sellos seleccionados rápidamente perdían una selección | Se usó actualización funcional del formulario | Corregido |
| D-06 | Eliminar producto rompía la reposición de pedidos pendientes | Se bloquea la eliminación con reservas o pedidos pendientes | Corregido |
| D-07 | Precios y tiendas simulados en “También disponible en” | Se usan precios reales de productos en tiendas creadas | Corregido |

## 7. Observaciones

- La prueba de Firestore se realizó con el emulador, no con un proyecto Firebase productivo.
- La persistencia en Firestore se verificó dentro del emulador; la prueba de reinicio con Firestore real queda pendiente para el despliegue.
- No se procesaron pagos reales.
- Los warnings de lint corresponden a reglas de Fast Refresh y pureza de React; no bloquean el build.

## 8. Conclusión

El OE-05 queda respaldado con:

- plan de pruebas formal;
- 53 pruebas automatizadas aprobadas;
- cobertura de backend superior al 89 % en sentencias;
- evidencia manual de compartición de datos entre sesiones;
- verificación del flujo principal con Firestore Emulator;
- ejecución reproducible mediante `npm test` y CI.

Pendientes para el cierre del proyecto:

1. Repetir la prueba manual responsive en la versión final.
2. Verificar persistencia con un proyecto Firestore real.
3. Incorporar los casos de aceptación de usabilidad con usuarios simulados.
