import { z } from 'zod';

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
// Tipos de Dominio de Usuario (Fase 2 y 4)
// ==========================================

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type UserRole = 'USER' | 'ADMIN';

/**
 * Representación segura de usuario para consumo autenticado (perfil propio).
 * NUNCA incluye passwordHash.
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

/**
 * Representación pública de un usuario (para otros usuarios del marketplace).
 * Omite deliberadamente email, teléfono, status privado y metadatos sensibles.
 */
export interface PublicUserDto {
  id: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
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

export interface AdminUpdateUserInput {
  fullName?: string;
  phone?: string | null;
  status?: UserStatus;
  role?: UserRole;
}

// ==========================================
// Esquemas de Validación con Zod (Fase 3: Auth)
// ==========================================

/**
 * Expresión regular para contraseña segura:
 * Al menos 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial.
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-\[\]{}|:;<>,./~`]).{8,100}$/;

export const registerSchema = z.object({
  fullName: z
    .string({ required_error: 'El nombre completo es requerido' })
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(150, 'El nombre no puede exceder 150 caracteres'),
  email: z
    .string({ required_error: 'El correo electrónico es requerido' })
    .trim()
    .toLowerCase()
    .email('Formato de correo electrónico inválido')
    .max(255, 'El correo no puede exceder 255 caracteres'),
  password: z
    .string({ required_error: 'La contraseña es requerida' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .regex(
      PASSWORD_REGEX,
      'La contraseña debe incluir al menos una letra mayúscula, una minúscula, un número y un carácter especial'
    ),
  phone: z
    .string()
    .trim()
    .max(30, 'El teléfono no puede exceder 30 caracteres')
    .optional()
    .nullable(),
});

export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'El correo electrónico es requerido' })
    .trim()
    .toLowerCase()
    .email('Formato de correo electrónico inválido'),
  password: z
    .string({ required_error: 'La contraseña es requerida' })
    .min(1, 'La contraseña es requerida'),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: 'El token de actualización es requerido' })
    .min(10, 'Token de actualización inválido'),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponseDto {
  user: SafeUserDto;
  tokens: AuthTokens;
}

// ==========================================
// Esquemas de Validación (Fase 4: CRUD Usuarios)
// ==========================================

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(150, 'El nombre no puede exceder 150 caracteres')
    .optional(),
  phone: z
    .string()
    .trim()
    .max(30, 'El teléfono no puede exceder 30 caracteres')
    .optional()
    .nullable(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export const adminUpdateUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3)
    .max(150)
    .optional(),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .nullable(),
  status: z
    .enum(['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const)
    .optional(),
  role: z
    .enum(['USER', 'ADMIN'] as const)
    .optional(),
});

export type AdminUpdateUserDto = z.infer<typeof adminUpdateUserSchema>;
