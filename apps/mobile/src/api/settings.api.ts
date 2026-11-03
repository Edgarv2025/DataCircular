/** © 2026 Fundación IMARA. Elaborado por Edgar Vásquez. */
import {
  VerificationFee,
  AuditLogEntry,
  VerificationRequestDto,
  CreateVerificationRequestInput,
  UpdateVerificationFeeInput,
  AdjustRequestFeeInput,
} from '@data-circular/shared';
import { apiFetch } from './client';

export const SettingsApi = {
  /**
   * Consulta las tarifas de verificación vigentes
   */
  async getFees(): Promise<VerificationFee[]> {
    return apiFetch<VerificationFee[]>('/admin/settings/fees');
  },

  /**
   * Actualiza la tarifa de verificación (requiere permiso platform:settings)
   */
  async updateFee(input: UpdateVerificationFeeInput): Promise<VerificationFee> {
    return apiFetch<VerificationFee>('/admin/settings/fees', {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  /**
   * Radica una solicitud de verificación documental
   */
  async createVerificationRequest(
    input: CreateVerificationRequestInput
  ): Promise<VerificationRequestDto> {
    return apiFetch<VerificationRequestDto>('/admin/verification-requests', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /**
   * Obtiene la lista de solicitudes de verificación
   */
  async getVerificationRequests(): Promise<VerificationRequestDto[]> {
    return apiFetch<VerificationRequestDto[]>('/admin/verification-requests');
  },

  /**
   * Ajusta el monto de una solicitud concreta con motivo obligatorio (queda en AuditLog)
   */
  async adjustRequestFee(input: AdjustRequestFeeInput): Promise<VerificationRequestDto> {
    return apiFetch<VerificationRequestDto>('/admin/verification-requests/adjust-fee', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  /**
   * Dictamina una solicitud de verificación (Aprobar, Rechazar o Revocar)
   */
  async reviewVerificationRequest(
    id: string,
    action: 'APPROVE' | 'REJECT' | 'REVOKE',
    notes: string
  ): Promise<VerificationRequestDto> {
    return apiFetch<VerificationRequestDto>(`/admin/verification-requests/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ action, notes }),
    });
  },

  /**
   * Consulta el registro de auditoría (AuditLog)
   */
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    return apiFetch<AuditLogEntry[]>('/admin/audit-logs');
  },

  /**
   * Consulta pública de una constancia de verificación por código (Puntos 5 y 6)
   */
  async getPublicVerification(code: string): Promise<{
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
    return apiFetch(`/admin/public-verification/${code}`);
  },
};
