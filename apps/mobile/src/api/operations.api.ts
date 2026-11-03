import { apiFetch } from './client';
import {
  OperationDto,
  OperationEvidenceDto,
  OperationReviewDto,
  UserReviewSummaryDto,
  CreateOperationInput,
  ScheduleOperationInput,
  AddEvidenceInput,
  ReceiveOperationInput,
  CloseOperationInput,
  CancelOperationInput,
  GetOperationsQuery,
  CreateReviewInput,
} from '@data-circular/shared';

export const OperationsApi = {
  /**
   * Crea o recupera una operación a partir de una propuesta formal aceptada.
   */
  async create(data: CreateOperationInput): Promise<OperationDto> {
    return apiFetch<OperationDto>('/operations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Lista operaciones del usuario autenticado con filtros.
   */
  async list(query?: GetOperationsQuery): Promise<{ total: number; page: number; pageSize: number; data: OperationDto[] }> {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.role) params.append('role', query.role);
    if (query?.page) params.append('page', String(query.page));
    if (query?.pageSize) params.append('pageSize', String(query.pageSize));

    const qs = params.toString();
    return apiFetch<{ total: number; page: number; pageSize: number; data: OperationDto[] }>(
      `/operations${qs ? `?${qs}` : ''}`,
      { method: 'GET' }
    );
  },

  /**
   * Obtiene el detalle de una operación por ID.
   */
  async getById(id: string): Promise<OperationDto> {
    return apiFetch<OperationDto>(`/operations/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Programa la logística y recolección (SCHEDULED).
   */
  async schedule(id: string, data: ScheduleOperationInput): Promise<OperationDto> {
    return apiFetch<OperationDto>(`/operations/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Inicia la recolección en ruta (COLLECTING).
   */
  async collect(id: string): Promise<OperationDto> {
    return apiFetch<OperationDto>(`/operations/${id}/collect`, {
      method: 'POST',
    });
  },

  /**
   * Adjunta evidencias de pesaje y soporte (EVIDENCE).
   */
  async addEvidence(
    id: string,
    data: AddEvidenceInput
  ): Promise<{ evidence: OperationEvidenceDto; operation: OperationDto }> {
    return apiFetch<{ evidence: OperationEvidenceDto; operation: OperationDto }>(
      `/operations/${id}/evidences`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  /**
   * Registra recepción en destino (RECEIVED).
   */
  async receive(id: string, data?: ReceiveOperationInput): Promise<OperationDto> {
    return apiFetch<OperationDto>(`/operations/${id}/receive`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  /**
   * Cierra y liquida la operación (CLOSED).
   */
  async close(id: string, data?: CloseOperationInput): Promise<OperationDto> {
    return apiFetch<OperationDto>(`/operations/${id}/close`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  /**
   * Cancela la operación.
   */
  async cancel(id: string, data: CancelOperationInput): Promise<OperationDto> {
    return apiFetch<OperationDto>(`/operations/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Califica y evalúa una operación finalizada (Fase 12).
   */
  async createReview(id: string, data: CreateReviewInput): Promise<OperationReviewDto> {
    return apiFetch<OperationReviewDto>(`/operations/${id}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Consulta el resumen de calificaciones públicas de un usuario.
   */
  async getUserReviewsSummary(userId: string): Promise<UserReviewSummaryDto> {
    return apiFetch<UserReviewSummaryDto>(`/operations/users/${userId}/reviews-summary`, {
      method: 'GET',
    });
  },
};
