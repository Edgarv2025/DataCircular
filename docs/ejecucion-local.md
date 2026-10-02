# Ejecución local

## Iniciar API y aplicación móvil

Desde la raíz del repositorio ejecuta:

```bash
npm run dev
```

El comando inicia la API en `http://localhost:3000` y Expo en modo LAN, que muestra un QR para Expo Go. El teléfono y el computador deben estar en la misma red Wi-Fi. En la consola de Expo, pulsa `w` para abrir la versión web.

Pulsa `Ctrl+C` para detener ambos procesos.

Si el puerto predeterminado de Expo está ocupado, acepta el puerto alternativo que proponga Expo y usa el QR actualizado. Si la red local bloquea la conexión del teléfono, inicia Expo por túnel desde una segunda terminal:

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