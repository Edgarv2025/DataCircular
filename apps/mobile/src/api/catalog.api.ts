import { apiFetch } from './client';
import {
  MaterialCategoryDto,
  UnitDto,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateUnitInput,
  UpdateUnitInput,
} from '@data-circular/shared';

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

  async getAdminCategories(): Promise<MaterialCategoryDto[]> {
    return apiFetch<MaterialCategoryDto[]>('/catalog/categories?includeInactive=true');
  },

  /**
   * Obtiene la lista de unidades de medida activas (kg, ton, und, l, etc.).
   */
  async getUnits(): Promise<UnitDto[]> {
    return apiFetch<UnitDto[]>('/catalog/units');
  },

  async getAdminUnits(): Promise<UnitDto[]> {
    return apiFetch<UnitDto[]>('/catalog/units?includeInactive=true');
  },

  async createCategory(data: CreateCategoryInput): Promise<MaterialCategoryDto> {
    return apiFetch<MaterialCategoryDto>('/catalog/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCategory(id: string, data: UpdateCategoryInput): Promise<MaterialCategoryDto> {
    return apiFetch<MaterialCategoryDto>(`/catalog/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteCategory(id: string): Promise<void> {
    await apiFetch(`/catalog/categories/${id}`, { method: 'DELETE' });
  },

  async createUnit(data: CreateUnitInput): Promise<UnitDto> {
    return apiFetch<UnitDto>('/catalog/units', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateUnit(id: string, data: UpdateUnitInput): Promise<UnitDto> {
    return apiFetch<UnitDto>(`/catalog/units/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteUnit(id: string): Promise<void> {
    await apiFetch(`/catalog/units/${id}`, { method: 'DELETE' });
  },
};
