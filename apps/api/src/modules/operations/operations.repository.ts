import { prisma } from '../../database/prisma';
import {
  Operation,
  OperationEvidence,
  OperationReview,
  OperationStatus,
  EvidenceType,
  Prisma,
} from '../../generated/prisma-client';
import {
  OperationDto,
  OperationEvidenceDto,
  OperationReviewDto,
  OperationTimelineStepDto,
  OperationPartySummaryDto,
  UserReviewSummaryDto,
} from '@data-circular/shared';

export interface CreateOperationData {
  proposalId: string;
  pickupAddress?: string | null;
  pickupArea?: string | null;
  deliveryAddress?: string | null;
  deliveryArea?: string | null;
}

export interface ScheduleOperationData {
  scheduledDate: Date;
  scheduledTimeSlot?: string | null;
  pickupAddress: string;
  pickupArea: string;
  deliveryAddress?: string | null;
  deliveryArea?: string | null;
  transporterUserId?: string | null;
  vehiclePlate?: string | null;
  driverName?: string | null;
  transportNotes?: string | null;
}

export interface AddEvidenceData {
  type: EvidenceType;
  fileUrl: string;
  description?: string | null;
  weightKg?: number | null;
  uploadedByUserId: string;
}

export interface CreateReviewData {
  operationId: string;
  reviewerUserId: string;
  targetUserId: string;
  score: number;
  punctualityScore?: number | null;
  materialQualityScore?: number | null;
  fulfillmentScore?: number | null;
  comment?: string | null;
}

