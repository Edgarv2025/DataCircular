/** © 2026 Fundación IMARA. Elaborado por Edgar Vásquez. */
/**
 * DATA_CIRCULAR - Tipos y DTOs del Módulo de Verificaciones y Parámetros (Bloque C2)
 * Incluye modelos para tarifas, auditoría (AuditLog), solicitudes y snapshots de cobro.
 */

export const VERIFICATION_REQUEST_TYPES = ['SELF', 'OTHER'] as const;
export type VerificationRequestType = (typeof VERIFICATION_REQUEST_TYPES)[number];

export const VERIFICATION_REQUEST_STATUSES = [
  'SUBMITTED',       // Solicitud radicada (sin cobro cuando la tarifa es nula)
  'UNDER_REVIEW',    // En proceso de auditoría documental
  'PAYMENT_PENDING', // En espera de confirmación de pago (si tiene tarifa activa)
  'VERIFIED',        // Aprobada / verificada con constancia
  'REJECTED',        // Rechazada con dictamen
  'REVOKED',         // Constancia revocada posteriormente
] as const;
export type VerificationRequestStatus = (typeof VERIFICATION_REQUEST_STATUSES)[number];

/**
 * Parámetro institucional de tarifa por tipo de solicitud
 * Por defecto SIN VALOR (amountCop = null)
 */
export interface VerificationFee {
  requestType: VerificationRequestType;
  amountCop: number | null; // null por defecto (sin valor)
  effectiveFrom: string;    // Fecha ISO
  currency: 'COP';
  updatedAt: string;
  updatedByUserId?: string;
  updatedByName?: string;
}

/**
 * Registro inmutable de auditoría para cambios de configuración y ajustes manuales
 */
export interface AuditLogEntry {
  id: string;
  entityType: 'VERIFICATION_FEE' | 'VERIFICATION_REQUEST' | 'ORGANIZATION' | 'SYSTEM_SETTINGS';
  entityId: string;
  action: string;
  performedByUserId: string;
  performedByName?: string;
  timestamp: string;
  previousValue?: any;
  newValue?: any;
  reason?: string | null;
}

/**
 * Solicitud de verificación con snapshot de tarifa y trazabilidad legal
 */
export interface VerificationRequestDto {
  id: string;
  applicantUserId: string;
  applicantName?: string;
  targetType: VerificationRequestType;
  targetUserId?: string | null;
  targetOrganizationId?: string | null;
  targetName: string;
  status: VerificationRequestStatus;
  appliedFeeCop: number | null; // Snapshot de la tarifa vigente (o null si no había valor) al momento de enviar
  adjustedFeeCop?: number | null; // Monto ajustado por administrador
  adjustmentReason?: string | null; // Motivo obligatorio del ajuste administrativo
  currency: 'COP';
  costUnderstood: boolean;
  dataPolicyAuthorized: boolean;
  notes?: string | null;
  documentUrl?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  verificationCode?: string;
  certificateUrl?: string | null;
  revokedAt?: string | null;
  scope?: string;
  validUntil?: string;
  legalVersion: string; // Guarda la versión del aviso legal mostrado (ej. 2026.1.0)
}

/**
 * Entrada para crear una solicitud de verificación
 */
export interface CreateVerificationRequestInput {
  targetType: VerificationRequestType;
  targetUserId?: string | null;
  targetOrganizationId?: string | null;
  targetName?: string;
  costUnderstood: boolean;
  dataPolicyAuthorized: boolean;
  notes?: string;
  documentUrl?: string;
}

/**
 * Entrada para actualizar la tarifa institucional (Administración > Parámetros)
 */
export interface UpdateVerificationFeeInput {
  requestType: VerificationRequestType;
  amountCop: number | null;
  effectiveFrom?: string;
  reason: string;
}

/**
 * Entrada para ajustar el monto de una solicitud concreta por un administrador
 */
export interface AdjustRequestFeeInput {
  requestId: string;
  newFeeCop: number | null;
  reason: string;
}
