import { Request, Response, NextFunction } from 'express';
import {
  startConversationSchema,
  sendMessageSchema,
  createProposalSchema,
  getConversationsQuerySchema,
  getMessagesQuerySchema,
} from '@data-circular/shared';
import { conversationsService } from './conversations.service';
import { sendSuccess } from '../../utils/apiResponse';

export class ConversationsController {
  async startConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = startConversationSchema.parse(req.body);
      const result = await conversationsService.startConversation(data, req.user!);
      sendSuccess(
        res,
        result.conversation,
        result.isNew ? 'Conversación iniciada exitosamente' : 'Conversación recuperada exitosamente',
        result.isNew ? 201 : 200
      );
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversation = await conversationsService.getConversationById(req.params.id, req.user!);
      sendSuccess(res, conversation, 'Conversación obtenida exitosamente');
    } catch (err) {
      next(err);
    }
  }

  async listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = getConversationsQuerySchema.parse(req.query);
      const result = await conversationsService.listUserConversations(query, req.user!);
      sendSuccess(res, result, 'Bandeja de conversaciones obtenida exitosamente');
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await conversationsService.getGlobalUnreadCount(req.user!);
      sendSuccess(res, result, 'Conteo de mensajes no leídos obtenido');
    } catch (err) {
      next(err);
    }
  }

  async archive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const archived = req.body?.archived !== false;
      const result = await conversationsService.archiveConversation(req.params.id, archived, req.user!);
      sendSuccess(
        res,
        result,
        archived ? 'Conversación archivada exitosamente' : 'Conversación desarchivada exitosamente'
      );
    } catch (err) {
      next(err);
    }
  }

  async listMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = getMessagesQuerySchema.parse(req.query);
      const result = await conversationsService.listMessages(req.params.id, query, req.user!);
      sendSuccess(res, result, 'Mensajes obtenidos exitosamente');
    } catch (err) {
      next(err);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = sendMessageSchema.parse(req.body);
      const message = await conversationsService.sendMessage(req.params.id, data, req.user!);
      sendSuccess(res, message, 'Mensaje enviado exitosamente', 201);
    } catch (err) {
      next(err);
    }
  }

  async createProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createProposalSchema.parse(req.body);
      const proposal = await conversationsService.createProposal(req.params.id, data, req.user!);
      sendSuccess(res, proposal, 'Propuesta formal creada exitosamente', 201);
    } catch (err) {
      next(err);
    }
  }

  async acceptProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const proposal = await conversationsService.acceptProposal(req.params.id, req.user!);
      sendSuccess(res, proposal, 'Propuesta aceptada exitosamente', 200);
    } catch (err) {
      next(err);
    }
  }

  async rejectProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const proposal = await conversationsService.rejectProposal(req.params.id, req.user!);
      sendSuccess(res, proposal, 'Propuesta rechazada exitosamente', 200);
    } catch (err) {
      next(err);
    }
  }
}

export const conversationsController = new ConversationsController();
