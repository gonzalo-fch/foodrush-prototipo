# Guía de instalación y despliegue — FoodRush

| Campo | Valor |
|---|---|
| Documento | Guía reproducible de instalación y despliegue |
| Versión | 1.0 |
| Fecha | 9 de noviembre de 2026 |
| Requisito relacionado | RNF-09 Portabilidad |
| Etapa relacionada | E6 Documentación y presentación |

Esta guía permite levantar FoodRush desde cero en desarrollo, con Firestore Emulator, con Node.js o con Docker, y desplegarlo en un entorno de demostración.

> El manual de uso para usuarios finales queda fuera de este avance.

## 1. Requisitos

- Node.js **22.6 o superior**.
- npm.
- Git.
- Docker 24 o superior (opcional, para despliegue en contenedor).
- Java 21 (solo si se usa Firestore Emulator).
- Proyecto Firebase con Firestore habilitado (para persistencia en la nube).

## 2. Obtener el proyecto

```bash
git clone https://github.com/gonzalo-fch/foodrush-prototipo.git
cd foodrush-prototipo
```

## 3. Instalar dependencias

```bash
npm ci
```

Para desarrollo con cambios locales también se puede usar `npm install`.

## 4. Configurar variables de entorno

```bash
cp .env.example .env
```

Variables principales:

| Variable | Uso | Valor por defecto |
|---|---|---|
| `PORT` | Puerto del servidor Express | `3001` |
| `DATA_BACKEND` | `auto`, `file` o `firestore` | `auto` |
| `FIREBASE_PROJECT_ID` | Project ID de Firebase | vacío |
| `FIREBASE_CLIENT_EMAIL` | Correo de la cuenta de servicio | vacío |
| `FIREBASE_PRIVATE_KEY` | Clave privada de la cuenta de servicio | vacío |
| `GOOGLE_APPLICATION_CREDENTIALS` | Ruta alternativa al service account JSON | vacío |
| `FIRESTORE_EMULATOR_HOST` | Host del emulador de Firestore | vacío |
| `VITE_API_URL` | URL del API si el frontend se sirve separado | `/api` |

### Comportamiento de `DATA_BACKEND`

- `auto`: usa Firestore si hay credenciales; si no, usa archivo local.
- `file`: guarda en `server/.data/state.json`.
- `firestore`: exige credenciales y usa Firestore.

## 5. Configurar Firebase Firestore

1. Crear un proyecto en Firebase.
2. Habilitar Firestore en modo producción.
3. Crear una cuenta de servicio con permisos de Firestore.
4. Descargar el JSON de la cuenta de servicio.
5. Completar `.env`:

