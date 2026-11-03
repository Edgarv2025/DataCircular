import {
  operationsRepository,
  toOperationDto,
} from './operations.repository';
import { prisma } from '../../database/prisma';
import { organizationsRepository } from '../organizations/organizations.repository';
import {
  SafeUserDto,
  OperationDto,
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

export class OperationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'OperationError';
  }
}

export class OperationsService {
  /**
   * Obtiene o crea la operación asociada a una propuesta formal aceptada.
   */
  async createOperation(
    input: CreateOperationInput,
    user: SafeUserDto
  ): Promise<{ operation: OperationDto; isNew: boolean }> {
    const proposal = await prisma.proposal.findUnique({
      where: { id: input.proposalId },
      include: {
        publication: true,
      },
    });

    if (!proposal) {
      throw new OperationError('PROPOSAL_NOT_FOUND', 'Propuesta formal no encontrada', 404);
    }

    if (proposal.status !== 'ACCEPTED') {
      throw new OperationError(
        'PROPOSAL_NOT_ACCEPTED',
        `No se puede generar una operación para una propuesta en estado ${proposal.status}. Debe estar ACCEPTED.`,
        409
      );
    }

    // Verificar si ya existe una operación creada para esta propuesta (Idempotencia)
    const existing = await operationsRepository.findByProposalId(proposal.id);
    if (existing) {
      await this.validateOperationAccess(existing, user);
      return {
        operation: toOperationDto(existing, user.id),
        isNew: false,
      };
    }

    // Validar que el usuario sea parte de la negociación
    const isProposer = proposal.proposerUserId === user.id;
    const isOwner = proposal.publication.ownerUserId === user.id;
    const userOrgIds = await this.getUserActiveOrgIds(user.id);
    const isProposerOrg = proposal.proposerOrganizationId && userOrgIds.includes(proposal.proposerOrganizationId);
    const isOwnerOrg = proposal.publication.organizationId && userOrgIds.includes(proposal.publication.organizationId);

    if (!isProposer && !isOwner && !isProposerOrg && !isOwnerOrg && user.role !== 'ADMIN') {
      throw new OperationError('FORBIDDEN', 'No perteneces a la negociación de esta propuesta', 403);
    }

    const created = await operationsRepository.createFromProposal(proposal.id, {
      pickupAddress: input.pickupAddress,
      pickupArea: input.pickupArea,
      deliveryAddress: input.deliveryAddress,
      deliveryArea: input.deliveryArea,
    });

    return {
      operation: toOperationDto(created, user.id),
      isNew: true,
    };
  }

  /**
   * Consulta una operación por su ID con control de acceso.
   */
  async getOperationById(operationId: string, user: SafeUserDto): Promise<OperationDto> {
    const op = await operationsRepository.findById(operationId);
    if (!op) {
      throw new OperationError('OPERATION_NOT_FOUND', 'Operación no encontrada', 404);
    }

    await this.validateOperationAccess(op, user);
    return toOperationDto(op, user.id);
  }

