# Instrucciones del proyecto

@docs/deployment.md

- Este proyecto entrega una web estática mediante Docker Compose en Dokploy.
- El vídeo se reproduce en Ace Stream instalado en el dispositivo; este sitio no ejecuta ni retransmite el motor P2P.
- El catálogo es `dist/channels.json`. Cambiarlo afecta al contenido de la web.
- Valida cambios locales con `npm test` y `docker compose config --quiet`.
- No se usa PostgreSQL ni hay migraciones.
- Consulta el destino de Dokploy y Auto Deploy en `docs/deployment.md` antes de publicar.
