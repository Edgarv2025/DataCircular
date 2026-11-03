import { describe, it, expect, vi, beforeEach } from 'vitest';
import { telemetryService, TelemetryService } from '../src/modules/admin/telemetry.service';
import { adminService, AdminError } from '../src/modules/admin/admin.service';
import { adminRepository } from '../src/modules/admin/admin.repository';
import { prisma } from '../src/database/prisma';
import { SafeUserDto } from '@data-circular/shared';

describe('DATA_CIRCULAR - Métricas de Conexión, Visitas y Usuarios (Analítica Administrativa)', () => {
  const adminUser: SafeUserDto = {
    id: 'admin-id-1',
    fullName: 'Administradora General',
    email: 'admin@datacircular.co',
    role: 'ADMIN',
    userType: 'GENERATOR',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const normalUser: SafeUserDto = {
    id: 'normal-id-2',
    fullName: 'Reciclador de Oficio',
    email: 'reciclador@datacircular.co',
    role: 'USER',
    userType: 'RECYCLER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Seguridad y Control de Acceso (RBAC)', () => {
    it('1.1 Bloquea acceso a métricas de usuario si no es ADMIN', async () => {
      await expect(adminService.getUserMetrics(normalUser)).rejects.toThrow(AdminError);
    });

    it('1.2 Bloquea acceso a métricas de conexión si no es ADMIN', async () => {
      await expect(adminService.getConnectionMetrics(normalUser)).rejects.toThrow(AdminError);
    });

    it('1.3 Bloquea acceso a resumen analítico si no es ADMIN', async () => {
      await expect(adminService.getAnalyticsSummary(normalUser)).rejects.toThrow(AdminError);
    });
  });

  describe('2. Telemetría de Conexión y Rendimiento (TelemetryService)', () => {
    it('2.1 Registra peticiones HTTP y calcula tasa de éxito y latencia promedio', async () => {
      const now = Date.now();

      // Registrar peticiones exitosas y fallidas simuladas
      telemetryService.recordRequest({
        timestamp: now,
        statusCode: 200,
        durationMs: 25,
        path: '/api/v1/publications',
        clientId: 'client-1',
      });
      telemetryService.recordRequest({
        timestamp: now + 500,
        statusCode: 201,
        durationMs: 35,
        path: '/api/v1/operations',
        clientId: 'client-1',
      });
      telemetryService.recordRequest({
        timestamp: now + 1000,
        statusCode: 404,
        durationMs: 15,
        path: '/api/v1/not-found',
        clientId: 'client-2',
      });

      const metrics = await telemetryService.getConnectionMetrics();

      expect(metrics.totalRequests).toBeGreaterThanOrEqual(3);
      expect(metrics.successfulRequests).toBeGreaterThanOrEqual(2);
      expect(metrics.failedRequests).toBeGreaterThanOrEqual(1);
      expect(metrics.successRatePercentage).toBeGreaterThanOrEqual(0);
      expect(metrics.successRatePercentage).toBeLessThanOrEqual(100);
      expect(metrics.averageLatencyMs).toBeGreaterThan(0);
      expect(metrics.activeConnections).toBeGreaterThanOrEqual(1);
      expect(metrics.peakConnectionHour).toBeDefined();
      expect(metrics.peakConnectionHour).toContain('UTC-5');
    });

    it('2.2 Calcula tiempo de visita, sesiones activas y tasa de rebote', () => {
      const visitMetrics = telemetryService.getUserVisitMetrics();

      expect(visitMetrics.totalVisitsCount).toBeGreaterThanOrEqual(1);
      expect(visitMetrics.averageSessionDurationMinutes).toBeGreaterThan(0);
      expect(visitMetrics.activeSessionsCount).toBeGreaterThanOrEqual(1);
      expect(typeof visitMetrics.bounceRatePercentage).toBe('number');
      expect(visitMetrics.averageRequestsPerSession).toBeGreaterThanOrEqual(1);
      expect(visitMetrics.lastVisitTimestamp).toBeDefined();
    });

    it('2.3 Genera sugerencias técnicas para analizar y optimizar la conexión', async () => {
      const connMetrics = await telemetryService.getConnectionMetrics();
      const suggestions = telemetryService.generateSuggestions(connMetrics);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThanOrEqual(4);

      // Validar sugerencias clave requeridas por el usuario
      const titles = suggestions.map((s) => s.title);
      expect(titles.some((t) => t.includes('Latencia') || t.includes('PostgreSQL'))).toBe(true);
      expect(titles.some((t) => t.includes('DAU') || t.includes('Stickiness'))).toBe(true);
      expect(titles.some((t) => t.includes('Campo') || t.includes('Offline'))).toBe(true);
      expect(titles.some((t) => t.includes('Compresión') || t.includes('ETags'))).toBe(true);

      for (const sug of suggestions) {
        expect(sug.id).toBeDefined();
        expect(sug.recommendation.length).toBeGreaterThan(10);
        expect(['HIGH', 'MEDIUM', 'LOW']).toContain(sug.impact);
      }
    });
  });

  describe('3. Métricas de Usuarios y Actores de Economía Circular (AdminRepository)', () => {
    it('3.1 Agrega conteos de usuarios por rol de economía circular y estado', async () => {
      // Mock de consultas a Prisma para validar agregación
      vi.spyOn(prisma.user, 'count')
        .mockResolvedValueOnce(45) // totalUsers
        .mockResolvedValueOnce(12); // newUsersThisMonth

      vi.spyOn(prisma.user, 'groupBy')
        .mockResolvedValueOnce([
          { userType: 'GENERATOR', _count: { id: 20 } },
          { userType: 'RECYCLER', _count: { id: 15 } },
          { userType: 'TRANSPORTER', _count: { id: 6 } },
          { userType: 'TRANSFORMER', _count: { id: 4 } },
        ] as any)
        .mockResolvedValueOnce([
          { status: 'ACTIVE', _count: { id: 40 } },
          { status: 'INACTIVE', _count: { id: 3 } },
          { status: 'SUSPENDED', _count: { id: 2 } },
        ] as any)
        .mockResolvedValueOnce([
          { role: 'USER', _count: { id: 43 } },
          { role: 'ADMIN', _count: { id: 2 } },
        ] as any);

      const userMetrics = await adminRepository.getUserMetrics();

      expect(userMetrics.totalUsers).toBe(45);
      expect(userMetrics.newUsersThisMonth).toBe(12);
      expect(userMetrics.activeUsers).toBe(40);
      expect(userMetrics.inactiveUsers).toBe(3);
      expect(userMetrics.suspendedUsers).toBe(2);

      // Desglose por tipo de actor
      expect(userMetrics.usersByType.generator).toBe(20);
      expect(userMetrics.usersByType.recycler).toBe(15);
      expect(userMetrics.usersByType.transporter).toBe(6);
      expect(userMetrics.usersByType.transformer).toBe(4);

      // Porcentajes
      expect(userMetrics.activeUsersPercentage).toBe(88.9); // (40/45)*100
      expect(userMetrics.newUsersGrowthPercentage).toBe(26.7); // (12/45)*100
    });
  });

  describe('4. Resumen Analítico Completo (getAnalyticsSummary)', () => {
    it('4.1 Retorna estructura consolidada para el panel de administración', async () => {
      // Mock de getCircularKpis
      vi.spyOn(adminRepository, 'getCircularKpis').mockResolvedValueOnce({
        tonsRecoveredTotal: 50.5,
        tonsRecoveredThisMonth: 12.3,
        activeMatchesCount: 18,
        verifiedOrganizationsCount: 14,
        totalOperationsCount: 25,
        closedOperationsCount: 20,
        averageSatisfaction: 4.8,
      });

      // Mock de getUserMetrics
      vi.spyOn(adminRepository, 'getUserMetrics').mockResolvedValueOnce({
        totalUsers: 50,
        activeUsers: 46,
        inactiveUsers: 3,
        suspendedUsers: 1,
        newUsersThisMonth: 10,
        usersByType: {
          generator: 20,
          recycler: 15,
          transporter: 10,
          transformer: 5,
        },
        usersByRole: {
          user: 48,
          admin: 2,
        },
        activeUsersPercentage: 92,
        newUsersGrowthPercentage: 20,
      });

      const summary = await adminService.getAnalyticsSummary(adminUser);

      expect(summary.circularKpis).toBeDefined();
      expect(summary.circularKpis.tonsRecoveredTotal).toBe(50.5);
      expect(summary.userMetrics).toBeDefined();
      expect(summary.userMetrics.totalUsers).toBe(50);
      expect(summary.connectionMetrics).toBeDefined();
      expect(summary.connectionMetrics.totalRequests).toBeGreaterThanOrEqual(1);
      expect(summary.visitMetrics).toBeDefined();
      expect(summary.visitMetrics.averageSessionDurationMinutes).toBeGreaterThan(0);
      expect(summary.suggestions).toBeDefined();
      expect(summary.suggestions.length).toBeGreaterThanOrEqual(4);
    });
  });
});
