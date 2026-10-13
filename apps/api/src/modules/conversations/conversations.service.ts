import {
  ConversationDto,
  MessageDto,
  ProposalDto,
  StartConversationInput,
  SendMessageInput,
  CreateProposalInput,
  GetConversationsQuery,
  GetMessagesQuery,
  SafeUserDto,
} from '@data-circular/shared';
import {
  conversationsRepository,
  toConversationDto,
  toMessageDto,
  toProposalDto,
} from './conversations.repository';
import { publicationsRepository } from '../publications/publications.repository';
import { organizationsRepository } from '../organizations/organizations.repository';

export class ConversationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'ConversationError';
  }
}

export class ConversationsService {
  /**
   * Obtiene los IDs de las organizaciones donde el usuario tiene membresía activa.
   */
  private async getUserActiveOrgIds(userId: string): Promise<string[]> {
    const orgs = await organizationsRepository.listUserOrganizations(userId);
    return orgs.map((o) => o.id);
  }

  /**
   * Valida si un usuario tiene acceso (lectura) a una conversación y determina su rol.
   */
  private async validateUserAccess(
    conv: any,
    user: SafeUserDto
  ): Promise<{ isParticipant: boolean; canWrite: boolean; actingOrgId?: string }> {
    if (user.role === 'ADMIN') {
      return { isParticipant: true, canWrite: true };
    }

    const isDirectUser =
      conv.initiatorUserId === user.id || conv.counterpartUserId === user.id;

    if (isDirectUser) {
      return { isParticipant: true, canWrite: true };
    }

    // Verificar si el usuario participa a través de alguna de las organizaciones
    const userOrgs = await organizationsRepository.listUserOrganizations(user.id);
    const orgIds = userOrgs.map((o) => o.id);

    const isInitiatorOrg = conv.initiatorOrganizationId && orgIds.includes(conv.initiatorOrganizationId);
    const isCounterpartOrg = conv.counterpartOrganizationId && orgIds.includes(conv.counterpartOrganizationId);

    if (isInitiatorOrg || isCounterpartOrg) {
      const targetOrgId = (isInitiatorOrg ? conv.initiatorOrganizationId : conv.counterpartOrganizationId)!;
      const membership = await organizationsRepository.findMember(targetOrgId, user.id);

      const roleName = membership?.role?.name;
      const canWrite = roleName === 'OWNER' || roleName === 'ADMIN' || roleName === 'OPERATOR';

      return { isParticipant: true, canWrite, actingOrgId: targetOrgId };
    }

    return { isParticipant: false, canWrite: false };
  }

