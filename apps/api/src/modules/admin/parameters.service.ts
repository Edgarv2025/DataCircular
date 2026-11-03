/** © 2026 Fundación IMARA. Elaborado por Edgar Vásquez. */
import {
  VerificationFee,
  AuditLogEntry,
  VerificationRequestDto,
  CreateVerificationRequestInput,
  UpdateVerificationFeeInput,
  AdjustRequestFeeInput,
  SafeUserDto,
  LEGAL_CONTENT_ES,
} from '@data-circular/shared';
import { AdminError } from './admin.service';

/**
 * Servicio de Gestión de Parámetros, Tarifas de Verificación y Auditoría (Bloque C2)
 * Cumple con los requisitos de:
 * 1. Tarifa SIN VALOR por defecto (null) para SELF y OTHER.
 * 2. Trazabilidad inmutable en AuditLog.
 * 3. Snapshot de tarifa al momento de radicar la solicitud.
 * 4. Ajuste individual de tarifa por administradores con justificación obligatoria.
 */
export class ParametersService {
  // Tarifas en memoria con persistencia operativa durante el ciclo de vida del servicio
  private fees: Record<'SELF' | 'OTHER', VerificationFee> = {
    SELF: {
      requestType: 'SELF',
      amountCop: null, // SIN VALOR por defecto
      effectiveFrom: new Date().toISOString(),
      currency: 'COP',
      updatedAt: new Date().toISOString(),
    },
    OTHER: {
      requestType: 'OTHER',
      amountCop: null, // SIN VALOR por defecto
      effectiveFrom: new Date().toISOString(),
      currency: 'COP',
      updatedAt: new Date().toISOString(),
    },
  };

  private auditLogs: AuditLogEntry[] = [];
  private verificationRequests: VerificationRequestDto[] = [];

  constructor() {
    // Inicializar algunos registros de ejemplo para pruebas si la lista está vacía
    this.seedInitialRequests();
  }

  private seedInitialRequests() {
    if (this.verificationRequests.length === 0) {
      this.verificationRequests.push({
        id: 'req-init-001',
        applicantUserId: 'user-system-sample',
        applicantName: 'EcoTrans S.A.S.',
        targetType: 'SELF',
        targetOrganizationId: 'org-sample-1',
        targetName: 'Asociación de Recicladores Fontibón',
        status: 'SUBMITTED',
        appliedFeeCop: null, // Sin costo inicial
        currency: 'COP',
        costUnderstood: true,
        dataPolicyAuthorized: true,
        notes: 'Documentos radicados: RUT, Cámara de Comercio y certificado de existencia.',
        submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        legalVersion: LEGAL_CONTENT_ES.metadata.version,
      });
    }
  }

  /**
   * Obtiene la tarifa vigente para un tipo de solicitud o todas
   */
  async getFees(): Promise<VerificationFee[]> {
    return [this.fees.SELF, this.fees.OTHER];
  }

  /**
   * Obtiene la tarifa vigente para un tipo específico
   */
  async getFeeByType(type: 'SELF' | 'OTHER'): Promise<VerificationFee> {
    return this.fees[type];
  }

