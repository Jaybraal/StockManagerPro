# StockManagerPro

Sistema multi-tenant de gestión de inventario, diseñado para usarse **desde el
móvil en el almacén**, no desde un escritorio.

> Quien recibe mercancía tiene las manos ocupadas y un teléfono, no un ratón.
> Buena parte del trabajo de este proyecto está en que el formulario de producto
> se pueda completar de pie, con una mano.

## Enfoque móvil real

El historial del repo lo refleja: modales que se cortaban tras la barra de
navegación de iOS, bottom-sheets parciales, el zoom automático que iOS aplica a
los inputs de menos de 16px. Son los detalles que separan "es responsive" de "se
puede usar".

- Rediseño responsive de todas las vistas (productos, categorías, proveedores,
  movimientos, tablas).
- Modales adaptados a móvil como bottom-sheet.
- **Recepción masiva** y **pedido rápido** para cargas grandes.
- Atajos de teclado para uso con escritorio.

## Multi-tenant

- Aislamiento de datos por inquilino.
- Jerarquía de credenciales: superadmin definido por variables de entorno, no en
  la base de datos.
- Roles administrador/operador; los empleados no pueden modificar sus propias
  credenciales (decisión deliberada, revertida tras detectar el hueco).
- Endpoints `/api/setup-check` y `/api/setup-init` para diagnóstico de arranque.

## Stack

| Capa | Tecnología |
|---|---|
| API | Flask · SQLAlchemy 2 · Flask-JWT-Extended · Flask-Login |
| Datos | PostgreSQL en producción · SQLite como *fallback* local |
| Frontend | React · PWA · i18n |
| Tiempo real | WebSockets |
| Despliegue | Docker · Railway |

## Detalles de implementación

- *Fallback* automático a SQLite en desarrollo, con corrección del prefijo
  `postgres://` → `postgresql://` que Railway inyecta y SQLAlchemy 2 rechaza.
- Inicialización de base de datos y superadmin en el arranque, en bloques
  separados para que un fallo no impida levantar el servicio.

## Licencia

Propietario — todos los derechos reservados. Visible para evaluación técnica;
no se autoriza su uso, copia ni distribución. Ver [LICENSE](LICENSE).
