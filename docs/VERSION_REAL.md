# FoodRush — Lista de trabajo para pasar del prototipo a la versión real

Este documento reúne las tareas necesarias para convertir el prototipo actual en una aplicación real, segura y operable. El prototipo prioriza demostrar el flujo catálogo → carrito → compra ficticia → entrega → inventario; varias decisiones son deliberadamente simuladas.

## 1. Situación actual del prototipo

- Autenticación simulada con correo y contraseña; sin tokens ni sesiones firmadas.
- Contraseñas almacenadas sin hash en el backend y en datos de ejemplo.
- API sin autorización real: acepta `customerId` y `storeId` enviados por el cliente.
- Reservas de carrito sin expiración automática.
- Pagos completamente simulados; no se procesan cobros.
- Notificaciones del cliente basadas en datos estáticos.
- Firestore probado con emulador, no con un proyecto productivo.
- Cuentas de cliente y ajustes del comercio ya son compartidos mediante la API, pero sin seguridad real.
- Diseño responsive: cliente mobile-first, panel de comercio con layout de escritorio.
- Sin manual de uso final.

## 2. Prioridad 1 — Seguridad y autenticación

- [ ] Reemplazar la autenticación simulada por Firebase Authentication o un proveedor equivalente.
- [ ] Implementar login, registro, recuperación de contraseña y verificación de correo.
- [ ] Hashear contraseñas con Argon2id o bcrypt si se mantiene autenticación propia.
- [ ] No devolver contraseñas en ninguna respuesta de API.
- [ ] Implementar tokens de sesión (JWT firmados o sesiones con cookies `HttpOnly`, `Secure`, `SameSite`).
- [ ] Agregar middleware de autorización por rol: cliente, comercio y administrador.
- [ ] Validar en el backend que un comercio solo modifique sus productos, pedidos, reservas y ajustes.
- [ ] Validar que un cliente solo consulte y modifique su propio carrito, pedidos y favoritos.
- [ ] Agregar rate limiting en login, registro, reservas y creación de pedidos.
- [ ] Configurar CORS restringido por dominio.
- [ ] Validar y sanitizar todas las entradas con Zod, Joi o similar.
- [ ] Implementar cierre de sesión real e invalidación de tokens.
- [ ] Agregar auditoría de accesos y operaciones sensibles.
- [ ] Eliminar cuentas demo, credenciales visibles y usuarios con contraseña de ejemplo en producción.
- [ ] Agregar App Check de Firebase o protección equivalente contra abuso.
- [ ] Usar HTTPS obligatorio y HSTS.

## 3. Prioridad 1 — Modelo de datos y reglas de negocio

- [ ] Definir colecciones Firestore normalizadas: usuarios, comercios, productos, inventario, pedidos, detalle, movimientos y reservas.
- [ ] Definir claves, índices compuestos y restricciones de integridad.
- [ ] Mover toda la lógica de stock y reservas a transacciones del backend.
- [ ] Implementar expiración de reservas de carrito (por ejemplo, 15–30 minutos).
- [ ] Liberar reservas vencidas mediante job programado o limpieza perezosa segura.
- [ ] Definir una máquina de estados de pedido: pendiente, pagado, en preparación, listo, entregado, cancelado, devuelto.
- [ ] Separar ventas entregadas, pedidos pendientes y devoluciones en reportes.
- [ ] Implementar devoluciones parciales y totales.
- [ ] Definir política de stock reservado, stock físico y stock disponible.
- [ ] Impedir stock negativo también a nivel de base de datos.
- [ ] Implementar auditoría de inventario y movimientos manuales con responsable.
- [ ] Definir borrado lógico de productos para conservar historial.
- [ ] Definir política de retención y eliminación de datos.
- [ ] Crear migraciones/versionado del esquema de datos.
- [ ] Definir respaldos y restauración de Firestore.

## 4. Prioridad 1 — Pagos reales

- [ ] Seleccionar pasarela de pago (Transbank/Webpay, Mercado Pago, Stripe u otra).
- [ ] Integrar tokenización de tarjetas; nunca almacenar números ni CVV.
- [ ] Implementar flujo de pago y confirmación con webhooks firmados.
- [ ] Implementar conciliación de pagos con pedidos.
- [ ] Implementar reembolsos y devoluciones monetarias.
- [ ] Generar boletas/facturas según normativa chilena.
- [ ] Definir manejo de pagos pendientes, rechazados y duplicados.
- [ ] Realizar pruebas de seguridad y cumplimiento PCI-DSS aplicable.

## 5. Prioridad 2 — Comercio y operación

- [ ] Implementar registro real de comercios con validación de identidad.
- [ ] Implementar múltiples sucursales por comercio si se requiere.
- [ ] Implementar roles internos: dueño, administrador, cajero, repartidor.
- [ ] Implementar escaneo real de QR.
- [ ] Implementar cierre de caja y arqueo.
- [ ] Implementar gestión de horarios y disponibilidad por producto.
- [ ] Implementar imágenes en Firebase Storage con compresión y CDN.
- [ ] Implementar notificaciones reales por pedido (push, correo o WhatsApp).
- [ ] Implementar historial de notificaciones y preferencias por usuario.
- [ ] Implementar panel de métricas exportable (CSV/Excel/PDF).
- [ ] Implementar búsqueda y geolocalización real de comercios.
- [ ] Implementar favoritos sincronizados en backend si se desea multicuenta.

