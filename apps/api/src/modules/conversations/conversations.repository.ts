import { prisma } from '../../database/prisma';
import {
  Conversation,
  Message,
  Proposal,
  ConversationStatus,
  MessageType,
  ProposalStatus,
  PublicationStatus,
  Prisma,
} from '../../generated/prisma-client';
import {
  ConversationDto,
  MessageDto,
  ProposalDto,
  CounterpartSummaryDto,
  ConversationPublicationSummaryDto,
  SafeUserDto,
} from '@data-circular/shared';

export interface CreateConversationData {
  publicationId: string;
  initiatorUserId: string;
  initiatorOrganizationId?: string | null;
  counterpartUserId: string;
  counterpartOrganizationId?: string | null;
  initialMessage?: string;
}

export interface CreateMessageData {
  conversationId: string;
  senderUserId?: string | null;
  body: string;
  type?: MessageType;
  metadata?: Record<string, unknown> | null;
}

export interface CreateProposalData {
  conversationId: string;
  publicationId: string;
  proposerUserId: string;
  proposerOrganizationId?: string | null;
  proposerDisplayName: string;
  quantity: number;
  unitId: string;
  terms: string;
  parentProposalId?: string | null;
}

/**
 * Mapea una entidad Prisma Message a MessageDto sanitizado (sin emails/teléfonos).
 */
export function toMessageDto(
  message: Message & {
    senderUser?: { id: string; fullName: string } | null;
  },
  currentUserId?: string
): MessageDto {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderUserId: message.senderUserId,
    senderDisplayName: message.senderUser?.fullName || (message.type === 'SYSTEM' ? 'Sistema' : undefined),
    body: message.body,
    type: message.type as MessageType,
    metadata: (message.metadata as Record<string, unknown>) || null,
    createdAt: message.createdAt.toISOString(),
    isMine: currentUserId ? message.senderUserId === currentUserId : undefined,
  };
}

/**
 * Mapea una entidad Prisma Proposal a ProposalDto sanitizado.
 */
export function toProposalDto(
  proposal: Proposal & {
    proposerUser?: { id: string; fullName: string } | null;
    proposerOrganization?: { id: string; name: string } | null;
    unit?: { id: string; name: string; abbreviation: string } | null;
  },
  currentUserId?: string
): ProposalDto {
  const displayName = proposal.proposerOrganization
    ? proposal.proposerOrganization.name
    : proposal.proposerUser?.fullName || 'Usuario';

  return {
    id: proposal.id,
    conversationId: proposal.conversationId,
    publicationId: proposal.publicationId,
    proposerUserId: proposal.proposerUserId,
    proposerOrganizationId: proposal.proposerOrganizationId,
    proposerDisplayName: displayName,
    quantity: Number(proposal.quantity),
    unitId: proposal.unitId,
    unitName: proposal.unit?.name,
    unitAbbreviation: proposal.unit?.abbreviation,
    terms: proposal.terms,
    status: proposal.status as ProposalStatus,
    parentProposalId: proposal.parentProposalId,
    respondedByUserId: proposal.respondedByUserId,
    respondedAt: proposal.respondedAt ? proposal.respondedAt.toISOString() : null,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
    isMine: currentUserId ? proposal.proposerUserId === currentUserId : undefined,
  };
}

/**
 * Mapea una conversación completa a ConversationDto con estricta sanitización de privacidad.
 */
