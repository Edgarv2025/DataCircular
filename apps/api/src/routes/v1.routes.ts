import { Router } from 'express';
import { healthRouter } from '../modules/health/health.routes';
import { authRouter } from '../modules/auth/auth.routes';
import { usersRouter } from '../modules/users/users.routes';
import { organizationsRouter } from '../modules/organizations/organizations.routes';

const v1Router = Router();

// Endpoint de comprobación de salud
v1Router.use('/health', healthRouter);

// Módulo de Autenticación (Fase 3)
v1Router.use('/auth', authRouter);

// Módulo de Usuarios y Perfil (Fase 4)
v1Router.use('/users', usersRouter);

// Módulo de Organizaciones, Empresas y Membresías (Fase 7)
v1Router.use('/organizations', organizationsRouter);

export { v1Router };
