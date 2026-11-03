import {
  MaterialCategoryDto,
  UnitDto,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateUnitInput,
  UpdateUnitInput,
} from '@data-circular/shared';
import { catalogRepository } from './catalog.repository';

export class CatalogError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'CatalogError';
  }
}

export class CatalogService {
  async listCategoriesTree(activeOnly = true): Promise<MaterialCategoryDto[]> {
    return catalogRepository.listCategoriesTree(activeOnly);
  }

  async getCategoryById(id: string): Promise<MaterialCategoryDto> {
    const category = await catalogRepository.findCategoryById(id);
    if (!category) {
      throw new CatalogError('CATEGORY_NOT_FOUND', 'Categoría de material no encontrada', 404);
    }
    return category;
  }

  async createCategory(input: CreateCategoryInput): Promise<MaterialCategoryDto> {
    if (input.parentId) {
      const parent = await catalogRepository.findCategoryById(input.parentId);
      if (!parent) {
        throw new CatalogError(
          'PARENT_CATEGORY_NOT_FOUND',
          'La categoría padre especificada no existe',
          400
        );
      }
    }

    const existing = await catalogRepository.findCategoryByNameAndParent(
      input.name,
      input.parentId
    );
    if (existing) {
      throw new CatalogError(
        'CATEGORY_ALREADY_EXISTS',
        `Ya existe una categoría o subcategoría con el nombre "${input.name}" bajo este nivel`,
        409
      );
    }

    return catalogRepository.createCategory(input);
  }

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<MaterialCategoryDto> {
    const current = await catalogRepository.findCategoryById(id);
    if (!current) {
      throw new CatalogError('CATEGORY_NOT_FOUND', 'Categoría de material no encontrada', 404);
    }

    if (input.parentId) {
      if (input.parentId === id) {
        throw new CatalogError(
          'INVALID_PARENT_CATEGORY',
          'Una categoría no puede ser padre de sí misma',
          400
        );
      }
      const parent = await catalogRepository.findCategoryById(input.parentId);
      if (!parent) {
        throw new CatalogError(
          'PARENT_CATEGORY_NOT_FOUND',
          'La categoría padre especificada no existe',
          400
        );
      }
    }

    if (input.name) {
      const targetParentId = input.parentId !== undefined ? input.parentId : current.parentId;
      const existing = await catalogRepository.findCategoryByNameAndParent(
        input.name,
        targetParentId
      );
      if (existing && existing.id !== id) {
        throw new CatalogError(
          'CATEGORY_ALREADY_EXISTS',
          `Ya existe otra categoría o subcategoría con el nombre "${input.name}" en este nivel`,
          409
        );
      }
    }

    return catalogRepository.updateCategory(id, input);
  }

  async deleteCategory(id: string): Promise<void> {
    const current = await catalogRepository.findCategoryById(id);
    if (!current) {
      throw new CatalogError('CATEGORY_NOT_FOUND', 'Categoría de material no encontrada', 404);
    }
    await catalogRepository.deactivateCategoryTree(id);
  }

  async listUnits(activeOnly = true): Promise<UnitDto[]> {
    return catalogRepository.listUnits(activeOnly);
  }

  async createUnit(input: CreateUnitInput): Promise<UnitDto> {
    const existing = await catalogRepository.findUnitByNameOrAbbreviation(
      input.name,
      input.abbreviation
    );
    if (existing) {
      throw new CatalogError(
        'UNIT_ALREADY_EXISTS',
        `Ya existe una unidad de medida con el nombre "${input.name}" o abreviatura "${input.abbreviation}"`,
        409
      );
    }

    return catalogRepository.createUnit(input);
  }

  async updateUnit(id: string, input: UpdateUnitInput): Promise<UnitDto> {
    const current = await catalogRepository.findUnitById(id);
    if (!current) {
      throw new CatalogError('UNIT_NOT_FOUND', 'Unidad de medida no encontrada', 404);
    }

    if (input.name !== undefined || input.abbreviation !== undefined) {
      const duplicate = await catalogRepository.findUnitByNameOrAbbreviation(
        input.name || current.name,
        input.abbreviation || current.abbreviation
      );
      if (duplicate && duplicate.id !== id) {
        throw new CatalogError(
          'UNIT_ALREADY_EXISTS',
          'Ya existe una unidad de medida con ese nombre o abreviatura',
          409
        );
      }
    }

    return catalogRepository.updateUnit(id, input);
  }

  async deleteUnit(id: string): Promise<UnitDto> {
    const current = await catalogRepository.findUnitById(id);
    if (!current) {
      throw new CatalogError('UNIT_NOT_FOUND', 'Unidad de medida no encontrada', 404);
    }
    return catalogRepository.deactivateUnit(id);
  }
}

export const catalogService = new CatalogService();
