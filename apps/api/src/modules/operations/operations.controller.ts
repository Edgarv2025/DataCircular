import { Request, Response, NextFunction } from 'express';
import { operationsService, OperationError } from './operations.service';
import {
  createOperationSchema,
  scheduleOperationSchema,
  addEvidenceSchema,
  receiveOperationSchema,
  closeOperationSchema,
  cancelOperationSchema,
  getOperationsQuerySchema,
  createReviewSchema,
} from '@data-circular/shared';

export class OperationsController {
  async createOperation(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createOperationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos de operación inválidos',
            details: parsed.error.format(),
          },
        });
      }

      const result = await operationsService.createOperation(parsed.data, req.user!);
      return res.status(result.isNew ? 201 : 200).json({
        success: true,
        data: result.operation,
      });
    } catch (error) {
      if (error instanceof OperationError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  async listUserOperations(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = getOperationsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parámetros de consulta inválidos',
            details: parsed.error.format(),
          },
        });
      }

      const result = await operationsService.listUserOperations(parsed.data, req.user!);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOperationById(req: Request, res: Response, next: NextFunction) {
    try {
      const operation = await operationsService.getOperationById(req.params.id, req.user!);
      return res.status(200).json({
        success: true,
        data: operation,
      });
    } catch (error) {
      if (error instanceof OperationError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  async scheduleOperation(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = scheduleOperationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos de programación logística inválidos',
            details: parsed.error.format(),
          },
        });
      }

      const operation = await operationsService.scheduleOperation(req.params.id, parsed.data, req.user!);
      return res.status(200).json({
        success: true,
        data: operation,
      });
    } catch (error) {
      if (error instanceof OperationError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  async startCollecting(req: Request, res: Response, next: NextFunction) {
    try {
      const operation = await operationsService.startCollecting(req.params.id, req.user!);
      return res.status(200).json({
        success: true,
        data: operation,
      });
    } catch (error) {
      if (error instanceof OperationError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  async addEvidence(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = addEvidenceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos de evidencia o pesaje inválidos',
            details: parsed.error.format(),
          },
        });
      }

      const result = await operationsService.addEvidence(req.params.id, parsed.data, req.user!);
      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof OperationError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  async receiveOperation(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = receiveOperationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos de recepción inválidos',
            details: parsed.error.format(),
          },
        });
      }

      const operation = await operationsService.receiveOperation(req.params.id, parsed.data, req.user!);
      return res.status(200).json({
        success: true,
        data: operation,
      });
    } catch (error) {
      if (error instanceof OperationError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  async closeOperation(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = closeOperationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos de cierre inválidos',
            details: parsed.error.format(),
          },
        });
      }

      const operation = await operationsService.closeOperation(req.params.id, parsed.data, req.user!);
      return res.status(200).json({
        success: true,
        data: operation,
      });
    } catch (error) {
      if (error instanceof OperationError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  async cancelOperation(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = cancelOperationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos de cancelación inválidos',
            details: parsed.error.format(),
          },
        });
      }

      const operation = await operationsService.cancelOperation(req.params.id, parsed.data, req.user!);
      return res.status(200).json({
        success: true,
        data: operation,
      });
    } catch (error) {
      if (error instanceof OperationError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createReviewSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos de evaluación inválidos',
            details: parsed.error.format(),
          },
        });
      }

      const review = await operationsService.createReview(req.params.id, parsed.data, req.user!);
      return res.status(201).json({
        success: true,
        data: review,
      });
    } catch (error) {
      if (error instanceof OperationError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }

  async getUserReviewSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await operationsService.getUserReviewSummary(req.params.id);
      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const operationsController = new OperationsController();
