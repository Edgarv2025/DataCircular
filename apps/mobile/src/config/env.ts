function getPlatformOS(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rn = require('react-native');
    return rn?.Platform?.OS || 'web';
  } catch {
    return 'web';
  }
}

/**
 * Configuración de entorno para la aplicación móvil DATA_CIRCULAR.
 *
 * Para pruebas en dispositivo físico con Expo Go:
 * Puedes definir en apps/mobile/.env:
 * EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3000/api/v1
 *
 * En emulador Android: 10.0.2.2 mapea a localhost de la máquina anfitriona.
 * En Web y simulador iOS: localhost funciona directamente.
 */
function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const os = getPlatformOS();
  if (os === 'android') {
    // Si estás en emulador de Android de Android Studio, 10.0.2.2 es localhost
    return 'http://10.0.2.2:3000/api/v1';
  }

  // Web o iOS Simulator
  return 'http://localhost:3000/api/v1';
}

export const Config = {
  apiUrl: getApiBaseUrl(),
  appName: 'DATA_CIRCULAR',
  organization: 'Fundación IMARA',
  city: 'Bogotá D.C., Colombia',
};