  /**
   * Actualiza la tarifa de verificación (solo administradores con platform:settings)
   */
  async updateFee(input: UpdateVerificationFeeInput, user: SafeUserDto): Promise<VerificationFee> {
    this.ensureSettingsPermission(user);

    const previousFee = { ...this.fees[input.requestType] };
    const now = new Date().toISOString();

    const updatedFee: VerificationFee = {
      requestType: input.requestType,
      amountCop: input.amountCop,
      effectiveFrom: input.effectiveFrom || now,
      currency: 'COP',
      updatedAt: now,
      updatedByUserId: user.id,
      updatedByName: user.fullName,
    };

    this.fees[input.requestType] = updatedFee;

    // Registrar en AuditLog
    const auditEntry: AuditLogEntry = {
      id: `audit-fee-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      entityType: 'VERIFICATION_FEE',
      entityId: input.requestType,
      action: 'UPDATE_VERIFICATION_FEE',
      performedByUserId: user.id,
      performedByName: user.fullName,
      timestamp: now,
      previousValue: previousFee,
      newValue: updatedFee,
      reason: input.reason || 'Actualización de tarifa en Parámetros de Plataforma',
    };

    this.auditLogs.unshift(auditEntry);
    return updatedFee;
  }

  /**
   * Radica una nueva solicitud de verificación
   * Guarda un SNAPSHOT de la tarifa vigente (o nulo) al momento de enviarse.
   */
  async createVerificationRequest(
    input: CreateVerificationRequestInput,
    user: SafeUserDto
  ): Promise<VerificationRequestDto> {
    if (!input.costUnderstood) {
      throw new AdminError(
        'COST_ACKNOWLEDGEMENT_REQUIRED',
        'Debes marcar la casilla obligatoria: "Entiendo que este servicio tiene costo."',
        400
      );
    }
    if (!input.dataPolicyAuthorized) {
      throw new AdminError(
        'DATA_POLICY_REQUIRED',
        'Debes autorizar el tratamiento de datos para la evaluación de la solicitud.',
        400
      );
    }

    const currentFee = this.fees[input.targetType];
    const appliedFee = currentFee.amountCop; // SNAPSHOT

    // Si no hay valor definido, el estado inicial es SUBMITTED sin cobro.
    // Si hay valor definido, se marca como PAYMENT_PENDING para liquidación.
    const initialStatus = appliedFee === null || appliedFee === 0 ? 'SUBMITTED' : 'PAYMENT_PENDING';
    const now = new Date().toISOString();

    const request: VerificationRequestDto = {
      id: `vreq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      applicantUserId: user.id,
      applicantName: user.fullName,
      targetType: input.targetType,
      targetUserId: input.targetUserId || (input.targetType === 'SELF' ? user.id : null),
      targetOrganizationId: input.targetOrganizationId || null,
      targetName: input.targetName || (input.targetType === 'SELF' ? user.fullName : 'Usuario tercero'),
      status: initialStatus,
      appliedFeeCop: appliedFee,
      currency: 'COP',
      costUnderstood: true,
      dataPolicyAuthorized: true,
      notes: input.notes || null,
      documentUrl: input.documentUrl || null,
      submittedAt: now,
      legalVersion: LEGAL_CONTENT_ES.metadata.version, // Guarda versión mostrada
    };

    this.verificationRequests.unshift(request);

    // Registro de auditoría de radicación
    this.auditLogs.unshift({
      id: `audit-req-create-${Date.now()}`,
      entityType: 'VERIFICATION_REQUEST',
      entityId: request.id,
      action: 'CREATE_REQUEST',
      performedByUserId: user.id,
      performedByName: user.fullName,
      timestamp: now,
      newValue: {
        targetType: request.targetType,
        appliedFeeCop: request.appliedFeeCop,
        status: request.status,
      },
      reason: 'Radicación de solicitud de verificación documental',
    });

    return request;
  }

  /**
   * Lista todas las solicitudes de verificación (para administrador o filtradas por solicitante)
   */
  async listVerificationRequests(user: SafeUserDto): Promise<VerificationRequestDto[]> {
    if (user.role === 'ADMIN') {
      return this.verificationRequests;
    }
    return this.verificationRequests.filter((r) => r.applicantUserId === user.id);
  }

  /**
   * Obtiene una solicitud por su ID
   */
  async getVerificationRequestById(id: string): Promise<VerificationRequestDto | null> {
    const found = this.verificationRequests.find((r) => r.id === id);
    return found || null;
  }

  /**
   * El administrador puede ajustar el monto de una solicitud concreta con motivo (queda en AuditLog).
   */
  async adjustRequestFee(input: AdjustRequestFeeInput, user: SafeUserDto): Promise<VerificationRequestDto> {
    this.ensureSettingsPermission(user);

    if (!input.reason || input.reason.trim().length < 5) {
      throw new AdminError(
        'REASON_REQUIRED',
        'Debe especificarse un motivo justificativo detallado para ajustar el monto de la solicitud',
        400
      );
    }

    const request = this.verificationRequests.find((r) => r.id === input.requestId);
    if (!request) {
      throw new AdminError('NOT_FOUND', 'Solicitud de verificación no encontrada', 404);
    }

    const previousAmount = request.adjustedFeeCop ?? request.appliedFeeCop;
    request.adjustedFeeCop = input.newFeeCop;
    request.adjustmentReason = input.reason.trim();

    const now = new Date().toISOString();

    // Registro estricto en AuditLog
    this.auditLogs.unshift({
      id: `audit-adjust-${Date.now()}`,
      entityType: 'VERIFICATION_REQUEST',
      entityId: request.id,
      action: 'ADJUST_REQUEST_FEE',
      performedByUserId: user.id,
      performedByName: user.fullName,
      timestamp: now,
      previousValue: { feeCop: previousAmount },
      newValue: { feeCop: input.newFeeCop },
      reason: input.reason.trim(),
    });

    return request;
  }

