import { Request, Response, NextFunction } from 'express';
import { matchesService } from './matches.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';
import { PublicationError } from '../publications/publications.service';

export class MatchesController {
  /**
   * GET /api/v1/publications/:id/matches
   * Obtiene las coincidencias sugeridas para una publicación específica, ordenadas por puntaje descendente.
   */
  async getMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const matches = await matchesService.getMatchesForPublication(req.params.id);
      sendSuccess(res, matches, 'Coincidencias obtenidas exitosamente');
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
      const suggestions = await matchesService.getMySuggestions(req.user!);
      sendSuccess(res, suggestions, 'Bandeja de sugerencias obtenida exitosamente');
    } catch (err) {
      next(err);
    }
  }
}

export const matchesController = new MatchesController();
