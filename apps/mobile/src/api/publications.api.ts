import { apiFetch } from './client';
import {
  MaterialPublicationDto,
  CreatePublicationInput,
  UpdatePublicationInput,
  SearchPublicationsQuery,
  PublicationSearchResultDto,
} from '@data-circular/shared';
import queryString from 'query-string';

/**
 * Cliente API para Publicaciones de Oferta y Necesidad (Fases 8 y 9)
 */
export const PublicationsApi = {
  /**
   * Búsqueda general con filtros combinables (tipo, categoría, localidad, cantidad, etc.)
   */
  async search(query: SearchPublicationsQuery = {}): Promise<PublicationSearchResultDto> {
    const qs = queryString.stringify(query as any, { skipNull: true, skipEmptyString: true });
    return apiFetch<PublicationSearchResultDto>(`/publications/search${qs ? `?${qs}` : ''}`);
  },

  /**
   * Obtiene el detalle de una publicación con el contador 'publicacionesCompatibles'.
   */
  async getById(id: string): Promise<MaterialPublicationDto> {
    return apiFetch<MaterialPublicationDto>(`/publications/${id}`);
  },

  /**
   * Crea una nueva publicación de oferta o necesidad.
   */
  async create(data: CreatePublicationInput): Promise<MaterialPublicationDto> {
    return apiFetch<MaterialPublicationDto>('/publications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualiza cantidad, condición, vigencia o datos de una publicación existente.
   */
  async update(id: string, data: UpdatePublicationInput): Promise<MaterialPublicationDto> {
    return apiFetch<MaterialPublicationDto>(`/publications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Cierra o realiza borrado lógico de una publicación.
   */
  async close(id: string): Promise<MaterialPublicationDto> {
    return apiFetch<MaterialPublicationDto>(`/publications/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Obtiene las publicaciones propias del usuario autenticado.
   */
  async getMine(page = 1, limit = 20): Promise<{ data: MaterialPublicationDto[]; total: number }> {
    return apiFetch<{ data: MaterialPublicationDto[]; total: number }>(
      `/publications/mine?page=${page}&limit=${limit}`
    );
  },
};
