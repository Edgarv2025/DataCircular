import { Request, Response, NextFunction } from 'express';
import {
  createCategorySchema,
  updateCategorySchema,
  createUnitSchema,
  updateUnitSchema,
} from '@data-circular/shared';
import { catalogService } from './catalog.service';
import { sendSuccess } from '../../utils/apiResponse';

export class CatalogController {
  async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'ADMIN';
      const categories = await catalogService.listCategoriesTree(!includeInactive);
      sendSuccess(res, categories, 'Catálogo de categorías de material obtenido exitosamente');
    } catch (err) {
      next(err);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await catalogService.deleteCategory(req.params.id);
      sendSuccess(res, { id: req.params.id, active: false }, 'Categoría eliminada del catálogo');
    } catch (err) {
      next(err);
    }
  }

  async getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await catalogService.getCategoryById(req.params.id);
      sendSuccess(res, category, 'Categoría obtenida exitosamente');
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createCategorySchema.parse(req.body);
      const category = await catalogService.createCategory(data);
      sendSuccess(res, category, 'Categoría de material creada exitosamente', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateCategorySchema.parse(req.body);
      const category = await catalogService.updateCategory(req.params.id, data);
      sendSuccess(res, category, 'Categoría de material actualizada exitosamente');
    } catch (err) {
      next(err);
    }
  }

  async listUnits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'ADMIN';
      const units = await catalogService.listUnits(!includeInactive);
      sendSuccess(res, units, 'Catálogo de unidades de medida obtenido exitosamente');
    } catch (err) {
      next(err);
    }
  }

  async updateUnit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateUnitSchema.parse(req.body);
      const unit = await catalogService.updateUnit(req.params.id, data);
      sendSuccess(res, unit, 'Unidad de medida actualizada exitosamente');
    } catch (err) {
      next(err);
    }
  }

  async deleteUnit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const unit = await catalogService.deleteUnit(req.params.id);
      sendSuccess(res, unit, 'Unidad de medida eliminada del catálogo');
    } catch (err) {
      next(err);
    }
  }

  async createUnit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createUnitSchema.parse(req.body);
      const unit = await catalogService.createUnit(data);
      sendSuccess(res, unit, 'Unidad de medida creada exitosamente', 201);
    } catch (err) {
      next(err);
    }
  }
}

export const catalogController = new CatalogController();
