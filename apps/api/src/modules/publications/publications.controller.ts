import { Request, Response, NextFunction } from 'express';
import {
  createPublicationSchema,
  updatePublicationSchema,
} from '@data-circular/shared';
import { publicationsService } from './publications.service';
import { sendSuccess } from '../../utils/apiResponse';

export class PublicationsController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createPublicationSchema.parse(req.body);
      const publication = await publicationsService.createPublication(data, req.user!);
      sendSuccess(res, publication, 'Publicación creada exitosamente', 201);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const publication = await publicationsService.getPublicationById(req.params.id);
      sendSuccess(res, publication, 'Publicación obtenida exitosamente');
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updatePublicationSchema.parse(req.body);
      const publication = await publicationsService.updatePublication(
        req.params.id,
        data,
        req.user!
      );
      sendSuccess(res, publication, 'Publicación actualizada exitosamente');
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const publication = await publicationsService.deletePublication(req.params.id, req.user!);
      sendSuccess(res, publication, 'Publicación cerrada exitosamente');
    } catch (err) {
      next(err);
    }
  }

  async listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await publicationsService.listMine(req.user!.id, page, limit);
      sendSuccess(res, result, 'Publicaciones propias obtenidas exitosamente');
    } catch (err) {
      next(err);
    }
  }

  async listAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await publicationsService.listAll(page, limit);
      sendSuccess(res, result, 'Listado general de publicaciones obtenido exitosamente');
    } catch (err) {
      next(err);
    }
  }
}

export const publicationsController = new PublicationsController();
