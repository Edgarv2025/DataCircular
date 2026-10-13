import { apiFetch } from './client';
import {
  ConversationDto,
  MessageDto,
  ProposalDto,
  StartConversationInput,
  SendMessageInput,
  CreateProposalInput,
  GetConversationsQuery,
  GetMessagesQuery,
} from '@data-circular/shared';
import queryString from 'query-string';

/**
 * Cliente API para Conversaciones, Mensajes y Propuestas (Fase 10 - DATA_CIRCULAR)
 */
export const ConversationsApi = {
  /**
   * Inicia o recupera una conversación asociada a una publicación (idempotente).
   */
  async start(data: StartConversationInput): Promise<ConversationDto> {
    return apiFetch<ConversationDto>('/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Obtiene una conversación por su ID y marca lectura automáticamente.
   */
  async getById(id: string): Promise<ConversationDto> {
    return apiFetch<ConversationDto>(`/conversations/${id}`);
  },

  /**
   * Lista las conversaciones de la bandeja del usuario autenticado.
   */
  async list(query: GetConversationsQuery = {}): Promise<{
    data: ConversationDto[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const qs = queryString.stringify(query as any, { skipNull: true, skipEmptyString: true });
    return apiFetch(`/conversations${qs ? `?${qs}` : ''}`);
  },

  /**
   * Obtiene el conteo total de mensajes no leídos para el usuario.
   */
  async getUnreadCount(): Promise<{ unreadCount: number }> {
    return apiFetch<{ unreadCount: number }>('/conversations/unread-count');
  },

  /**
   * Archiva o desarchiva una conversación para el usuario autenticado.
   */
  async archive(id: string, archived: boolean = true): Promise<{ success: boolean; archived: boolean }> {
    return apiFetch(`/conversations/${id}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ archived }),
    });
  },

  /**
   * Lista el historial de mensajes de una conversación y marca lectura.
   */
  async listMessages(
    conversationId: string,
    query: GetMessagesQuery = {}
  ): Promise<{ data: MessageDto[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const qs = queryString.stringify(query as any, { skipNull: true, skipEmptyString: true });
    return apiFetch(`/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`);
  },

  /**
   * Envía un mensaje de texto en una conversación abierta.
   */
  async sendMessage(conversationId: string, data: SendMessageInput): Promise<MessageDto> {
    return apiFetch<MessageDto>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Formaliza una propuesta o contrapropuesta dentro de una conversación.
   */
  async createProposal(conversationId: string, data: CreateProposalInput): Promise<ProposalDto> {
    return apiFetch<ProposalDto>(`/conversations/${conversationId}/proposals`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Acepta una propuesta formal pendiente.
   */
  async acceptProposal(proposalId: string): Promise<ProposalDto> {
    return apiFetch<ProposalDto>(`/proposals/${proposalId}/accept`, {
      method: 'POST',
    });
  },

  /**
   * Rechaza una propuesta formal pendiente.
   */
  async rejectProposal(proposalId: string): Promise<ProposalDto> {
    return apiFetch<ProposalDto>(`/proposals/${proposalId}/reject`, {
      method: 'POST',
    });
  },
};
