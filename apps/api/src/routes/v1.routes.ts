import { Router } from 'express';
import { healthRouter } from '../modules/health/health.routes';
import { authRouter } from '../modules/auth/auth.routes';

const v1Router = Router();

// Endpoint de comprobación de salud
v1Router.use('/health', healthRouter);

// Módulo de Autenticación (Fase 3)
v1Router.use('/auth', authRouter);

// En fases futuras se agregarán aquí:
// v1Router.use('/users', usersRouter);   (Fase 4)
// etc.

export { v1Router };
