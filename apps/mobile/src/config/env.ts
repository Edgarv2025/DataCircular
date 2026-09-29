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
 * Configuración dinámica de entorno para la aplicación móvil DATA_CIRCULAR.
 *
 * Prioridades de resolución:
 * 1. Variable de entorno explícita: EXPO_PUBLIC_API_URL
 * 2. Navegador Web / Simulador iOS: http://localhost:3000/api/v1
 * 3. Dispositivo físico con Expo Go: Detecta la IP del host desde Constants.expoConfig.hostUri
 * 4. Emulador Android Studio: http://10.0.2.2:3000/api/v1
 * 5. Fallback red local Wi-Fi: http://192.168.10.11:3000/api/v1
 */
function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const os = getPlatformOS();

  // En navegador Web se usa localhost
  if (os === 'web') {
    return 'http://localhost:3000/api/v1';
  }

  // En dispositivo móvil con Expo Go, intentar obtener la IP del computador
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants');
    const config = Constants?.default?.expoConfig || Constants?.expoConfig;
    const hostUri = config?.hostUri;

    if (hostUri && typeof hostUri === 'string') {
      const hostIp = hostUri.split(':')[0];
      if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
        return `http://${hostIp}:3000/api/v1`;
      }
    }
  } catch {
    // Continuar con resolución por plataforma
  }

  if (os === 'android') {
    // Si corre en emulador local de Android Studio
    return 'http://10.0.2.2:3000/api/v1';
  }

  // Fallback con la IP local Wi-Fi de desarrollo en Bogotá
  return 'http://192.168.10.11:3000/api/v1';
}

export const Config = {
  apiUrl: getApiBaseUrl(),
  appName: 'DATA_CIRCULAR',
  organization: 'Fundación IMARA',
  city: 'Bogotá D.C., Colombia',
};
