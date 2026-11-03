import { apiFetch } from './client';
import {
  CircularKpisDto,
  LocalityMetricsDto,
  MaterialSummaryDto,
  OperationDto,
  AdminOperationsQuery,
  UserMetricsDto,
  ConnectionMetricsDto,
  UserVisitMetricsDto,
  ConnectionSuggestionDto,
  AdminAnalyticsSummaryDto,
} from '@data-circular/shared';

export const AdminApi = {
  /**
   * Obtiene los KPIs distritales calculados en tiempo real con datos de PostgreSQL.
   */
  async getCircularKpis(): Promise<CircularKpisDto> {
    return apiFetch<CircularKpisDto>('/admin/reports/kpis', {
      method: 'GET',
    });
  },

  /**
   * Agregado territorial por municipios y ciudades de Colombia.
   */
  async getLocalityMetrics(): Promise<LocalityMetricsDto[]> {
    return apiFetch<LocalityMetricsDto[]>('/admin/reports/localities', {
      method: 'GET',
    });
  },

  /**
   * Balance de masa por categorías principales de materiales.
   */
  async getMaterialsSummary(): Promise<MaterialSummaryDto[]> {
    return apiFetch<MaterialSummaryDto[]>('/admin/reports/materials', {
      method: 'GET',
    });
  },

  /**
   * Supervisión global de todas las operaciones para auditoría administrativa.
   */
  async listAllOperations(query?: AdminOperationsQuery): Promise<{ total: number; page: number; pageSize: number; data: OperationDto[] }> {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.locality) params.append('locality', query.locality);
    if (query?.dateFrom) params.append('dateFrom', query.dateFrom);
    if (query?.dateTo) params.append('dateTo', query.dateTo);
    if (query?.page) params.append('page', String(query.page));
    if (query?.pageSize) params.append('pageSize', String(query.pageSize));

    const qs = params.toString();
    return apiFetch<{ total: number; page: number; pageSize: number; data: OperationDto[] }>(
      `/admin/operations${qs ? `?${qs}` : ''}`,
      { method: 'GET' }
    );
  },

  /**
   * Métricas de cantidad, actividad y desglose por rol de usuarios de economía circular.
   */
  async getUserMetrics(): Promise<UserMetricsDto> {
    return apiFetch<UserMetricsDto>('/admin/analytics/users', {
      method: 'GET',
    });
  },

  /**
   * Métricas de latencia, salud de base de datos y conexiones en tiempo real.
   */
  async getConnectionMetrics(): Promise<ConnectionMetricsDto> {
    return apiFetch<ConnectionMetricsDto>('/admin/analytics/connections', {
      method: 'GET',
    });
  },

  /**
   * Métricas de tiempo de visita, sesiones activas y tasa de rebote.
   */
  async getUserVisitMetrics(): Promise<UserVisitMetricsDto> {
    return apiFetch<UserVisitMetricsDto>('/admin/analytics/visits', {
      method: 'GET',
    });
  },

  /**
   * Sugerencias y recomendaciones arquitectónicas de conexión.
   */
  async getConnectionSuggestions(): Promise<ConnectionSuggestionDto[]> {
    return apiFetch<ConnectionSuggestionDto[]>('/admin/analytics/suggestions', {
      method: 'GET',
    });
  },

  /**
   * Resumen analítico unificado para el panel de administración.
   */
  async getAnalyticsSummary(): Promise<AdminAnalyticsSummaryDto> {
    return apiFetch<AdminAnalyticsSummaryDto>('/admin/analytics/summary', {
      method: 'GET',
    });
  },
};
