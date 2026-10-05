import { prisma } from '../../database/prisma';
import { MaterialCategory, Unit } from '../../generated/prisma-client';
import {
  MaterialCategoryDto,
  UnitDto,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateUnitInput,
} from '@data-circular/shared';
import { seedCatalogAndUnits } from './catalog.seed';

export function toCategoryDto(
  cat: MaterialCategory & {
    parent?: { id: string; name: string } | null;
    subcategories?: MaterialCategory[];
  }
): MaterialCategoryDto {
  return {
    id: cat.id,
    name: cat.name,
    description: cat.description,
    parentId: cat.parentId,
    active: cat.active,
    createdAt: cat.createdAt.toISOString(),
    updatedAt: cat.updatedAt.toISOString(),
    parent: cat.parent
      ? {
          id: cat.parent.id,
          name: cat.parent.name,
        }
      : null,
    subcategories: cat.subcategories ? cat.subcategories.map((s) => toCategoryDto(s)) : undefined,
  };
}

export function toUnitDto(unit: Unit): UnitDto {
  return {
    id: unit.id,
    name: unit.name,
    abbreviation: unit.abbreviation,
    active: unit.active,
  };
}

export class CatalogRepository {
  async ensureSeeded(): Promise<void> {
    const count = await prisma.materialCategory.count();
    if (count === 0) {
      await seedCatalogAndUnits();
    }
  }

  async listCategoriesTree(activeOnly = true): Promise<MaterialCategoryDto[]> {
    await this.ensureSeeded();

    const rootCategories = await prisma.materialCategory.findMany({
      where: {
        parentId: null,
        ...(activeOnly ? { active: true } : {}),
      },
      include: {
        subcategories: {
          where: activeOnly ? { active: true } : {},
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return rootCategories.map((c) => toCategoryDto(c));
  }

  async findCategoryById(id: string): Promise<MaterialCategoryDto | null> {
    const category = await prisma.materialCategory.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, name: true },
        },
        subcategories: {
          orderBy: { name: 'asc' },
        },
      },
    });

    return category ? toCategoryDto(category) : null;
  }

  async findCategoryByNameAndParent(name: string, parentId?: string | null) {
    return prisma.materialCategory.findFirst({
      where: {
        name: name.trim(),
        parentId: parentId || null,
      },
    });
  }

  async createCategory(input: CreateCategoryInput): Promise<MaterialCategoryDto> {
    const category = await prisma.materialCategory.create({
      data: {
        name: input.name.trim(),
        description: input.description ? input.description.trim() : null,
        parentId: input.parentId || null,
        active: input.active !== undefined ? input.active : true,
      },
      include: {
        parent: {
          select: { id: true, name: true },
        },
      },
    });

    return toCategoryDto(category);
  }

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<MaterialCategoryDto> {
    const category = await prisma.materialCategory.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description ? input.description.trim() : null } : {}),
        ...(input.parentId !== undefined ? { parentId: input.parentId || null } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
      include: {
        parent: {
          select: { id: true, name: true },
        },
        subcategories: true,
      },
    });

    return toCategoryDto(category);
  }

  async listUnits(activeOnly = true): Promise<UnitDto[]> {
    await this.ensureSeeded();

    const units = await prisma.unit.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: { name: 'asc' },
    });

    return units.map(toUnitDto);
  }

  async findUnitById(id: string): Promise<UnitDto | null> {
    const unit = await prisma.unit.findUnique({
      where: { id },
    });

    return unit ? toUnitDto(unit) : null;
  }

  async findUnitByNameOrAbbreviation(name: string, abbreviation: string) {
    return prisma.unit.findFirst({
      where: {
        OR: [
          { name: name.trim() },
          { abbreviation: abbreviation.trim() },
        ],
      },
    });
  }

  async createUnit(input: CreateUnitInput): Promise<UnitDto> {
    const unit = await prisma.unit.create({
      data: {
        name: input.name.trim(),
        abbreviation: input.abbreviation.trim(),
        active: input.active !== undefined ? input.active : true,
      },
    });

    return toUnitDto(unit);
  }
}

export const catalogRepository = new CatalogRepository();