export function toConversationDto(
  conv: any,
  currentUserId: string,
  userOrgIds: string[] = []
): ConversationDto {
  // Determinar si el usuario actual actúa del lado del iniciador o del dueño de la publicación
  const isInitiatorSide =
    conv.initiatorUserId === currentUserId ||
    (conv.initiatorOrganizationId && userOrgIds.includes(conv.initiatorOrganizationId));

  // Contraparte para la vista del usuario
  let counterpart: CounterpartSummaryDto;
  if (isInitiatorSide) {
    counterpart = {
      userId: conv.counterpartUserId,
      displayName: conv.counterpartOrganization
        ? conv.counterpartOrganization.name
        : conv.counterpartUser?.fullName || 'Usuario',
      organizationId: conv.counterpartOrganizationId,
      organizationName: conv.counterpartOrganization?.name || null,
      verificationStatus: conv.counterpartOrganization?.verificationStatus || null,
    };
  } else {
    counterpart = {
      userId: conv.initiatorUserId,
      displayName: conv.initiatorOrganization
        ? conv.initiatorOrganization.name
        : conv.initiatorUser?.fullName || 'Usuario',
      organizationId: conv.initiatorOrganizationId,
      organizationName: conv.initiatorOrganization?.name || null,
      verificationStatus: conv.initiatorOrganization?.verificationStatus || null,
    };
  }

  // Resumen de la publicación asociada
  let publicationSummary: ConversationPublicationSummaryDto | undefined;
  if (conv.publication) {
    const isExpired =
      conv.publication.status === 'ACTIVE' &&
      conv.publication.expiresAt &&
      new Date(conv.publication.expiresAt) < new Date();

    publicationSummary = {
      id: conv.publication.id,
      type: conv.publication.type,
      categoryId: conv.publication.categoryId,
      categoryName: conv.publication.category?.name,
      quantity: Number(conv.publication.quantity),
      unitId: conv.publication.unitId,
      unitName: conv.publication.unit?.name,
      unitAbbreviation: conv.publication.unit?.abbreviation,
      locationAddress: conv.publication.locationAddress,
      locationCity: conv.publication.locationCity,
      locationArea: conv.publication.locationArea,
      photoUrl: conv.publication.photoUrl,
      status: (isExpired ? 'EXPIRED' : conv.publication.status) as PublicationStatus,
    };
  }

  // Estado del participante para el usuario actual
  const userState = conv.participantStates?.find(
    (s: any) => s.userId === currentUserId
  );
  const isArchived = Boolean(userState?.archivedAt);

  // Último mensaje
  let lastMessage: MessageDto | null = null;
  if (conv.messages && conv.messages.length > 0) {
    lastMessage = toMessageDto(conv.messages[0], currentUserId);
  }

  // Propuesta vigente (preferir PENDING, sino la más reciente)
  let currentProposal: ProposalDto | null = null;
  if (conv.proposals && conv.proposals.length > 0) {
    const pending = conv.proposals.find((p: any) => p.status === 'PENDING');
    currentProposal = toProposalDto(pending || conv.proposals[0], currentUserId);
  }

  return {
    id: conv.id,
    publicationId: conv.publicationId,
    initiatorUserId: conv.initiatorUserId,
    initiatorOrganizationId: conv.initiatorOrganizationId,
    counterpartUserId: conv.counterpartUserId,
    counterpartOrganizationId: conv.counterpartOrganizationId,
    status: conv.status as ConversationStatus,
    lastMessageAt: conv.lastMessageAt ? conv.lastMessageAt.toISOString() : null,
    createdAt: conv.createdAt.toISOString(),
    updatedAt: conv.updatedAt.toISOString(),
    unreadCount: conv.unreadCount ?? 0,
    isArchived,
    publication: publicationSummary,
    counterpart,
    lastMessage,
    currentProposal,
  };
}

