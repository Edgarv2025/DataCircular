import { z } from 'zod';

/**
 * DATA_CIRCULAR - Paquete Compartido (Shared)
 * Contratos de API, tipos de dominio, esquemas de validación y localización (Bogotá, Colombia).
 * Contexto: Proyecto de Práctica Universitaria - Fundación IMARA
 */

// ==========================================
// Localización y Contexto Territorial (Colombia - Bogotá D.C.)
// ==========================================

export const COUNTRY_CONFIG = {
  country: 'Colombia',
  countryCode: 'CO',
  dialCode: '+57',
  currency: 'COP',
  currencySymbol: '$',
  locale: 'es-CO',
  timezone: 'America/Bogota', // UTC-5
};

export const BOGOTA_LOCATION = {
  city: 'Bogotá D.C.',
  department: 'Bogotá D.C.',
  country: 'Colombia',
  coordinates: {
    latitude: 4.7110,
    longitude: -74.0721,
  },
};

/**
 * Las 20 Localidades Oficiales de Bogotá D.C.
 */
export const BOGOTA_LOCALITIES = [
  'Usaquén',
  'Chapinero',
  'Santa Fe',
  'San Cristóbal',
  'Usme',
  'Tunjuelito',
  'Bosa',
  'Kennedy',
  'Fontibón',
  'Engativá',
  'Suba',
  'Barrios Unidos',
  'Teusaquillo',
  'Los Mártires',
  'Antonio Nariño',
  'Puente Aranda',
  'La Candelaria',
  'Rafael Uribe Uribe',
  'Ciudad Bolívar',
  'Sumapaz',
] as const;

export type BogotaLocality = (typeof BOGOTA_LOCALITIES)[number];

/**
 * Formato de moneda colombiana (COP)
 * Ejemplo: formatCOP(250000) => "$ 250.000 COP"
 */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' COP';
}

/**
 * Categorías principales de materiales recuperables en Colombia
 * Basado en la normativa ambiental colombiana (Resolución 2184 de 2019 / Código de Colores)
 */
export const MATERIAL_CATEGORIES_COLOMBIA = [
  { id: 'PLASTICOS', name: 'Plásticos Aprovechables', subcategories: ['PET', 'PEAD / HDPE', 'PEBD / LDPE', 'PP (Polipropileno)', 'PVC'] },
  { id: 'METALES', name: 'Metales y Chatarra', subcategories: ['Aluminio (Latas/Perfiles)', 'Cobre', 'Bronce', 'Hierro / Chatarra ferrosa', 'Acero'] },
  { id: 'PAPEL_CARTON', name: 'Papel y Cartón', subcategories: ['Cartón Corrugado / Ondulado', 'Papel Archivo Blanco', 'Plegadiza', 'Periódico'] },
  { id: 'VIDRIO', name: 'Vidrio Aprovechable', subcategories: ['Vidrio Transparente', 'Vidrio Verde', 'Vidrio Ámbar'] },
  { id: 'RAEE', name: 'Residuos Eléctricos y Electrónicos (RAEE)', subcategories: ['Equipos de Cómputo', 'Celulares y Baterías', 'Electrodomésticos'] },
  { id: 'TEXTILES', name: 'Textiles Recuperables', subcategories: ['Retazos Industriales', 'Algodón', 'Prendas en Desuso'] },
  { id: 'ORGANICOS', name: 'Orgánicos y Biomasa', subcategories: ['Residuos de Alimentos no Cocinados', 'Podas y Jardinería', 'Residuos Agroindustriales'] },
] as const;

// ==========================================
// Expresión Regular para Celulares en Colombia
// Válido para formato local 3XXXXXXXXX o internacional +57 3XXXXXXXXX
// ==========================================
export const COLOMBIA_PHONE_REGEX = /^(?:\+?57\s?)?3\d{2}\s?\d{3}\s?\d{4}$/;

// ==========================================
// Interfaces Base de API
// ==========================================

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
// Esquemas de Validación con Zod (Fase 3 y 4)
// ==========================================

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
