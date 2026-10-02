# Ejecución local

## Iniciar API y aplicación móvil

Desde la raíz del repositorio ejecuta:

```bash
npm run dev
```

El comando reutiliza la API saludable en el puerto `3000` o busca uno libre entre `3000` y `3010`. Expo busca un puerto libre entre `8081` y `8090`, evitando prompts por colisiones, y muestra un QR para Expo Go. El teléfono y el computador deben estar en la misma red Wi-Fi. En la consola de Expo, pulsa `w` para abrir la versión web.

El puerto seleccionado para la API se comparte automáticamente con la app móvil. Durante desarrollo, CORS permite los orígenes `localhost` y `127.0.0.1` aunque Expo seleccione un puerto distinto.

Pulsa `Ctrl+C` para detener los procesos iniciados por el comando.

Si la red local bloquea la conexión del teléfono, inicia Expo por túnel desde una segunda terminal:

```bash
cd apps/mobile
npx expo start --tunnel
```

## Iniciar servicios por separado

```bash
npm run dev:api
npm run dev:mobile
npm run mobile:web
```