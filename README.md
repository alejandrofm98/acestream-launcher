# Ace Stream Launcher

Lanzador web estático en español para elegir un canal y una calidad y abrirlos con Ace Stream instalado en Windows, Linux o Android. No necesita build ni dependencias externas.

## Contenedor

La web se puede servir directamente con el Docker Compose incluido; Dokploy construye la imagen Nginx a partir de `Dockerfile`. El endpoint `/health` devuelve HTTP 200 para las comprobaciones del servicio. El catálogo `/channels.json` evita caché para que los cambios estén disponibles tras publicar el archivo.

```sh
docker compose up --build
```

## Uso local

Desde esta carpeta:

```sh
python3 -m http.server --directory dist 8080
```

Abre `http://localhost:8080`. La interfaz carga `dist/channels.json` desde el mismo origen. El catálogo incluido tiene un único elemento: `Canal de prueba`, con la etiqueta de calidad `Original` y el enlace de prueba proporcionado. “Original” es solo una etiqueta; no afirma resolución ni disponibilidad del contenido.

La selección inicial es `prueba` / `original`. Elegir un canal o una calidad nunca abre el reproductor automáticamente: hay que confirmar que Ace Stream está instalado y pulsar **Abrir canal en Ace Stream**. El navegador y el sistema deciden si pueden abrirlo. El estado posterior solo informa que se envió una solicitud, no que la aplicación esté instalada o reproduciendo.

## Catálogo

`dist/channels.json` es una lista estática. Cada canal requiere un `id`, un `name` y una o más `qualities`; cada calidad requiere un `id`, un `label` y un `url` con el formato exacto `acestream://` seguido de un ID hexadecimal de 40 caracteres. No añadas parámetros, rutas ni espacios al enlace. La página valida la estructura, los IDs duplicados (ID de canal y, dentro de cada canal, ID de calidad) y cada enlace antes de habilitar el envío. El mismo enlace puede aparecer en más de una calidad o canal. Los nombres se insertan como texto, no como HTML.

```json
[
  {
    "id": "prueba",
    "name": "Canal de prueba",
    "qualities": [
      {
        "id": "original",
        "label": "Original",
        "url": "acestream://574e7432eb6b80e541fd42759850dd8bc7b7fa28"
      }
    ]
  }
]
```

Si el catálogo falla, la interfaz no habilita el lanzamiento y ofrece reintentar. El contenido se reproduce en Ace Stream; esta web no retransmite la señal.

## Plataformas y límites

En Android se usa un intent genérico sin paquete fijado, con retorno a la ayuda de esta página sin el ID, y se ofrece el enlace `acestream://` estándar como alternativa. Hace falta Ace Stream con reproductor y compatibilidad para abrir estos enlaces; instalar solo el engine no lo garantiza. En Linux hace falta registrar `x-scheme-handler/acestream`; se puede consultar con `xdg-mime query default x-scheme-handler/acestream`. En iOS el envío está bloqueado porque hace falta un motor externo compatible.

## Comprobaciones

Con Node.js 18 o posterior, ejecuta `npm test` desde esta carpeta. No instala dependencias. Las pruebas validan catálogo, IDs y selección, además de detección de plataforma y construcción de enlaces. No abren el enlace de prueba ni prueban reproducción. La apertura real queda pendiente de comprobar en dispositivos con Ace Stream instalado.

## Referencias

- [Android Intents: abrir enlaces desde el navegador](https://developer.chrome.com/docs/android/intents)
- [Ace Stream: sitio oficial](https://www.acestream.org/)
- [Ace Stream: productos y documentación](https://docs.acestream.net/products/)
- [Android Engine: manifiesto público de Activities y filtros](https://github.com/acestream/acestream-engine-android/blob/master/app/src/main/AndroidManifest.xml)
