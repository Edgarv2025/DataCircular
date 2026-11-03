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
catalogRouter.delete('/categories/:id', requireRole('ADMIN'), catalogController.deleteCategory);

// Unidades de Medida
catalogRouter.get('/units', catalogController.listUnits);
catalogRouter.post('/units', requireRole('ADMIN'), catalogController.createUnit);
catalogRouter.patch('/units/:id', requireRole('ADMIN'), catalogController.updateUnit);
catalogRouter.delete('/units/:id', requireRole('ADMIN'), catalogController.deleteUnit);

export { catalogRouter };