export class ConversationsRepository {
  /**
   * Busca conversación por ID con todos los detalles necesarios.
   */
  async findById(conversationId: string) {
    return prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        publication: {
          include: {
            category: true,
            unit: true,
          },
        },
        initiatorUser: {
          select: { id: true, fullName: true },
        },
        initiatorOrganization: {
          select: { id: true, name: true, verificationStatus: true },
        },
        counterpartUser: {
          select: { id: true, fullName: true },
        },
        counterpartOrganization: {
          select: { id: true, name: true, verificationStatus: true },
        },
        participantStates: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            senderUser: {
              select: { id: true, fullName: true },
            },
          },
        },
        proposals: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            proposerUser: { select: { id: true, fullName: true } },
            proposerOrganization: { select: { id: true, name: true } },
            unit: true,
          },
        },
      },
    });
  }

  /**
   * Busca si ya existe conversación para el par (publicación, usuario iniciador).
   */
  async findByPublicationAndInitiator(publicationId: string, initiatorUserId: string) {
    return prisma.conversation.findUnique({
      where: {
        publicationId_initiatorUserId: {
          publicationId,
          initiatorUserId,
        },
      },
      include: {
        publication: {
          include: {
            category: true,
            unit: true,
          },
        },
        initiatorUser: { select: { id: true, fullName: true } },
        initiatorOrganization: { select: { id: true, name: true, verificationStatus: true } },
        counterpartUser: { select: { id: true, fullName: true } },
        counterpartOrganization: { select: { id: true, name: true, verificationStatus: true } },
        participantStates: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            senderUser: { select: { id: true, fullName: true } },
          },
        },
        proposals: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            proposerUser: { select: { id: true, fullName: true } },
            proposerOrganization: { select: { id: true, name: true } },
            unit: true,
          },
        },
      },
    });
  }

  /**
   * Crea una conversación de forma atómica e idempotente.
   */
  async createConversation(data: CreateConversationData) {
    return prisma.$transaction(async (tx) => {
      const now = new Date();

      const conv = await tx.conversation.create({
        data: {
          publicationId: data.publicationId,
          initiatorUserId: data.initiatorUserId,
          initiatorOrganizationId: data.initiatorOrganizationId || null,
          counterpartUserId: data.counterpartUserId,
          counterpartOrganizationId: data.counterpartOrganizationId || null,
          status: ConversationStatus.OPEN,
          lastMessageAt: data.initialMessage ? now : null,
          participantStates: {
            create: [
              {
                userId: data.initiatorUserId,
                lastReadAt: now,
              },
              {
                userId: data.counterpartUserId,
                lastReadAt: null,
              },
            ],
          },
          ...(data.initialMessage
            ? {
                messages: {
                  create: {
                    senderUserId: data.initiatorUserId,
                    body: data.initialMessage,
                    type: MessageType.TEXT,
                    createdAt: now,
                  },
                },
              }
            : {}),
        },
        include: {
          publication: {
            include: {
              category: true,
              unit: true,
            },
          },
          initiatorUser: { select: { id: true, fullName: true } },
          initiatorOrganization: { select: { id: true, name: true, verificationStatus: true } },
          counterpartUser: { select: { id: true, fullName: true } },
          counterpartOrganization: { select: { id: true, name: true, verificationStatus: true } },
          participantStates: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              senderUser: { select: { id: true, fullName: true } },
            },
          },
          proposals: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              proposerUser: { select: { id: true, fullName: true } },
              proposerOrganization: { select: { id: true, name: true } },
              unit: true,
            },
          },
        },
      });

      return conv;
    });
  }

  /**
   * Lista conversaciones para un usuario (personal o de sus organizaciones).
   */
  async listUserConversations(
    userId: string,
    userOrgIds: string[],
    options: {
      archived?: boolean;
      status?: ConversationStatus;
      page: number;
      pageSize: number;
    }
  ) {
    const { archived, status, page, pageSize } = options;
    const skip = (page - 1) * pageSize;

    // Condición de pertenencia
    const participationCondition: Prisma.ConversationWhereInput = {
      OR: [
        { initiatorUserId: userId },
        { counterpartUserId: userId },
        ...(userOrgIds.length > 0
          ? [
              { initiatorOrganizationId: { in: userOrgIds } },
              { counterpartOrganizationId: { in: userOrgIds } },
            ]
          : []),
      ],
    };

    // Filtro de archivado por participante
    let archivedCondition: Prisma.ConversationWhereInput = {};
    if (archived === true) {
      archivedCondition = {
        participantStates: {
          some: {
            userId,
            archivedAt: { not: null },
          },
        },
      };
    } else if (archived === false) {
      archivedCondition = {
        NOT: {
          participantStates: {
            some: {
              userId,
              archivedAt: { not: null },
            },
          },
        },
      };
    }

    const where: Prisma.ConversationWhereInput = {
      AND: [
        participationCondition,
        status ? { status } : {},
        archivedCondition,
      ],
    };

    const [total, conversations] = await prisma.$transaction([
      prisma.conversation.count({ where }),
      prisma.conversation.findMany({
        where,
        include: {
          publication: {
            include: {
              category: true,
              unit: true,
            },
          },
          initiatorUser: { select: { id: true, fullName: true } },
          initiatorOrganization: { select: { id: true, name: true, verificationStatus: true } },
          counterpartUser: { select: { id: true, fullName: true } },
          counterpartOrganization: { select: { id: true, name: true, verificationStatus: true } },
          participantStates: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              senderUser: { select: { id: true, fullName: true } },
            },
          },
          proposals: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              proposerUser: { select: { id: true, fullName: true } },
              proposerOrganization: { select: { id: true, name: true } },
              unit: true,
            },
          },
        },
        orderBy: [
          { lastMessageAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: pageSize,
      }),
    ]);

    // Calcular conteo de no leídos para cada conversación
    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        const state = conv.participantStates.find((s) => s.userId === userId);
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderUserId: { not: userId },
            ...(state?.lastReadAt ? { createdAt: { gt: state.lastReadAt } } : {}),
          },
        });
        return {
          ...conv,
          unreadCount,
        };
      })
    );

    return {
      total,
      data: withUnread,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Conteo total de mensajes no leídos para un usuario a lo largo de todas sus conversaciones.
   */
  async getGlobalUnreadCount(userId: string, userOrgIds: string[]): Promise<number> {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { initiatorUserId: userId },
          { counterpartUserId: userId },
          ...(userOrgIds.length > 0
            ? [
                { initiatorOrganizationId: { in: userOrgIds } },
                { counterpartOrganizationId: { in: userOrgIds } },
              ]
            : []),
        ],
        status: ConversationStatus.OPEN,
      },
      include: {
        participantStates: {
          where: { userId },
        },
      },
    });

    let totalUnread = 0;
    for (const conv of conversations) {
      const state = conv.participantStates[0];
      const count = await prisma.message.count({
        where: {
          conversationId: conv.id,
          senderUserId: { not: userId },
          ...(state?.lastReadAt ? { createdAt: { gt: state.lastReadAt } } : {}),
        },
      });
      totalUnread += count;
    }

    return totalUnread;
  }

  /**
   * Actualiza el estado de lectura / archivo de un participante en una conversación.
   */
  async upsertParticipantState(
    conversationId: string,
    userId: string,
    data: { lastReadAt?: Date | null; archivedAt?: Date | null }
  ) {
    return prisma.conversationParticipantState.upsert({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      create: {
        conversationId,
        userId,
        lastReadAt: data.lastReadAt !== undefined ? data.lastReadAt : null,
        archivedAt: data.archivedAt !== undefined ? data.archivedAt : null,
      },
      update: {
        ...(data.lastReadAt !== undefined ? { lastReadAt: data.lastReadAt } : {}),
        ...(data.archivedAt !== undefined ? { archivedAt: data.archivedAt } : {}),
      },
    });
  }

  /**
   * Cuenta cuántos mensajes ha enviado un usuario en los últimos N milisegundos (rate limiter anti-spam).
   */
  async countRecentMessages(conversationId: string, userId: string, windowMs: number): Promise<number> {
    const since = new Date(Date.now() - windowMs);
    return prisma.message.count({
      where: {
        conversationId,
        senderUserId: userId,
        createdAt: { gte: since },
      },
    });
  }

  /**
   * Crea un mensaje de texto o sistema en una transacción atómica.
   * Desarchiva automáticamente la conversación para el remitente y actualiza lastMessageAt.
   */
  async createMessage(data: CreateMessageData) {
    return prisma.$transaction(async (tx) => {
      const now = new Date();

      const message = await tx.message.create({
        data: {
          conversationId: data.conversationId,
          senderUserId: data.senderUserId || null,
          body: data.body,
          type: data.type || MessageType.TEXT,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
          createdAt: now,
        },
        include: {
          senderUser: {
            select: { id: true, fullName: true },
          },
        },
      });

      // Actualizar timestamp del último mensaje de la conversación
      await tx.conversation.update({
        where: { id: data.conversationId },
        data: {
          lastMessageAt: now,
        },
      });

      // Si el mensaje es de un usuario, actualizar su lastReadAt y desarchivar si estaba archivado
      if (data.senderUserId) {
        await tx.conversationParticipantState.upsert({
          where: {
            conversationId_userId: {
              conversationId: data.conversationId,
              userId: data.senderUserId,
            },
          },
          create: {
            conversationId: data.conversationId,
            userId: data.senderUserId,
            lastReadAt: now,
            archivedAt: null,
          },
          update: {
            lastReadAt: now,
            archivedAt: null,
          },
        });
      }

      return message;
    });
  }

  /**
   * Lista mensajes de una conversación con paginación.
   */
  async listMessages(conversationId: string, page: number = 1, pageSize: number = 50) {
    const skip = (page - 1) * pageSize;

    const [total, messages] = await prisma.$transaction([
      prisma.message.count({ where: { conversationId } }),
      prisma.message.findMany({
        where: { conversationId },
        include: {
          senderUser: {
            select: { id: true, fullName: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      total,
      data: messages,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Crea una propuesta o contrapropuesta dentro de una transacción atómica.
   * Regla: en una conversación solo puede haber a lo sumo UNA propuesta PENDING.
   * La anterior pasa a SUPERSEDED y se genera un mensaje de sistema descriptivo.
   */
  async createProposal(data: CreateProposalData) {
    return prisma.$transaction(async (tx) => {
      const now = new Date();

      // Buscar si existe propuesta PENDING actual
      const pendingProposal = await tx.proposal.findFirst({
        where: {
          conversationId: data.conversationId,
          status: ProposalStatus.PENDING,
        },
        include: {
          unit: true,
        },
      });

      // Si había una propuesta PENDING, marcarla como SUPERSEDED
      if (pendingProposal) {
        await tx.proposal.update({
          where: { id: pendingProposal.id },
          data: {
            status: ProposalStatus.SUPERSEDED,
            updatedAt: now,
          },
        });
      }

      // Obtener datos de la unidad para el mensaje de sistema
      const unit = await tx.unit.findUnique({
        where: { id: data.unitId },
      });

      const unitAbbr = unit?.abbreviation || 'und';

      // Crear nueva propuesta PENDING
      const parentId = data.parentProposalId || pendingProposal?.id || null;

      const newProposal = await tx.proposal.create({
        data: {
          conversationId: data.conversationId,
          publicationId: data.publicationId,
          proposerUserId: data.proposerUserId,
          proposerOrganizationId: data.proposerOrganizationId || null,
          quantity: data.quantity,
          unitId: data.unitId,
          terms: data.terms,
          status: ProposalStatus.PENDING,
          parentProposalId: parentId,
          createdAt: now,
          updatedAt: now,
        },
        include: {
          proposerUser: { select: { id: true, fullName: true } },
          proposerOrganization: { select: { id: true, name: true } },
          unit: true,
        },
      });

      // Mensaje de sistema generado automáticamente
      const isCounterProposal = Boolean(parentId);
      const systemBody = isCounterProposal
        ? `Contrapropuesta presentada por ${data.proposerDisplayName}: ${data.quantity} ${unitAbbr} - ${data.terms}`
        : `Propuesta formal presentada por ${data.proposerDisplayName}: ${data.quantity} ${unitAbbr} - ${data.terms}`;

      await tx.message.create({
        data: {
          conversationId: data.conversationId,
          senderUserId: null,
          body: systemBody,
          type: MessageType.SYSTEM,
          metadata: {
            event: isCounterProposal ? 'PROPOSAL_SUPERSEDED' : 'PROPOSAL_CREATED',
            proposalId: newProposal.id,
            parentProposalId: parentId,
            quantity: data.quantity,
            unit: unitAbbr,
          },
          createdAt: now,
        },
      });

      // Actualizar lastMessageAt de la conversación y lastReadAt del proponente
      await tx.conversation.update({
        where: { id: data.conversationId },
        data: { lastMessageAt: now },
      });

      await tx.conversationParticipantState.upsert({
        where: {
          conversationId_userId: {
            conversationId: data.conversationId,
            userId: data.proposerUserId,
          },
        },
        create: {
          conversationId: data.conversationId,
          userId: data.proposerUserId,
          lastReadAt: now,
          archivedAt: null,
        },
        update: {
          lastReadAt: now,
          archivedAt: null,
        },
      });

      return newProposal;
    });
  }

  /**
   * Busca propuesta por ID con datos completos.
   */
  async findProposalById(proposalId: string) {
    return prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        conversation: {
          include: {
            initiatorUser: { select: { id: true, fullName: true } },
            counterpartUser: { select: { id: true, fullName: true } },
            initiatorOrganization: { select: { id: true, name: true } },
            counterpartOrganization: { select: { id: true, name: true } },
          },
        },
        publication: true,
        unit: true,
        proposerUser: { select: { id: true, fullName: true } },
        proposerOrganization: { select: { id: true, name: true } },
        respondedByUser: { select: { id: true, fullName: true } },
      },
    });
  }

  /**
   * Acepta una propuesta formal en transacción atómica con control de concurrencia.
   */
  async acceptProposal(
    proposalId: string,
    responderUserId: string,
    responderDisplayName: string
  ) {
    return prisma.$transaction(async (tx) => {
      const now = new Date();

      // Actualizar con condición de estatus PENDING para evitar race condition
      const updateResult = await tx.proposal.updateMany({
        where: {
          id: proposalId,
          status: ProposalStatus.PENDING,
        },
        data: {
          status: ProposalStatus.ACCEPTED,
          respondedByUserId: responderUserId,
          respondedAt: now,
          updatedAt: now,
        },
      });

      if (updateResult.count === 0) {
        return null;
      }

      const proposal = await tx.proposal.findUniqueOrThrow({
        where: { id: proposalId },
        include: {
          proposerUser: { select: { id: true, fullName: true } },
          proposerOrganization: { select: { id: true, name: true } },
          unit: true,
        },
      });

      // Crear mensaje de sistema en la conversación
      const systemBody = `Propuesta formal aceptada por ${responderDisplayName}. Las partes han acordado las condiciones.`;

      await tx.message.create({
        data: {
          conversationId: proposal.conversationId,
          senderUserId: null,
          body: systemBody,
          type: MessageType.SYSTEM,
          metadata: {
            event: 'PROPOSAL_ACCEPTED',
            proposalId: proposal.id,
            respondedByUserId: responderUserId,
          },
          createdAt: now,
        },
      });

      // Actualizar timestamps de la conversación y lectura
      await tx.conversation.update({
        where: { id: proposal.conversationId },
        data: { lastMessageAt: now },
      });

      await tx.conversationParticipantState.upsert({
        where: {
          conversationId_userId: {
            conversationId: proposal.conversationId,
            userId: responderUserId,
          },
        },
        create: {
          conversationId: proposal.conversationId,
          userId: responderUserId,
          lastReadAt: now,
          archivedAt: null,
        },
        update: {
          lastReadAt: now,
          archivedAt: null,
        },
      });

      return proposal;
    });
  }

  /**
   * Rechaza una propuesta formal en transacción atómica.
   */
  async rejectProposal(
    proposalId: string,
    responderUserId: string,
    responderDisplayName: string
  ) {
    return prisma.$transaction(async (tx) => {
      const now = new Date();

      const updateResult = await tx.proposal.updateMany({
        where: {
          id: proposalId,
          status: ProposalStatus.PENDING,
        },
        data: {
          status: ProposalStatus.REJECTED,
          respondedByUserId: responderUserId,
          respondedAt: now,
          updatedAt: now,
        },
      });

      if (updateResult.count === 0) {
        return null;
      }

      const proposal = await tx.proposal.findUniqueOrThrow({
        where: { id: proposalId },
        include: {
          proposerUser: { select: { id: true, fullName: true } },
          proposerOrganization: { select: { id: true, name: true } },
          unit: true,
        },
      });

      const systemBody = `Propuesta formal rechazada por ${responderDisplayName}. Se puede formular una nueva propuesta o continuar conversando.`;

      await tx.message.create({
        data: {
          conversationId: proposal.conversationId,
          senderUserId: null,
          body: systemBody,
          type: MessageType.SYSTEM,
          metadata: {
            event: 'PROPOSAL_REJECTED',
            proposalId: proposal.id,
            respondedByUserId: responderUserId,
          },
          createdAt: now,
        },
      });

      await tx.conversation.update({
        where: { id: proposal.conversationId },
        data: { lastMessageAt: now },
      });

      await tx.conversationParticipantState.upsert({
        where: {
          conversationId_userId: {
            conversationId: proposal.conversationId,
            userId: responderUserId,
          },
        },
        create: {
          conversationId: proposal.conversationId,
          userId: responderUserId,
          lastReadAt: now,
          archivedAt: null,
        },
        update: {
          lastReadAt: now,
          archivedAt: null,
        },
      });

      return proposal;
    });
  }
}

export const conversationsRepository = new ConversationsRepository();
