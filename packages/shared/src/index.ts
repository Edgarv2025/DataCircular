/**
 * DATA_CIRCULAR - Paquete Compartido (Shared)
 * Contiene contratos de API, tipos comunes y esquemas compartidos entre API y Mobile.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface HealthCheckData {
  service: string;
  version: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptimeSeconds: number;
  database: {
    status: 'connected' | 'disconnected' | 'error';
    latencyMs?: number;
  };
  environment: string;
}
