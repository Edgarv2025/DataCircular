import { Router } from 'express';
import {
  getMeController,
  updateMeController,
  deleteMeController,
  getUserByIdController,
  listUsersController,
  adminCreateUserController,
  adminDeleteUserController,
  adminUpdateUserController,
} from './users.controller';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validate';
import {
  updateProfileSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
} from '@data-circular/shared';

const router = Router();

// Administración de usuarios (exclusivo ADMIN)
router.get('/', authenticateToken, requireRole('ADMIN'), listUsersController);
router.post(
  '/',
  authenticateToken,
  requireRole('ADMIN'),
  validateBody(adminCreateUserSchema),
  adminCreateUserController
);

// ==========================================
// Rutas de Perfil Propio (Usuario Autenticado)
// ==========================================

// GET /api/v1/users/me - Consultar perfil propio
router.get('/me', authenticateToken, getMeController);

// PATCH /api/v1/users/me - Actualizar datos permitidos del perfil propio
router.patch(
  '/me',
  authenticateToken,
  validateBody(updateProfileSchema),
  updateMeController
);

// DELETE /api/v1/users/me - Desactivación lógica de la propia cuenta
router.delete('/me', authenticateToken, deleteMeController);

// ==========================================
// Rutas de Usuarios en el Marketplace
// ==========================================

// GET /api/v1/users/:id - Consultar perfil público de un usuario (sin email ni teléfono)
router.get('/:id', authenticateToken, getUserByIdController);

// PATCH /api/v1/users/:id - Modificar usuario por parte de un Administrador (exclusivo ADMIN)
router.patch(
  '/:id',
  authenticateToken,
  requireRole('ADMIN'),
  validateBody(adminUpdateUserSchema),
  adminUpdateUserController
);

router.delete('/:id', authenticateToken, requireRole('ADMIN'), adminDeleteUserController);

export { router as usersRouter };