  /**
   * Lista operaciones del usuario autenticado.
   */
  async listUserOperations(query: GetOperationsQuery, user: SafeUserDto) {
    const userOrgIds = await this.getUserActiveOrgIds(user.id);
    const result = await operationsRepository.listUserOperations({
      userId: user.id,
      orgIds: userOrgIds,
      status: query.status,
      role: query.role,
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      data: result.data.map((op) => toOperationDto(op, user.id)),
    };
  }

  /**
   * Programa la logística y recolección (Transición: ACCEPTED -> SCHEDULED).
   */
  async scheduleOperation(
    operationId: string,
    input: ScheduleOperationInput,
    user: SafeUserDto
  ): Promise<OperationDto> {
    const op = await operationsRepository.findById(operationId);
    if (!op) {
      throw new OperationError('OPERATION_NOT_FOUND', 'Operación no encontrada', 404);
    }

    await this.validateOperationAccess(op, user);

    if (op.status !== 'ACCEPTED') {
      throw new OperationError(
        'INVALID_STATE_TRANSITION',
        `No se puede programar una operación en estado ${op.status}. Debe estar en estado ACCEPTED.`,
        409
      );
    }

    const scheduledDate = new Date(input.scheduledDate);
    if (isNaN(scheduledDate.getTime())) {
      throw new OperationError('INVALID_DATE', 'Fecha de programación inválida', 400);
    }

    const updated = await operationsRepository.scheduleOperation(op.id, {
      scheduledDate,
      scheduledTimeSlot: input.scheduledTimeSlot,
      pickupAddress: input.pickupAddress,
      pickupArea: input.pickupArea,
      deliveryAddress: input.deliveryAddress,
      deliveryArea: input.deliveryArea,
      transporterUserId: input.transporterUserId,
      vehiclePlate: input.vehiclePlate,
      driverName: input.driverName,
      transportNotes: input.transportNotes,
    });

    return toOperationDto(updated, user.id);
  }

  /**
   * Inicia la fase de recolección en ruta (Transición: SCHEDULED -> COLLECTING).
   */
  async startCollecting(operationId: string, user: SafeUserDto): Promise<OperationDto> {
    const op = await operationsRepository.findById(operationId);
    if (!op) {
      throw new OperationError('OPERATION_NOT_FOUND', 'Operación no encontrada', 404);
    }

    await this.validateOperationAccess(op, user);

    if (op.status !== 'SCHEDULED') {
      throw new OperationError(
        'INVALID_STATE_TRANSITION',
        `No se puede iniciar recolección de una operación en estado ${op.status}. Debe estar en estado SCHEDULED.`,
        409
      );
    }

    const updated = await operationsRepository.startCollecting(op.id);
    return toOperationDto(updated, user.id);
  }

  /**
   * Registra evidencia y pesaje (Transición: COLLECTING -> EVIDENCE o EVIDENCE -> EVIDENCE).
   */
  async addEvidence(
    operationId: string,
    input: AddEvidenceInput,
    user: SafeUserDto
  ) {
    const op = await operationsRepository.findById(operationId);
    if (!op) {
      throw new OperationError('OPERATION_NOT_FOUND', 'Operación no encontrada', 404);
    }

    await this.validateOperationAccess(op, user);

    if (op.status !== 'COLLECTING' && op.status !== 'EVIDENCE') {
      throw new OperationError(
        'INVALID_STATE_TRANSITION',
        `No se pueden adjuntar evidencias a una operación en estado ${op.status}. Debe estar en COLLECTING o EVIDENCE.`,
        409
      );
    }

    const evidence = await operationsRepository.addEvidence(op.id, {
      type: input.type,
      fileUrl: input.fileUrl,
      description: input.description,
      weightKg: input.weightKg,
      uploadedByUserId: user.id,
    });

    const refreshed = await operationsRepository.findById(op.id);
    return {
      evidence: {
        id: evidence.id,
        operationId: evidence.operationId,
        type: evidence.type,
        fileUrl: evidence.fileUrl,
        description: evidence.description,
        weightKg: evidence.weightKg ? Number(evidence.weightKg) : null,
        uploadedByUserId: evidence.uploadedByUserId,
        uploadedByName: evidence.uploadedByUser?.fullName,
        createdAt: evidence.createdAt.toISOString(),
      },
      operation: toOperationDto(refreshed!, user.id),
    };
  }

  /**
   * Registra la recepción en destino (Transición: EVIDENCE -> RECEIVED).
   */
  async receiveOperation(
    operationId: string,
    input: ReceiveOperationInput,
    user: SafeUserDto
  ): Promise<OperationDto> {
    const op = await operationsRepository.findById(operationId);
    if (!op) {
      throw new OperationError('OPERATION_NOT_FOUND', 'Operación no encontrada', 404);
    }

    await this.validateOperationAccess(op, user);

    if (op.status !== 'EVIDENCE') {
      throw new OperationError(
        'INVALID_STATE_TRANSITION',
        `No se puede recibir una operación en estado ${op.status}. Debe registrarse evidencia de pesaje primero (EVIDENCE).`,
        409
      );
    }

    const updated = await operationsRepository.receiveOperation(op.id, {
      receivedNotes: input.receivedNotes,
      actualReceivedQuantity: input.actualReceivedQuantity,
    });

    return toOperationDto(updated, user.id);
  }

  /**
   * Cierre formal definitivo (Transición: RECEIVED -> CLOSED).
   */
  async closeOperation(
    operationId: string,
    input: CloseOperationInput,
    user: SafeUserDto
  ): Promise<OperationDto> {
    const op = await operationsRepository.findById(operationId);
    if (!op) {
      throw new OperationError('OPERATION_NOT_FOUND', 'Operación no encontrada', 404);
    }

    await this.validateOperationAccess(op, user);

    if (op.status !== 'RECEIVED') {
      throw new OperationError(
        'INVALID_STATE_TRANSITION',
        `No se puede cerrar una operación en estado ${op.status}. Debe haber sido recibida previamente (RECEIVED).`,
        409
      );
    }

    const updated = await operationsRepository.closeOperation(op.id, input.closingNotes);
    return toOperationDto(updated, user.id);
  }

  /**
   * Cancela la operación (Solo permitida en ACCEPTED o SCHEDULED).
   */
  async cancelOperation(
    operationId: string,
    input: CancelOperationInput,
    user: SafeUserDto
  ): Promise<OperationDto> {
    const op = await operationsRepository.findById(operationId);
    if (!op) {
      throw new OperationError('OPERATION_NOT_FOUND', 'Operación no encontrada', 404);
    }

    await this.validateOperationAccess(op, user);

    if (op.status !== 'ACCEPTED' && op.status !== 'SCHEDULED') {
      throw new OperationError(
        'CANNOT_CANCEL_IN_PROGRESS_OPERATION',
        `No se puede cancelar una operación que ya se encuentra en fase ${op.status}. Solo se admite en ACCEPTED o SCHEDULED.`,
        409
      );
    }

    const updated = await operationsRepository.cancelOperation(op.id, input.reason);
    return toOperationDto(updated, user.id);
  }

  /**
   * Calificación y evaluación de operación finalizada (Fase 12).
   */
  async createReview(
    operationId: string,
    input: CreateReviewInput,
    user: SafeUserDto
  ): Promise<OperationReviewDto> {
    const op = await operationsRepository.findById(operationId);
    if (!op) {
      throw new OperationError('OPERATION_NOT_FOUND', 'Operación no encontrada', 404);
    }

    await this.validateOperationAccess(op, user);

    // Regla: La operación DEBE estar en CLOSED
    if (op.status !== 'CLOSED') {
      throw new OperationError(
        'OPERATION_NOT_CLOSED',
        `Solo se pueden evaluar operaciones que hayan finalizado su ciclo con éxito (CLOSED). Estado actual: ${op.status}`,
        409
      );
    }

    // Determinar a quién evalúa el usuario autenticado
    let targetUserId: string;
    if (op.sellerUserId === user.id) {
      targetUserId = op.buyerUserId;
    } else if (op.buyerUserId === user.id) {
      targetUserId = op.sellerUserId;
    } else if (op.transporterUserId === user.id) {
      targetUserId = op.buyerUserId;
    } else {
      // Si actúa en nombre de organización
      const userOrgIds = await this.getUserActiveOrgIds(user.id);
      if (op.sellerOrganizationId && userOrgIds.includes(op.sellerOrganizationId)) {
        targetUserId = op.buyerUserId;
      } else if (op.buyerOrganizationId && userOrgIds.includes(op.buyerOrganizationId)) {
        targetUserId = op.sellerUserId;
      } else {
        throw new OperationError('FORBIDDEN', 'No eres participante directo de la operación a evaluar', 403);
      }
    }

    if (targetUserId === user.id) {
      throw new OperationError('CANNOT_REVIEW_SELF', 'No puedes evaluarte a ti mismo', 400);
    }

    // Regla: Cada usuario solo puede evaluar una vez por operación
    const existingReviews = await operationsRepository.listOperationReviews(op.id);
    const alreadyReviewed = existingReviews.some((r) => r.reviewerUserId === user.id);
    if (alreadyReviewed) {
      throw new OperationError(
        'DUPLICATE_REVIEW',
        'Ya has registrado una evaluación para esta operación',
        409
      );
    }

    const review = await operationsRepository.createReview({
      operationId: op.id,
      reviewerUserId: user.id,
      targetUserId,
      score: input.score,
      punctualityScore: input.punctualityScore,
      materialQualityScore: input.materialQualityScore,
      fulfillmentScore: input.fulfillmentScore,
      comment: input.comment,
    });

    return {
      id: review.id,
      operationId: review.operationId,
      reviewerUserId: review.reviewerUserId,
      reviewerDisplayName: review.reviewerUser?.fullName,
      targetUserId: review.targetUserId,
      targetDisplayName: review.targetUser?.fullName,
      score: review.score,
      punctualityScore: review.punctualityScore,
      materialQualityScore: review.materialQualityScore,
      fulfillmentScore: review.fulfillmentScore,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    };
  }

  /**
   * Resumen de reputación y evaluaciones recibidas por un usuario.
   */
  async getUserReviewSummary(userId: string): Promise<UserReviewSummaryDto> {
    return operationsRepository.getUserReviewSummary(userId);
  }

  /**
   * Valida si el usuario o su organización tienen acceso a la operación.
   */
  private async validateOperationAccess(op: any, user: SafeUserDto) {
    if (user.role === 'ADMIN') return;

    const userOrgIds = await this.getUserActiveOrgIds(user.id);

    const isDirectParty =
      op.sellerUserId === user.id ||
      op.buyerUserId === user.id ||
      op.transporterUserId === user.id;

    const isOrgParty =
      (op.sellerOrganizationId && userOrgIds.includes(op.sellerOrganizationId)) ||
      (op.buyerOrganizationId && userOrgIds.includes(op.buyerOrganizationId)) ||
      (op.transporterOrganizationId && userOrgIds.includes(op.transporterOrganizationId));

    if (!isDirectParty && !isOrgParty) {
      throw new OperationError('FORBIDDEN', 'No tienes permiso para acceder a esta operación', 403);
    }
  }

  private async getUserActiveOrgIds(userId: string): Promise<string[]> {
    const orgs = await organizationsRepository.listUserOrganizations(userId);
    return orgs.map((o) => o.id);
  }
}

export const operationsService = new OperationsService();
