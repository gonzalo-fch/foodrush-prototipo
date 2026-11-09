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
| Archivos de prueba | 10 |
| Pruebas ejecutadas | 46 |
| Pruebas aprobadas | 46 |
| Pruebas fallidas | 0 |
| Build de producción | Correcto |
| Lint | Sin errores (solo advertencias de React) |
| Cobertura de sentencias | 60,97 % |
| Cobertura de líneas | 63,72 % |
| Cobertura de ramas | 52,06 % |

Salida resumida:

```text
Test Files  10 passed (10)
Tests       46 passed (46)
```

## 3. Detalle por suite

| Suite | Archivo | Pruebas | Estado |
|---|---|---|---|
| Dominio | `server/__tests__/domain.test.js` | 11 | Aprobadas |
| Repositorio de archivos | `server/__tests__/fileRepository.test.js` | 13 | Aprobadas |
| API REST | `server/__tests__/api.test.js` | 8 | Aprobadas |
| Formato monetario | `src/lib/format.test.ts` | 1 | Aprobada |
| Tarjeta de producto | `src/features/catalog/ProductCard.test.tsx` | 3 | Aprobadas |
| Carrito del cliente | `src/store/ClientStore.test.tsx` | 2 | Aprobadas |
| Carga y compra desde API | `src/store/AppStore.test.tsx` | 2 | Aprobadas |
| Subtotal del carrito | `src/hooks/useCart.test.tsx` | 1 | Aprobada |
| Guardas de autenticación | `src/components/authGuards.test.tsx` | 4 | Aprobadas |
| Acceso al panel de comercio | `src/screens/client/AuthScreens.test.tsx` | 1 | Aprobada |

> Los totales de esta tabla agrupan los casos descritos en el plan. Vitest contabiliza 46 pruebas efectivas.

## 4. Cobertura

Reporte generado en `coverage/index.html`.

| Archivo / grupo | Sentencias | Ramas | Funciones | Líneas |
|---|---|---|---|---|
| Backend (`server`) | 89,21 % | 70,27 % | 96,66 % | 93,85 % |
| `app.js` | 92,68 % | 58,33 % | 100 % | 92,50 % |
| `domain.js` | 88,88 % | 86,11 % | 100 % | 100 % |
| `fileRepository.js` | 87,50 % | 63,93 % | 93,75 % | 92,30 % |
| `seed.js` | 100 % | 50 % | 100 % | 100 % |
| `ProductCard.tsx` | 60 % | 100 % | 50 % | 60 % |
| Stores del frontend | 52,51 % | 50,36 % | 44,89 % | 55,43 % |
| `AuthScreens.tsx` | 9,58 % | 2,38 % | 5,55 % | 10,44 % |
| **Total** | **60,97 %** | **52,06 %** | **55,90 %** | **63,72 %** |

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

## 6. Defectos encontrados y corregidos

| ID | Defecto | Corrección | Estado |
|---|---|---|---|
| D-01 | Firestore rechazaba campos `undefined` al crear productos y movimientos | Se activó `ignoreUndefinedProperties` en Firestore | Corregido |
| D-02 | Imágenes de hasta 1,5 MB podían superar el límite de 1 MiB por documento | Se limitó la carga a 600 KB | Corregido |

## 7. Observaciones

- La prueba de Firestore se realizó con el emulador, no con un proyecto Firebase productivo.
- La persistencia en Firestore se verificó dentro del emulador; la prueba de reinicio con Firestore real queda pendiente para el despliegue.
- No se procesaron pagos reales.
- Los warnings de lint corresponden a reglas de Fast Refresh y pureza de React; no bloquean el build.

## 8. Conclusión

El OE-05 queda respaldado con:

- plan de pruebas formal;
- 46 pruebas automatizadas aprobadas;
- cobertura de backend superior al 89 % en sentencias;
- evidencia manual de compartición de datos entre sesiones;
- verificación del flujo principal con Firestore Emulator;
- ejecución reproducible mediante `npm test` y CI.

Pendientes para el cierre del proyecto:

1. Repetir la prueba manual responsive en la versión final.
2. Verificar persistencia con un proyecto Firestore real.
3. Incorporar los casos de aceptación de usabilidad con usuarios simulados.
