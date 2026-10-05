import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';
import { catalogController } from './catalog.controller';

const catalogRouter = Router();

// Todas las rutas requieren autenticación
catalogRouter.use(authenticateToken);

// Categorías
catalogRouter.get('/categories', catalogController.listCategories);
catalogRouter.get('/categories/:id', catalogController.getCategoryById);
catalogRouter.post('/categories', requireRole('ADMIN'), catalogController.createCategory);
catalogRouter.patch('/categories/:id', requireRole('ADMIN'), catalogController.updateCategory);

// Unidades de Medida
catalogRouter.get('/units', catalogController.listUnits);
catalogRouter.post('/units', requireRole('ADMIN'), catalogController.createUnit);

export { catalogRouter };
