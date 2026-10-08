import { apiFetch } from './client';
import { MaterialCategoryDto, UnitDto } from '@data-circular/shared';

/**
 * Cliente API para el Catálogo de Materiales y Unidades (Fase 8)
 */
export const CatalogApi = {
  /**
   * Obtiene el árbol completo de categorías y subcategorías de materiales.
   */
  async getCategories(): Promise<MaterialCategoryDto[]> {
    return apiFetch<MaterialCategoryDto[]>('/catalog/categories');
  },

  /**
   * Obtiene la lista de unidades de medida activas (kg, ton, und, l, etc.).
   */
  async getUnits(): Promise<UnitDto[]> {
    return apiFetch<UnitDto[]>('/catalog/units');
  },
};