```env
DATA_BACKEND=firestore
FIREBASE_PROJECT_ID=foodrush-tu-proyecto
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@foodrush-tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Alternativa:

```env
DATA_BACKEND=firestore
GOOGLE_APPLICATION_CREDENTIALS=/ruta/al/service-account.json
```

6. Actualizar `.firebaserc` con el project id real si se usará Firebase CLI.

Las reglas de `firestore.rules` bloquean el acceso directo desde el navegador. Todo el acceso pasa por la API Express con Admin SDK.

## 6. Ejecutar en desarrollo

Con backend local:

```bash
npm run dev:all
```

- Frontend: http://localhost:5173
- API: http://localhost:3001
- Healthcheck: http://localhost:3001/api/health
- Datos locales: `server/.data/state.json`

También se puede ejecutar por separado:

```bash
npm run dev
npm run dev:api
```

## 7. Ejecutar pruebas antes de desplegar

```bash
npm run lint
npm test
npm run build
```

Para cobertura:

```bash
npm run test:coverage
```

Documentos relacionados:

- `docs/PLAN_DE_PRUEBAS.md`
- `docs/REGISTRO_DE_PRUEBAS.md`

## 8. Ejecutar con Firestore Emulator

Requiere Java 21.

Terminal 1:

```bash
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 \
npx firebase-tools emulators:start --only firestore --project foodrush-demo
```

Terminal 2:

```bash
DATA_BACKEND=firestore \
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
FIREBASE_PROJECT_ID=foodrush-demo \
npm run server
```

## 9. Ejecución en producción con Node.js

```bash
npm ci
npm run build
npm start
```

Express sirve:

- la API en `/api/*`;
- el frontend compilado en `dist/` para el resto de rutas.

Verificar:

```bash
curl http://localhost:3001/api/health
```

Respuesta esperada:

```json
{"ok":true,"backend":"firestore"}
```

## 10. Despliegue con Docker

### Construir la imagen

```bash
docker build -t foodrush .
```

### Ejecutar con backend de archivo

```bash
docker run --rm -p 3001:3001 \
  -e DATA_BACKEND=file \
  -v foodrush_data:/app/server/.data \
  foodrush
```

### Ejecutar con Firestore

```bash
docker run --rm -p 3001:3001 \
  --env-file .env \
  foodrush
```

### Docker Compose

```bash
docker compose up -d --build
```

La aplicación queda en http://localhost:3001.

Detener:

```bash
docker compose down
```

El volumen `foodrush_data` conserva los datos si se usa el backend de archivo. En producción se recomienda Firestore para evitar pérdida de datos si el contenedor se recrea.

## 11. Despliegue en la nube

La imagen Docker es portable. Estos pasos son genéricos y aplican a Railway, Render, Fly.io o un servidor propio.

### Render

1. Crear un **Web Service** desde el repositorio.
2. Seleccionar entorno **Docker**.
3. Configurar las variables de entorno de Firestore.
4. Usar el puerto `3001`.
5. Configurar health check en `/api/health`.

### Railway

1. Crear un proyecto desde GitHub.
2. Railway detecta el `Dockerfile`.
3. Agregar las variables de Firestore.
4. Generar un dominio público.

### Fly.io

```bash
fly launch
fly secrets set DATA_BACKEND=firestore FIREBASE_PROJECT_ID=... FIREBASE_CLIENT_EMAIL=... FIREBASE_PRIVATE_KEY=...
fly deploy
```

### Servidor propio

```bash
git clone https://github.com/gonzalo-fch/foodrush-prototipo.git
cd foodrush-prototipo
cp .env.example .env
# completar variables
docker compose up -d --build
```

Se recomienda un proxy inverso con HTTPS (Caddy, Nginx o Traefik) delante del puerto `3001`.

## 12. Verificación posterior al despliegue

| Verificación | Cómo | Resultado esperado |
|---|---|---|
| Servicio activo | `GET /api/health` | `{"ok":true,...}` |
| Backend correcto | Revisar `backend` en health | `firestore` en producción |
| Login cliente | `isabella@universidad.cl` / `123456` | Catálogo visible |
| Entrada comercio | Enlace “Accede a tu panel” o `/comercio/login` | Login de comercio |
| Login comercio | `admin@casinoaraucarias.cl` / `123456` | Panel de su comercio |
| Compra compartida | Crear compra y abrir panel de comercio | Pedido visible |
| Persistencia | Reiniciar el servicio | Datos conservados |
| Seguridad | Abrir Firestore desde el navegador | Acceso denegado por reglas |

Credenciales completas: ver la sección **Cuentas demo** del `README.md`.

## 13. Solución de problemas

| Problema | Causa probable | Solución |
|---|---|---|
| `Node.js 22.6 o superior` | Versión antigua | Actualizar Node |
| El frontend no carga datos | API apagada | Ejecutar `npm run dev:api` o `npm start` |
| `DATA_BACKEND=firestore` falla | Credenciales incompletas | Revisar project id, email y private key |
| Firestore Emulator no inicia | Java anterior a 21 | Usar JDK 21 |
| Datos perdidos al recrear contenedor | Backend de archivo efímero | Usar Firestore o volumen persistente |
| Imagen de producto rechazada | Supera 600 KB | Reducir la imagen |

## 14. Relación con RNF-09

| Criterio | Evidencia |
|---|---|
| Instalación reproducible | `npm ci`, `.env.example`, README y esta guía |
| Despliegue reproducible | `Dockerfile`, `docker-compose.yml`, healthcheck |
| Persistencia configurable | `DATA_BACKEND=file` o `firestore` |
| Verificación | `/api/health` y checklist posterior |
| Documentación | `README.md`, `docs/DESPLIEGUE.md`, CI |
