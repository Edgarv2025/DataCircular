import { apiFetch } from './client';
import { PublicationMatchDto, MySuggestionsItemDto } from '@data-circular/shared';

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
   * Obtiene la bandeja de sugerencias (top 5 coincidencias para cada publicación activa del usuario).
   */
  async getMySuggestions(): Promise<MySuggestionsItemDto[]> {
    return apiFetch<MySuggestionsItemDto[]>('/matches/my-suggestions');
  },
};
