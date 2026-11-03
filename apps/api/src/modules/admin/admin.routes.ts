import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

export const adminRouter = Router();

// Ruta pública de consulta de verificación documental (Puntos 5 y 6)
adminRouter.get('/public-verification/:code', (req, res, next) =>
  adminController.getPublicVerification(req, res, next)
);

// Las siguientes rutas están protegidas con autenticación
adminRouter.use(authenticateToken);

// Reportes e Indicadores Distritales (Fase 12)
adminRouter.get('/reports/kpis', (req, res, next) =>
  adminController.getCircularKpis(req, res, next)
);
adminRouter.get('/reports/localities', (req, res, next) =>
  adminController.getLocalityMetrics(req, res, next)
);
adminRouter.get('/reports/materials', (req, res, next) =>
  adminController.getMaterialsSummary(req, res, next)
);

// Supervisión de Operaciones de Plataforma (Fase 12)
adminRouter.get('/operations', (req, res, next) =>
  adminController.listAllOperations(req, res, next)
);

// Analítica Administrativa: Conexiones, Visitas, Usuarios y Sugerencias
adminRouter.get('/analytics/users', (req, res, next) =>
  adminController.getUserMetrics(req, res, next)
);
adminRouter.get('/analytics/connections', (req, res, next) =>
  adminController.getConnectionMetrics(req, res, next)
);
adminRouter.get('/analytics/visits', (req, res, next) =>
  adminController.getUserVisitMetrics(req, res, next)
);
adminRouter.get('/analytics/suggestions', (req, res, next) =>
  adminController.getConnectionSuggestions(req, res, next)
);
adminRouter.get('/analytics/summary', (req, res, next) =>
  adminController.getAnalyticsSummary(req, res, next)
);

// Bloque C2: Parámetros, Tarifas de Verificación y Auditoría
adminRouter.get('/settings/fees', (req, res, next) =>
  adminController.getFees(req, res, next)
);
adminRouter.put('/settings/fees', (req, res, next) =>
  adminController.updateFee(req, res, next)
);
adminRouter.get('/verification-requests', (req, res, next) =>
  adminController.listVerificationRequests(req, res, next)
);
adminRouter.post('/verification-requests', (req, res, next) =>
  adminController.createVerificationRequest(req, res, next)
);
adminRouter.patch('/verification-requests/adjust-fee', (req, res, next) =>
  adminController.adjustRequestFee(req, res, next)
);
adminRouter.patch('/verification-requests/:id/review', (req, res, next) =>
  adminController.reviewVerificationRequest(req, res, next)
);
adminRouter.get('/audit-logs', (req, res, next) =>
  adminController.getAuditLogs(req, res, next)
);
