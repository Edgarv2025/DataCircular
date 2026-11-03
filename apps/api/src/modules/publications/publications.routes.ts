import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';
import { publicationsController } from './publications.controller';
import { matchesController } from '../matches/matches.controller';

const publicationsRouter = Router();

// Todas las rutas requieren token de autenticación válido
publicationsRouter.use(authenticateToken);

publicationsRouter.post('/', requireRole('USER'), publicationsController.create);
publicationsRouter.get('/mine', requireRole('USER'), publicationsController.listMine);
publicationsRouter.get('/search', requireRole('USER'), publicationsController.search);
publicationsRouter.get('/:id/matches', requireRole('USER'), matchesController.getMatches);
publicationsRouter.get('/', requireRole('ADMIN'), publicationsController.listAll);
publicationsRouter.get('/:id', requireRole('USER'), publicationsController.getById);
publicationsRouter.patch('/:id', requireRole('USER'), publicationsController.update);
publicationsRouter.delete('/:id', requireRole('USER'), publicationsController.delete);

export { publicationsRouter };
