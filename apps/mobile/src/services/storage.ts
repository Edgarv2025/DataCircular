import { SafeUserDto } from '@data-circular/shared';

const TOKEN_KEY = 'data_circular_access_token';
const REFRESH_TOKEN_KEY = 'data_circular_refresh_token';
const USER_KEY = 'data_circular_user_profile';

const memoryStore = new Map<string, string>();

function isWebPlatform(): boolean {
  if (typeof window !== 'undefined' || typeof localStorage !== 'undefined') {
    return true;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rn = require('react-native');
    return rn?.Platform?.OS === 'web';
  } catch {
    return true;
  }
}

function getSecureStore(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-secure-store');
  } catch {
    return null;
  }
}

function getStorageItem(key: string): string | null {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(key);
  }
  return memoryStore.get(key) || null;
}

function setStorageItem(key: string, value: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
  } else {
    memoryStore.set(key, value);
  }
}

function removeStorageItem(key: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
  } else {
    memoryStore.delete(key);
  }
}

/**
 * Servicio de almacenamiento seguro para DATA_CIRCULAR.
 * Utiliza el llavero seguro (Keychain en iOS / Keystore en Android) mediante Expo SecureStore.
 * En Web utiliza localStorage de forma transparente.
 * NUNCA almacena contraseñas.
 */
export const StorageService = {
  async saveTokens(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      const secureStore = getSecureStore();
      if (isWebPlatform() || !secureStore) {
        setStorageItem(TOKEN_KEY, accessToken);
        if (refreshToken) setStorageItem(REFRESH_TOKEN_KEY, refreshToken);
      } else {
        await secureStore.setItemAsync(TOKEN_KEY, accessToken);
        if (refreshToken) await secureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (err) {
      console.error('[Storage Error] No se pudo guardar el token:', err);
    }
  },

  async getAccessToken(): Promise<string | null> {
    try {
      const secureStore = getSecureStore();
      if (isWebPlatform() || !secureStore) {
        return getStorageItem(TOKEN_KEY);
      }
      return await secureStore.getItemAsync(TOKEN_KEY);
    } catch (err) {
      console.error('[Storage Error] No se pudo leer el token:', err);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      const secureStore = getSecureStore();
      if (isWebPlatform() || !secureStore) {
        return getStorageItem(REFRESH_TOKEN_KEY);
      }
      return await secureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (err) {
      console.error('[Storage Error] No se pudo leer el refresh token:', err);
      return null;
    }
  },

  async saveUser(user: SafeUserDto): Promise<void> {
    try {
      const data = JSON.stringify(user);
      const secureStore = getSecureStore();
      if (isWebPlatform() || !secureStore) {
        setStorageItem(USER_KEY, data);
      } else {
        await secureStore.setItemAsync(USER_KEY, data);
      }
    } catch (err) {
      console.error('[Storage Error] No se pudo guardar el perfil:', err);
    }
  },

  async getUser(): Promise<SafeUserDto | null> {
    try {
      const secureStore = getSecureStore();
      let raw: string | null = null;
      if (isWebPlatform() || !secureStore) {
        raw = getStorageItem(USER_KEY);
      } else {
        raw = await secureStore.getItemAsync(USER_KEY);
      }
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async clearSession(): Promise<void> {
    try {
      const secureStore = getSecureStore();
      if (isWebPlatform() || !secureStore) {
        removeStorageItem(TOKEN_KEY);
        removeStorageItem(REFRESH_TOKEN_KEY);
        removeStorageItem(USER_KEY);
      } else {
        await secureStore.deleteItemAsync(TOKEN_KEY);
        await secureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        await secureStore.deleteItemAsync(USER_KEY);
      }
    } catch (err) {
      console.error('[Storage Error] Error al limpiar sesión:', err);
    }
  },
};
