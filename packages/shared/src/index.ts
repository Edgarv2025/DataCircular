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
export const USER_TYPES = ['GENERATOR', 'RECYCLER', 'TRANSPORTER', 'TRANSFORMER'] as const;
export type UserType = (typeof USER_TYPES)[number];

export interface SafeUserDto {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  userType: UserType;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface DataPolicyInfoDto {
  available: boolean;
  url: string | null;
  version: string;
}

export interface PublicUserDto {
  id: string;
  fullName: string;
  role: UserRole;
  userType: UserType;
  createdAt: string;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  phone?: string | null;
  userType: UserType;
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
  userType?: UserType;
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
  userType: z.enum(USER_TYPES, {
    required_error: 'El tipo de usuario es requerido',
    invalid_type_error: 'Selecciona un tipo de usuario válido',
  }),
  dataPolicyAccepted: z
    .boolean({ required_error: 'Debes aceptar el tratamiento de datos personales' })
    .refine((accepted) => accepted, 'Debes aceptar el tratamiento de datos personales'),
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
  userType: z.enum(USER_TYPES).optional(),
});

export type AdminUpdateUserDto = z.infer<typeof adminUpdateUserSchema>;

export const adminCreateUserSchema = registerSchema.omit({ dataPolicyAccepted: true }).extend({
  role: z.enum(['USER', 'ADMIN'] as const).optional(),
});

export type AdminCreateUserDto = z.infer<typeof adminCreateUserSchema>;

// ==========================================
// Entidades y DTOs de Organizaciones (Fase 7)
// ==========================================

export const ORGANIZATION_TYPES = [
  'COMPANY',      // Empresa (S.A.S., S.A., Ltda., etc.)
  'ASSOCIATION',  // Asociación de recicladores de oficio
  'FOUNDATION',   // Fundación (ej. Fundación IMARA)
  'COOPERATIVE',  // Cooperativa de reciclaje y trabajo asociado
  'INSTITUTION',  // Entidad pública / municipal (ej. UAESP, Alcaldía)
] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export const ORGANIZATION_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export const VERIFICATION_STATUSES = ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const MEMBERSHIP_STATUSES = ['ACTIVE', 'INVITED', 'INACTIVE'] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const ORG_ROLE_NAMES = ['OWNER', 'ADMIN', 'MEMBER', 'OPERATOR'] as const;
export type OrgRoleName = (typeof ORG_ROLE_NAMES)[number];

export interface PermissionDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string;
}

export interface RoleDto {
  id: string;
  organizationId: string | null;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: PermissionDto[];
}

export interface OrganizationMemberDto {
  id: string;
  organizationId: string;
  userId: string;
  roleId: string;
  status: MembershipStatus;
  joinedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
  role: {
    id: string;
    name: string;
    description: string | null;
  };
}

export interface OrganizationDto {
  id: string;
  name: string;
  legalName: string | null;
  taxId: string | null;
  orgType: OrganizationType;
  activityType: UserType;
  email: string | null;
  phone: string | null;
  address: string | null;
  locality: string | null;
  city: string;
  status: OrganizationStatus;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  verificationNotes: string | null;
  certificateUrl: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  membersCount?: number;
  userRole?: string; // Rol del usuario autenticado en esta organización
}

// ==========================================
// Esquemas de Validación con Zod (Fase 7)
// ==========================================

