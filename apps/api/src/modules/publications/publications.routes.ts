import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { publicationsController } from './publications.controller';

const publicationsRouter = Router();

// Todas las rutas requieren token de autenticación válido
publicationsRouter.use(authenticateToken);

publicationsRouter.post('/', publicationsController.create);
publicationsRouter.get('/mine', publicationsController.listMine);
publicationsRouter.get('/', publicationsController.listAll);
publicationsRouter.get('/:id', publicationsController.getById);
publicationsRouter.patch('/:id', publicationsController.update);
publicationsRouter.delete('/:id', publicationsController.delete);

export { publicationsRouter };
