import { Request, Response, NextFunction } from 'express';
import { adminService, AdminError } from './admin.service';
import { adminOperationsQuerySchema } from '@data-circular/shared';

export class AdminController {
  async getCircularKpis(req: Request, res: Response, next: NextFunction) {
    try {
      const kpis = await adminService.getCircularKpis(req.user!);
      return res.status(200).json({
        success: true,
        data: kpis,
      });
    } catch (error) {
      if (error instanceof AdminError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  async getLocalityMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await adminService.getLocalityMetrics(req.user!);
      return res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      if (error instanceof AdminError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  async getMaterialsSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await adminService.getMaterialsSummary(req.user!);
      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      if (error instanceof AdminError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  async listAllOperations(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = adminOperationsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parámetros de consulta administrativos inválidos',
            details: parsed.error.format(),
          },
        });
      }

      const result = await adminService.listAllOperations(parsed.data, req.user!);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof AdminError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  // ==============================================================
  // Analítica Administrativa: Usuarios, Conexión y Visitas
  // ==============================================================

  async getUserMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getUserMetrics(req.user!);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      if (error instanceof AdminError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  async getConnectionMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getConnectionMetrics(req.user!);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      if (error instanceof AdminError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  async getUserVisitMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getUserVisitMetrics(req.user!);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      if (error instanceof AdminError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  async getConnectionSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getConnectionSuggestions(req.user!);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      if (error instanceof AdminError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  async getAnalyticsSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getAnalyticsSummary(req.user!);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      if (error instanceof AdminError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  // ==============================================================
  // Bloque C2: Parámetros, Tarifas de Verificación y Auditoría
  // ==============================================================

  async getFees(req: Request, res: Response, next: NextFunction) {
    try {
      const { parametersService } = await import('./parameters.service');
      const fees = await parametersService.getFees();
      return res.status(200).json({ success: true, data: fees });
    } catch (error) {
      next(error);
    }
  }

  async updateFee(req: Request, res: Response, next: NextFunction) {
    try {
      const { parametersService } = await import('./parameters.service');
      const updated = await parametersService.updateFee(req.body, req.user!);
      return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      if (error instanceof AdminError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  async createVerificationRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { parametersService } = await import('./parameters.service');
      const request = await parametersService.createVerificationRequest(req.body, req.user!);
      return res.status(201).json({ success: true, data: request });
    } catch (error: any) {
      if (error instanceof AdminError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  async listVerificationRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { parametersService } = await import('./parameters.service');
      const requests = await parametersService.listVerificationRequests(req.user!);
      return res.status(200).json({ success: true, data: requests });
    } catch (error) {
      next(error);
    }
  }

  async adjustRequestFee(req: Request, res: Response, next: NextFunction) {
    try {
      const { parametersService } = await import('./parameters.service');
      const adjusted = await parametersService.adjustRequestFee(req.body, req.user!);
      return res.status(200).json({ success: true, data: adjusted });
    } catch (error: any) {
      if (error instanceof AdminError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  async reviewVerificationRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { parametersService } = await import('./parameters.service');
      const { id } = req.params;
      const { action, notes } = req.body;
      const result = await parametersService.reviewRequest(id, action, notes, req.user!);
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      if (error instanceof AdminError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { parametersService } = await import('./parameters.service');
      const logs = await parametersService.getAuditLogs(req.user!);
      return res.status(200).json({ success: true, data: logs });
    } catch (error: any) {
      if (error instanceof AdminError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  async getPublicVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { parametersService } = await import('./parameters.service');
      const { code } = req.params;
      const result = await parametersService.getPublicVerificationByCode(code);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
