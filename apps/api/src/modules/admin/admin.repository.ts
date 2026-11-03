import { prisma } from '../../database/prisma';
import {
  OperationStatus,
  VerificationStatus,
  Prisma,
} from '../../generated/prisma-client';
import {
  CircularKpisDto,
  LocalityMetricsDto,
  MaterialSummaryDto,
  AdminOperationsQuery,
  UserMetricsDto,
  ConnectionMetricsDto,
  UserVisitMetricsDto,
  ConnectionSuggestionDto,
  AdminAnalyticsSummaryDto,
} from '@data-circular/shared';
import { toOperationDto } from '../operations/operations.repository';
import { telemetryService } from './telemetry.service';

export class AdminRepository {
  /**
   * Calcula los KPIs de economía circular agregando datos REALES de PostgreSQL.
   */
  async getCircularKpis(): Promise<CircularKpisDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Total operaciones y conteo por estado
    const [totalOps, closedOps] = await Promise.all([
      prisma.operation.count(),
      prisma.operation.count({ where: { status: OperationStatus.CLOSED } }),
    ]);

    // 2. Toneladas recuperadas totales y del mes corriente (de operaciones CLOSED)
    const closedOperations = await prisma.operation.findMany({
      where: { status: OperationStatus.CLOSED },
      select: {
        actualWeight: true,
        quantity: true,
        closedAt: true,
        createdAt: true,
      },
    });

    let totalKg = 0;
    let thisMonthKg = 0;

    for (const op of closedOperations) {
      const weight = op.actualWeight ? Number(op.actualWeight) : Number(op.quantity);
      totalKg += weight;

      const date = op.closedAt || op.createdAt;
      if (date >= startOfMonth) {
        thisMonthKg += weight;
      }
    }

    const tonsRecoveredTotal = Number((totalKg / 1000).toFixed(2));
    const tonsRecoveredThisMonth = Number((thisMonthKg / 1000).toFixed(2));

    // 3. Conteo de publicaciones activas / matches en curso
    const activeMatchesCount = await prisma.materialPublication.count({
      where: { status: 'ACTIVE' },
    });

    // 4. Organizaciones verificadas institucionalmente
    const verifiedOrganizationsCount = await prisma.organization.count({
      where: { verificationStatus: VerificationStatus.VERIFIED },
    });

    // 5. Promedio de satisfacción real de evaluaciones
    const reviewAggregate = await prisma.operationReview.aggregate({
      _avg: { score: true },
      _count: { score: true },
    });

    const averageSatisfaction = reviewAggregate._avg.score
      ? Number(reviewAggregate._avg.score.toFixed(1))
      : 0;