export class OperationsRepository {
  /**
   * Genera un código único secuencial para la operación (ej: OP-BOG-2026-0001).
   */
  async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.operation.count();
    const seq = String(count + 1).padStart(4, '0');
    const rand = Math.floor(100 + Math.random() * 900);
    return `OP-BOG-${year}-${seq}-${rand}`;
  }

  /**
   * Crea una operación a partir de una propuesta aceptada.
   */
  async createFromProposal(proposalId: string, overrides?: Partial<CreateOperationData>): Promise<Operation> {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        publication: {
          include: {
            ownerUser: true,
            organization: true,
          },
        },
        proposerUser: true,
        proposerOrganization: true,
      },
    });

    if (!proposal) {
      throw new Error('Propuesta no encontrada');
    }

    // Determinar comprador y vendedor según el tipo de publicación
    // Si la publicación fue OFFER: el creador de la publicación es SELLER, el proponente es BUYER.
    // Si la publicación fue NEED: el creador de la publicación es BUYER, el proponente es SELLER.
    const isOffer = proposal.publication.type === 'OFFER';

    const sellerUserId = isOffer ? proposal.publication.ownerUserId : proposal.proposerUserId;
    const sellerOrganizationId = isOffer
      ? proposal.publication.organizationId
      : proposal.proposerOrganizationId;

    const buyerUserId = isOffer ? proposal.proposerUserId : proposal.publication.ownerUserId;
    const buyerOrganizationId = isOffer
      ? proposal.proposerOrganizationId
      : proposal.publication.organizationId;

    const code = await this.generateCode();

    return prisma.operation.create({
      data: {
        code,
        proposalId: proposal.id,
        publicationId: proposal.publicationId,
        sellerUserId,
        sellerOrganizationId,
        buyerUserId,
        buyerOrganizationId,
        materialCategoryId: proposal.publication.categoryId,
        quantity: proposal.quantity,
        unitId: proposal.unitId,
        pickupAddress: overrides?.pickupAddress || proposal.publication.locationAddress,
        pickupCity: proposal.publication.locationCity || 'Bogotá D.C.',
        pickupArea: overrides?.pickupArea || proposal.publication.locationArea,
        deliveryAddress: overrides?.deliveryAddress || null,
        deliveryArea: overrides?.deliveryArea || null,
        status: OperationStatus.ACCEPTED,
      },
      include: this.getCommonIncludes(),
    });
  }

  /**
   * Consulta una operación por su ID.
   */
  async findById(id: string) {
    return prisma.operation.findUnique({
      where: { id },
      include: this.getCommonIncludes(),
    });
  }

  /**
   * Consulta una operación asociada a una propuesta.
   */
  async findByProposalId(proposalId: string) {
    return prisma.operation.findUnique({
      where: { proposalId },
      include: this.getCommonIncludes(),
    });
  }

  /**
   * Lista operaciones de un usuario (como vendedor, comprador o transportador) con filtros y paginación.
   */
  async listUserOperations(params: {
    userId: string;
    orgIds?: string[];
    status?: OperationStatus;
    role?: 'seller' | 'buyer' | 'transporter' | 'any';
    page?: number;
    pageSize?: number;
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.OperationWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }

    const orgIds = params.orgIds || [];

    if (params.role === 'seller') {
      where.OR = [
        { sellerUserId: params.userId },
        ...(orgIds.length > 0 ? [{ sellerOrganizationId: { in: orgIds } }] : []),
      ];
    } else if (params.role === 'buyer') {
      where.OR = [
        { buyerUserId: params.userId },
        ...(orgIds.length > 0 ? [{ buyerOrganizationId: { in: orgIds } }] : []),
      ];
    } else if (params.role === 'transporter') {
      where.OR = [
        { transporterUserId: params.userId },
        ...(orgIds.length > 0 ? [{ transporterOrganizationId: { in: orgIds } }] : []),
      ];
    } else {
      // 'any'
      where.OR = [
        { sellerUserId: params.userId },
        { buyerUserId: params.userId },
        { transporterUserId: params.userId },
        ...(orgIds.length > 0
          ? [
              { sellerOrganizationId: { in: orgIds } },
              { buyerOrganizationId: { in: orgIds } },
              { transporterOrganizationId: { in: orgIds } },
            ]
          : []),
      ];
    }

    const [total, data] = await Promise.all([
      prisma.operation.count({ where }),
      prisma.operation.findMany({
        where,
        include: this.getCommonIncludes(),
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return { total, page, pageSize, data };
  }

  /**
   * Actualiza la programación logística de la operación (SCHEDULED).
   */
  async scheduleOperation(id: string, data: ScheduleOperationData) {
    return prisma.operation.update({
      where: { id },
      data: {
        status: OperationStatus.SCHEDULED,
        scheduledDate: data.scheduledDate,
        scheduledTimeSlot: data.scheduledTimeSlot || null,
        pickupAddress: data.pickupAddress,
        pickupArea: data.pickupArea,
        deliveryAddress: data.deliveryAddress || null,
        deliveryArea: data.deliveryArea || null,
        transporterUserId: data.transporterUserId || null,
        vehiclePlate: data.vehiclePlate || null,
        driverName: data.driverName || null,
        transportNotes: data.transportNotes || null,
      },
      include: this.getCommonIncludes(),
    });
  }

  /**
   * Inicia la fase de recolección (COLLECTING).
   */
  async startCollecting(id: string) {
    return prisma.operation.update({
      where: { id },
      data: {
        status: OperationStatus.COLLECTING,
      },
      include: this.getCommonIncludes(),
    });
  }

  /**
   * Registra una evidencia asociada a la operación y transiciona a EVIDENCE.
   */
  async addEvidence(operationId: string, data: AddEvidenceData) {
    return prisma.$transaction(async (tx) => {
      const evidence = await tx.operationEvidence.create({
        data: {
          operationId,
          type: data.type,
          fileUrl: data.fileUrl,
          description: data.description || null,
          weightKg: data.weightKg ? new Prisma.Decimal(data.weightKg) : null,
          uploadedByUserId: data.uploadedByUserId,
        },
        include: {
          uploadedByUser: {
            select: { id: true, fullName: true },
          },
        },
      });

      // Actualizar peso verificado en la operación si se registró
      const updateData: Prisma.OperationUpdateInput = {
        status: OperationStatus.EVIDENCE,
      };
      if (data.weightKg) {
        updateData.actualWeight = new Prisma.Decimal(data.weightKg);
      }

      await tx.operation.update({
        where: { id: operationId },
        data: updateData,
      });

      return evidence;
    });
  }

  /**
   * Registra la recepción conforme de la carga (RECEIVED).
   */
  async receiveOperation(id: string, data?: { receivedNotes?: string; actualReceivedQuantity?: number }) {
    const updateData: Prisma.OperationUpdateInput = {
      status: OperationStatus.RECEIVED,
      receivedNotes: data?.receivedNotes || null,
    };
    if (data?.actualReceivedQuantity) {
      updateData.actualWeight = new Prisma.Decimal(data.actualReceivedQuantity);
    }

    return prisma.operation.update({
      where: { id },
      data: updateData,
      include: this.getCommonIncludes(),
    });
  }

  /**
   * Cierra definitivamente la operación (CLOSED).
   */
  async closeOperation(id: string, closingNotes?: string) {
    return prisma.operation.update({
      where: { id },
      data: {
        status: OperationStatus.CLOSED,
        closedAt: new Date(),
        transportNotes: closingNotes ? closingNotes : undefined,
      },
      include: this.getCommonIncludes(),
    });
  }

  /**
   * Cancela una operación (CANCELLED).
   */
  async cancelOperation(id: string, reason: string) {
    return prisma.operation.update({
      where: { id },
      data: {
        status: OperationStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
      include: this.getCommonIncludes(),
    });
  }

  /**
   * Crea una evaluación / calificación para una operación cerrada.
   */
  async createReview(data: CreateReviewData) {
    return prisma.operationReview.create({
      data: {
        operationId: data.operationId,
        reviewerUserId: data.reviewerUserId,
        targetUserId: data.targetUserId,
        score: data.score,
        punctualityScore: data.punctualityScore || null,
        materialQualityScore: data.materialQualityScore || null,
        fulfillmentScore: data.fulfillmentScore || null,
        comment: data.comment || null,
      },
      include: {
        reviewerUser: { select: { id: true, fullName: true } },
        targetUser: { select: { id: true, fullName: true } },
      },
    });
  }

  /**
   * Consulta las evaluaciones recibidas por un usuario.
   */
  async getUserReviewSummary(userId: string): Promise<UserReviewSummaryDto> {
    const reviews = await prisma.operationReview.findMany({
      where: { targetUserId: userId },
    });

    if (reviews.length === 0) {
      return {
        userId,
        averageScore: 0,
        totalReviews: 0,
        scoreBreakdown: {
          punctualityAverage: 0,
          materialQualityAverage: 0,
          fulfillmentAverage: 0,
        },
      };
    }

    const total = reviews.length;
    const sumScore = reviews.reduce((acc, r) => acc + r.score, 0);

    const punctualityScores = reviews.filter((r) => r.punctualityScore !== null).map((r) => r.punctualityScore!);
    const materialScores = reviews.filter((r) => r.materialQualityScore !== null).map((r) => r.materialQualityScore!);
    const fulfillmentScores = reviews.filter((r) => r.fulfillmentScore !== null).map((r) => r.fulfillmentScore!);

    const punctualityAvg = punctualityScores.length ? punctualityScores.reduce((a, b) => a + b, 0) / punctualityScores.length : null;
    const materialAvg = materialScores.length ? materialScores.reduce((a, b) => a + b, 0) / materialScores.length : null;
    const fulfillmentAvg = fulfillmentScores.length ? fulfillmentScores.reduce((a, b) => a + b, 0) / fulfillmentScores.length : null;

    return {
      userId,
      averageScore: Number((sumScore / total).toFixed(1)),
      totalReviews: total,
      scoreBreakdown: {
        punctualityAverage: punctualityAvg ? Number(punctualityAvg.toFixed(1)) : null,
        materialQualityAverage: materialAvg ? Number(materialAvg.toFixed(1)) : null,
        fulfillmentAverage: fulfillmentAvg ? Number(fulfillmentAvg.toFixed(1)) : null,
      },
    };
  }

  /**
   * Consulta lista de evaluaciones de una operación.
   */
  async listOperationReviews(operationId: string) {
    return prisma.operationReview.findMany({
      where: { operationId },
      include: {
        reviewerUser: { select: { id: true, fullName: true } },
        targetUser: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private getCommonIncludes() {
    return {
      publication: true,
      sellerUser: { select: { id: true, fullName: true, phone: true, userType: true } },
      sellerOrganization: { select: { id: true, name: true } },
      buyerUser: { select: { id: true, fullName: true, phone: true, userType: true } },
      buyerOrganization: { select: { id: true, name: true } },
      transporterUser: { select: { id: true, fullName: true, phone: true, userType: true } },
      materialCategory: { select: { id: true, name: true } },
      unit: { select: { id: true, name: true, abbreviation: true } },
      evidences: {
        include: {
          uploadedByUser: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'asc' as const },
      },
      reviews: {
        include: {
          reviewerUser: { select: { id: true, fullName: true } },
          targetUser: { select: { id: true, fullName: true } },
        },
      },
    };
  }
}

export const operationsRepository = new OperationsRepository();

/**
 * Convierte un registro de Operation a OperationDto con timeline y sin datos sensibles ajenos.
 */
export function toOperationDto(operation: any, currentUserId?: string): OperationDto {
  const evidences: OperationEvidenceDto[] = (operation.evidences || []).map((e: any) => ({
    id: e.id,
    operationId: e.operationId,
    type: e.type,
    fileUrl: e.fileUrl,
    description: e.description,
    weightKg: e.weightKg ? Number(e.weightKg) : null,
    uploadedByUserId: e.uploadedByUserId,
    uploadedByName: e.uploadedByUser?.fullName || undefined,
    createdAt: e.createdAt.toISOString(),
  }));

  const reviews: OperationReviewDto[] = (operation.reviews || []).map((r: any) => ({
    id: r.id,
    operationId: r.operationId,
    reviewerUserId: r.reviewerUserId,
    reviewerDisplayName: r.reviewerUser?.fullName || undefined,
    targetUserId: r.targetUserId,
    targetDisplayName: r.targetUser?.fullName || undefined,
    score: r.score,
    punctualityScore: r.punctualityScore,
    materialQualityScore: r.materialQualityScore,
    fulfillmentScore: r.fulfillmentScore,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
  }));

  const statusOrder: OperationStatus[] = ['ACCEPTED', 'SCHEDULED', 'COLLECTING', 'EVIDENCE', 'RECEIVED', 'CLOSED'];
  const currentIndex = statusOrder.indexOf(operation.status);

  const stageDescriptions: Record<OperationStatus, { label: string; desc: string }> = {
    ACCEPTED: { label: 'Acuerdo Aceptado', desc: 'Propuesta formal acordada entre las partes' },
    SCHEDULED: { label: 'Recolección Agendada', desc: 'Fecha, hora y punto de recolección programados' },
    COLLECTING: { label: 'En Recolección', desc: 'Vehículo en ruta y recolección en sitio' },
    EVIDENCE: { label: 'Pesaje y Evidencias', desc: 'Pesaje en báscula y soporte documental cargado' },
    RECEIVED: { label: 'Recepción Conforme', desc: 'Lote ingresado y verificado en destino' },
    CLOSED: { label: 'Cierre y Calificación', desc: 'Operación concluida y liquidada con éxito' },
    CANCELLED: { label: 'Cancelada', desc: 'Operación interrumpida antes de completarse' },
  };

  const timeline: OperationTimelineStepDto[] = statusOrder.map((st, idx) => {
    const isDone = currentIndex >= idx;
    const isActive = currentIndex === idx;
    let completedAt: string | null = null;
    if (st === 'ACCEPTED') completedAt = operation.createdAt.toISOString();
    if (st === 'SCHEDULED' && operation.scheduledDate) completedAt = new Date(operation.scheduledDate).toISOString();
    if (st === 'CLOSED' && operation.closedAt) completedAt = new Date(operation.closedAt).toISOString();

    return {
      stage: st,
      label: stageDescriptions[st].label,
      description: stageDescriptions[st].desc,
      completedAt,
      isDone,
      isActive,
    };
  });

  const seller: OperationPartySummaryDto = {
    userId: operation.sellerUserId,
    displayName: operation.sellerOrganization?.name || operation.sellerUser?.fullName || 'Vendedor',
    phone: operation.sellerUser?.phone || null,
    organizationId: operation.sellerOrganizationId || null,
    organizationName: operation.sellerOrganization?.name || null,
    userType: operation.sellerUser?.userType,
  };

  const buyer: OperationPartySummaryDto = {
    userId: operation.buyerUserId,
    displayName: operation.buyerOrganization?.name || operation.buyerUser?.fullName || 'Comprador',
    phone: operation.buyerUser?.phone || null,
    organizationId: operation.buyerOrganizationId || null,
    organizationName: operation.buyerOrganization?.name || null,
    userType: operation.buyerUser?.userType,
  };

  let transporter: OperationPartySummaryDto | null = null;
  if (operation.transporterUserId) {
    transporter = {
      userId: operation.transporterUserId,
      displayName: operation.transporterUser?.fullName || 'Transportador',
      phone: operation.transporterUser?.phone || null,
      userType: operation.transporterUser?.userType,
    };
  }

  return {
    id: operation.id,
    code: operation.code,
    proposalId: operation.proposalId,
    publicationId: operation.publicationId,
    sellerUserId: operation.sellerUserId,
    sellerOrganizationId: operation.sellerOrganizationId,
    seller,
    buyerUserId: operation.buyerUserId,
    buyerOrganizationId: operation.buyerOrganizationId,
    buyer,
    transporterUserId: operation.transporterUserId,
    transporterOrganizationId: operation.transporterOrganizationId,
    transporter,
    materialCategoryId: operation.materialCategoryId,
    materialCategoryName: operation.materialCategory?.name,
    quantity: Number(operation.quantity),
    unitId: operation.unitId,
    unitName: operation.unit?.name,
    unitAbbreviation: operation.unit?.abbreviation,
    agreedPriceCop: operation.agreedPriceCop ? Number(operation.agreedPriceCop) : null,
    status: operation.status,
    scheduledDate: operation.scheduledDate ? new Date(operation.scheduledDate).toISOString() : null,
    scheduledTimeSlot: operation.scheduledTimeSlot,
    pickupAddress: operation.pickupAddress,
    pickupCity: operation.pickupCity,
    pickupArea: operation.pickupArea,
    deliveryAddress: operation.deliveryAddress,
    deliveryCity: operation.deliveryCity,
    deliveryArea: operation.deliveryArea,
    transportNotes: operation.transportNotes,
    vehiclePlate: operation.vehiclePlate,
    driverName: operation.driverName,
    actualWeight: operation.actualWeight ? Number(operation.actualWeight) : null,
    receivedNotes: operation.receivedNotes,
    closedAt: operation.closedAt ? new Date(operation.closedAt).toISOString() : null,
    cancelledAt: operation.cancelledAt ? new Date(operation.cancelledAt).toISOString() : null,
    cancellationReason: operation.cancellationReason,
    createdAt: operation.createdAt.toISOString(),
    updatedAt: operation.updatedAt.toISOString(),
    evidences,
    reviews,
    timeline,
  };
}