export const createOrganizationSchema = z.object({
  name: z
    .string({ required_error: 'El nombre comercial es requerido' })
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(150, 'El nombre no puede exceder 150 caracteres'),
  legalName: z
    .string()
    .trim()
    .min(3, 'La razón social debe tener al menos 3 caracteres')
    .max(200, 'La razón social no puede exceder 200 caracteres')
    .optional()
    .nullable(),
  taxId: z
    .string()
    .trim()
    .min(5, 'El NIT debe tener al menos 5 caracteres')
    .max(50, 'El NIT no puede exceder 50 caracteres')
    .regex(/^[0-9.-]+$/, 'El NIT solo puede contener números, puntos y guiones')
    .optional()
    .nullable(),
  orgType: z.enum(ORGANIZATION_TYPES, {
    invalid_type_error: 'Tipo de organización inválido',
  }).default('COMPANY'),
  activityType: z.enum(USER_TYPES, {
    invalid_type_error: 'Tipo de actividad circular inválido',
  }).default('GENERATOR'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Correo electrónico corporativo inválido')
    .optional()
    .nullable(),
  phone: z
    .string()
    .trim()
    .max(30, 'El teléfono no puede exceder 30 caracteres')
    .optional()
    .nullable(),
  address: z
    .string()
    .trim()
    .max(255, 'La dirección no puede exceder 255 caracteres')
    .optional()
    .nullable(),
  locality: z
    .enum(BOGOTA_LOCALITIES, {
      invalid_type_error: 'Selecciona una localidad oficial de Bogotá válida',
    })
    .optional()
    .nullable(),
  city: z
    .string()
    .trim()
    .default('Bogotá D.C.'),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(150, 'El nombre no puede exceder 150 caracteres')
    .optional(),
  legalName: z
    .string()
    .trim()
    .min(3, 'La razón social debe tener al menos 3 caracteres')
    .max(200, 'La razón social no puede exceder 200 caracteres')
    .optional()
    .nullable(),
  taxId: z
    .string()
    .trim()
    .min(5, 'El NIT debe tener al menos 5 caracteres')
    .max(50, 'El NIT no puede exceder 50 caracteres')
    .regex(/^[0-9.-]+$/, 'El NIT solo puede contener números, puntos y guiones')
    .optional()
    .nullable(),
  orgType: z.enum(ORGANIZATION_TYPES).optional(),
  activityType: z.enum(USER_TYPES).optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Correo electrónico corporativo inválido')
    .optional()
    .nullable(),
  phone: z
    .string()
    .trim()
    .max(30, 'El teléfono no puede exceder 30 caracteres')
    .optional()
    .nullable(),
  address: z
    .string()
    .trim()
    .max(255, 'La dirección no puede exceder 255 caracteres')
    .optional()
    .nullable(),
  locality: z
    .enum(BOGOTA_LOCALITIES)
    .optional()
    .nullable(),
  city: z
    .string()
    .trim()
    .optional(),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

export const addMemberSchema = z.object({
  email: z
    .string({ required_error: 'El correo electrónico del miembro es requerido' })
    .trim()
    .toLowerCase()
    .email('Formato de correo electrónico inválido'),
  roleName: z
    .enum(ORG_ROLE_NAMES, {
      required_error: 'El rol en la organización es requerido',
      invalid_type_error: 'Rol de organización inválido (OWNER, ADMIN, MEMBER, OPERATOR)',
    })
    .default('MEMBER'),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const updateMemberRoleSchema = z.object({
  roleName: z.enum(ORG_ROLE_NAMES, {
    required_error: 'El rol en la organización es requerido',
  }),
  status: z.enum(MEMBERSHIP_STATUSES).optional(),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

export const requestVerificationSchema = z.object({
  notes: z
    .string()
    .trim()
    .max(500, 'Las notas de verificación no pueden exceder 500 caracteres')
    .optional(),
  certificateUrl: z
    .string()
    .trim()
    .url('Debe ser una URL válida')
    .optional()
    .nullable(),
});

export type RequestVerificationInput = z.infer<typeof requestVerificationSchema>;

export const reviewVerificationSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED'] as const, {
    required_error: 'El estado de revisión debe ser VERIFIED o REJECTED',
  }),
  notes: z
    .string()
    .trim()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional(),
});

export type ReviewVerificationInput = z.infer<typeof reviewVerificationSchema>;

// ==========================================
// Catálogo de Materiales y Publicaciones (Fase 8)
// ==========================================

export const PUBLICATION_TYPES = ['OFFER', 'NEED'] as const;
export type PublicationType = (typeof PUBLICATION_TYPES)[number];

export const PUBLICATION_STATUSES = ['ACTIVE', 'PAUSED', 'CLOSED', 'EXPIRED'] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export interface MaterialCategoryDto {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: {
    id: string;
    name: string;
  } | null;
  subcategories?: MaterialCategoryDto[];
}

export interface UnitDto {
  id: string;
  name: string;
  abbreviation: string;
  active: boolean;
}

export interface MaterialPublicationDto {
  id: string;
  type: PublicationType;
  ownerUserId: string;
  organizationId: string | null;
  categoryId: string;
  quantity: number;
  unitId: string;
  locationAddress: string;
  locationCity: string | null;
  locationArea: string | null;
  condition: string | null;
  photoUrl: string | null;
  isUrgent: boolean;
  status: PublicationStatus;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  ownerUser?: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
  organization?: {
    id: string;
    name: string;
    legalName: string | null;
  } | null;
  category?: MaterialCategoryDto;
  unit?: UnitDto;
  publicacionesCompatibles?: number;
}

// Esquemas Zod para Catálogo
export const createCategorySchema = z.object({
  name: z
    .string({ required_error: 'El nombre de la categoría es requerido' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  description: z
    .string()
    .trim()
    .max(255, 'La descripción no puede exceder 255 caracteres')
    .optional()
    .nullable(),
  parentId: z
    .string()
    .uuid('El parentId debe ser un UUID válido')
    .optional()
    .nullable(),
  active: z.boolean().default(true).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional(),
  description: z
    .string()
    .trim()
    .max(255, 'La descripción no puede exceder 255 caracteres')
    .optional()
    .nullable(),
  parentId: z
    .string()
    .uuid('El parentId debe ser un UUID válido')
    .optional()
    .nullable(),
  active: z.boolean().optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const createUnitSchema = z.object({
  name: z
    .string({ required_error: 'El nombre de la unidad es requerido' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  abbreviation: z
    .string({ required_error: 'La abreviatura es requerida' })
    .trim()
    .min(1, 'La abreviatura debe tener al menos 1 carácter')
    .max(10, 'La abreviatura no puede exceder 10 caracteres'),
  active: z.boolean().default(true).optional(),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;

// Esquemas Zod para Publicaciones
export const createPublicationSchema = z.object({
  type: z.enum(PUBLICATION_TYPES, {
    required_error: 'El tipo de publicación es requerido (OFFER o NEED)',
  }),
  organizationId: z
    .string()
    .uuid('El ID de organización debe ser un UUID válido')
    .optional()
    .nullable(),
  categoryId: z
    .string({ required_error: 'La subcategoría de material es requerida' })
    .uuid('El ID de categoría debe ser un UUID válido'),
  quantity: z
    .number({ required_error: 'La cantidad es requerida' })
    .positive('La cantidad debe ser mayor a cero'),
  unitId: z
    .string({ required_error: 'La unidad de medida es requerida' })
    .uuid('El ID de unidad debe ser un UUID válido'),
  locationAddress: z
    .string({ required_error: 'La dirección de ubicación es requerida' })
    .trim()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(255, 'La dirección no puede exceder 255 caracteres'),
  locationCity: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .default('Bogotá D.C.')
    .optional(),
  locationArea: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .nullable(),
  condition: z
    .string()
    .trim()
    .max(100, 'La condición no puede exceder 100 caracteres')
    .optional()
    .nullable(),
  photoUrl: z
    .string()
    .trim()
    .url('La URL de foto debe ser válida')
    .max(500)
    .optional()
    .nullable(),
  isUrgent: z.boolean().default(false).optional(),
  expiresAt: z
    .string()
    .datetime({ message: 'La fecha de expiración debe tener formato ISO 8601' })
    .optional()
    .nullable(),
});

export type CreatePublicationInput = z.infer<typeof createPublicationSchema>;

export const updatePublicationSchema = z.object({
  quantity: z
    .number()
    .positive('La cantidad debe ser mayor a cero')
    .optional(),
  unitId: z
    .string()
    .uuid('El ID de unidad debe ser un UUID válido')
    .optional(),
  locationAddress: z
    .string()
    .trim()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(255, 'La dirección no puede exceder 255 caracteres')
    .optional(),
  locationCity: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .optional(),
  locationArea: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .nullable(),
  condition: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable(),
  photoUrl: z
    .string()
    .trim()
    .url('La URL de foto debe ser válida')
    .max(500)
    .optional()
    .nullable(),
  isUrgent: z.boolean().optional(),
  status: z.enum(PUBLICATION_STATUSES).optional(),
  expiresAt: z
    .string()
    .datetime({ message: 'La fecha de expiración debe tener formato ISO 8601' })
    .optional()
    .nullable(),
});

export type UpdatePublicationInput = z.infer<typeof updatePublicationSchema>;

// ==========================================
// FASE 9: BÚSQUEDA, FILTROS Y COINCIDENCIAS
// ==========================================

export const PUBLICATION_SORT_OPTIONS = ['recent', 'urgent_first'] as const;
export type PublicationSortOption = (typeof PUBLICATION_SORT_OPTIONS)[number];

export const searchPublicationsQuerySchema = z.object({
  type: z.enum(PUBLICATION_TYPES).optional(),
  categoryId: z.string().uuid('El ID de categoría debe ser un UUID válido').optional(),
  city: z.string().trim().optional(),
  area: z.string().trim().optional(),
  minQuantity: z.coerce.number().min(0, 'La cantidad mínima no puede ser negativa').optional(),
  maxQuantity: z.coerce.number().min(0, 'La cantidad máxima no puede ser negativa').optional(),
  unitId: z.string().uuid('El ID de unidad debe ser un UUID válido').optional(),
  isUrgent: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
    .optional(),
  status: z.enum(PUBLICATION_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).default(20).optional(),
  sortBy: z.enum(PUBLICATION_SORT_OPTIONS).default('recent').optional(),
});

export type SearchPublicationsQuery = z.infer<typeof searchPublicationsQuerySchema>;

export interface PublicationSearchResultDto {
  data: MaterialPublicationDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PublicationMatchDto {
  publicationId: string;
  score: number;
  factors: string[];
  publication?: MaterialPublicationDto;
}

export interface MySuggestionsItemDto {
  publicationId: string;
  publication: MaterialPublicationDto;
  matches: PublicationMatchDto[];
}


