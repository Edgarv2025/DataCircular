import { apiFetch } from './client';
import { MaterialPublicationDto, PublicationMatchDto } from '@data-circular/shared';

/**
 * Cliente API para Motor de Coincidencias y Sugerencias (Fase 9)
 */
export const MatchesApi = {
  /**
   * Obtiene las coincidencias del tipo opuesto para una publicación específica,
   * ordenadas por puntaje y con el desglose de factores de compatibilidad (HU-08).
   */
  async getMatches(publicationId: string): Promise<PublicationMatchDto[]> {
    return apiFetch<PublicationMatchDto[]>(`/publications/${publicationId}/matches`);
  },

  /**
   * Obtiene las ofertas que coinciden con los materiales de las organizaciones del usuario.
   */
  async getMySuggestions(): Promise<MaterialPublicationDto[]> {
    return apiFetch<MaterialPublicationDto[]>('/matches/my-suggestions');
  },
};