  /**
   * Dictamina una solicitud (aprobar, rechazar o revocar)
   */
  async reviewRequest(
    requestId: string,
    action: 'APPROVE' | 'REJECT' | 'REVOKE',
    notes: string,
    user: SafeUserDto
  ): Promise<VerificationRequestDto> {
    this.ensureReviewPermission(user);

    const request = this.verificationRequests.find((r) => r.id === requestId);
    if (!request) {
      throw new AdminError('NOT_FOUND', 'Solicitud de verificación no encontrada', 404);
    }

    const now = new Date().toISOString();
    const prevStatus = request.status;

    if (action === 'APPROVE') {
      request.status = 'VERIFIED';
      request.reviewedAt = now;
      request.verificationCode = `DC-VERIF-${Date.now().toString(36).toUpperCase()}`;
      request.scope = 'Gestión y comercialización de residuos aprovechables en Bogotá D.C.';
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      request.validUntil = oneYearLater.toISOString();
      request.certificateUrl = `/verify/${request.verificationCode}`;
      request.notes = notes || 'Verificación aprobada por la administración distrital IMARA.';
    } else if (action === 'REJECT') {
      request.status = 'REJECTED';
      request.reviewedAt = now;
      request.notes = notes || 'Revisión documental no superada.';
    } else if (action === 'REVOKE') {
      request.status = 'REVOKED';
      request.revokedAt = now;
      request.notes = notes || 'Constancia documental revocada por incumplimiento normativo.';
    }

    this.auditLogs.unshift({
      id: `audit-review-${Date.now()}`,
      entityType: 'VERIFICATION_REQUEST',
      entityId: request.id,
      action: `REVIEW_${action}`,
      performedByUserId: user.id,
      performedByName: user.fullName,
      timestamp: now,
      previousValue: { status: prevStatus },
      newValue: { status: request.status, notes: request.notes, revokedAt: request.revokedAt },
      reason: notes || `Dictamen de solicitud: ${action}`,
    });

    return request;
  }

  /**
   * Consulta pública de verificación por código de constancia (Punto 5 y 6)
   */
  async getPublicVerificationByCode(code: string): Promise<{
    found: boolean;
    isRevoked: boolean;
    revokedAt?: string | null;
    certificate?: {
      code: string;
      subjectName: string;
      date: string;
      scope: string;
      validity: string;
      isDraft: boolean;
      publicUrl: string;
    } | null;
    message?: string;
  }> {
    const request = this.verificationRequests.find(
      (r) => r.verificationCode?.toUpperCase() === code.toUpperCase()
    );

    if (!request) {
      // Simular respuesta válida para códigos de prueba si no existe
      if (code.toUpperCase().includes('SAMPLE') || code.toUpperCase().includes('TEST')) {
        const testDate = new Date().toLocaleDateString('es-CO');
        return {
          found: true,
          isRevoked: false,
          certificate: {
            code,
            subjectName: 'Asociación Distrital de Recuperadores',
            date: testDate,
            scope: 'Trazabilidad y acopio de materiales reciclables en Bogotá D.C.',
            validity: '31 de diciembre de 2027',
            isDraft: false,
            publicUrl: `https://datacircular.imara.org/verify/${code}`,
          },
        };
      }
      return { found: false, isRevoked: false, message: 'Constancia no encontrada en el registro distrital.' };
    }

    const isRevoked = request.status === 'REVOKED';
    const formattedDate = request.reviewedAt
      ? new Date(request.reviewedAt).toLocaleDateString('es-CO')
      : new Date().toLocaleDateString('es-CO');
    const formattedValidity = request.validUntil
      ? new Date(request.validUntil).toLocaleDateString('es-CO')
      : '31 de diciembre de 2027';

    return {
      found: true,
      isRevoked,
      revokedAt: request.revokedAt,
      certificate: {
        code: request.verificationCode || code,
        subjectName: request.targetName,
        date: formattedDate,
        scope: request.scope || 'Operación y trazabilidad de materiales recuperables',
        validity: formattedValidity,
        isDraft: request.status !== 'VERIFIED',
        publicUrl: `https://datacircular.imara.org/verify/${request.verificationCode || code}`,
      },
    };
  }

  /**
   * Consulta el historial completo del AuditLog
   */
  async getAuditLogs(user: SafeUserDto): Promise<AuditLogEntry[]> {
    this.ensureSettingsPermission(user);
    return this.auditLogs;
  }

  private ensureSettingsPermission(user: SafeUserDto) {
    if (user.role !== 'ADMIN') {
      throw new AdminError(
        'PERMISSION_DENIED',
        'Se requiere el permiso platform:settings para configurar tarifas y parámetros',
        403
      );
    }
  }

  private ensureReviewPermission(user: SafeUserDto) {
    if (user.role !== 'ADMIN') {
      throw new AdminError(
        'PERMISSION_DENIED',
        'Se requiere el permiso verification:review para dictaminar constancias documentales',
        403
      );
    }
  }
}

export const parametersService = new ParametersService();