  /**
   * Inicia o recupera una conversación asociada a una publicación.
   */
  async startConversation(
    input: StartConversationInput,
    user: SafeUserDto
  ): Promise<{ conversation: ConversationDto; isNew: boolean }> {
    const publication = await publicationsRepository.findById(input.publicationId);
    if (!publication) {
      throw new ConversationError('PUBLICATION_NOT_FOUND', 'La publicación especificada no existe', 404);
    }

    // No permitir contactar publicaciones propias
    if (publication.ownerUserId === user.id) {
      throw new ConversationError(
        'CANNOT_CONTACT_OWN_PUBLICATION',
        'No puedes contactar tu propia publicación',
        400
      );
    }

    // Si la publicación pertenece a una organización, validar que el usuario no sea miembro de ella
    if (publication.organizationId) {
      if (input.organizationId === publication.organizationId) {
        throw new ConversationError(
          'CANNOT_CONTACT_OWN_ORGANIZATION',
          'No puedes contactar una publicación de tu propia organización',
          400
        );
      }

      const membershipInPubOrg = await organizationsRepository.findMember(
        publication.organizationId,
        user.id
      );
      if (membershipInPubOrg && membershipInPubOrg.status === 'ACTIVE') {
        throw new ConversationError(
          'CANNOT_CONTACT_OWN_ORGANIZATION',
          'No puedes contactar una publicación perteneciente a tu propia organización',
          400
        );
      }
    }

    // Validar estado de la publicación
    const isExpired =
      publication.expiresAt && new Date(publication.expiresAt) < new Date();
    if (publication.status !== 'ACTIVE' || isExpired) {
      throw new ConversationError(
        'PUBLICATION_NOT_ACTIVE',
        'No se pueden iniciar conversaciones sobre publicaciones cerradas, pausadas o expiradas',
        409
      );
    }

    // Validar permisos de organización si el usuario actúa en nombre de una org
    if (input.organizationId) {
      const membership = await organizationsRepository.findMember(input.organizationId, user.id);
      if (!membership || membership.status !== 'ACTIVE') {
        throw new ConversationError(
          'FORBIDDEN',
          'No eres miembro activo de la organización indicada',
          403
        );
      }
      const roleName = membership.role?.name;
      if (roleName !== 'OWNER' && roleName !== 'ADMIN' && roleName !== 'OPERATOR') {
        throw new ConversationError(
          'FORBIDDEN',
          'Tu rol en la organización no tiene permisos para iniciar conversaciones',
          403
        );
      }
    }

    // Idempotencia: Verificar si ya existe conversación abierta para esta publicación e iniciador
    const existing = await conversationsRepository.findByPublicationAndInitiator(
      publication.id,
      user.id
    );

    const userOrgIds = await this.getUserActiveOrgIds(user.id);

    if (existing) {
      // Si se envió mensaje inicial adicional y ya existía la conversación, agregar el mensaje
      if (input.initialMessage) {
        await conversationsRepository.createMessage({
          conversationId: existing.id,
          senderUserId: user.id,
          body: input.initialMessage,
        });
      }

      const refreshed = await conversationsRepository.findById(existing.id);
      return {
        conversation: toConversationDto(refreshed || existing, user.id, userOrgIds),
        isNew: false,
      };
    }

    // Crear nueva conversación
    const created = await conversationsRepository.createConversation({
      publicationId: publication.id,
      initiatorUserId: user.id,
      initiatorOrganizationId: input.organizationId || null,
      counterpartUserId: publication.ownerUserId,
      counterpartOrganizationId: publication.organizationId || null,
      initialMessage: input.initialMessage,
    });

    return {
      conversation: toConversationDto(created, user.id, userOrgIds),
      isNew: true,
    };
  }

  /**
   * Obtiene el detalle de una conversación y marca lectura.
   */
  async getConversationById(
    conversationId: string,
    user: SafeUserDto
  ): Promise<ConversationDto> {
    const conv = await conversationsRepository.findById(conversationId);
    if (!conv) {
      throw new ConversationError('CONVERSATION_NOT_FOUND', 'Conversación no encontrada', 404);
    }

    const { isParticipant } = await this.validateUserAccess(conv, user);
    if (!isParticipant) {
      throw new ConversationError(
        'FORBIDDEN',
        'No tienes permiso para acceder a esta conversación',
        403
      );
    }

    // Actualizar lectura del usuario actual
    await conversationsRepository.upsertParticipantState(conv.id, user.id, {
      lastReadAt: new Date(),
    });

    const userOrgIds = await this.getUserActiveOrgIds(user.id);
    return toConversationDto(conv, user.id, userOrgIds);
  }

