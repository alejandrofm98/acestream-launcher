# Contexto de despliegue

Estado: repositorio preparado; configuración del servicio en Dokploy pendiente de terminar y verificar.

## GitHub y Dokploy

- Repositorio solicitado: `https://github.com/alejandrofm98/acestream-launcher`.
- Visibilidad: público (confirmada mediante GitHub, 2026-10-26).
- Rama por defecto en GitHub: `main` (confirmada mediante GitHub, 2026-10-26); rama de despliegue en Dokploy: pendiente de verificar.
- Proyecto / entorno / servicio de Dokploy: pendiente de crear.
- Auto Deploy / trigger / filtros de ruta: pendiente de verificar en el panel.
- Dominio del servicio y URL pública de salud: pendientes de asignar y probar.
- Fuente del estado de Dokploy: pendiente de verificación autenticada. El inventario local de servicios fue verificado el 2026-10-10, antes de crear este repositorio, y no registra un servicio para él.
- Fecha de configuración de Dokploy: pendiente.

Antes de otro push a `main`, confirma en Dokploy la rama y todos sus destinos con Auto Deploy. La rama `main` se creó como la rama por defecto del nuevo repositorio; la configuración de despliegue no se infiere de ella.

## Compose

- Tipo: web estática detrás de Nginx.
- Compose: `docker-compose.yml` en la raíz.
- Contexto de build: raíz del repositorio.
- Dockerfile: `Dockerfile`.
- Servicio: `web`, HTTP interno en puerto 80.
- Healthcheck de contenedor: `GET /health`.
- Volúmenes y estado persistente: ninguno.
- Variables: ninguna.

El servicio solo entrega los archivos del catálogo y la interfaz. Ace Stream se abre localmente en el dispositivo del usuario; el contenedor no ejecuta Ace Stream, no descarga P2P y no retransmite el vídeo.

## PostgreSQL

Esta aplicación no usa PostgreSQL ni otra base de datos. No requiere migraciones ni recursos de base de datos en Dokploy.

## Verificación y publicación

- Pruebas del catálogo y la interfaz: `npm test`.
- Validación de Compose: `docker compose -f docker-compose.yml config --quiet`.
- Build: `docker compose -f docker-compose.yml build`.
- Salud después de desplegar: HTTP 200 en `/health` y comprobación de la página y catálogo mediante el dominio asignado.
- Despliegue en Dokploy: pendiente; no declarar éxito hasta verificar el estado del servicio y la URL.
- Rollback: restaurar el commit o la imagen anterior. No hay datos de aplicación que migrar o recuperar.
