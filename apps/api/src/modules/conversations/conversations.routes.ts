import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { conversationsController } from './conversations.controller';

const conversationsRouter = Router();

// Todas las rutas requieren token de autenticación válido
conversationsRouter.use(authenticateToken);

// Rutas de conversaciones
conversationsRouter.post('/', conversationsController.startConversation);
conversationsRouter.get('/unread-count', conversationsController.getUnreadCount);
conversationsRouter.get('/', conversationsController.listMine);
conversationsRouter.get('/:id', conversationsController.getById);
conversationsRouter.patch('/:id/archive', conversationsController.archive);

// Sub-rutas de mensajes y propuestas dentro de la conversación
conversationsRouter.get('/:id/messages', conversationsController.listMessages);
conversationsRouter.post('/:id/messages', conversationsController.sendMessage);
conversationsRouter.post('/:id/proposals', conversationsController.createProposal);

const proposalsRouter = Router();
proposalsRouter.use(authenticateToken);

// Respuestas a propuestas formales
proposalsRouter.post('/:id/accept', conversationsController.acceptProposal);
proposalsRouter.post('/:id/reject', conversationsController.rejectProposal);

export { conversationsRouter, proposalsRouter };
