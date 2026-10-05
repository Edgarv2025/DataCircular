import { Request, Response, NextFunction } from 'express';
import {
  createCategorySchema,
  updateCategorySchema,
  createUnitSchema,
} from '@data-circular/shared';
import { catalogService } from './catalog.service';
import { sendSuccess } from '../../utils/apiResponse';

export class CatalogController {
  async listCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await catalogService.listCategoriesTree();
      sendSuccess(res, categories, 'Catálogo de categorías de material obtenido exitosamente');
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

  async listUnits(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const units = await catalogService.listUnits();
      sendSuccess(res, units, 'Catálogo de unidades de medida obtenido exitosamente');
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
