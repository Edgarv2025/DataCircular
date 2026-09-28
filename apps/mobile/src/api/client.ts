import { Config } from '../config/env';
import { StorageService } from '../services/storage';
import { ApiResponse } from '@data-circular/shared';

export class ApiError extends Error {
  public status: number;
  public details?: unknown;

  constructor(message: string, status: number = 0, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Cliente HTTP base para la app móvil DATA_CIRCULAR.
 * Realiza peticiones reales contra el backend configurado.
 * Inyecta el token Bearer guardado de forma segura y maneja errores de red.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${Config.apiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Headers base
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Inyectar token de autenticación si existe
  const token = await StorageService.getAccessToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data: ApiResponse<T> = isJson ? await response.json() : null;

    if (!response.ok) {
      // Manejar error 401 (token expirado o inválido)
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        await StorageService.clearSession();
      }

      const errorMessage =
        data?.message ||
        data?.error?.message ||
        `Error del servidor (${response.status}): ${response.statusText}`;

      throw new ApiError(errorMessage, response.status, data?.error?.details);
    }

    return (data?.data ?? data) as T;
  } catch (err: any) {
    // Si ya es un ApiError con estado HTTP, relanzarlo
    if (err instanceof ApiError) {
      throw err;
    }

    // Detectar fallos de red / conexión rechazada
    const isNetworkError =
      err.message?.includes('Network request failed') ||
      err.message?.includes('Failed to fetch') ||
      err.message?.includes('NetworkError') ||
      err.message?.includes('ECONNREFUSED');

    if (isNetworkError) {
      throw new ApiError(
        `No se pudo conectar con el servidor backend DATA_CIRCULAR (${Config.apiUrl}). Por favor verifica que el servidor esté encendido y que tu conexión a la red de Bogotá esté activa.`,
        0
      );
    }

    throw new ApiError(err.message || 'Ocurrió un error inesperado al comunicarse con el servidor.', 0);
  }
}
