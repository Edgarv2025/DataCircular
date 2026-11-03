import { adminRepository } from './admin.repository';
import { SafeUserDto, AdminOperationsQuery } from '@data-circular/shared';

export class AdminError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 403
  ) {
    super(message);
    this.name = 'AdminError';
  }
}

export class AdminService {
  /**
   * Obtiene los KPIs calculados en vivo con datos reales de PostgreSQL.
   */
  async getCircularKpis(user: SafeUserDto) {
    this.ensureAdminRole(user);
    return adminRepository.getCircularKpis();
  }

  /**
   * Obtiene métricas territoriales agrupadas por localidades de Bogotá D.C.
   */
  async getLocalityMetrics(user: SafeUserDto) {
    this.ensureAdminRole(user);
    return adminRepository.getLocalityMetrics();
  }

  /**
   * Obtiene el balance de masa por categorías principales de materiales.
   */
  async getMaterialsSummary(user: SafeUserDto) {
    this.ensureAdminRole(user);
    return adminRepository.getMaterialsSummary();
  }

  /**
   * Supervisión global de todas las operaciones del sistema.
   */
  async listAllOperations(query: AdminOperationsQuery, user: SafeUserDto) {
    this.ensureAdminRole(user);
    return adminRepository.listAllOperations(query);
  }

  /**
   * Métricas y estadísticas de usuarios y actores de economía circular.
   */
  async getUserMetrics(user: SafeUserDto) {
    this.ensureAdminRole(user);
    return adminRepository.getUserMetrics();
  }

  /**
   * Métricas de conexión y rendimiento de red.
   */
  async getConnectionMetrics(user: SafeUserDto) {
    this.ensureAdminRole(user);
    return adminRepository.getConnectionMetrics();
  }

  /**
   * Métricas de tiempo de visita y sesiones.
   */
  async getUserVisitMetrics(user: SafeUserDto) {
    this.ensureAdminRole(user);
    return adminRepository.getUserVisitMetrics();
  }

  /**
   * Sugerencias de optimización y monitoreo de conexión.
   */
  async getConnectionSuggestions(user: SafeUserDto) {
    this.ensureAdminRole(user);
    return adminRepository.getConnectionSuggestions();
  }

  /**
   * Resumen analítico integral del panel de administración.
   */
  async getAnalyticsSummary(user: SafeUserDto) {
    this.ensureAdminRole(user);
    return adminRepository.getAnalyticsSummary();
  }

  private ensureAdminRole(user: SafeUserDto) {
    if (user.role !== 'ADMIN') {
      throw new AdminError(
        'FORBIDDEN',
        'Se requieren permisos de Administrador de Plataforma para acceder a este módulo de auditoría y métricas',
        403
      );
    }
  }
}

export const adminService = new AdminService();
