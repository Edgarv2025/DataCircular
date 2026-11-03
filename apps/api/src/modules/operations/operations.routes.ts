import { Router } from 'express';
import { operationsController } from './operations.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

export const operationsRouter = Router();

// Rutas protegidas con autenticación JWT
operationsRouter.use(authenticateToken);

// Resumen de reputación de usuario
operationsRouter.get('/users/:id/reviews-summary', (req, res, next) =>
  operationsController.getUserReviewSummary(req, res, next)
);

// CRUD y listado de operaciones
operationsRouter.post('/', (req, res, next) =>
  operationsController.createOperation(req, res, next)
);
operationsRouter.get('/', (req, res, next) =>
  operationsController.listUserOperations(req, res, next)
);
operationsRouter.get('/:id', (req, res, next) =>
  operationsController.getOperationById(req, res, next)
);

// Flujo logístico y transiciones de estado
operationsRouter.post('/:id/schedule', (req, res, next) =>
  operationsController.scheduleOperation(req, res, next)
);
operationsRouter.post('/:id/collect', (req, res, next) =>
  operationsController.startCollecting(req, res, next)
);
operationsRouter.post('/:id/evidences', (req, res, next) =>
  operationsController.addEvidence(req, res, next)
);
operationsRouter.post('/:id/receive', (req, res, next) =>
  operationsController.receiveOperation(req, res, next)
);
operationsRouter.post('/:id/close', (req, res, next) =>
  operationsController.closeOperation(req, res, next)
);
operationsRouter.post('/:id/cancel', (req, res, next) =>
  operationsController.cancelOperation(req, res, next)
);

// Evaluaciones y calificaciones de operaciones cerradas (Fase 12)
operationsRouter.post('/:id/reviews', (req, res, next) =>
  operationsController.createReview(req, res, next)
);
