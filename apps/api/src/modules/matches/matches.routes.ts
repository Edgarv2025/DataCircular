import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { matchesController } from './matches.controller';

const matchesRouter = Router();

// Todas las rutas de matches requieren usuario autenticado
matchesRouter.use(authenticateToken);

// GET /api/v1/matches/my-suggestions
matchesRouter.get('/my-suggestions', matchesController.getMySuggestions);

export { matchesRouter };