  /**
   * Lista la bandeja de conversaciones del usuario.
   */
  async listUserConversations(
    query: GetConversationsQuery,
    user: SafeUserDto
  ) {
    const userOrgIds = await this.getUserActiveOrgIds(user.id);
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    const result = await conversationsRepository.listUserConversations(
      user.id,
      userOrgIds,
      {
        archived: query.archived,
        status: query.status,
        page,
        pageSize,
      }
    );

    return {
      total: result.total,
      data: result.data.map((c) => toConversationDto(c, user.id, userOrgIds)),
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }

  /**
   * Conteo global de mensajes no leídos del usuario.
   */
  async getGlobalUnreadCount(user: SafeUserDto): Promise<{ unreadCount: number }> {
    const userOrgIds = await this.getUserActiveOrgIds(user.id);
    const unreadCount = await conversationsRepository.getGlobalUnreadCount(user.id, userOrgIds);
    return { unreadCount };
  }

  /**
   * Archiva o desarchiva una conversación para el usuario.
   */
  async archiveConversation(
    conversationId: string,
    archived: boolean,
    user: SafeUserDto
  ): Promise<{ success: boolean; archived: boolean }> {
    const conv = await conversationsRepository.findById(conversationId);
    if (!conv) {
      throw new ConversationError('CONVERSATION_NOT_FOUND', 'Conversación no encontrada', 404);
    }

    const { isParticipant } = await this.validateUserAccess(conv, user);
    if (!isParticipant) {
      throw new ConversationError('FORBIDDEN', 'No tienes permiso sobre esta conversación', 403);
    }

    await conversationsRepository.upsertParticipantState(conv.id, user.id, {
      archivedAt: archived ? new Date() : null,
    });

    return { success: true, archived };
  }

  /**
   * Lista mensajes paginados de una conversación y marca lectura.
   */
  async listMessages(
    conversationId: string,
    query: GetMessagesQuery,
    user: SafeUserDto
  ) {
    const conv = await conversationsRepository.findById(conversationId);
    if (!conv) {
      throw new ConversationError('CONVERSATION_NOT_FOUND', 'Conversación no encontrada', 404);
    }

    const { isParticipant } = await this.validateUserAccess(conv, user);
    if (!isParticipant) {
      throw new ConversationError('FORBIDDEN', 'No tienes permiso para ver estos mensajes', 403);
    }

    // Marcar lectura
    await conversationsRepository.upsertParticipantState(conv.id, user.id, {
      lastReadAt: new Date(),
    });

    const page = query.page || 1;
    const pageSize = query.pageSize || 50;

    const result = await conversationsRepository.listMessages(conversationId, page, pageSize);

    return {
      total: result.total,
      data: result.data.map((m) => toMessageDto(m, user.id)),
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }

  /**
   * Envía un mensaje de texto dentro de una conversación.
   */
  async sendMessage(
    conversationId: string,
    input: SendMessageInput,
    user: SafeUserDto
  ): Promise<MessageDto> {
    const conv = await conversationsRepository.findById(conversationId);
    if (!conv) {
      throw new ConversationError('CONVERSATION_NOT_FOUND', 'Conversación no encontrada', 404);
    }

    const { isParticipant, canWrite } = await this.validateUserAccess(conv, user);
    if (!isParticipant) {
      throw new ConversationError('FORBIDDEN', 'No tienes permiso para acceder a esta conversación', 403);
    }

    if (!canWrite) {
      throw new ConversationError(
        'FORBIDDEN',
        'Tu rol en la organización es de solo lectura (MEMBER)',
        403
      );
    }

    if (conv.status === 'BLOCKED') {
      throw new ConversationError('CONVERSATION_BLOCKED', 'La conversación está bloqueada', 403);
    }

    // Validar estado de la publicación
    const isExpired =
      conv.publication.expiresAt && new Date(conv.publication.expiresAt) < new Date();
    if (conv.publication.status !== 'ACTIVE' || isExpired) {
      throw new ConversationError(
        'PUBLICATION_CLOSED',
        'La publicación asociada está cerrada o expirada. No se permiten nuevos mensajes.',
        409
      );
    }

    // Rate limiting: máximo 30 mensajes por minuto por usuario en esta conversación
    const recentCount = await conversationsRepository.countRecentMessages(conv.id, user.id, 60000);
    if (recentCount >= 30) {
      throw new ConversationError(
        'RATE_LIMIT_EXCEEDED',
        'Has excedido el límite de 30 mensajes por minuto en esta conversación',
        429
      );
    }

    const message = await conversationsRepository.createMessage({
      conversationId: conv.id,
      senderUserId: user.id,
      body: input.body,
    });

    return toMessageDto(message, user.id);
  }

  /**
   * Crea una propuesta formal o contrapropuesta dentro de una conversación.
   */
  async createProposal(
    conversationId: string,
    input: CreateProposalInput,
    user: SafeUserDto
  ): Promise<ProposalDto> {
    const conv = await conversationsRepository.findById(conversationId);
    if (!conv) {
      throw new ConversationError('CONVERSATION_NOT_FOUND', 'Conversación no encontrada', 404);
    }

    const { isParticipant, canWrite, actingOrgId } = await this.validateUserAccess(conv, user);
    if (!isParticipant) {
      throw new ConversationError('FORBIDDEN', 'No tienes permiso para acceder a esta conversación', 403);
    }

    if (!canWrite) {
      throw new ConversationError(
        'FORBIDDEN',
        'Tu rol en la organización no tiene permisos para crear propuestas',
        403
      );
    }

    // Validar publicación
    const isExpired =
      conv.publication.expiresAt && new Date(conv.publication.expiresAt) < new Date();
    if (conv.publication.status !== 'ACTIVE' || isExpired) {
      throw new ConversationError(
        'PUBLICATION_NOT_ACTIVE',
        'No se pueden crear propuestas sobre publicaciones cerradas o expiradas',
        409
      );
    }

    // Validar si ya existe una propuesta ACCEPTED en la conversación
    const hasAccepted = conv.proposals.some((p) => p.status === 'ACCEPTED');
    if (hasAccepted) {
      throw new ConversationError(
        'NEGOTIATION_ALREADY_ACCEPTED',
        'La conversación ya tiene una propuesta aceptada y la negociación ha concluido',
        409
      );
    }

    // Validar parentProposalId si fue provisto
    if (input.parentProposalId) {
      const parent = conv.proposals.find((p) => p.id === input.parentProposalId);
      if (!parent) {
        throw new ConversationError(
          'PARENT_PROPOSAL_NOT_FOUND',
          'La propuesta previa especificada no pertenece a esta conversación',
          400
        );
      }
    }

    // Determinar nombre y organización del proponente
    let proposerDisplayName = user.fullName;
    let proposerOrgId = input.organizationId || actingOrgId || null;

    if (proposerOrgId) {
      const org = await organizationsRepository.findById(proposerOrgId);
      if (org) {
        proposerDisplayName = org.name;
      }
    }

    const proposal = await conversationsRepository.createProposal({
      conversationId: conv.id,
      publicationId: conv.publicationId,
      proposerUserId: user.id,
      proposerOrganizationId: proposerOrgId,
      proposerDisplayName,
      quantity: input.quantity,
      unitId: input.unitId,
      terms: input.terms,
      parentProposalId: input.parentProposalId,
    });

    return toProposalDto(proposal, user.id);
  }

  /**
   * Acepta una propuesta formal PENDING.
   */
  async acceptProposal(
    proposalId: string,
    user: SafeUserDto
  ): Promise<ProposalDto> {
    const proposal = await conversationsRepository.findProposalById(proposalId);
    if (!proposal) {
      throw new ConversationError('PROPOSAL_NOT_FOUND', 'Propuesta no encontrada', 404);
    }

    if (proposal.status === 'ACCEPTED') {
      throw new ConversationError('PROPOSAL_ALREADY_ACCEPTED', 'La propuesta ya fue aceptada', 409);
    }

    if (proposal.status !== 'PENDING') {
      throw new ConversationError(
        'PROPOSAL_NOT_PENDING',
        `No se puede aceptar una propuesta en estado ${proposal.status}`,
        409
      );
    }

    // Validar que el proponente no intente auto-aceptarse
    if (proposal.proposerUserId === user.id) {
      throw new ConversationError(
        'CANNOT_RESPOND_OWN_PROPOSAL',
        'No puedes aceptar tu propia propuesta',
        403
      );
    }

    // Si la propuesta fue hecha a nombre de una org, verificar que el usuario no pertenezca a esa misma org
    if (proposal.proposerOrganizationId) {
      const isMemberOfProposerOrg = await organizationsRepository.findMember(
        proposal.proposerOrganizationId,
        user.id
      );
      if (isMemberOfProposerOrg && isMemberOfProposerOrg.status === 'ACTIVE') {
        throw new ConversationError(
          'CANNOT_RESPOND_OWN_PROPOSAL',
          'No puedes responder una propuesta formulada por tu propia organización',
          403
        );
      }
    }

    // Validar que el usuario sea la contraparte legítima de la conversación
    const { isParticipant, canWrite, actingOrgId } = await this.validateUserAccess(
      proposal.conversation,
      user
    );

    if (!isParticipant) {
      throw new ConversationError(
        'FORBIDDEN',
        'No perteneces a la conversación de esta propuesta',
        403
      );
    }

    if (!canWrite) {
      throw new ConversationError(
        'FORBIDDEN',
        'Tu rol no tiene permisos para responder propuestas',
        403
      );
    }

    // Determinar nombre del respondedor
    let responderDisplayName = user.fullName;
    if (actingOrgId) {
      const org = await organizationsRepository.findById(actingOrgId);
      if (org) responderDisplayName = org.name;
    }

    const accepted = await conversationsRepository.acceptProposal(
      proposal.id,
      user.id,
      responderDisplayName
    );

    if (!accepted) {
      throw new ConversationError(
        'CONCURRENT_MODIFICATION',
        'La propuesta ya fue procesada concurrentemente',
        409
      );
    }

    return toProposalDto(accepted, user.id);
  }

  /**
   * Rechaza una propuesta formal PENDING.
   */
  async rejectProposal(
    proposalId: string,
    user: SafeUserDto
  ): Promise<ProposalDto> {
    const proposal = await conversationsRepository.findProposalById(proposalId);
    if (!proposal) {
      throw new ConversationError('PROPOSAL_NOT_FOUND', 'Propuesta no encontrada', 404);
    }

    if (proposal.status !== 'PENDING') {
      throw new ConversationError(
        'PROPOSAL_NOT_PENDING',
        `No se puede rechazar una propuesta en estado ${proposal.status}`,
        409
      );
    }

    // Proponente no puede auto-rechazar
    if (proposal.proposerUserId === user.id) {
      throw new ConversationError(
        'CANNOT_RESPOND_OWN_PROPOSAL',
        'No puedes rechazar tu propia propuesta',
        403
      );
    }

    if (proposal.proposerOrganizationId) {
      const isMemberOfProposerOrg = await organizationsRepository.findMember(
        proposal.proposerOrganizationId,
        user.id
      );
      if (isMemberOfProposerOrg && isMemberOfProposerOrg.status === 'ACTIVE') {
        throw new ConversationError(
          'CANNOT_RESPOND_OWN_PROPOSAL',
          'No puedes responder una propuesta de tu propia organización',
          403
        );
      }
    }

    const { isParticipant, canWrite, actingOrgId } = await this.validateUserAccess(
      proposal.conversation,
      user
    );

    if (!isParticipant) {
      throw new ConversationError('FORBIDDEN', 'No perteneces a la conversación', 403);
    }

    if (!canWrite) {
      throw new ConversationError('FORBIDDEN', 'Tu rol no tiene permisos para responder propuestas', 403);
    }

    let responderDisplayName = user.fullName;
    if (actingOrgId) {
      const org = await organizationsRepository.findById(actingOrgId);
      if (org) responderDisplayName = org.name;
    }

    const rejected = await conversationsRepository.rejectProposal(
      proposal.id,
      user.id,
      responderDisplayName
    );

    if (!rejected) {
      throw new ConversationError(
        'CONCURRENT_MODIFICATION',
        'La propuesta ya fue procesada concurrentemente',
        409
      );
    }

    return toProposalDto(rejected, user.id);
  }
}

export const conversationsService = new ConversationsService();