    return {
      tonsRecoveredTotal,
      tonsRecoveredThisMonth,
      activeMatchesCount,
      verifiedOrganizationsCount,
      totalOperationsCount: totalOps,
      closedOperationsCount: closedOps,
      averageSatisfaction,
    };
  }

  /**
   * Agregación territorial de operaciones y organizaciones por ciudades y municipios de Colombia.
   */
  async getLocalityMetrics(): Promise<LocalityMetricsDto[]> {
    // Operaciones por ciudad o municipio de recolección
    const operations = await prisma.operation.findMany({
      select: {
        pickupArea: true,
        status: true,
        actualWeight: true,
        quantity: true,
      },
    });

    const verifiedOrgs = await prisma.organization.findMany({
      where: { verificationStatus: VerificationStatus.VERIFIED },
      select: { locality: true },
    });

    const map = new Map<string, { ops: number; kg: number; verifiedOrgs: number }>();

    for (const op of operations) {
      const loc = op.pickupArea || 'Sin especificar';
      const cur = map.get(loc) || { ops: 0, kg: 0, verifiedOrgs: 0 };
      cur.ops += 1;
      if (op.status === OperationStatus.CLOSED) {
        const weight = op.actualWeight ? Number(op.actualWeight) : Number(op.quantity);
        cur.kg += weight;
      }
      map.set(loc, cur);
    }

    for (const org of verifiedOrgs) {
      const loc = org.locality || 'Sin especificar';
      const cur = map.get(loc) || { ops: 0, kg: 0, verifiedOrgs: 0 };
      cur.verifiedOrgs += 1;
      map.set(loc, cur);
    }

    const list: LocalityMetricsDto[] = [];
    for (const [locality, stats] of map.entries()) {
      list.push({
        locality,
        operationsCount: stats.ops,
        tonsRecovered: Number((stats.kg / 1000).toFixed(2)),
        verifiedOrganizationsCount: stats.verifiedOrgs,
      });
    }

    return list.sort((a, b) => b.operationsCount - a.operationsCount);
  }

  /**
   * Resumen de balance de masa por categorías principales de materiales.
   */
  async getMaterialsSummary(): Promise<MaterialSummaryDto[]> {
    const categories = await prisma.materialCategory.findMany({
      where: { parentId: null },
      include: {
        subcategories: true,
      },
    });

    const [publications, closedOperations] = await Promise.all([
      prisma.materialPublication.findMany({
        select: { categoryId: true, quantity: true },
      }),
      prisma.operation.findMany({
        where: { status: OperationStatus.CLOSED },
        select: { materialCategoryId: true, actualWeight: true, quantity: true },
      }),
    ]);

    let grandTotalRecovered = 0;
    const catMap = new Map<string, { name: string; offered: number; recovered: number; ops: number }>();

    for (const parent of categories) {
      const validIds = new Set<string>([parent.id, ...parent.subcategories.map((s) => s.id)]);
      let offered = 0;
      let recovered = 0;
      let ops = 0;

      for (const pub of publications) {
        if (validIds.has(pub.categoryId)) {
          offered += Number(pub.quantity);
        }
      }

      for (const op of closedOperations) {
        if (validIds.has(op.materialCategoryId)) {
          const w = op.actualWeight ? Number(op.actualWeight) : Number(op.quantity);
          recovered += w;
          ops += 1;
        }
      }

      grandTotalRecovered += recovered;
      catMap.set(parent.id, { name: parent.name, offered, recovered, ops });
    }

    const result: MaterialSummaryDto[] = [];
    for (const [categoryId, val] of catMap.entries()) {
      const pct = grandTotalRecovered > 0 ? (val.recovered / grandTotalRecovered) * 100 : 0;
      result.push({
        categoryId,
        categoryName: val.name,
        totalKilogramsOffered: Number(val.offered.toFixed(2)),
        totalKilogramsRecovered: Number(val.recovered.toFixed(2)),
        operationsCount: val.ops,
        percentageOfTotal: Number(pct.toFixed(1)),
      });
    }

    return result.sort((a, b) => b.totalKilogramsRecovered - a.totalKilogramsRecovered);
  }

  /**
   * Supervisión administrativa de operaciones de toda la plataforma con filtros.
   */
  async listAllOperations(query: AdminOperationsQuery) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.OperationWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.locality) {
      where.pickupArea = { contains: query.locality, mode: 'insensitive' };
    }
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const [total, data] = await Promise.all([
      prisma.operation.count({ where }),
      prisma.operation.findMany({
        where,
        include: {
          publication: true,
          sellerUser: { select: { id: true, fullName: true, phone: true, userType: true } },
          sellerOrganization: { select: { id: true, name: true } },
          buyerUser: { select: { id: true, fullName: true, phone: true, userType: true } },
          buyerOrganization: { select: { id: true, name: true } },
          transporterUser: { select: { id: true, fullName: true, phone: true, userType: true } },
          materialCategory: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true, abbreviation: true } },
          evidences: {
            include: { uploadedByUser: { select: { id: true, fullName: true } } },
          },
          reviews: {
            include: {
              reviewerUser: { select: { id: true, fullName: true } },
              targetUser: { select: { id: true, fullName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      data: data.map((op) => toOperationDto(op)),
    };
  }

  /**
   * Métricas cuantitativas y cualitativas de usuarios y actores de economía circular.
   */
  async getUserMetrics(): Promise<UserMetricsDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      newUsersThisMonth,
      byUserType,
      byStatus,
      byRole,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.user.groupBy({
        by: ['userType'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      prisma.user.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      prisma.user.groupBy({
        by: ['role'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
    ]);

    const usersByType = {
      generator: 0,
      recycler: 0,
      transporter: 0,
      transformer: 0,
    };

    for (const item of byUserType) {
      if (item.userType === 'GENERATOR') usersByType.generator = item._count.id;
      if (item.userType === 'RECYCLER') usersByType.recycler = item._count.id;
      if (item.userType === 'TRANSPORTER') usersByType.transporter = item._count.id;
      if (item.userType === 'TRANSFORMER') usersByType.transformer = item._count.id;
    }

    let activeUsers = 0;
    let inactiveUsers = 0;
    let suspendedUsers = 0;

    for (const item of byStatus) {
      if (item.status === 'ACTIVE') activeUsers = item._count.id;
      if (item.status === 'INACTIVE') inactiveUsers = item._count.id;
      if (item.status === 'SUSPENDED') suspendedUsers = item._count.id;
    }

    let regularUsers = 0;
    let adminUsers = 0;

    for (const item of byRole) {
      if (item.role === 'USER') regularUsers = item._count.id;
      if (item.role === 'ADMIN') adminUsers = item._count.id;
    }

    const activeUsersPercentage =
      totalUsers > 0
        ? Number(((activeUsers / totalUsers) * 100).toFixed(1))
        : 100;

    const newUsersGrowthPercentage =
      totalUsers > 0
        ? Number(((newUsersThisMonth / totalUsers) * 100).toFixed(1))
        : 0;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      newUsersThisMonth,
      usersByType,
      usersByRole: {
        user: regularUsers,
        admin: adminUsers,
      },
      activeUsersPercentage,
      newUsersGrowthPercentage,
    };
  }

  /**
   * Métricas de conexión y rendimiento del sistema.
   */
  async getConnectionMetrics(): Promise<ConnectionMetricsDto> {
    return telemetryService.getConnectionMetrics();
  }

  /**
   * Métricas de tiempo de visita y sesiones de usuario.
   */
  getUserVisitMetrics(): UserVisitMetricsDto {
    return telemetryService.getUserVisitMetrics();
  }

  /**
   * Sugerencias arquitectónicas y analíticas de conexión.
   */
  async getConnectionSuggestions(): Promise<ConnectionSuggestionDto[]> {
    const connection = await this.getConnectionMetrics();
    return telemetryService.generateSuggestions(connection);
  }

  /**
   * Resumen analítico unificado para el panel de administración.
   */
  async getAnalyticsSummary(): Promise<AdminAnalyticsSummaryDto> {
    const [circularKpis, userMetrics, connectionMetrics] = await Promise.all([
      this.getCircularKpis(),
      this.getUserMetrics(),
      this.getConnectionMetrics(),
    ]);
    const visitMetrics = this.getUserVisitMetrics();
    const suggestions = telemetryService.generateSuggestions(connectionMetrics);

    return {
      circularKpis,
      userMetrics,
      connectionMetrics,
      visitMetrics,
      suggestions,
    };
  }
}

export const adminRepository = new AdminRepository();
