import { Request, Response, NextFunction } from 'express';
import { matchesService } from './matches.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';
import { PublicationError, publicationsService } from '../publications/publications.service';

export class MatchesController {
  /**
   * GET /api/v1/publications/:id/matches
   * Obtiene las coincidencias sugeridas para una publicación específica, ordenadas por puntaje descendente.
   */
  async getMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const target = await publicationsService.getPublicationById(req.params.id, req.user!);
      const matches = await matchesService.getMatchesForPublication(req.params.id);
      const visibleMatches =
        req.user!.userType === 'GENERATOR' && target.ownerUserId !== req.user!.id
          ? []
          : matches;
      sendSuccess(res, visibleMatches, 'Coincidencias obtenidas exitosamente');
    } catch (err: unknown) {
      if (err instanceof PublicationError) {
        sendError(res, err.code, err.message, err.statusCode);
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/v1/matches/my-suggestions
   * Retorna las mejores 5 coincidencias para cada publicación activa propia o de las organizaciones del usuario.
   */
  async getMySuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user!.role !== 'USER' || req.user!.userType === 'GENERATOR') {
        sendSuccess(res, [], 'No hay sugerencias para este tipo de usuario');
        return;
      }
      const suggestions = await matchesService.getMySuggestions(req.user!);
      sendSuccess(res, suggestions, 'Bandeja de sugerencias obtenida exitosamente');
    } catch (err) {
      next(err);
    }
  }
}

export const matchesController = new MatchesController();