## 6. Prioridad 2 — Infraestructura y despliegue

- [ ] Crear proyectos Firebase separados para desarrollo, staging y producción.
- [ ] Configurar reglas de Firestore y Storage para producción.
- [ ] Configurar variables de entorno y secretos en el proveedor de despliegue.
- [ ] Definir dominio, HTTPS y correo corporativo.
- [ ] Configurar CI/CD con despliegue automático a staging y producción.
- [ ] Implementar monitoreo de errores (Sentry o equivalente).
- [ ] Implementar logs estructurados y alertas.
- [ ] Implementar health checks, uptime y reinicio automático.
- [ ] Configurar límites de costo y presupuesto en Firebase.
- [ ] Definir plan de respaldo y recuperación ante desastres.
- [ ] Documentar runbook de incidentes.
- [ ] Implementar entornos de pruebas con datos aislados.

## 7. Prioridad 2 — Calidad y pruebas

- [ ] Aumentar cobertura de pruebas unitarias y de integración.
- [ ] Agregar pruebas E2E para autenticación real, pagos y devoluciones.
- [ ] Agregar pruebas de carga y concurrencia sobre reservas y stock.
- [ ] Agregar pruebas de seguridad (OWASP, autorización, inyección, rate limiting).
- [ ] Agregar pruebas de accesibilidad (WCAG 2.1 AA).
- [ ] Agregar pruebas de usabilidad con usuarios reales.
- [ ] Agregar pruebas en dispositivos móviles reales.
- [ ] Definir umbrales mínimos de cobertura para CI.
- [ ] Implementar pruebas de regresión visual.
- [ ] Implementar pruebas de compatibilidad de navegadores.

## 8. Prioridad 3 — Producto y experiencia

- [ ] Implementar notificaciones y estados en tiempo real (SSE, WebSocket o Firestore listeners).
- [ ] Implementar historial de compras completo y detalle de devoluciones.
- [ ] Implementar recuperación de carrito entre dispositivos.
- [ ] Implementar recomendaciones y productos relacionados.
- [ ] Implementar cupones, descuentos y promociones.
- [ ] Implementar multi-idioma si aplica.
- [ ] Implementar modo accesible y navegación por teclado.
- [ ] Implementar manual de uso y centro de ayuda.
- [ ] Implementar soporte y canales de contacto reales.
- [ ] Implementar términos, privacidad y consentimiento de datos.

## 9. Prioridad 3 — Legal y privacidad

- [ ] Redactar términos y condiciones.
- [ ] Redactar política de privacidad.
- [ ] Definir base legal y consentimiento para datos personales.
- [ ] Definir retención y eliminación de datos.
- [ ] Revisar normativa chilena de protección de datos y consumo.
- [ ] Definir tratamiento de datos de menores si aplica.
- [ ] Definir política de cookies y analítica.
- [ ] Definir acuerdos de nivel de servicio con comercios.

## 10. Cambios concretos respecto del prototipo

| Área | Prototipo actual | Versión real |
|---|---|---|
| Autenticación | Simulada, sin tokens | Firebase Auth o JWT con roles |
| Contraseñas | Texto plano | Hash Argon2/bcrypt |
| API | Sin autorización | Middleware por rol y recurso |
| Reservas | Sin expiración | TTL y limpieza automática |
| Pagos | Simulados | Pasarela real y webhooks |
| Notificaciones | Datos estáticos | Push/email/WhatsApp reales |
| Imágenes | Data URL limitada | Firebase Storage/CDN |
| Base de datos | Firestore emulado y archivo local | Firestore productivo con reglas e índices |
| Despliegue | Docker y guía | CI/CD a staging y producción |
| Observabilidad | Logs básicos | Monitoreo, alertas y trazas |
| Legal | Sin documentos | Términos, privacidad y cumplimiento |

## 11. Orden sugerido de implementación

1. Autenticación real y autorización de API.
2. Endurecimiento del modelo de datos y reservas con expiración.
3. Pagos reales y conciliación.
4. Firebase productivo, reglas, índices y respaldos.
5. Despliegue con HTTPS, monitoreo y alertas.
6. Notificaciones reales y operación del comercio.
7. Pruebas de carga, seguridad, accesibilidad y usabilidad.
8. Documentación legal, manual de uso y soporte.

## 12. Criterios de salida para considerar la versión real

- [ ] Ninguna contraseña se almacena en texto plano.
- [ ] Toda operación de API está autorizada por rol y recurso.
- [ ] Las reservas expiran y no bloquean stock indefinidamente.
- [ ] Los pagos reales se concilian y permiten reembolsos.
- [ ] Firestore productivo tiene reglas, índices y respaldos.
- [ ] Existe CI/CD con staging y producción.
- [ ] Existe monitoreo, alertas y runbook.
- [ ] Existen términos, privacidad y manual de uso.
- [ ] Las pruebas E2E, de carga y de seguridad están aprobadas.
