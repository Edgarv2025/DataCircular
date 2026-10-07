import { prisma } from '../../database/prisma';
import {
  MaterialPublicationDto,
  PublicationMatchDto,
  MySuggestionsItemDto,
  SafeUserDto,
} from '@data-circular/shared';
import { toPublicationDto } from '../publications/publications.repository';
import { PublicationError } from '../publications/publications.service';

/**
 * Constantes y factores del algoritmo de compatibilidad de economía circular (RF-11, HU-08).
 * Algoritmo determinista, explicable y basado en reglas objetivas (sin Machine Learning opaco).
 */
export const MATCH_THRESHOLD = 40; // Umbral mínimo para considerarse "coincidencia sugerida"
export const SCORE_WEIGHTS = {
  SAME_SUBCATEGORY: 50,
  SAME_PARENT_CATEGORY: 20,
  SAME_LOCATION: 20,
  COMPATIBLE_QUANTITY: 15,
  IS_URGENT: 10,
  RECENT_7_DAYS: 5,
} as const;

export interface ScoreResult {
  score: number;
  factors: string[];
}

export class MatchesService {
  /**
   * Evalúa y calcula el puntaje de compatibilidad entre dos publicaciones de tipos opuestos.
   * HU-08: Cada punto sumado debe tener una explicación clara y comprensible para el usuario.
   */
  evaluateMatch(
    target: MaterialPublicationDto,
    candidate: MaterialPublicationDto
  ): ScoreResult {
    let score = 0;
    const factors: string[] = [];

    // Factor 1: Categoría de material
    if (candidate.categoryId === target.categoryId) {
      score += SCORE_WEIGHTS.SAME_SUBCATEGORY;
      factors.push('Misma subcategoría de material');
    } else if (
      target.category?.parentId &&
      candidate.category?.parentId &&
      target.category.parentId === candidate.category.parentId
    ) {
      score += SCORE_WEIGHTS.SAME_PARENT_CATEGORY;
      factors.push('Misma categoría principal de material');
    }

    // Factor 2: Ubicación geográfica (Ciudad o Localidad)
    const targetCity = target.locationCity?.trim().toLowerCase();
    const candidateCity = candidate.locationCity?.trim().toLowerCase();
    const targetArea = target.locationArea?.trim().toLowerCase();
    const candidateArea = candidate.locationArea?.trim().toLowerCase();

    const sameCity = Boolean(targetCity && candidateCity && targetCity === candidateCity);
    const sameArea = Boolean(targetArea && candidateArea && targetArea === candidateArea);

    if (sameCity || sameArea) {
      score += SCORE_WEIGHTS.SAME_LOCATION;
      if (sameArea) {
        factors.push('Misma localidad o zona geográfica');
      } else {
        factors.push('Misma ciudad');
      }
    }

    // Factor 3: Cantidad compatible (oferta cubre al menos la necesidad)
    // Solo si ambas publicaciones usan la misma unidad de medida (sin conversión en esta fase)
    if (target.unitId === candidate.unitId) {
      const offerQty = target.type === 'OFFER' ? target.quantity : candidate.quantity;
      const needQty = target.type === 'NEED' ? target.quantity : candidate.quantity;

      if (offerQty >= needQty) {
        score += SCORE_WEIGHTS.COMPATIBLE_QUANTITY;
        factors.push('Cantidad ofrecida cubre la cantidad solicitada');
      }
    }

    // Factor 4: Urgencia (al menos una de las dos publicaciones marcada como urgente)
    if (target.isUrgent || candidate.isUrgent) {
      score += SCORE_WEIGHTS.IS_URGENT;
      factors.push('Prioridad alta por publicación urgente');
    }

    // Factor 5: Publicación candidata reciente (creada en los últimos 7 días)
    const candidateCreatedAt = new Date(candidate.createdAt).getTime();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    if (candidateCreatedAt >= sevenDaysAgo) {
      score += SCORE_WEIGHTS.RECENT_7_DAYS;
      factors.push('Publicación candidata creada en los últimos 7 días');
    }

    return { score, factors };
  }

