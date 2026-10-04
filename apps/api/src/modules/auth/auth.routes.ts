import { Router } from 'express';
import {
  registerController,
  loginController,
  logoutController,
  refreshController,
  dataPolicyController,
} from './auth.controller';
import { validateBody } from '../../middleware/validate';
import { authenticateToken } from '../../middleware/auth.middleware';
import { registerRateLimiter, loginRateLimiter } from '../../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '@data-circular/shared';

const router = Router();

// GET /api/v1/auth/data-policy
router.get('/data-policy', dataPolicyController);

// POST /api/v1/auth/register
router.post(
  '/register',
  registerRateLimiter,
  validateBody(registerSchema),
  registerController
);

// POST /api/v1/auth/login
router.post(
  '/login',
  loginRateLimiter,
  validateBody(loginSchema),
  loginController
);

// POST /api/v1/auth/logout (Requiere estar autenticado)
router.post(
  '/logout',
  authenticateToken,
  logoutController
);

// POST /api/v1/auth/refresh
router.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  refreshController
);

export { router as authRouter };
