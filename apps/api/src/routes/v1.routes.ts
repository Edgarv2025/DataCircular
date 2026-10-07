import { Router } from 'express';
import { healthRouter } from '../modules/health/health.routes';
import { authRouter } from '../modules/auth/auth.routes';
import { usersRouter } from '../modules/users/users.routes';
import { organizationsRouter } from '../modules/organizations/organizations.routes';
import { catalogRouter } from '../modules/catalog/catalog.routes';
import { publicationsRouter } from '../modules/publications/publications.routes';
import { matchesRouter } from '../modules/matches/matches.routes';

const v1Router = Router();

// Endpoint de comprobación de salud
v1Router.use('/health', healthRouter);

// Módulo de Autenticación (Fase 3)
v1Router.use('/auth', authRouter);

// Módulo de Usuarios y Perfil (Fase 4)
v1Router.use('/users', usersRouter);

// Módulo de Organizaciones, Empresas y Membresías (Fase 7)
v1Router.use('/organizations', organizationsRouter);

// Módulo de Catálogo de Materiales y Unidades (Fase 8)
v1Router.use('/catalog', catalogRouter);

// Módulo de Publicaciones de Oferta y Demanda (Fase 8)
v1Router.use('/publications', publicationsRouter);

// Módulo de Coincidencias y Sugerencias (Fase 9)
v1Router.use('/matches', matchesRouter);

export { v1Router };