  /**
   * Obtiene las publicaciones candidatas del tipo opuesto aplicando pre-filtrado en base de datos.
   * Optimización de rendimiento: descarta en PostgreSQL publicaciones sin relación de categoría o ciudad.
   */
  private async getCandidatePool(
    target: MaterialPublicationDto
  ): Promise<MaterialPublicationDto[]> {
    const oppositeType = target.type === 'OFFER' ? 'NEED' : 'OFFER';
    const now = new Date();

    // Determinar categorías relevantes para el pre-filtro (misma subcategoría o hermanas bajo el mismo padre)
    const relevantCategoryIds: string[] = [target.categoryId];
    const parentId = target.category?.parentId || null;

    if (parentId) {
      const siblings = await prisma.materialCategory.findMany({
        where: { parentId, active: true },
        select: { id: true },
      });
      for (const s of siblings) {
        if (!relevantCategoryIds.includes(s.id)) {
          relevantCategoryIds.push(s.id);
        }
      }
    }

    // Consulta con índices compuestos en PostgreSQL
    const candidates = await prisma.materialPublication.findMany({
      where: {
        type: oppositeType,
        status: 'ACTIVE',
        deletedAt: null,
        id: { not: target.id },
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } },
            ],
          },
          {
            OR: [
              { categoryId: { in: relevantCategoryIds } },
              ...(target.locationCity
                ? [{ locationCity: { equals: target.locationCity, mode: 'insensitive' as const } }]
                : []),
            ],
          },
        ],
      },
      include: {
        ownerUser: true,
        organization: true,
        category: {
          include: { parent: true },
        },
        unit: true,
      },
    });

    return candidates.map(toPublicationDto);
  }

  /**
   * Obtiene las coincidencias ordenadas por puntaje para una publicación específica (GET /publications/:id/matches).
   * Solo incluye candidatos con puntaje igual o superior al umbral de 40 puntos.
   */
  async getMatchesForPublication(publicationId: string): Promise<PublicationMatchDto[]> {
    const rawTarget = await prisma.materialPublication.findFirst({
      where: { id: publicationId, deletedAt: null },
      include: {
        ownerUser: true,
        organization: true,
        category: {
          include: { parent: true },
        },
        unit: true,
      },
    });

    if (!rawTarget) {
      throw new PublicationError('PUBLICATION_NOT_FOUND', 'Publicación no encontrada', 404);
    }

    const target = toPublicationDto(rawTarget);

    // Si la publicación base no está activa o ya expiró, no genera coincidencias
    if (target.status !== 'ACTIVE') {
      return [];
    }

    const candidates = await this.getCandidatePool(target);

    const matches: PublicationMatchDto[] = [];
    for (const candidate of candidates) {
      // Ignorar candidatos que pertenecen al mismo dueño o misma organización
      if (candidate.ownerUserId === target.ownerUserId) {
        continue;
      }
      if (target.organizationId && candidate.organizationId === target.organizationId) {
        continue;
      }

      const { score, factors } = this.evaluateMatch(target, candidate);
      if (score >= MATCH_THRESHOLD) {
        matches.push({
          publicationId: candidate.id,
          score,
          factors,
          publication: candidate,
        });
      }
    }

    // Ordenar descendentemente por score, y como criterio de desempate por fecha de creación reciente
    matches.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const bDate = b.publication?.createdAt ? new Date(b.publication.createdAt).getTime() : 0;
      const aDate = a.publication?.createdAt ? new Date(a.publication.createdAt).getTime() : 0;
      return bDate - aDate;
    });

    return matches;
  }

  /**
   * Conteo liviano de coincidencias potenciales para el detalle de publicación (RF-10, CU-06).
   */
  async countMatchesForPublication(publicationId: string): Promise<number> {
    try {
      const matches = await this.getMatchesForPublication(publicationId);
      return matches.length;
    } catch {
      return 0;
    }
  }

  /**
   * Genera el resumen agregado de coincidencias para el usuario autenticado (GET /matches/my-suggestions).
   * Retorna las mejores 5 coincidencias para cada publicación activa propia o de sus organizaciones.
   */
  async getMySuggestions(user: SafeUserDto): Promise<MySuggestionsItemDto[]> {
    // 1. Obtener IDs de organizaciones activas a las que pertenece el usuario
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
      select: { organizationId: true },
    });
    const orgIds = memberships.map((m) => m.organizationId);

    const now = new Date();

    // 2. Obtener todas las publicaciones activas del usuario o sus organizaciones
    const myPubsRaw = await prisma.materialPublication.findMany({
      where: {
        OR: [
          { ownerUserId: user.id },
          ...(orgIds.length > 0 ? [{ organizationId: { in: orgIds } }] : []),
        ],
        status: 'ACTIVE',
        deletedAt: null,
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } },
            ],
          },
        ],
      },
      include: {
        ownerUser: true,
        organization: true,
        category: {
          include: { parent: true },
        },
        unit: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const myPubs = myPubsRaw.map(toPublicationDto);
    const results: MySuggestionsItemDto[] = [];

    // 3. Para cada publicación activa, calcular sus mejores coincidencias (top 5)
    for (const pub of myPubs) {
      const matches = await this.getMatchesForPublication(pub.id);
      results.push({
        publicationId: pub.id,
        publication: pub,
        matches: matches.slice(0, 5),
      });
    }

    return results;
  }
}

export const matchesService = new MatchesService();
