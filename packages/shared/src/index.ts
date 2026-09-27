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

// ==========================================
// Tipos de Dominio de Usuario (Fase 2)
// ==========================================

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type UserRole = 'USER' | 'ADMIN';

/**
 * Representación segura de usuario para consumo público / frontend.
 * NUNCA incluye passwordHash ni información de seguridad sensible.
 */
export interface SafeUserDto {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  phone?: string | null;
  passwordHash: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  fullName?: string;
  phone?: string | null;
}
